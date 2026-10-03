import { first } from "./common.mjs";

export const financialTriggers = [
  "financial_records_keep_one_year", "financial_events_keep_one_year",
  "financial_events_append_only", "financial_records_keep_identity",
  "financial_request_created", "financial_request_changed", "financial_request_removed",
  "financial_entitlement_granted", "financial_entitlement_removed",
];

// Falha fechada: pedido e exclusão com Pix exigem arquivo e gatilhos completos.
export async function financialReady(db) {
  const result = await first(db, `SELECT COUNT(*) AS total FROM sqlite_master
    WHERE (type = 'table' AND name IN ('financial_records', 'financial_events'))
       OR (type = 'trigger' AND name IN (${financialTriggers.map(() => "?").join(", ")}))`,
  ...financialTriggers);
  return Number(result?.total) === financialTriggers.length + 2;
}

// Um esquema completo não garante que pedidos criados antes da migração foram arquivados.
export async function financialProfileReady(db, profileId) {
  const missing = await first(db, `SELECT r.id FROM pro_requests r
    LEFT JOIN financial_records f ON f.request_id = r.id
    WHERE r.profile_id = ? AND f.request_id IS NULL LIMIT 1`, profileId);
  return !missing;
}
