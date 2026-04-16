package fate.ram.bookshop.service;

import fate.ram.bookshop.integration.reviews.ReviewRatingsClient;
import fate.ram.bookshop.model.Book;
import fate.ram.bookshop.model.Category;
import fate.ram.bookshop.repository.BookRepository;
import fate.ram.bookshop.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ReviewRatingsClient reviewRatingsClient;

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
        // Popularity is determined primarily by rating (avg desc, count desc), falling back to views.
        // We consider the full catalog so "popular" reflects the best-reviewed books, not just the most-viewed ones.
        List<Book> candidates = bookRepository.findAll();

        if (candidates.isEmpty()) {
            return List.of();
        }

        List<Long> ids = candidates.stream().map(Book::getId).toList();

        try {
            Map<Long, ReviewRatingsClient.BookRating> ratings = reviewRatingsClient.getAverageRatings(ids);

            Comparator<Book> byPopularity = Comparator
                    .comparingDouble((Book b) -> ratings.getOrDefault(b.getId(), ReviewRatingsClient.BookRating.ZERO).averageRating())
                    .reversed()
                    .thenComparing(Comparator.comparingLong(
                            (Book b) -> ratings.getOrDefault(b.getId(), ReviewRatingsClient.BookRating.ZERO).reviewCount()
                    ).reversed())
                    .thenComparing(Comparator.comparingInt(Book::getViews).reversed());

            return candidates.stream()
                    .sorted(byPopularity)
                    .limit(10)
                    .toList();
        } catch (Exception ex) {
            // If review-service is unavailable, keep a deterministic views-based fallback.
            return bookRepository
                    .findAll(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "views")))
                    .getContent();
        }
    }
}