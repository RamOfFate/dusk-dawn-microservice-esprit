package esprit.candidat4twin2ms;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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
    public List<Candidat> getCandidatsByCustomerName(String customerName) {
        if (customerName == null || customerName.trim().isEmpty()) {
            return List.of();
        }
        return candidatRepository.findByCustomerName(customerName.trim());
    }

    @Override
    public Candidat saveCandidat(Candidat candidat) {
        if (candidat.getOrderDate() == null) {
            candidat.setOrderDate(LocalDateTime.now());
        }
        if (candidat.getStatus() == null) {
            candidat.setStatus(Candidat.OrderStatus.PENDING);
        }
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
            if (c.getCustomerName() != null) {
                existing.setCustomerName(c.getCustomerName());
            }
            if (c.getOrderDate() != null) {
                existing.setOrderDate(c.getOrderDate());
            }
            if (c.getStatus() != null) {
                existing.setStatus(c.getStatus());
            }
            if (c.getTotalAmount() != null) {
                existing.setTotalAmount(c.getTotalAmount());
            }
            if (c.getShippingAddress() != null) {
                existing.setShippingAddress(c.getShippingAddress());
            }
            if (c.getNotes() != null) {
                existing.setNotes(c.getNotes());
            }
            return candidatRepository.save(existing);
        }
        return null;
    }

    @Override
    public void deleteCandidat(int id) {
        candidatRepository.deleteById(id);
    }

}
