-- Execute depois de ranking.sql. Reexecutar é seguro.
CREATE TABLE IF NOT EXISTS synced_profiles (
  id VARCHAR(80) NOT NULL PRIMARY KEY,
  access_key_hash BINARY(32) NOT NULL UNIQUE,
  nickname VARCHAR(32) NOT NULL,
  share_ranking BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profile_results (
  id VARCHAR(80) NOT NULL PRIMARY KEY,
  profile_id VARCHAR(80) NOT NULL,
  category VARCHAR(40) NOT NULL,
  level TINYINT UNSIGNED NOT NULL,
  total TINYINT UNSIGNED NOT NULL,
  correct TINYINT UNSIGNED NOT NULL,
  completed_at DATETIME(3) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX profile_results_owner (profile_id, completed_at),
  CONSTRAINT profile_results_owner_fk FOREIGN KEY (profile_id)
    REFERENCES synced_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profile_labs (
  profile_id VARCHAR(80) NOT NULL,
  mission TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (profile_id, mission),
  CONSTRAINT profile_labs_owner_fk FOREIGN KEY (profile_id)
    REFERENCES synced_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profile_question_stats (
  profile_id VARCHAR(80) NOT NULL,
  question_id VARCHAR(80) NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  correct INT UNSIGNED NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (profile_id, question_id),
  CONSTRAINT profile_question_stats_owner_fk FOREIGN KEY (profile_id)
    REFERENCES synced_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pro_requests (
  id VARCHAR(80) NOT NULL PRIMARY KEY,
  profile_id VARCHAR(80) NOT NULL,
  txid VARCHAR(25) NOT NULL UNIQUE,
  amount_cents INT UNSIGNED NOT NULL,
  status ENUM('pending', 'claimed', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  payer_reference VARCHAR(100) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  claimed_at TIMESTAMP(3) NULL,
  approved_at TIMESTAMP(3) NULL,
  INDEX pro_requests_owner (profile_id, created_at),
  CONSTRAINT pro_requests_owner_fk FOREIGN KEY (profile_id)
    REFERENCES synced_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pro_entitlements (
  profile_id VARCHAR(80) NOT NULL PRIMARY KEY,
  request_id VARCHAR(80) NOT NULL UNIQUE,
  payment_reference VARCHAR(100) NOT NULL UNIQUE,
  granted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT pro_entitlements_owner_fk FOREIGN KEY (profile_id)
    REFERENCES synced_profiles(id) ON DELETE CASCADE,
  CONSTRAINT pro_entitlements_request_fk FOREIGN KEY (request_id)
    REFERENCES pro_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
