package com.bookstore.review.repository;

import com.bookstore.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    interface BookRatingAggregate {
        Long getBookId();

        Double getAverageRating();

        Long getReviewCount();
    }

    boolean existsByCustomerNameAndBookId(String customerName, Long bookId);

    Optional<Review> findByCustomerNameAndBookId(String customerName, Long bookId);

    Page<Review> findByBookId(Long bookId, Pageable pageable);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.bookId = :bookId")
    Double averageRatingByBookId(@Param("bookId") Long bookId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.bookId = :bookId")
    long countByBookId(@Param("bookId") Long bookId);

    @Query("""
            SELECT r.bookId AS bookId,
                   COALESCE(AVG(r.rating), 0.0) AS averageRating,
                   COUNT(r) AS reviewCount
            FROM Review r
            WHERE r.bookId IN :bookIds
            GROUP BY r.bookId
            """)
    List<BookRatingAggregate> aggregateRatingsByBookIds(@Param("bookIds") Collection<Long> bookIds);
}
