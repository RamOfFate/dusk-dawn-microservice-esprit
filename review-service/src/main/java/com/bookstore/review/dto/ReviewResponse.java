package com.bookstore.review.dto;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        String customerName,
        Long bookId,
        Integer rating,
        String comment,
        Instant createdAt
) {
}
