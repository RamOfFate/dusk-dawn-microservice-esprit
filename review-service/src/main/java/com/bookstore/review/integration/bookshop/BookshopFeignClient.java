package com.bookstore.review.integration.bookshop;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * OpenFeign client used by review-service to validate that a book exists.
 *
 * bookshop-service exposes:
 * - GET /api/books/{id}
 */
@FeignClient(name = "bookshop-service", path = "/api/books")
public interface BookshopFeignClient {

    /**
     * We only need the id for existence validation.
     * Keep this DTO minimal to avoid coupling.
     */
    record BookDto(Long id) {
    }

    @GetMapping("/{id}")
    BookDto getBookById(@PathVariable("id") Long id);
}
