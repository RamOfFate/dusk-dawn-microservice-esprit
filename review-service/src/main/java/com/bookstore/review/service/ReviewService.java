package com.bookstore.review.service;

import com.bookstore.review.dto.AverageRatingResponse;
import com.bookstore.review.dto.PagedReviewsResponse;
import com.bookstore.review.dto.ReviewCreateRequest;
import com.bookstore.review.dto.ReviewResponse;
import com.bookstore.review.dto.ReviewUpdateRequest;
import com.bookstore.review.entity.Review;
import com.bookstore.review.exception.DuplicateReviewException;
import com.bookstore.review.exception.ForbiddenReviewAccessException;
import com.bookstore.review.exception.ReviewNotFoundException;
import com.bookstore.review.model.ReviewSortOption;
import com.bookstore.review.repository.ReviewRepository;
import com.bookstore.review.security.SecurityContextFacade;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final SecurityContextFacade securityContextFacade;

    public ReviewService(ReviewRepository reviewRepository, SecurityContextFacade securityContextFacade) {
        this.reviewRepository = reviewRepository;
        this.securityContextFacade = securityContextFacade;
    }

    @Transactional
    public ReviewResponse create(ReviewCreateRequest request) {
        // On utilise toujours l'ID de l'utilisateur authentifié (depuis le token JWT ou Keycloak),
        // jamais celui fourni par le client dans le body — c'est plus sécurisé.
        Long authUserId = securityContextFacade.requireUserId();
        if (reviewRepository.existsByUserIdAndBookId(authUserId, request.bookId())) {
            throw new DuplicateReviewException(authUserId, request.bookId());
        }
        Review review = new Review();
        review.setUserId(authUserId);
        review.setBookId(request.bookId());
        review.setRating(request.rating());
        review.setComment(request.comment());
        review.setCreatedAt(Instant.now());
        try {
            Review saved = reviewRepository.save(review);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateReviewException(request.userId(), request.bookId(), ex);
        }
    }

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
    public AverageRatingResponse averageForBook(Long bookId) {
        Double avg = reviewRepository.averageRatingByBookId(bookId);
        long count = reviewRepository.countByBookId(bookId);
        return new AverageRatingResponse(bookId, avg != null ? avg : 0.0, count);
    }

    @Transactional
    public ReviewResponse update(Long id, ReviewUpdateRequest request) {
        Long authUserId = securityContextFacade.requireUserId();
        Review review = reviewRepository.findById(id).orElseThrow(() -> new ReviewNotFoundException(id));
        if (!review.getUserId().equals(authUserId)) {
            throw new ForbiddenReviewAccessException("You can only update your own review");
        }
        review.setRating(request.rating());
        review.setComment(request.comment());
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public void delete(Long id) {
        Long authUserId = securityContextFacade.requireUserId();
        Review review = reviewRepository.findById(id).orElseThrow(() -> new ReviewNotFoundException(id));
        if (!review.getUserId().equals(authUserId)) {
            throw new ForbiddenReviewAccessException("You can only delete your own review");
        }
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

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getUserId(),
                r.getBookId(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}
