plugins {
    java
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.omnidash"
version = "0.1.0"

java {
    // Java 17+ 호환 (도커는 jdk21 사용, 로컬은 17도 가능)
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot core
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // DB
    implementation("org.postgresql:postgresql")
    // Spring Boot 3.2.5는 flyway-core 9.22.3을 관리. PostgreSQL 지원은 core에 내장.
    implementation("org.flywaydb:flyway-core")

    // CSV parsing
    implementation("org.apache.commons:commons-csv:1.10.0")

    // YAML loader (Skills.md 임계값 핫리로드)
    implementation("org.yaml:snakeyaml:2.2")

    // Lombok
    compileOnly("org.projectlombok:lombok:1.18.30")
    annotationProcessor("org.projectlombok:lombok:1.18.30")
    testCompileOnly("org.projectlombok:lombok:1.18.30")
    testAnnotationProcessor("org.projectlombok:lombok:1.18.30")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("com.h2database:h2")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveFileName.set("app.jar")
}
