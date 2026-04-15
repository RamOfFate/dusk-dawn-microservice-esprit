package fate.ram.bookshop.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;


import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;


@Data
@Document(collection = "books")
public class Book {
    @Id
    private String id;

    private String title;

    private String isbn;

    private Double price;

    private String description;

    private String imageUrl;

    private String author;

    private int views;

    @DocumentReference
    private Category category;

}
