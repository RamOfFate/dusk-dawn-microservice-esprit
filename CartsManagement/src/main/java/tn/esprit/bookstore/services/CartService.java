package tn.esprit.bookstore.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.esprit.bookstore.entities.Cart;
import tn.esprit.bookstore.dto.User;
import tn.esprit.bookstore.repositories.CartRepository;
import tn.esprit.bookstore.repositories.UserClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    private final CartRepository repo;

    @Autowired
    private UserClient userClient;

    @Autowired
    public CartService(CartRepository repo) {
        this.repo = repo;
    }

    // ===== User Methods =====
    public Optional<User> getUserById(Long id) {
        return Optional.ofNullable(userClient.getUserById(id));
    }

    // ===== Cart CRUD Methods =====
    public List<Cart> getAll() {
        return repo.findAll();
    }

    public List<Cart> getCartsByCustomer(Integer customerId) {
        return repo.findByCustomerId(customerId);
    }

    public Cart addCart(Cart cart) {
        LocalDateTime now = LocalDateTime.now();
        cart.setCreatedAt(now);
        cart.setUpdatedAt(now);
        return repo.save(cart);
    }

    public Optional<Cart> updateCart(Integer id, Cart newCart) {
        return repo.findById(id)
                .map(existing -> {
                    if (newCart.getTotalAmount() != null)
                        existing.setTotalAmount(newCart.getTotalAmount());
                    if (newCart.getShippingAddress() != null)
                        existing.setShippingAddress(newCart.getShippingAddress());
                    if (newCart.getNotes() != null)
                        existing.setNotes(newCart.getNotes());
                    if (newCart.getCustomerId() != null)
                        existing.setCustomerId(newCart.getCustomerId());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return repo.save(existing);
                });
    }

    public boolean deleteCart(Integer id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return true;
        }
        return false;
    }
}