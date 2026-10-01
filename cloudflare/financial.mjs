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
