package esprit.candidat4twin2ms;

import java.util.List;

public interface ICandidat {
    public List<Candidat> getCandidats();
    public Candidat saveCandidat(Candidat candidat);
    public  Candidat getCandidatById(int id);
    public  Candidat updateCandidat(int id, Candidat c);
    public void deleteCandidat(int id);
}
