-- Aplique uma vez depois de d1-schema.sql em bancos novos ou existentes.
-- A referência deve vir do extrato conferido pelo operador, nunca do aluno.
ALTER TABLE pro_requests ADD COLUMN confirmed_payment_reference TEXT
  CHECK (confirmed_payment_reference IS NULL OR
    (length(confirmed_payment_reference) BETWEEN 6 AND 100 AND
     confirmed_payment_reference = trim(confirmed_payment_reference)));

CREATE UNIQUE INDEX pro_requests_confirmed_payment
  ON pro_requests(confirmed_payment_reference)
  WHERE confirmed_payment_reference IS NOT NULL;

-- O entitlement nasce na mesma operação que aprova o pedido.
CREATE TRIGGER pro_requests_grant_after_approval
AFTER UPDATE OF status ON pro_requests
WHEN NEW.status = 'approved'
BEGIN
  SELECT RAISE(ABORT, 'approval_requires_claimed_payment')
    WHERE OLD.status <> 'claimed' OR NEW.confirmed_payment_reference IS NULL
      OR NEW.approved_at IS NULL OR NEW.amount_cents < 990;
  INSERT INTO pro_entitlements (profile_id, request_id, payment_reference)
    VALUES (NEW.profile_id, NEW.id, NEW.confirmed_payment_reference);
END;

-- Evita deixar um entitlement ativo com pedido retrocedido manualmente.
CREATE TRIGGER pro_requests_keep_approved
BEFORE UPDATE OF status ON pro_requests
WHEN OLD.status = 'approved' AND NEW.status <> 'approved'
BEGIN
  SELECT RAISE(ABORT, 'approved_payment_cannot_change_status');
END;
