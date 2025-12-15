package com.datn.identity.infrastructure.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * HTTP client for the Notification service.
 * Used by OutboxRelayService to send emails via the notification service.
 */
@Component
public class NotificationClient {
    private static final Logger log = LoggerFactory.getLogger(NotificationClient.class);

    private final RestTemplate restTemplate;
    private final String notificationServiceUrl;

    public NotificationClient(
            RestTemplate restTemplate,
            @Value("${app.notification-service-url:http://notification-api:3000}") String notificationServiceUrl) {
        this.restTemplate = restTemplate;
        this.notificationServiceUrl = notificationServiceUrl;
    }

    /**
     * Send an email via the notification service.
     *
     * @param to      recipient email address
     * @param subject email subject
     * @param html    HTML content of the email
     */
    public void sendEmail(String to, String subject, String html) {
        String url = notificationServiceUrl + "/email/send";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "to", to,
                "subject", subject,
                "html", html
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Void> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    Void.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully to: {}", to);
            } else {
                log.warn("Email send returned non-2xx status: {}", response.getStatusCode());
            }
        } catch (org.springframework.web.client.ResourceAccessException e) {
            log.error("Cannot connect to notification service at {}. Please check if the service is running.", notificationServiceUrl);
            throw new RuntimeException("Cannot connect to notification service: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }
}
