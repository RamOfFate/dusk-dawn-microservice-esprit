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
            book.setCategory(resolveCategory(book.getCategory()));
        }

        return bookRepository.save(book);
    }

    public Book getBookById(Long id) {
        return bookRepository.findById(id).orElseThrow(() -> new RuntimeException("Book not found"));
    }

    public Book updateBook(Long id, Book input) {
        Book existing = getBookById(id);

        if (input.getTitle() == null || input.getTitle().isEmpty()) {
            throw new RuntimeException("Book title cannot be empty!");
        }

        existing.setTitle(input.getTitle());
        existing.setAuthor(input.getAuthor());
        existing.setIsbn(input.getIsbn());
        existing.setPrice(input.getPrice());
        existing.setDescription(input.getDescription());
        existing.setImageUrl(input.getImageUrl());
        existing.setViews(input.getViews());

        if (input.getCategory() == null) {
            existing.setCategory(null);
        } else {
            existing.setCategory(resolveCategory(input.getCategory()));
        }

        return bookRepository.save(existing);
    }

    public void deleteBook(Long id) {
        bookRepository.deleteById(id);
    }

    private Category resolveCategory(Category category) {
        if (category.getId() != null) {
            return categoryRepository.getReferenceById(category.getId());
        }
        return categoryRepository.save(category);
    }

    public List<Book> getPopularBooks() {
        return bookRepository.findTop10ByOrderByViewsDesc();
    }
}