package com.example.demo.project.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

public class ProjectValidationException extends ResponseStatusException {

    private final Map<String, List<String>> errors;

    public ProjectValidationException(Map<String, List<String>> errors) {
        super(HttpStatus.BAD_REQUEST, "Project validation failed");
        this.errors = errors;
    }

    public Map<String, List<String>> getErrors() {
        return errors;
    }
}
