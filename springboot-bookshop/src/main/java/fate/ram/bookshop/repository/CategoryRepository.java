package fate.ram.bookshop.repository;

import fate.ram.bookshop.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface CategoryRepository  extends MongoRepository<Category, String> {
}
