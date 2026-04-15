package tn.esprit.bookstore.repositories;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import tn.esprit.bookstore.dto.User;




@FeignClient(name = "UserService")
public interface UserClient {

    @GetMapping("/users/{id}")
    tn.esprit.bookstore.dto.User getUserById(@PathVariable("id") Long id);
}