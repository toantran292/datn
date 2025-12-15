package com.datn.identity.application;

import com.datn.identity.common.Email;
import com.datn.identity.domain.events.IdentityEvents;
import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import com.datn.identity.domain.user.*;
import com.datn.identity.infrastructure.util.Jsons;
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

    public UserApplicationService(UserRepository users, PasswordHasher hasher,
                                  PasswordPolicy passwordPolicy, OutboxRepository outbox,
                                  ObjectMapper mapper, ExternalIdentityRepository externals,
                                  EmailVerificationService emailVerificationService) {
        this.users = users; this.hasher = hasher;
        this.passwordPolicy = passwordPolicy; this.outbox = outbox;
        this.externals = externals;
        this.emailVerificationService = emailVerificationService;
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
            throw new IllegalStateException("google_sync_not_allowed");
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
        return new ProfileRes(
            user.id().toString(),
            user.email().value(),
            user.displayName(),
            user.phone(),
            user.bio(),
            user.avatarAssetId() != null ? user.avatarAssetId().toString() : null,
            user.isEmailVerified()
        );
    }
}
