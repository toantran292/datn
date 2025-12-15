package com.datn.identity.infrastructure.email;

import com.datn.identity.domain.email.EmailService;
import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import com.datn.identity.infrastructure.util.Jsons;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Email service that publishes events to outbox.
 * Notification service consumes these events and sends actual emails.
 */
@Service
public class OutboxEmailService implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(OutboxEmailService.class);
    private static final String EMAIL_TOPIC = "notification.email.send";

    private final OutboxRepository outbox;

    public OutboxEmailService(OutboxRepository outbox) {
        this.outbox = outbox;
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        var payload = new PasswordResetEmailPayload(
            toEmail,
            "Reset Your Password",
            "PASSWORD_RESET",
            resetLink,
            Instant.now()
        );

        outbox.append(OutboxMessage.create(EMAIL_TOPIC, Jsons.toJson(payload)));
        log.info("Password reset email event published for: {}", toEmail);
    }

    public record PasswordResetEmailPayload(
        String toEmail,
        String subject,
        String templateType,
        String resetLink,
        Instant occurredAt
    ) {}
}
