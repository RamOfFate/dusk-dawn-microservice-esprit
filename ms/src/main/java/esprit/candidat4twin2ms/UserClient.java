package esprit.candidat4twin2ms;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@FeignClient(name="usermicroservice" , configuration = FeignConfig.class)
public interface UserClient {

    @RequestMapping("/users")
    public List<User> getAllUsers();
}
