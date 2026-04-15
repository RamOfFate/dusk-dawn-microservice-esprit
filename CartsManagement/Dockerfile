FROM openjdk:21
EXPOSE 8084
# Optional: include local H2 file directory if present
ADD Database/ /Database/
ADD target/OrderManagement-0.0.1-SNAPSHOT.jar cartmanagement.jar
ENTRYPOINT ["java", "-jar", "cartmanagement.jar"]
