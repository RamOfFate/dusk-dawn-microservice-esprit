package com.bookstore.review.service;

import com.bookstore.review.dto.AverageRatingResponse;
import com.bookstore.review.dto.PagedReviewsResponse;
import com.bookstore.review.dto.ReviewCreateRequest;
import com.bookstore.review.dto.ReviewResponse;
import com.bookstore.review.dto.ReviewUpdateRequest;
import com.bookstore.review.entity.Review;
import com.bookstore.review.exception.BookNotFoundException;
import com.bookstore.review.exception.BookshopUnavailableException;
import com.bookstore.review.exception.DuplicateReviewException;
import com.bookstore.review.exception.ReviewNotFoundException;
import com.bookstore.review.integration.bookshop.BookshopFeignClient;
import com.bookstore.review.model.ReviewSortOption;
import com.bookstore.review.repository.ReviewRepository;
import feign.FeignException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookshopFeignClient bookshopClient;

    public ReviewService(ReviewRepository reviewRepository, BookshopFeignClient bookshopClient) {
        this.reviewRepository = reviewRepository;
        this.bookshopClient = bookshopClient;
    }

    @Transactional
    public ReviewResponse create(ReviewCreateRequest request) {
        assertBookExists(request.bookId());

        Review review = new Review();
        review.setCustomerName(request.customerName());
        review.setBookId(request.bookId());
        review.setRating(request.rating());
        review.setComment(request.comment());
        review.setCreatedAt(Instant.now());
        try {
            Review saved = reviewRepository.save(review);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateReviewException(request.customerName(), request.bookId(), ex);
        }
    }

    public PagedReviewsResponse findByBook(
            Long bookId,
            ReviewSortOption sort,
            int page,
            int size
    ) {
        Sort s = resolveSort(sort != null ? sort : ReviewSortOption.LATEST);
        Pageable pageable = PageRequest.of(Math.max(page, 0), clampSize(size), s);
        Page<Review> result = reviewRepository.findByBookId(bookId, pageable);
        return new PagedReviewsResponse(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    public AverageRatingResponse averageForBook(Long bookId) {
        Double avg = reviewRepository.averageRatingByBookId(bookId);
        long count = reviewRepository.countByBookId(bookId);
        return new AverageRatingResponse(bookId, avg != null ? avg : 0.0, count);
    }

    public List<AverageRatingResponse> averageForBooks(List<Long> bookIds) {
        if (bookIds == null || bookIds.isEmpty()) {
            return List.of();
        }

        List<Long> normalized = bookIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (normalized.isEmpty()) {
            return List.of();
        }

        List<ReviewRepository.BookRatingAggregate> aggs = reviewRepository.aggregateRatingsByBookIds(normalized);
        Map<Long, AverageRatingResponse> byBookId = new HashMap<>(aggs.size());

        for (ReviewRepository.BookRatingAggregate a : aggs) {
            Long bookId = a.getBookId();
            if (bookId == null) {
                continue;
            }
            double avg = a.getAverageRating() != null ? a.getAverageRating() : 0.0;
            long count = a.getReviewCount() != null ? a.getReviewCount() : 0L;
            byBookId.put(bookId, new AverageRatingResponse(bookId, avg, count));
        }

        // Preserve input order and include zeros for books with no reviews.
        return normalized.stream()
                .map(id -> byBookId.getOrDefault(id, new AverageRatingResponse(id, 0.0, 0L)))
                .toList();
    }

    public ReviewResponse update(Long id, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(id).orElseThrow(() -> new ReviewNotFoundException(id));
        review.setRating(request.rating());
        review.setComment(request.comment());
        return toResponse(reviewRepository.save(review));
    }

    public void delete(Long id) {
        Review review = reviewRepository.findById(id).orElseThrow(() -> new ReviewNotFoundException(id));
        reviewRepository.delete(review);
    }

    private Sort resolveSort(ReviewSortOption sort) {
        return switch (sort) {
            case LATEST -> Sort.by(Sort.Direction.DESC, "createdAt");
            case HIGHEST_RATING -> Sort.by(Sort.Direction.DESC, "rating")
                    .and(Sort.by(Sort.Direction.DESC, "createdAt"));
        };
    }

    private int clampSize(int size) {
        if (size <= 0) {
            return 20;
        }
        return Math.min(size, 100);
    }

    private void assertBookExists(Long bookId) {
        if (bookId == null) {
            throw new BookNotFoundException(null);
        }

        try {
            // We only need to know that it exists.
            bookshopClient.getBookById(bookId);
        } catch (FeignException.NotFound ex) {
            throw new BookNotFoundException(bookId);
        } catch (FeignException ex) {
            throw new BookshopUnavailableException("Failed to validate book via bookshop-service", ex);
        }
    }

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getCustomerName(),
                r.getBookId(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}
