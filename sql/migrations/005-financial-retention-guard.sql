-- Aplique depois de 003 e 004. Repetir esta migração é seguro.
-- O prazo já concedido nunca pode ser encurtado por uma edição manual.
CREATE TRIGGER IF NOT EXISTS financial_records_keep_retention
BEFORE UPDATE OF retain_until, last_event_at ON financial_records
WHEN NEW.retain_until < OLD.retain_until
  OR NEW.last_event_at < OLD.last_event_at
  OR NEW.retain_until < strftime('%Y-%m-%dT%H:%M:%fZ', NEW.last_event_at, '+1 year')
BEGIN SELECT RAISE(ABORT, 'financial_retention_cannot_shorten'); END;
