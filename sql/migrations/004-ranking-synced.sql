-- Remove publicações legadas sem perfil e rodada verificada na API.
DELETE FROM ranking_attempts
WHERE NOT EXISTS (
  SELECT 1 FROM synced_profiles p
  JOIN profile_results v ON v.profile_id = p.id AND v.verified = 1
  WHERE p.id = ranking_attempts.participant_id AND v.id = ranking_attempts.id
);

-- A rodada é gravada antes da publicação no mesmo batch da API de perfil.
CREATE TRIGGER IF NOT EXISTS ranking_requires_verified_profile
BEFORE INSERT ON ranking_attempts
WHEN NOT EXISTS (
  SELECT 1 FROM synced_profiles p
  JOIN profile_results v ON v.profile_id = p.id AND v.verified = 1
  WHERE p.id = NEW.participant_id AND v.id = NEW.id
)
BEGIN SELECT RAISE(ABORT, 'ranking_requires_verified_profile'); END;

CREATE TRIGGER IF NOT EXISTS ranking_keep_verified_profile
BEFORE UPDATE ON ranking_attempts
WHEN NOT EXISTS (
  SELECT 1 FROM synced_profiles p
  JOIN profile_results v ON v.profile_id = p.id AND v.verified = 1
  WHERE p.id = NEW.participant_id AND v.id = NEW.id
)
BEGIN SELECT RAISE(ABORT, 'ranking_requires_verified_profile'); END;
