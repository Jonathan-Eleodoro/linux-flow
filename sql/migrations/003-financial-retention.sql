-- Aplique após 001 e 002. A cópia financeira não depende do perfil de estudo.
-- Pedidos anteriores entram como uma fotografia; transições antigas não podem ser reconstruídas.
CREATE TABLE IF NOT EXISTS financial_records (
  request_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  txid TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 990),
  status TEXT NOT NULL CHECK (status IN ('pending', 'claimed', 'approved', 'rejected')),
  payer_reference TEXT,
  confirmed_payment_reference TEXT UNIQUE,
  request_created_at TEXT NOT NULL,
  claimed_at TEXT,
  approved_at TEXT,
  granted_at TEXT,
  last_event_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  retain_until TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+1 year'))
);
CREATE INDEX IF NOT EXISTS financial_records_profile ON financial_records(profile_id, request_created_at);

CREATE TABLE IF NOT EXISTS financial_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL REFERENCES financial_records(request_id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN
    ('backfilled', 'created', 'changed', 'granted', 'access_removed', 'removed')),
  status TEXT NOT NULL,
  payer_reference TEXT,
  confirmed_payment_reference TEXT,
  event_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  retain_until TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+1 year'))
);
CREATE INDEX IF NOT EXISTS financial_events_request ON financial_events(request_id, event_at);

-- Preserva pelo menos um ano a partir da última alteração ou remoção do pedido.
CREATE TRIGGER IF NOT EXISTS financial_records_keep_one_year
BEFORE DELETE ON financial_records
WHEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') < OLD.retain_until
  OR EXISTS (SELECT 1 FROM pro_requests WHERE id = OLD.request_id)
BEGIN SELECT RAISE(ABORT, 'financial_retention_not_elapsed'); END;

CREATE TRIGGER IF NOT EXISTS financial_events_keep_one_year
BEFORE DELETE ON financial_events
WHEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') < OLD.retain_until
  OR EXISTS (SELECT 1 FROM pro_requests WHERE id = OLD.request_id)
  OR EXISTS (SELECT 1 FROM financial_records
    WHERE request_id = OLD.request_id
      AND strftime('%Y-%m-%dT%H:%M:%fZ', 'now') < retain_until)
BEGIN SELECT RAISE(ABORT, 'financial_retention_not_elapsed'); END;

CREATE TRIGGER IF NOT EXISTS financial_events_append_only
BEFORE UPDATE ON financial_events
BEGIN SELECT RAISE(ABORT, 'financial_event_immutable'); END;

CREATE TRIGGER IF NOT EXISTS financial_records_keep_identity
BEFORE UPDATE OF request_id, profile_id, txid, amount_cents, request_created_at
ON financial_records
BEGIN SELECT RAISE(ABORT, 'financial_identity_immutable'); END;

-- A migração de um banco já usado retém o estado atual por mais um ano.
INSERT OR IGNORE INTO financial_records
  (request_id, profile_id, txid, amount_cents, status, payer_reference,
   confirmed_payment_reference, request_created_at, claimed_at, approved_at, granted_at)
SELECT r.id, r.profile_id, r.txid, r.amount_cents, r.status, r.payer_reference,
       r.confirmed_payment_reference, r.created_at, r.claimed_at, r.approved_at,
       e.granted_at
FROM pro_requests r LEFT JOIN pro_entitlements e ON e.request_id = r.id;

INSERT INTO financial_events (request_id, event_type, status,
  payer_reference, confirmed_payment_reference)
SELECT id, 'backfilled', status, payer_reference, confirmed_payment_reference
FROM pro_requests WHERE NOT EXISTS
  (SELECT 1 FROM financial_events WHERE request_id = pro_requests.id);

CREATE TRIGGER IF NOT EXISTS financial_request_created
AFTER INSERT ON pro_requests
BEGIN
  INSERT INTO financial_records
    (request_id, profile_id, txid, amount_cents, status, payer_reference,
     confirmed_payment_reference, request_created_at, claimed_at, approved_at)
  VALUES (NEW.id, NEW.profile_id, NEW.txid, NEW.amount_cents, NEW.status,
          NEW.payer_reference, NEW.confirmed_payment_reference,
          NEW.created_at, NEW.claimed_at, NEW.approved_at);
  INSERT INTO financial_events (request_id, event_type, status,
    payer_reference, confirmed_payment_reference)
  VALUES (NEW.id, 'created', NEW.status, NEW.payer_reference,
          NEW.confirmed_payment_reference);
END;

CREATE TRIGGER IF NOT EXISTS financial_request_changed
AFTER UPDATE OF status, payer_reference, claimed_at, approved_at, confirmed_payment_reference
ON pro_requests
WHEN OLD.status IS NOT NEW.status OR OLD.payer_reference IS NOT NEW.payer_reference
  OR OLD.claimed_at IS NOT NEW.claimed_at OR OLD.approved_at IS NOT NEW.approved_at
  OR OLD.confirmed_payment_reference IS NOT NEW.confirmed_payment_reference
BEGIN
  UPDATE financial_records SET status = NEW.status,
    payer_reference = NEW.payer_reference,
    confirmed_payment_reference = NEW.confirmed_payment_reference,
    claimed_at = NEW.claimed_at, approved_at = NEW.approved_at,
    last_event_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    retain_until = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+1 year')
  WHERE request_id = NEW.id;
  INSERT INTO financial_events (request_id, event_type, status,
    payer_reference, confirmed_payment_reference)
  VALUES (NEW.id, 'changed', NEW.status, NEW.payer_reference,
          NEW.confirmed_payment_reference);
END;

CREATE TRIGGER IF NOT EXISTS financial_request_removed
AFTER DELETE ON pro_requests
BEGIN
  UPDATE financial_records SET last_event_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    retain_until = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+1 year')
  WHERE request_id = OLD.id;
  INSERT INTO financial_events (request_id, event_type, status,
    payer_reference, confirmed_payment_reference)
  VALUES (OLD.id, 'removed', OLD.status, OLD.payer_reference,
          OLD.confirmed_payment_reference);
END;

-- O acesso concedido também é um registro financeiro, mesmo se for removido.
CREATE TRIGGER IF NOT EXISTS financial_entitlement_granted
AFTER INSERT ON pro_entitlements
BEGIN
  UPDATE financial_records SET granted_at = NEW.granted_at,
    last_event_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    retain_until = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+1 year')
  WHERE request_id = NEW.request_id;
  INSERT INTO financial_events (request_id, event_type, status,
    confirmed_payment_reference)
  VALUES (NEW.request_id, 'granted', 'approved', NEW.payment_reference);
END;

CREATE TRIGGER IF NOT EXISTS financial_entitlement_removed
AFTER DELETE ON pro_entitlements
BEGIN
  UPDATE financial_records SET last_event_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    retain_until = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+1 year')
  WHERE request_id = OLD.request_id;
  INSERT INTO financial_events (request_id, event_type, status,
    confirmed_payment_reference)
  VALUES (OLD.request_id, 'access_removed', 'approved', OLD.payment_reference);
END;
