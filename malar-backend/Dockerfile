# Build stage
FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
# Use simple paths (we will set the Context in Render)
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-focal
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
