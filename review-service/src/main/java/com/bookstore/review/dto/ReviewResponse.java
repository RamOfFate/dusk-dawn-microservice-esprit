package com.bookstore.review.dto;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long userId,
        Long bookId,
        Integer rating,
        String comment,
        Instant createdAt
) {
}
