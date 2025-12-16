package com.datn.identity.application;

import com.datn.identity.common.Email;
import com.datn.identity.domain.events.IdentityEvents;
import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import com.datn.identity.domain.user.*;
import com.datn.identity.infrastructure.util.Jsons;
import com.datn.identity.infrastructure.web.FileStorageClient;
import com.datn.identity.interfaces.api.dto.Dtos.ProfileRes;
import com.datn.identity.interfaces.api.dto.Dtos.UpdateProfileReq;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserApplicationService {
    private final UserRepository users;
    private final ExternalIdentityRepository externals;
    private final PasswordHasher hasher;
    private final PasswordPolicy passwordPolicy;
    private final OutboxRepository outbox;
    private final EmailVerificationService emailVerificationService;
    private final FileStorageClient fileStorageClient;

    public UserApplicationService(UserRepository users, PasswordHasher hasher,
                                  PasswordPolicy passwordPolicy, OutboxRepository outbox,
                                  ObjectMapper mapper, ExternalIdentityRepository externals,
                                  EmailVerificationService emailVerificationService,
                                  FileStorageClient fileStorageClient) {
        this.users = users; this.hasher = hasher;
        this.passwordPolicy = passwordPolicy; this.outbox = outbox;
        this.externals = externals;
        this.emailVerificationService = emailVerificationService;
        this.fileStorageClient = fileStorageClient;
    }

    @Transactional
    public UUID register(String emailRaw, String rawPassword) {
        var emailCI = Email.of(emailRaw).value();
        if (users.existsByEmail(emailCI)) throw new IllegalStateException("email_exists");

        passwordPolicy.validate(rawPassword);
        var pepper = System.getenv().getOrDefault("PWD_PEPPER", "");
        var hash = hasher.hash(rawPassword + pepper);

        var user = User.createNew(Email.of(emailCI), hash);
        users.save(user);

        var evt = new IdentityEvents.UserRegistered(user.id(), emailCI);
        outbox.append(OutboxMessage.create(evt.topic(), Jsons.toJson(evt)));

        // Send verification email
        emailVerificationService.sendVerificationEmail(user.id(), emailCI);

        return user.id();
    }

    public record GoogleLinkResult(UUID userId, String email, boolean mustChangePassword) {}

    @Transactional
    public GoogleLinkResult registerOrLinkGoogle(String sub, String emailRaw) {
        var emailCI = Email.of(emailRaw).value();

        var ex = externals.find("google", sub);
        if (ex.isPresent()) {
            var userId = ex.get().userId();
            var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("user_not_found"));
            return new GoogleLinkResult(userId, emailCI, user.mustChangePassword());
        }

        var userOpt = users.findByEmail(emailCI);
        if (userOpt.isPresent()) {
            // Email exists but not linked to Google - throw specific exception
            // so handler can redirect to link page
            throw new EmailExistsNotLinkedException(emailCI, sub);
        } else {
            var random = UUID.randomUUID().toString();
            var dummyHash = hasher.hash(random); // placeholder
            var u = User.createNew(Email.of(emailCI), dummyHash).requirePasswordChange();
            users.save(u);

            var evt = new IdentityEvents.UserRegistered(u.id(), emailCI);
            outbox.append(OutboxMessage.create(evt.topic(), Jsons.toJson(evt)));
            var userId = u.id();
            externals.save(new ExternalIdentity("google", sub, userId, emailCI));
            return new GoogleLinkResult(userId, emailCI, true);
        }
    }

    /**
     * Link Google account to an existing user.
     * Used when a logged-in user wants to connect their Google account.
     */
    @Transactional
    public void linkGoogleToExistingUser(UUID userId, String googleSub, String googleEmail) {
        // Verify user exists
        var user = users.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("user_not_found"));

        // Check if this Google account is already linked to another user
        var existingLink = externals.find("google", googleSub);
        if (existingLink.isPresent()) {
            if (!existingLink.get().userId().equals(userId)) {
                throw new IllegalStateException("google_account_already_linked");
            }
            // Already linked to this user, nothing to do
            return;
        }

        // Check if user already has a Google account linked
        var userExternalOpt = externals.findByUserId(userId);
        if (userExternalOpt.isPresent() && "google".equals(userExternalOpt.get().provider())) {
            throw new IllegalStateException("user_already_has_google_linked");
        }

        // Link the Google account
        externals.save(new ExternalIdentity("google", googleSub, userId, googleEmail));

        var evt = new IdentityEvents.GoogleAccountLinked(userId, googleEmail);
        outbox.append(OutboxMessage.create(evt.topic(), Jsons.toJson(evt)));
    }

    /**
     * Link Google account to existing user after password verification.
     * Used when user logs in with Google but email already exists.
     * Returns the user info after successful link for login.
     */
    @Transactional
    public GoogleLinkResult linkGoogleWithPasswordVerification(String googleSub, String googleEmail, String password) {
        var emailCI = Email.of(googleEmail).value();

        // Find existing user by email
        var user = users.findByEmail(emailCI)
            .orElseThrow(() -> new IllegalArgumentException("user_not_found"));

        // Verify password
        var pepper = System.getenv().getOrDefault("PWD_PEPPER", "");
        if (!hasher.matches(password + pepper, user.passwordHash())) {
            throw new IllegalArgumentException("invalid_credentials");
        }

        // Check if this Google account is already linked to another user
        var existingLink = externals.find("google", googleSub);
        if (existingLink.isPresent()) {
            if (!existingLink.get().userId().equals(user.id())) {
                throw new IllegalStateException("google_account_already_linked_to_other");
            }
            // Already linked to this user, just return
            return new GoogleLinkResult(user.id(), emailCI, user.mustChangePassword());
        }

        // Check if user already has a Google account linked
        var userExternalOpt = externals.findByUserId(user.id());
        if (userExternalOpt.isPresent() && "google".equals(userExternalOpt.get().provider())) {
            throw new IllegalStateException("user_already_has_google_linked");
        }

        // Link the Google account
        externals.save(new ExternalIdentity("google", googleSub, user.id(), googleEmail));

        var evt = new IdentityEvents.GoogleAccountLinked(user.id(), googleEmail);
        outbox.append(OutboxMessage.create(evt.topic(), Jsons.toJson(evt)));

        return new GoogleLinkResult(user.id(), emailCI, user.mustChangePassword());
    }

    @Transactional
    public void setPassword(UUID userId, String rawPassword) {
        var user = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("user_not_found"));

        passwordPolicy.validate(rawPassword);
        var pepper = System.getenv().getOrDefault("PWD_PEPPER", "");
        var hash = hasher.hash(rawPassword + pepper);

        users.save(user.withPasswordHash(hash).clearPasswordChangeRequirement());

        var evt = new IdentityEvents.PasswordSet(userId);
        outbox.append(OutboxMessage.create(evt.topic(), Jsons.toJson(evt)));
    }

    /**
     * Change password for authenticated user.
     * Verifies current password before allowing change.
     */
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        var user = users.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("user_not_found"));

        // Verify current password
        var pepper = System.getenv().getOrDefault("PWD_PEPPER", "");
        if (!hasher.matches(currentPassword + pepper, user.passwordHash())) {
            throw new IllegalArgumentException("current_password_incorrect");
        }

        // Validate and set new password
        passwordPolicy.validate(newPassword);
        var newHash = hasher.hash(newPassword + pepper);

        users.save(user.withPasswordHash(newHash));

        var evt = new IdentityEvents.PasswordChanged(userId);
        outbox.append(OutboxMessage.create(evt.topic(), Jsons.toJson(evt)));
    }

    /**
     * Get user profile (UC05).
     */
    public ProfileRes getProfile(UUID userId) {
        var user = users.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("user_not_found"));
        return toProfileRes(user);
    }

    /**
     * Update user profile (UC05).
     * Supports partial updates - only non-null fields will be updated.
     */
    @Transactional
    public ProfileRes updateProfile(UUID userId, UpdateProfileReq req) {
        var user = users.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("user_not_found"));

        var updated = user.updateProfile(
            req.displayName(),
            req.phone(),
            req.bio(),
            req.avatarAssetId()
        );

        users.save(updated);

        var evt = new IdentityEvents.ProfileUpdated(userId);
        outbox.append(OutboxMessage.create(evt.topic(), Jsons.toJson(evt)));

        return toProfileRes(updated);
    }

    private ProfileRes toProfileRes(User user) {
        // Check if user has external identity (Google, etc.)
        String provider = externals.findByUserId(user.id())
            .map(ext -> ext.provider().toUpperCase())
            .orElse("EMAIL");

        // Get avatar URL if asset ID exists
        String avatarUrl = null;
        if (user.avatarAssetId() != null && !user.avatarAssetId().isBlank()) {
            try {
                var presignedResponse = fileStorageClient.getPresignedGetUrl(
                    user.avatarAssetId(), 3600);
                avatarUrl = presignedResponse.presignedUrl();
            } catch (Exception e) {
                System.err.println("Failed to get avatar URL for user " + user.id() + ": " + e.getMessage());
            }
        }

        return new ProfileRes(
            user.id().toString(),
            user.email().value(),
            null, // first_name - not stored separately
            null, // last_name - not stored separately
            user.displayName(),
            user.phone(),
            user.bio(),
            user.avatarAssetId(),
            avatarUrl,
            user.isEmailVerified(),
            provider
        );
    }
}
