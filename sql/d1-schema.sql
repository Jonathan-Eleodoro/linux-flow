-- Cloudflare D1 / SQLite. Aplique uma vez antes de ativar as Pages Functions.
-- O D1 já aplica chaves estrangeiras; seu executor não permite alternar esta PRAGMA.

-- Perfis usam hash de chave; o código original nunca é persistido aqui.
CREATE TABLE IF NOT EXISTS synced_profiles (
  id TEXT PRIMARY KEY,
  access_key_hash TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  share_ranking INTEGER NOT NULL DEFAULT 0 CHECK (share_ranking IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ranking_attempts (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  category TEXT NOT NULL,
  level INTEGER NOT NULL,
  total INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS ranking_filter ON ranking_attempts(category, level, total, correct DESC, created_at);
CREATE INDEX IF NOT EXISTS ranking_participant ON ranking_attempts(participant_id);

-- Resultados importados podem ser locais; verified marca rodadas recalculadas pela API.
CREATE TABLE IF NOT EXISTS profile_results (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  level INTEGER NOT NULL,
  total INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1))
);
CREATE INDEX IF NOT EXISTS profile_results_owner ON profile_results(profile_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS profile_labs (
  profile_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  mission INTEGER NOT NULL,
  PRIMARY KEY (profile_id, mission)
);

CREATE TABLE IF NOT EXISTS profile_attempt_answers (
  result_id TEXT NOT NULL REFERENCES profile_results(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  PRIMARY KEY (result_id, question_id)
);
CREATE INDEX IF NOT EXISTS profile_attempt_answers_stats ON profile_attempt_answers(profile_id, question_id);

-- Resumo por questão evita recalcular todo o histórico a cada abertura.
CREATE TABLE IF NOT EXISTS profile_question_stats (
  profile_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (profile_id, question_id)
);

CREATE TABLE IF NOT EXISTS pro_requests (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  txid TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'approved', 'rejected')),
  payer_reference TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  claimed_at TEXT,
  approved_at TEXT
);
CREATE INDEX IF NOT EXISTS pro_requests_owner ON pro_requests(profile_id, created_at DESC);
-- Um perfil não pode abrir dois pedidos pendentes ao mesmo tempo.
CREATE UNIQUE INDEX IF NOT EXISTS pro_requests_one_open ON pro_requests(profile_id) WHERE status IN ('pending', 'claimed');

CREATE TABLE IF NOT EXISTS pro_entitlements (
  profile_id TEXT PRIMARY KEY REFERENCES synced_profiles(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL UNIQUE REFERENCES pro_requests(id) ON DELETE CASCADE,
  payment_reference TEXT NOT NULL UNIQUE,
  granted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS feedback_comments (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS feedback_email_date ON feedback_comments(email, created_at DESC);

-- Espaços coletivos: acesso por código, sem reivindicar identidade docente verificada.
CREATE TABLE IF NOT EXISTS community_profiles (
  profile_id TEXT PRIMARY KEY REFERENCES synced_profiles(id) ON DELETE CASCADE,
  avatar TEXT NOT NULL DEFAULT 'penguin',
  accent TEXT NOT NULL DEFAULT 'lime',
  age_band TEXT NOT NULL DEFAULT 'unspecified',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS game_rooms (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('duel', 'collective')),
  category TEXT NOT NULL,
  question_ids TEXT NOT NULL,
  seconds_per_question INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  current_index INTEGER NOT NULL DEFAULT 0,
  started_at TEXT,
  deadline_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS game_rooms_owner ON game_rooms(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS game_members (
  room_id TEXT NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (room_id, profile_id)
);

-- Respostas têm chave por pessoa e questão para impedir pontuação duplicada.
CREATE TABLE IF NOT EXISTS game_answers (
  room_id TEXT NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  selected TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  answered_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (room_id, profile_id, question_index)
);
CREATE INDEX IF NOT EXISTS game_answers_room ON game_answers(room_id, question_index);

CREATE TABLE IF NOT EXISTS game_events (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS game_events_room ON game_events(room_id, created_at);

CREATE TABLE IF NOT EXISTS study_groups (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE TABLE IF NOT EXISTS study_members (
  group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (group_id, profile_id)
);
CREATE TABLE IF NOT EXISTS study_suggestions (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES synced_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
