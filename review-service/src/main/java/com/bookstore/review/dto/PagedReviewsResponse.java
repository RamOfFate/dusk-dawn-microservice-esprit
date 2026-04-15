package com.bookstore.review.dto;

import java.util.List;

public record PagedReviewsResponse(
        List<ReviewResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
}
