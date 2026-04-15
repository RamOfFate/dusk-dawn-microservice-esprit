package com.bookstore.review.web;

import com.bookstore.review.model.ReviewSortOption;

public final class ReviewSortParser {

    private ReviewSortParser() {
    }

    /**
     * Accepts: {@code latest}, {@code rating} (or {@code HIGHEST_RATING}), case-insensitive.
     */
    public static ReviewSortOption parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return ReviewSortOption.LATEST;
        }
        return switch (raw.trim().toLowerCase()) {
            case "latest" -> ReviewSortOption.LATEST;
            case "rating", "highest", "highest_rating" -> ReviewSortOption.HIGHEST_RATING;
            default -> ReviewSortOption.LATEST;
        };
    }
}
