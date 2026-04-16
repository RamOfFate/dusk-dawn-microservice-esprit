FROM eclipse-temurin:21-jdk

# Needed for docker-compose healthchecks (uses curl)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ADD target/bookshop-config-server-0.0.1-SNAPSHOT.jar bookshop-config-server.jar
ENTRYPOINT ["java", "-jar", "bookshop-config-server.jar"]
