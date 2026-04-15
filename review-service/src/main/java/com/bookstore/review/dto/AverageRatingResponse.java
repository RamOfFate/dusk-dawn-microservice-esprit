package com.bookstore.review.dto;

public record AverageRatingResponse(
        Long bookId,
        double averageRating,
        long reviewCount
) {
}
