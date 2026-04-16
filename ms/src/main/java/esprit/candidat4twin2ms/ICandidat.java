package esprit.candidat4twin2ms;

import java.util.List;

public interface ICandidat {
    List<Candidat> getCandidats();

    List<Candidat> getCandidatsByCustomerName(String customerName);

    Candidat saveCandidat(Candidat candidat);

    Candidat getCandidatById(int id);

    Candidat updateCandidat(int id, Candidat c);

    void deleteCandidat(int id);
}
