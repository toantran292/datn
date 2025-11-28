package com.datn.identity.infrastructure.web;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class FileStorageClient {
    private final RestTemplate restTemplate;
    private final String fileStorageBaseUrl;

    public FileStorageClient(
            RestTemplate restTemplate,
            @Value("${file-storage.base-url:http://file-storage-api:3000}") String fileStorageBaseUrl) {
        this.restTemplate = restTemplate;
        this.fileStorageBaseUrl = fileStorageBaseUrl;
    }

    public record CreatePresignedUrlRequest(
            String originalName,
            String mimeType,
            Long size,
            String service,
            String modelType,
            String subjectId,
            String uploadedBy,
            java.util.List<String> tags,
            Map<String, Object> metadata
    ) {}

    public record CreatePresignedUrlResponse(
            String assetId,
            String presignedUrl,
            String objectKey,
            Integer expiresIn
    ) {}

    public CreatePresignedUrlResponse createPresignedUrl(CreatePresignedUrlRequest request) {
        String url = fileStorageBaseUrl + "/files/presigned-url";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<CreatePresignedUrlRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    JsonNode.class
            );

            JsonNode body = response.getBody();
            if (body == null) {
                throw new RuntimeException("File-storage service returned empty response");
            }

            JsonNode data = body.get("data");
            if (data == null) {
                throw new RuntimeException("File-storage service response missing 'data' field");
            }

            return new CreatePresignedUrlResponse(
                    data.get("assetId").asText(),
                    data.get("presignedUrl").asText(),
                    data.get("objectKey").asText(),
                    data.get("expiresIn").asInt()
            );
        } catch (org.springframework.web.client.ResourceAccessException e) {
            throw new RuntimeException("Cannot connect to file-storage service at " + fileStorageBaseUrl + ". Please check if the service is running and the URL is correct.", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create presigned URL: " + e.getMessage(), e);
        }
    }

    public void confirmUpload(String assetId) {
        String url = fileStorageBaseUrl + "/files/confirm-upload";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of("assetId", assetId);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Void.class
        );
    }

    public record PresignedGetUrlRequest(
            String id,
            Integer expirySeconds
    ) {}

    public record PresignedGetUrlResponse(
            String id,
            String presignedUrl,
            Integer expiresIn
    ) {}

    public PresignedGetUrlResponse getPresignedGetUrl(String fileId, Integer expirySeconds) {
        String url = fileStorageBaseUrl + "/files/presigned-get-url";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        PresignedGetUrlRequest request = new PresignedGetUrlRequest(fileId, expirySeconds);
        HttpEntity<PresignedGetUrlRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    JsonNode.class
            );

            JsonNode body = response.getBody();
            if (body == null) {
                throw new RuntimeException("File-storage service returned empty response");
            }

            JsonNode data = body.get("data");
            if (data == null) {
                throw new RuntimeException("File-storage service response missing 'data' field");
            }

            return new PresignedGetUrlResponse(
                    data.get("id").asText(),
                    data.get("presignedUrl").asText(),
                    data.get("expiresIn").asInt()
            );
        } catch (org.springframework.web.client.ResourceAccessException e) {
            throw new RuntimeException("Cannot connect to file-storage service at " + fileStorageBaseUrl + ". Please check if the service is running and the URL is correct.", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get presigned GET URL: " + e.getMessage(), e);
        }
    }
}

