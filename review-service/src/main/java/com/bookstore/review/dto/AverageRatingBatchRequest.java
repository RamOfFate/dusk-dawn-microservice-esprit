package com.bookstore.review.dto;

import java.util.List;

public record AverageRatingBatchRequest(
        List<Long> bookIds
) {
}
