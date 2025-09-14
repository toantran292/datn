# Identity Service Tests

This directory contains additional test suites for the identity service beyond the standard unit tests in `src/test/`.

## Structure

- `integration/` - Integration tests with external dependencies (database, external APIs)
- `e2e/` - End-to-end API tests using real HTTP requests
- `performance/` - Performance and load tests for critical endpoints
- `security/` - Security and penetration tests for authentication flows

## Running Tests

### Unit Tests (Standard Spring Boot)
```bash
./gradlew test
```

### Integration Tests
```bash
./gradlew test --tests "*.integration.*"
```

### All Tests
```bash
./gradlew test integrationTest
```

## Test Environment

- Integration tests require a test database (PostgreSQL)
- E2E tests should run against a test environment
- Performance tests should use dedicated test data and environment
