CREATE TABLE IF NOT EXISTS ranking_attempts (
  id VARCHAR(80) NOT NULL PRIMARY KEY,
  participant_id VARCHAR(80) NOT NULL,
  nickname VARCHAR(32) NOT NULL,
  category VARCHAR(40) NOT NULL,
  level TINYINT UNSIGNED NOT NULL,
  total TINYINT UNSIGNED NOT NULL,
  correct TINYINT UNSIGNED NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX ranking_filter (category, level, total, correct, created_at),
  INDEX ranking_participant (participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
