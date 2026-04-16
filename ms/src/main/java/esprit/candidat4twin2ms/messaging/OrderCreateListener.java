package esprit.candidat4twin2ms.messaging;

import bookshop.shared.messaging.OrderCreateRequest;
import bookshop.shared.messaging.OrderCreateResponse;
import esprit.candidat4twin2ms.Candidat;
import esprit.candidat4twin2ms.ServiceCandidat;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class OrderCreateListener {

    private final ServiceCandidat serviceCandidat;

    public OrderCreateListener(ServiceCandidat serviceCandidat) {
        this.serviceCandidat = serviceCandidat;
    }

    @RabbitListener(queues = "${app.rabbitmq.orders.create.queue:orders.create.queue}")
    public OrderCreateResponse handleCreateOrder(OrderCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request is null");
        }

        Candidat order = new Candidat();
        order.setCustomerName(request.getCustomerName());
        order.setTotalAmount(request.getTotalAmount());
        order.setShippingAddress(request.getShippingAddress());
        order.setNotes(request.getNotes());

        Candidat saved = serviceCandidat.saveCandidat(order);

        return new OrderCreateResponse(
                saved.getId(),
                saved.getCustomerName(),
                saved.getOrderDate(),
                saved.getStatus() != null ? saved.getStatus().name() : null,
                saved.getTotalAmount(),
                saved.getShippingAddress(),
                saved.getNotes()
        );
    }
}
