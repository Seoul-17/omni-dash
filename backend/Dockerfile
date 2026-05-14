# --- Build stage ---
# alpine 대신 jammy(debian) 사용 — alpine + ARM64 + Gradle은 libnative-platform-file-events
# 충돌(SIGSEGV)이 잦다. vfs.watch도 명시적으로 끈다.
FROM gradle:8.7-jdk21 AS build
WORKDIR /workspace

ENV GRADLE_OPTS="-Dorg.gradle.daemon=false -Dorg.gradle.vfs.watch=false"

# 의존성 캐시 최적화: 빌드 스크립트 먼저 복사
COPY settings.gradle.kts build.gradle.kts gradle.properties ./
RUN gradle dependencies > /dev/null 2>&1 || true

# 소스 복사 후 빌드
COPY src src
RUN gradle bootJar -x test

# --- Runtime stage ---
FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r app && useradd -r -g app app
WORKDIR /app

COPY --from=build /workspace/build/libs/app.jar app.jar

USER app
EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx768m"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
