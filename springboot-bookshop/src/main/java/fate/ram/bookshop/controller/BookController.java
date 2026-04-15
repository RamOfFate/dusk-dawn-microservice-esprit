package fate.ram.bookshop.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import fate.ram.bookshop.model.Book;
import fate.ram.bookshop.service.BookService;

@RestController
@RequestMapping("/api/books")
public class BookController{

    @Autowired
    private BookService bookService; 

    @GetMapping
    public List<Book> getAllBooks() {
        return bookService.getAllBooks();
    }

    @PostMapping
    public Book createBook(@RequestBody Book book) {
        return bookService.saveBook(book);
    }

    @GetMapping("/popular")
    public List<Book> getPopularBooks() {return bookService.getPopularBooks();}

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
}
