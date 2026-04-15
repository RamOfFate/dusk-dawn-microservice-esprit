package com.bookstore.review.web;

import com.bookstore.review.dto.AverageRatingResponse;
import com.bookstore.review.dto.PagedReviewsResponse;
import com.bookstore.review.dto.ReviewCreateRequest;
import com.bookstore.review.dto.ReviewResponse;
import com.bookstore.review.dto.ReviewUpdateRequest;
import com.bookstore.review.model.ReviewSortOption;
import com.bookstore.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(@Valid @RequestBody ReviewCreateRequest request) {
        return reviewService.create(request);
    }

    /**
     * Paginated reviews for a book. Query: {@code sort=latest|rating}, {@code page}, {@code size}.
     */
    @GetMapping("/book/{bookId}")
    public PagedReviewsResponse listByBook(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        ReviewSortOption sortOption = ReviewSortParser.parse(sort);
        return reviewService.findByBook(bookId, sortOption, page, size);
    }

    @GetMapping("/book/{bookId}/average")
    public AverageRatingResponse average(@PathVariable Long bookId) {
        return reviewService.averageForBook(bookId);
    }

    @PutMapping("/{id}")
    public ReviewResponse update(@PathVariable Long id, @Valid @RequestBody ReviewUpdateRequest request) {
        return reviewService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        reviewService.delete(id);
    }
}
