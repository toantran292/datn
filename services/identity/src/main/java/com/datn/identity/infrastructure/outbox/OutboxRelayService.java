package com.datn.identity.infrastructure.outbox;

import com.datn.identity.domain.outbox.OutboxMessage;
import com.datn.identity.domain.outbox.OutboxRepository;
import com.datn.identity.infrastructure.notification.NotificationClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Outbox Relay Service - polls outbox table and dispatches messages to external services.
 *
 * Flow:
 * 1. @Scheduled job runs every 5 seconds
 * 2. Polls unpublished messages from outbox table
 * 3. Routes each message based on topic to appropriate handler
 * 4. Marks message as published after successful delivery
 *
 * Topics handled:
 * - notification.email.send -> NotificationClient.sendEmail()
 * - identity.* -> Domain events (for audit/analytics, not critical)
 */
@Service
public class OutboxRelayService {
    private static final Logger log = LoggerFactory.getLogger(OutboxRelayService.class);
    private static final int BATCH_SIZE = 50;

    private final OutboxRepository outbox;
    private final NotificationClient notificationClient;
    private final ObjectMapper objectMapper;
    private final String frontendUrl;

    public OutboxRelayService(OutboxRepository outbox,
                               NotificationClient notificationClient,
                               ObjectMapper objectMapper,
                               @Value("${app.frontend-url}") String frontendUrl) {
        this.outbox = outbox;
        this.notificationClient = notificationClient;
        this.objectMapper = objectMapper;
        this.frontendUrl = frontendUrl;
    }

    /**
     * Scheduled job to poll and relay outbox messages.
     * Runs every 5 seconds with 10 second initial delay.
     */
    @Scheduled(fixedDelay = 5000, initialDelay = 10000)
    public void relayMessages() {
        List<OutboxMessage> messages = outbox.listUnpublished(BATCH_SIZE);

        if (messages.isEmpty()) {
            return;
        }

        log.debug("Processing {} outbox messages", messages.size());

        for (OutboxMessage msg : messages) {
            try {
                processMessage(msg);
                outbox.markPublished(msg.id(), Instant.now());
                log.debug("Successfully relayed message id={} topic={}", msg.id(), msg.topic());
            } catch (Exception e) {
                log.error("Failed to relay message id={} topic={}: {}",
                        msg.id(), msg.topic(), e.getMessage(), e);
                // Don't mark as published - will retry on next poll
            }
        }
    }

    private void processMessage(OutboxMessage msg) throws Exception {
        String topic = msg.topic();

        if (topic.startsWith("notification.email")) {
            handleEmailNotification(msg);
        } else if (topic.equals("identity.invitation.created")) {
            // Special handling for invitation created - send invitation email
            handleInvitationCreated(msg);
        } else if (topic.startsWith("identity.")) {
            // Domain events - log for now, could forward to analytics/audit service
            handleDomainEvent(msg);
        } else {
            log.warn("Unknown topic: {}, skipping", topic);
            // Mark as published anyway to avoid infinite loop
        }
    }

    /**
     * Handle email notification messages.
     * Expected payload: { toEmail, subject, templateType, resetLink, occurredAt }
     */
    private void handleEmailNotification(OutboxMessage msg) throws Exception {
        JsonNode payload = objectMapper.readTree(msg.payloadJson());

        String toEmail = payload.get("toEmail").asText();
        String subject = payload.get("subject").asText();
        String templateType = payload.has("templateType") ? payload.get("templateType").asText() : "GENERIC";

        String htmlContent = buildEmailHtml(templateType, payload);

        notificationClient.sendEmail(toEmail, subject, htmlContent);
        log.info("Email notification sent to: {}", toEmail);
    }

    /**
     * Build HTML content based on template type.
     */
    private String buildEmailHtml(String templateType, JsonNode payload) {
        return switch (templateType) {
            case "PASSWORD_RESET" -> buildPasswordResetEmail(payload);
            case "EMAIL_VERIFICATION" -> buildEmailVerificationEmail(payload);
            case "WELCOME" -> buildWelcomeEmail(payload);
            default -> buildGenericEmail(payload);
        };
    }

    // UTS Design System Colors
    private static final String UTS_ORANGE = "#FF8800";
    private static final String UTS_TEAL = "#00C4AB";
    private static final String TEXT_PRIMARY = "#0F172A";
    private static final String TEXT_SECONDARY = "#475569";
    private static final String BG_SURFACE = "#FFFFFF";
    private static final String BG_PAGE = "#F9FAFB";

