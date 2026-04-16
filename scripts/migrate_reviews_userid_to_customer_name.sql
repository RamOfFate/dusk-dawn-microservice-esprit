-- Migration helper for existing MySQL volumes created before the refactor
-- from (user_id, book_id) to (customer_name, book_id).
--
-- Symptom:
--   POST /reviews fails with: Field 'user_id' doesn't have a default value
--
-- This script is intentionally idempotent (safe to run multiple times).
--
-- DB: bookstore_reviews
-- Table: reviews

USE bookstore_reviews;

SET @has_user_id := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reviews'
    AND COLUMN_NAME = 'user_id'
);

SET @has_old_unique_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reviews'
    AND INDEX_NAME = 'uk_reviews_user_book'
);

-- Drop the old unique key (user_id, book_id) if it exists.
SET @sql_drop_idx := IF(
  @has_old_unique_idx > 0,
  'ALTER TABLE reviews DROP INDEX uk_reviews_user_book',
  'SELECT 1'
);
PREPARE stmt_drop_idx FROM @sql_drop_idx;
EXECUTE stmt_drop_idx;
DEALLOCATE PREPARE stmt_drop_idx;

-- Drop the obsolete user_id column if it exists.
SET @sql_drop_col := IF(
  @has_user_id > 0,
  'ALTER TABLE reviews DROP COLUMN user_id',
  'SELECT 1'
);
PREPARE stmt_drop_col FROM @sql_drop_col;
EXECUTE stmt_drop_col;
DEALLOCATE PREPARE stmt_drop_col;
