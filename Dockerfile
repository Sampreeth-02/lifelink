# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/lifelink.jar app.jar
ENV PORT=8080
EXPOSE $PORT
ENTRYPOINT ["sh", "-c", "java -Xmx256m -Dserver.port=${PORT} -jar app.jar"]
