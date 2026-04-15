package com.bookstore.review.exception;

public class ForbiddenReviewAccessException extends RuntimeException {

    public ForbiddenReviewAccessException(String message) {
        super(message);
    }
}
