plugins {
    java
    id("org.springframework.boot") version "3.5.5"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.datn"
version = "0.0.1-SNAPSHOT"
description = "identity"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Web + Security
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")

    // (Tuỳ chọn) Google OAuth2 login cho flow b
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")

    // JWT / JWS signing (RSA/ECDSA)
    implementation("org.springframework.security:spring-security-oauth2-jose")

    // Data + DB
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.postgresql:postgresql:42.7.3")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // Validation + Actuator
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // Jackson Java Time
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // MapStruct (tuỳ chọn nếu bạn dùng mapper)
    implementation("org.mapstruct:mapstruct:1.5.5.Final")

    // DevTools for hot reload
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
