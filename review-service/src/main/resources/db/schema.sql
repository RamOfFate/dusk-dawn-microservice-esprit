-- Review Service — MySQL 8+
-- Run manually or use as reference; Hibernate ddl-auto can also create tables.

CREATE DATABASE IF NOT EXISTS bookstore_reviews
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bookstore_reviews;

CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT 'Reference to User Service',
    book_id BIGINT NOT NULL COMMENT 'Reference to Book Service',
    rating INT NOT NULL,
    comment VARCHAR(4000) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_reviews_user_book UNIQUE (user_id, book_id),
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    INDEX idx_reviews_book_id (book_id),
    INDEX idx_reviews_created_at (created_at)
) ENGINE=InnoDB;
