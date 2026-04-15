package com.bookstore.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewCreateRequest(
        Long userId,       // Optionnel : le serveur utilise l'ID du token authentifié
        @NotNull Long bookId,
        @NotNull @Min(1) @Max(5) Integer rating,
        @Size(max = 4000) String comment
) {
}
