FROM eclipse-temurin:21-jdk
EXPOSE 8082
ADD target/review-service-1.0.0-SNAPSHOT.jar review-service.jar
ENTRYPOINT ["java", "-jar", "review-service.jar"]