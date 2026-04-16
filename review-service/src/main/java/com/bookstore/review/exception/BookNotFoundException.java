package com.bookstore.review.exception;

public class BookNotFoundException extends RuntimeException {
    public BookNotFoundException(Long bookId) {
        super("Book not found: " + bookId);
    }
}