    private String buildPasswordResetEmail(JsonNode payload) {
        String resetLink = payload.get("resetLink").asText();
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: %s; margin: 0; padding: 0; background: %s; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, %s 0%%, %s 100%%); color: white; padding: 32px 20px; text-align: center; border-radius: 16px 16px 0 0; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .content { padding: 40px 30px; background: %s; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(15,23,42,0.08); }
                    .button { display: inline-block; background: %s; color: white; padding: 14px 32px;
                              text-decoration: none; border-radius: 12px; margin: 24px 0; font-weight: 600; font-size: 15px; }
                    .button:hover { background: #E56600; }
                    .info-badge { display: inline-block; background: %s; color: white; padding: 4px 12px;
                                  border-radius: 6px; font-size: 12px; font-weight: 600; }
                    .footer { padding: 24px; text-align: center; color: %s; font-size: 12px; }
                    a { color: %s; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>We received a request to reset your password on <strong>UTS</strong>.</p>
                        <p>Click the button below to create a new password:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button" style="color: white;">Reset Password</a>
                        </p>
                        <p>This link will expire in <span class="info-badge">1 hour</span>.</p>
                        <p>If you didn't request this, you can safely ignore this email.</p>
                        <p style="color: %s; font-size: 12px; margin-top: 30px;">
                            If the button doesn't work, copy and paste this link:<br>
                            <a href="%s">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from <strong>UTS</strong>. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                TEXT_PRIMARY, BG_PAGE,
                UTS_ORANGE, UTS_TEAL,
                BG_SURFACE,
                UTS_ORANGE,
                UTS_TEAL,
                TEXT_SECONDARY, UTS_TEAL,
                resetLink,
                TEXT_SECONDARY,
                resetLink, resetLink
            );
    }

    private String buildEmailVerificationEmail(JsonNode payload) {
        String verifyLink = payload.has("verifyLink") ? payload.get("verifyLink").asText() : "#";
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: %s; margin: 0; padding: 0; background: %s; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, %s 0%%, %s 100%%); color: white; padding: 32px 20px; text-align: center; border-radius: 16px 16px 0 0; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .content { padding: 40px 30px; background: %s; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(15,23,42,0.08); }
                    .button { display: inline-block; background: %s; color: white; padding: 14px 32px;
                              text-decoration: none; border-radius: 12px; margin: 24px 0; font-weight: 600; font-size: 15px; }
                    .button:hover { background: #00B9A0; }
                    .info-badge { display: inline-block; background: %s; color: white; padding: 4px 12px;
                                  border-radius: 6px; font-size: 12px; font-weight: 600; }
                    .footer { padding: 24px; text-align: center; color: %s; font-size: 12px; }
                    a { color: %s; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Verify Your Email Address</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>Thank you for registering on <strong>UTS</strong>!</p>
                        <p>Please verify your email address by clicking the button below:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button" style="color: white;">Verify Email</a>
                        </p>
                        <p>This link will expire in <span class="info-badge">24 hours</span>.</p>
                        <p>If you didn't create an account, you can safely ignore this email.</p>
                        <p style="color: %s; font-size: 12px; margin-top: 30px;">
                            If the button doesn't work, copy and paste this link:<br>
                            <a href="%s">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from <strong>UTS</strong>. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                TEXT_PRIMARY, BG_PAGE,
                UTS_TEAL, UTS_ORANGE,
                BG_SURFACE,
                UTS_TEAL,
                UTS_ORANGE,
                TEXT_SECONDARY, UTS_TEAL,
                verifyLink,
                TEXT_SECONDARY,
                verifyLink, verifyLink
            );
    }

