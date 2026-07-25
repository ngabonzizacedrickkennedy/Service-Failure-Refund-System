# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B clean package -Dmaven.test.skip=true

# ---- Run stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Tight JVM tuning to survive Render's 512MB free tier (heavy Spring Boot 4).
# Small heap + capped metaspace + SerialGC + lean thread stacks keep total RSS under 512MB.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=60.0 -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m -Xss512k -XX:TieredStopAtLevel=1 -XX:+ExitOnOutOfMemoryError"
# Render injects $PORT; the app binds to it via server.port=${PORT:...} in application.properties.
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
