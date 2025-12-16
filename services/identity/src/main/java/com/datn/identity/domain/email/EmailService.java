package com.datn.identity.domain.email;

/**
 * Interface for requesting email delivery.
 * Implementation publishes events to notification service via outbox pattern.
 */
public interface EmailService {

    /**
     * Request password reset email to be sent via notification service
     * @param toEmail recipient email
     * @param resetLink the full reset link including token
     */
    void sendPasswordResetEmail(String toEmail, String resetLink);
}
