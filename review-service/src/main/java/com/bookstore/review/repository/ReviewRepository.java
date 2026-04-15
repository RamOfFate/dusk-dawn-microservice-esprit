package com.bookstore.review.repository;

import com.bookstore.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    Optional<Review> findByUserIdAndBookId(Long userId, Long bookId);

    Page<Review> findByBookId(Long bookId, Pageable pageable);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.bookId = :bookId")
    Double averageRatingByBookId(@Param("bookId") Long bookId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.bookId = :bookId")
    long countByBookId(@Param("bookId") Long bookId);
}
