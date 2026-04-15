FROM eclipse-temurin:21-jdk
EXPOSE 8080
ADD target/bookshop-0.0.1-SNAPSHOT.jar bookshop-service.jar
ENTRYPOINT ["java", "-jar", "bookshop-service.jar"]
