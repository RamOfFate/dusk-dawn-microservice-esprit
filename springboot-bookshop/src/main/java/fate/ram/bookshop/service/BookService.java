package fate.ram.bookshop.service;

import fate.ram.bookshop.model.Book;
import fate.ram.bookshop.model.Category;
import fate.ram.bookshop.repository.BookRepository;
import fate.ram.bookshop.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Book saveBook(Book book) {
        if (book.getTitle() == null || book.getTitle().isEmpty()) {
            throw new RuntimeException("Book title cannot be empty!");
        }

        // If a new Book references an existing Category (id present in JSON),
        // attach the Category to the persistence context to avoid "detached entity passed to persist".
        if (book.getCategory() != null) {
            Category category = book.getCategory();
            if (category.getId() != null) {
                book.setCategory(categoryRepository.getReferenceById(category.getId()));
            } else {
                book.setCategory(categoryRepository.save(category));
            }
        }

        return bookRepository.save(book);
    }

    public void deleteBook(Long id) {
        bookRepository.deleteById(id);
    }

    public List<Book> getPopularBooks() {
        return bookRepository.findTop10ByOrderByViewsDesc();
    }
}