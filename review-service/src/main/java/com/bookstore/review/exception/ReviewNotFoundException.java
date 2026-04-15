package com.bookstore.review.exception;

public class ReviewNotFoundException extends RuntimeException {

    public ReviewNotFoundException(Long id) {
        super("Review not found: " + id);
    }
}
