package com.example.demo.common;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                         HttpServletRequest request) {
        ApiErrorResponse response = buildFromBindingResult(ex.getBindingResult(), HttpStatus.BAD_REQUEST,
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiErrorResponse> handleBindException(BindException ex, HttpServletRequest request) {
        ApiErrorResponse response = buildFromBindingResult(ex.getBindingResult(), HttpStatus.BAD_REQUEST,
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException ex,
                                                                       HttpServletRequest request) {
        List<FieldErrorDetail> fieldErrors = ex.getConstraintViolations().stream()
                .map(violation -> new FieldErrorDetail(violation.getPropertyPath().toString(),
                        violation.getMessage(), violation.getInvalidValue()))
                .collect(Collectors.toList());

        ApiErrorResponse response = ApiErrorResponse.validation(HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(), "Constraint violation", request.getRequestURI(), fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
                                                                         HttpServletRequest request) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        List<FieldErrorDetail> fieldErrors = new ArrayList<>();
        String message = "Malformed JSON request";

        Throwable cause = ex.getCause();
        if (cause instanceof InvalidFormatException invalidFormatException) {
            message = "Invalid value in request payload";
            String path = buildJsonPath(invalidFormatException.getPath());
            Object invalidValue = invalidFormatException.getValue();
            String expectedType = invalidFormatException.getTargetType() != null
                    ? invalidFormatException.getTargetType().getSimpleName()
                    : "";

            String detailMessage = expectedType.isEmpty()
                    ? "Invalid value provided"
                    : String.format("Value must be of type %s", expectedType);

            fieldErrors.add(new FieldErrorDetail(path, detailMessage, invalidValue));
        }

        ApiErrorResponse response = ApiErrorResponse.validation(status.value(), status.getReasonPhrase(),
                message, request.getRequestURI(), fieldErrors.isEmpty() ? null : fieldErrors);
        return ResponseEntity.status(status).body(response);
    }

    private ApiErrorResponse buildFromBindingResult(BindingResult bindingResult, HttpStatus status, String path) {
        List<FieldErrorDetail> fieldErrors = bindingResult.getFieldErrors().stream()
                .map(fieldError -> new FieldErrorDetail(resolveFieldName(fieldError),
                        fieldError.getDefaultMessage(), fieldError.getRejectedValue()))
                .collect(Collectors.toList());

        fieldErrors.addAll(bindingResult.getGlobalErrors().stream()
                .map((ObjectError objectError) -> new FieldErrorDetail(objectError.getObjectName(),
                        objectError.getDefaultMessage(), null))
                .collect(Collectors.toList()));

        String message = String.format("Validation failed for object '%s'", bindingResult.getObjectName());

        return ApiErrorResponse.validation(status.value(), status.getReasonPhrase(), message, path, fieldErrors);
    }

    private String resolveFieldName(FieldError fieldError) {
        return fieldError.getField();
    }

    private String buildJsonPath(List<JsonMappingException.Reference> pathReferences) {
        if (pathReferences == null || pathReferences.isEmpty()) {
            return "";
        }

        return pathReferences.stream()
                .map(reference -> {
                    String fieldName = reference.getFieldName();
                    if (fieldName != null && !fieldName.isEmpty()) {
                        return fieldName;
                    }
                    int index = reference.getIndex();
                    return index >= 0 ? String.format("[%d]", index) : "";
                })
                .filter(part -> part != null && !part.isEmpty())
                .collect(Collectors.joining("."));
    }
}
