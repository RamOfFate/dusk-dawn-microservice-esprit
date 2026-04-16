package com.bookstore.review.exception;

public class DuplicateReviewException extends RuntimeException {

    public DuplicateReviewException(String customerName, Long bookId) {
        super("Customer '" + customerName + "' has already reviewed book " + bookId);
    }

    public DuplicateReviewException(String customerName, Long bookId, Throwable cause) {
        super("Customer '" + customerName + "' has already reviewed book " + bookId, cause);
    }
}
