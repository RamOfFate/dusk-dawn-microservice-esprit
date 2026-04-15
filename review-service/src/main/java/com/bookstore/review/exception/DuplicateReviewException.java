package com.bookstore.review.exception;

public class DuplicateReviewException extends RuntimeException {

    public DuplicateReviewException(Long userId, Long bookId) {
        super("User " + userId + " has already reviewed book " + bookId);
    }

    public DuplicateReviewException(Long userId, Long bookId, Throwable cause) {
        super("User " + userId + " has already reviewed book " + bookId, cause);
    }
}
