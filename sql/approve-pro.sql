-- Use somente após conferir o crédito no extrato do banco recebedor.
-- Substitua ambos os valores abaixo. A referência deve identificar a
-- transferência confirmada e nunca deve ser reutilizada.
SET @request_id = 'SUBSTITUA_PELO_ID_DO_PEDIDO';
SET @payment_reference = 'SUBSTITUA_PELO_IDENTIFICADOR_CONFIRMADO_NO_BANCO';
SET @confirmed_in_bank = 0; -- Troque para 1 somente após conferir o crédito.

START TRANSACTION;
SELECT id, profile_id, txid, amount_cents, status, payer_reference
FROM pro_requests WHERE id = @request_id FOR UPDATE;

-- Confira manualmente valor, recebedor e identificador no seu extrato ANTES
-- de executar as instruções abaixo. Uma declaração do aluno não é prova.
INSERT INTO pro_entitlements (profile_id, request_id, payment_reference)
SELECT profile_id, id, @payment_reference FROM pro_requests
WHERE id = @request_id AND status = 'claimed' AND amount_cents >= 990
  AND @payment_reference <> '' AND @confirmed_in_bank = 1;

UPDATE pro_requests SET status = 'approved', approved_at = CURRENT_TIMESTAMP(3)
WHERE id = @request_id AND status = 'claimed'
  AND EXISTS (SELECT 1 FROM pro_entitlements WHERE request_id = @request_id);

SELECT id, status FROM pro_requests WHERE id = @request_id;
COMMIT;
