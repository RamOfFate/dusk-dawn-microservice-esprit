package esprit.candidat4twin2ms;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServiceCandidat implements ICandidat {
    @Autowired
    public CandidatRepository candidatRepository;
    @Autowired
    public UserClient jobClient;

    public List<User> getAllUsers() {
        return  jobClient.getAllUsers();
    }

    @Override
    public List<Candidat> getCandidats() {
        return candidatRepository.findAll();
    }

    @Override
    public Candidat saveCandidat(Candidat candidat) {
        return candidatRepository.save(candidat);
    }



    @Override
    public Candidat getCandidatById(int id) {
        return candidatRepository.findById(id).orElse(null);
    }


    @Override
    public Candidat updateCandidat(int id, Candidat c) {
        Candidat existing = candidatRepository.findById(id).orElse(null);
        if (existing != null) {
            existing.setCustomerName(c.getCustomerName());;
            existing.setOrderDate(c.getOrderDate());
            existing.setTotalAmount(c.getTotalAmount());
            return candidatRepository.save(existing);
        }
        return null;
    }

    @Override
    public void deleteCandidat(int id) {
        candidatRepository.deleteById(id);
    }

}
