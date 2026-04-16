package esprit.candidat4twin2ms;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableRabbit
public class Candidat4Twin2MsApplication {

    public static void main(String[] args) {
        SpringApplication.run(Candidat4Twin2MsApplication.class, args);
    }
    @Bean
    ApplicationRunner init() {
        return (args) -> {
        };
    }
}
