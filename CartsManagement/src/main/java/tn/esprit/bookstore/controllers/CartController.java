package tn.esprit.bookstore.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import bookshop.shared.messaging.OrderCreateRequest;
import bookshop.shared.messaging.OrderCreateResponse;
import tn.esprit.bookstore.entities.Cart;
import tn.esprit.bookstore.dto.User;
import tn.esprit.bookstore.messaging.OrdersMessagingClient;
import tn.esprit.bookstore.services.CartService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/carts")
public class CartController {

    private final CartService cartService;
    private final OrdersMessagingClient ordersMessagingClient;

    @Autowired
    public CartController(CartService cartService, OrdersMessagingClient ordersMessagingClient) {
        this.cartService = cartService;
        this.ordersMessagingClient = ordersMessagingClient;
    }

    @GetMapping
    public ResponseEntity<List<Cart>> getAllCarts() {
        List<Cart> carts = cartService.getAll();
        if (carts.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(carts);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Cart>> getCartsByCustomer(@PathVariable Integer customerId) {
        List<Cart> carts = cartService.getCartsByCustomer(customerId);
        if (carts.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(carts);
    }

    @GetMapping("/customerName/{customerName}")
    public ResponseEntity<List<Cart>> getCartsByCustomerName(@PathVariable String customerName) {
        List<Cart> carts = cartService.getCartsByCustomerName(customerName);
        if (carts.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(carts);
    }

    @PostMapping
    public ResponseEntity<Cart> createCart(@RequestBody Cart cart) {
        Cart saved = cartService.addCart(cart);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cart> updateCart(@PathVariable Integer id, @RequestBody Cart cart) {
        Optional<Cart> updated = cartService.updateCart(id, cart);
        return updated
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCart(@PathVariable Integer id) {
        boolean deleted = cartService.deleteCart(id);
        if (deleted) return ResponseEntity.ok("Cart deleted");
        else return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cart not found");
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = cartService.getUserById(id);
        return user
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Creates an order via the Orders microservice, using RabbitMQ (RPC-style request/reply),
     * then clears the corresponding cart items server-side.
     *
     * If "cartId" is provided, only that cart item is cleared.
     * Otherwise, all cart items for the given customerName are cleared.
     */
    @PostMapping("/order")
    public ResponseEntity<OrderCreateResponse> createOrderFromCart(
            @RequestParam(value = "cartId", required = false) Integer cartId,
            @RequestBody OrderCreateRequest request
    ) {
        if (request == null) {
            return ResponseEntity.badRequest().build();
        }

        String customer = request.getCustomerName() != null ? request.getCustomerName().trim() : "";
        String address = request.getShippingAddress() != null ? request.getShippingAddress().trim() : "";

        if (customer.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        if (address.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        if (request.getTotalAmount() == null || request.getTotalAmount() <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // Pre-check carts before creating the order (avoid creating an order for a missing/empty cart).
        if (cartId != null) {
            Optional<Cart> cartOpt = cartService.getCartById(cartId);
            if (cartOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            Cart cart = cartOpt.get();
            String cartCustomer = cart.getCustomerName() != null ? cart.getCustomerName().trim() : "";
            if (!customer.equals(cartCustomer)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        } else {
            List<Cart> carts = cartService.getCartsByCustomerName(customer);
            if (carts == null || carts.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
        }

        OrderCreateResponse created = ordersMessagingClient.createOrder(request);

        String cartClearStatus = "ok";
        int deletedCount = 0;
        try {
            if (cartId != null) {
                deletedCount = cartService.deleteCart(cartId) ? 1 : 0;
            } else {
                deletedCount = cartService.deleteCartsByCustomerName(customer);
            }
        } catch (Exception ex) {
            cartClearStatus = "failed";
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .header("X-Cart-Clear-Status", cartClearStatus)
                .header("X-Carts-Deleted", String.valueOf(deletedCount))
                .body(created);
    }
}