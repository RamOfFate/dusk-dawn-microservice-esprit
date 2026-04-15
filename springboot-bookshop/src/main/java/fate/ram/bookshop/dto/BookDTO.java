package fate.ram.bookshop.dto;

import lombok.Data;

@Data
public class BookDTO {
    private String title;
    private String isbn;
    private String authorName;
    private String categoryName;
    private double price;
}