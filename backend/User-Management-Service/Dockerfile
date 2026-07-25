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
# Cap heap to 75% of the container's RAM so it fits Render's 512MB free tier.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
# Render injects $PORT; the app binds to it via server.port=${PORT:...} in application.properties.
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
