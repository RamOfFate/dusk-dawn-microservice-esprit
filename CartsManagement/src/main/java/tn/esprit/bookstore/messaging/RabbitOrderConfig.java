package tn.esprit.bookstore.messaging;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitOrderConfig {

    @Value("${app.rabbitmq.orders.exchange:bookshop.orders.exchange}")
    private String ordersExchange;

    @Value("${app.rabbitmq.orders.create.queue:orders.create.queue}")
    private String orderCreateQueue;

    @Value("${app.rabbitmq.orders.create.routing-key:orders.create}")
    private String orderCreateRoutingKey;

    @Value("${app.rabbitmq.rpc-timeout-ms:5000}")
    private long rpcTimeoutMs;

    @Bean
    public DirectExchange ordersExchange() {
        return new DirectExchange(ordersExchange, true, false);
    }

    @Bean
    public Queue orderCreateQueue() {
        return new Queue(orderCreateQueue, true);
    }

    @Bean
    public Binding orderCreateBinding(DirectExchange ordersExchange, Queue orderCreateQueue) {
        return BindingBuilder.bind(orderCreateQueue).to(ordersExchange).with(orderCreateRoutingKey);
    }

    @Bean
    public MessageConverter jacksonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jacksonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jacksonMessageConverter);
        template.setReplyTimeout(rpcTimeoutMs);
        return template;
    }
}
