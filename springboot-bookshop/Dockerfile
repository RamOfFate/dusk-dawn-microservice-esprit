FROM openjdk:21
EXPOSE 8080
ADD target/bookshop-0.0.1-SNAPSHOT.jar bookshop-service.jar
ENTRYPOINT ["java", "-jar", "bookshop-service.jar"]
