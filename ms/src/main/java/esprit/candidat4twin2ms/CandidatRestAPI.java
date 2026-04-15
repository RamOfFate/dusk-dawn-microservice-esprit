package esprit.candidat4twin2ms;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class CandidatRestAPI {
    public String title = "Hello";
    @Autowired
    public  ICandidat candidatInterface;

    @Autowired
    public ServiceCandidat serCandid;
    @RequestMapping("/users")
    public List<User> getJobs() {
        return serCandid.getAllUsers();
    }
    @RequestMapping("/hello")
    public String getTitle() {
        return title;
    }
    @GetMapping
    public List<Candidat> getCandidats() {
       return candidatInterface.getCandidats();
    }
    @PostMapping
    public Candidat saveCandidat(@RequestBody Candidat candidat) {
       return candidatInterface.saveCandidat(candidat);
    }
    // GET http://localhost:8080/candidats/{id}
    @GetMapping("/{id}")
    public Candidat getCandidat(@PathVariable int id) {
        return candidatInterface.getCandidatById(id);
    }

    // PUT http://localhost:8080/candidats/{id}
    @PutMapping("/{id}")
    public Candidat updateCandidat(@PathVariable int id,
                                   @RequestBody Candidat c) {
        return candidatInterface.updateCandidat(id, c);
    }

    // DELETE http://localhost:8080/candidats/{id}
    @DeleteMapping("/{id}")
    public void deleteCandidat(@PathVariable int id) {
        candidatInterface.deleteCandidat(id);
    }
}
