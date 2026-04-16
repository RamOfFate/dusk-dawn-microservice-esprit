package tn.esprit.bookstore.messaging;

import bookshop.shared.messaging.OrderCreateRequest;
import bookshop.shared.messaging.OrderCreateResponse;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OrdersMessagingClient {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.orders.exchange:bookshop.orders.exchange}")
    private String ordersExchange;

    @Value("${app.rabbitmq.orders.create.routing-key:orders.create}")
    private String orderCreateRoutingKey;

    public OrdersMessagingClient(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public OrderCreateResponse createOrder(OrderCreateRequest request) {
        Object reply = rabbitTemplate.convertSendAndReceive(ordersExchange, orderCreateRoutingKey, request);
        if (reply == null) {
            throw new IllegalStateException("Orders service did not reply (RabbitMQ RPC timeout)");
        }
        if (!(reply instanceof OrderCreateResponse)) {
            throw new IllegalStateException("Unexpected reply type from orders service: " + reply.getClass());
        }
        return (OrderCreateResponse) reply;
    }
}
