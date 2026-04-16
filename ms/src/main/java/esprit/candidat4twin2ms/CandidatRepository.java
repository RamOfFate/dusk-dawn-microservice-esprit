package esprit.candidat4twin2ms;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CandidatRepository extends
        JpaRepository<Candidat, Integer> {

    List<Candidat> findByCustomerName(String customerName);
}