    private String buildWelcomeEmail(JsonNode payload) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: %s; margin: 0; padding: 0; background: %s; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, %s 0%%, %s 100%%); color: white; padding: 32px 20px; text-align: center; border-radius: 16px 16px 0 0; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .content { padding: 40px 30px; background: %s; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(15,23,42,0.08); }
                    .button { display: inline-block; background: %s; color: white; padding: 14px 32px;
                              text-decoration: none; border-radius: 12px; margin: 24px 0; font-weight: 600; font-size: 15px; }
                    .button:hover { background: #E56600; }
                    .feature-badge { display: inline-block; background: %s; color: white; padding: 4px 12px;
                                     border-radius: 6px; font-size: 12px; font-weight: 600; margin: 4px; }
                    .footer { padding: 24px; text-align: center; color: %s; font-size: 12px; }
                    a { color: %s; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to UTS!</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>Thank you for joining <strong>UTS</strong>! Your account has been created successfully.</p>
                        <p>You can now start collaborating with your team using our powerful features:</p>
                        <p style="text-align: center; margin: 20px 0;">
                            <span class="feature-badge">Team Chat</span>
                            <span class="feature-badge">AI Assistant</span>
                            <span class="feature-badge">Reports</span>
                        </p>
                        <p style="text-align: center;">
                            <a href="%s" class="button" style="color: white;">Get Started</a>
                        </p>
                        <p>If you have any questions, feel free to reach out to our support team.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from <strong>UTS</strong>. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                TEXT_PRIMARY, BG_PAGE,
                UTS_ORANGE, UTS_TEAL,
                BG_SURFACE,
                UTS_ORANGE,
                UTS_TEAL,
                TEXT_SECONDARY, UTS_TEAL,
                frontendUrl
            );
    }

    private String buildGenericEmail(JsonNode payload) {
        String message = payload.has("message") ? payload.get("message").asText() : "No message content";
        String title = payload.has("title") ? payload.get("title").asText() : "Notification";
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: %s; margin: 0; padding: 0; background: %s; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, %s 0%%, %s 100%%); color: white; padding: 32px 20px; text-align: center; border-radius: 16px 16px 0 0; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .content { padding: 40px 30px; background: %s; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(15,23,42,0.08); }
                    .footer { padding: 24px; text-align: center; color: %s; font-size: 12px; }
                    a { color: %s; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>%s</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from <strong>UTS</strong>. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                TEXT_PRIMARY, BG_PAGE,
                UTS_ORANGE, UTS_TEAL,
                BG_SURFACE,
                TEXT_SECONDARY, UTS_TEAL,
                title,
                message
            );
    }

    /**
     * Handle domain events (identity.*).
     * These are logged for audit purposes. Could be forwarded to analytics service.
     */
    private void handleDomainEvent(OutboxMessage msg) {
        log.info("Domain event: topic={}, payload={}", msg.topic(), msg.payloadJson());
        // Future: Forward to analytics/audit service
    }

    /**
     * Handle invitation created events.
     * Expected payload: { orgId, email, memberType, role, token, occurredAt }
     */
    private void handleInvitationCreated(OutboxMessage msg) throws Exception {
        JsonNode payload = objectMapper.readTree(msg.payloadJson());

        String toEmail = payload.get("email").asText();
        String token = payload.has("token") && !payload.get("token").isNull() ? payload.get("token").asText() : null;
        String role = payload.has("role") ? payload.get("role").asText() : "MEMBER";

        if (token == null || token.isEmpty()) {
            log.warn("Invitation event has no token, skipping email for: {}", toEmail);
            return;
        }

        String inviteLink = frontendUrl + "/invite?token=" + token;
        String subject = "You've been invited to join UTS";
        String htmlContent = buildInvitationEmail(inviteLink, role);

        notificationClient.sendEmail(toEmail, subject, htmlContent);
        log.info("Invitation email sent to: {}", toEmail);
    }

    private String buildInvitationEmail(String inviteLink, String role) {
        String roleDisplay = "ADMIN".equalsIgnoreCase(role) ? "Administrator" : "Member";
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: %s; margin: 0; padding: 0; background: %s; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, %s 0%%, %s 100%%); color: white; padding: 32px 20px; text-align: center; border-radius: 16px 16px 0 0; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .content { padding: 40px 30px; background: %s; border-radius: 0 0 16px 16px; box-shadow: 0 4px 16px rgba(15,23,42,0.08); }
                    .button { display: inline-block; background: %s; color: white; padding: 14px 32px;
                              text-decoration: none; border-radius: 12px; margin: 24px 0; font-weight: 600; font-size: 15px; }
                    .button:hover { background: #E56600; }
                    .role-badge { display: inline-block; background: %s; color: white; padding: 4px 12px;
                                  border-radius: 6px; font-size: 12px; font-weight: 600; margin-left: 8px; }
                    .footer { padding: 24px; text-align: center; color: %s; font-size: 12px; }
                    a { color: %s; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>You're Invited to UTS!</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>You've been invited to join an organization on <strong>UTS</strong> as a <span class="role-badge">%s</span>.</p>
                        <p>Click the button below to accept the invitation and set up your account:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button" style="color: white;">Accept Invitation</a>
                        </p>
                        <p>This invitation link will expire in <strong>7 days</strong>.</p>
                        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                        <p style="color: %s; font-size: 12px; margin-top: 30px;">
                            If the button doesn't work, copy and paste this link:<br>
                            <a href="%s">%s</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from <strong>UTS</strong>. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                TEXT_PRIMARY, BG_PAGE,
                UTS_ORANGE, UTS_TEAL,
                BG_SURFACE,
                UTS_ORANGE,
                UTS_TEAL,
                TEXT_SECONDARY, UTS_TEAL,
                roleDisplay,
                inviteLink,
                TEXT_SECONDARY,
                inviteLink, inviteLink
            );
    }
}
