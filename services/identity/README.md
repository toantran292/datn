# Identity Service

Identity Service là dịch vụ xác thực và phân quyền trung tâm của hệ thống UTS (Unified Team Space), được xây dựng bằng Spring Boot với Java 21.

## Tính năng chính

- **Quản lý người dùng**: Đăng ký, đăng nhập, quản lý profile
- **Xác thực đa dạng**: Password-based, Google OAuth2, JWT tokens  
- **Quản lý tổ chức**: Organizations, memberships, invitations
- **Phân quyền RBAC**: Role-based access control với permissions
- **Audit logs**: Ghi lại các hoạt động quan trọng
- **Outbox pattern**: Đảm bảo tính nhất quán của events

## Cấu trúc dự án

```
identity/
├── src/
│   ├── main/
│   │   ├── java/com/datn/identity/
│   │   │   ├── application/          # Application services
│   │   │   ├── domain/               # Domain entities và business logic
│   │   │   │   ├── user/            # User domain
│   │   │   │   ├── org/             # Organization domain  
│   │   │   │   ├── rbac/            # Role-based access control
│   │   │   │   ├── invite/          # Invitation domain
│   │   │   │   └── audit/           # Audit logging
│   │   │   ├── infrastructure/       # Technical infrastructure
│   │   │   │   ├── persistence/     # Database adapters
│   │   │   │   ├── security/        # Security configuration
│   │   │   │   └── web/             # Web layer utilities
│   │   │   ├── interfaces/api/       # REST API controllers
│   │   │   └── common/               # Shared utilities
│   │   └── resources/
│   │       ├── application.yml       # Configuration
│   │       └── db/migration/         # Flyway database migrations
│   └── test/                         # Unit tests
├── tests/                            # Additional test suites
│   ├── integration/                  # Integration tests
│   ├── e2e/                         # End-to-end tests
│   ├── performance/                  # Performance tests
│   └── security/                     # Security tests
├── contracts/openapi/               # OpenAPI specification
├── build.gradle.kts                 # Build configuration
└── Dockerfile                       # Container configuration
```

## Công nghệ sử dụng

- **Framework**: Spring Boot 3.5.5
- **Java**: Java 21
- **Database**: PostgreSQL với Flyway migrations  
- **Security**: Spring Security với JWT/OAuth2
- **Build**: Gradle với Kotlin DSL
- **Container**: Docker với multi-stage build

## Development

### Yêu cầu

- Java 21+
- PostgreSQL 15+
- Gradle 8+

### Chạy ứng dụng

```bash
# Build và chạy
./gradlew bootRun

# Hoặc build thành JAR
./gradlew bootJar
java -jar build/libs/identity-0.0.1-SNAPSHOT.jar
```

### Testing

```bash
# Unit tests
./gradlew test

# All tests
./gradlew test integrationTest
```

### Docker

```bash
# Build image
docker build -t uts-identity .

# Run container
docker run -p 8080:8080 uts-identity
```

## API Documentation

OpenAPI specification có thể được tìm thấy tại:
- File: `contracts/openapi/identity.yaml`
- Runtime: `http://localhost:8080/v3/api-docs`

## Configuration

Xem `src/main/resources/application.yml` để biết các tùy chọn cấu hình.

## Architecture

Service này tuân theo Clean Architecture với:
- **Domain layer**: Business logic và entities
- **Application layer**: Use cases và orchestration  
- **Infrastructure layer**: Technical concerns
- **Interface layer**: API endpoints

## Contributing

1. Tạo feature branch từ `main`
2. Implement changes với tests
3. Đảm bảo tất cả tests pass
4. Tạo pull request với mô tả rõ ràng
