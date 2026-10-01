-- A aprovação é feita por um responsável fora da API pública.
-- Cada linha registra uma concessão; revogar preserva a decisão anterior.
CREATE TABLE IF NOT EXISTS educator_grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  approved_by TEXT NOT NULL CHECK (length(trim(approved_by)) BETWEEN 2 AND 100),
  approved_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  revoked_at TEXT,
  revoked_by TEXT,
  CHECK ((revoked_at IS NULL AND revoked_by IS NULL) OR
         (revoked_at IS NOT NULL AND revoked_by IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS educator_grants_one_active
  ON educator_grants(profile_id) WHERE revoked_at IS NULL;
