CREATE TABLE IF NOT EXISTS feedback_comments (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX feedback_email_date (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
