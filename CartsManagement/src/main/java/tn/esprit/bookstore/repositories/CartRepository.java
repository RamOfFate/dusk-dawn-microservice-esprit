package tn.esprit.bookstore.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.bookstore.entities.Cart;

import java.util.List;

@Repository
public interface CartRepository extends JpaRepository<Cart, Integer> {

    List<Cart> findByCustomerId(Integer customerId);

    List<Cart> findByCustomerName(String customerName);
}
