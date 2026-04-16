package com.bookstore.review.exception;

public class BookshopUnavailableException extends RuntimeException {
    public BookshopUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
