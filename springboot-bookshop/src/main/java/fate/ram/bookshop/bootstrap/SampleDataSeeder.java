package fate.ram.bookshop.bootstrap;

import fate.ram.bookshop.model.Book;
import fate.ram.bookshop.model.Category;
import fate.ram.bookshop.repository.BookRepository;
import fate.ram.bookshop.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class SampleDataSeeder implements CommandLineRunner {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;

    public SampleDataSeeder(BookRepository bookRepository, CategoryRepository categoryRepository) {
        this.bookRepository = bookRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Seed only when the catalog is empty.
        if (bookRepository.count() > 0) {
            return;
        }

        Category classics = category("Classics", "Timeless stories and influential works.", "#2563eb");
        Category fantasy = category("Fantasy", "Magic, myths, and otherworldly adventures.", "#7c3aed");
        Category sciFi = category("Science", "Ideas, discoveries, and future-facing stories.", "#0ea5e9");
        Category business = category("Business", "Practical books on work, growth, and strategy.", "#16a34a");
        Category philosophy = category("Philosophy", "Big questions, clear thinking, and ethics.", "#f59e0b");

        categoryRepository.saveAll(List.of(classics, fantasy, sciFi, business, philosophy));

        List<Book> books = List.of(
                book("Pride and Prejudice", "Jane Austen", "978-0141439518", 24.90,
                        "A sharp, witty story about manners, misunderstandings, and the slow work of changing one’s mind.",
                        "https://placehold.co/400x600?text=Pride+and+Prejudice", 187, classics),
                book("Moby-Dick", "Herman Melville", "978-0142437247", 29.50,
                        "A voyage that turns into obsession — part adventure, part meditation on fate and the sea.",
                        "https://placehold.co/400x600?text=Moby-Dick", 132, classics),
                book("The Great Gatsby", "F. Scott Fitzgerald", "978-0743273565", 22.00,
                        "A glittering summer of hope and illusions, told with precision and heartbreak.",
                        "https://placehold.co/400x600?text=Gatsby", 164, classics),

                book("The Hobbit", "J.R.R. Tolkien", "978-0547928227", 35.00,
                        "A reluctant hero, a dangerous journey, and the kind of luck you only notice after it saves you.",
                        "https://placehold.co/400x600?text=The+Hobbit", 240, fantasy),
                book("A Wizard of Earthsea", "Ursula K. Le Guin", "978-0547773742", 27.80,
                        "A coming-of-age tale where true power is knowing what to name — and what to leave unnamed.",
                        "https://placehold.co/400x600?text=Earthsea", 98, fantasy),

                book("The Martian", "Andy Weir", "978-0804139021", 31.90,
                        "Stranded on Mars, one engineer solves problems with science, sarcasm, and stubborn optimism.",
                        "https://placehold.co/400x600?text=The+Martian", 210, sciFi),
                book("The Pragmatic Programmer", "Andrew Hunt & David Thomas", "978-0135957059", 89.00,
                        "A toolbox of habits for building software that survives contact with reality.",
                        "https://placehold.co/400x600?text=Pragmatic+Programmer", 420, business),
                book("Deep Work", "Cal Newport", "978-1455586691", 44.00,
                        "A practical guide to focus: how to produce better results by protecting your attention.",
                        "https://placehold.co/400x600?text=Deep+Work", 205, business),

                book("Meditations", "Marcus Aurelius", "978-0812968255", 26.00,
                        "Short reflections on discipline, perspective, and living with purpose — written for the author, kept for us.",
                        "https://placehold.co/400x600?text=Meditations", 176, philosophy),
                book("The Republic", "Plato", "978-0141442433", 33.00,
                        "A dialogue about justice, power, and the shape of a good society.",
                        "https://placehold.co/400x600?text=The+Republic", 144, philosophy),

                book("Clean Code", "Robert C. Martin", "978-0132350884", 95.00,
                        "Principles and practices for writing code that is readable, maintainable, and kind to your future self.",
                        "https://placehold.co/400x600?text=Clean+Code", 390, business),
                book("Thinking, Fast and Slow", "Daniel Kahneman", "978-0374533557", 58.00,
                        "A tour of how humans actually think — and why our brains often betray our best intentions.",
                        "https://placehold.co/400x600?text=Thinking+Fast+and+Slow", 260, philosophy)
        );

        bookRepository.saveAll(books);
    }

    private static Category category(String name, String description, String color) {
        Category c = new Category();
        c.setName(name);
        c.setDescription(description);
        c.setColor(color);
        return c;
    }

    private static Book book(String title, String author, String isbn, double price, String description, String imageUrl,
                             int views, Category category) {
        Book b = new Book();
        b.setTitle(title);
        b.setAuthor(author);
        b.setIsbn(isbn);
        b.setPrice(price);
        b.setDescription(description);
        b.setImageUrl(imageUrl);
        b.setViews(views);
        b.setCategory(category);
        return b;
    }
}
