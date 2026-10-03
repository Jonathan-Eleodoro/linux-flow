import { database, first, json } from "../../cloudflare/common.mjs";
import { financialTriggers } from "../../cloudflare/financial.mjs";

// Confere apenas a infraestrutura; a resposta pública nunca revela dados ou esquema.
const requiredTables = [
  "synced_profiles", "ranking_attempts", "profile_results", "profile_labs",
  "profile_attempt_answers", "profile_question_stats", "pro_requests",
  "pro_entitlements", "feedback_comments", "community_profiles", "game_rooms",
  "game_members", "game_answers", "game_events", "study_groups",
  "study_members", "study_suggestions", "educator_grants",
  "financial_records", "financial_events",
];
const requiredTriggers = [
  "pro_requests_grant_after_approval", "pro_requests_keep_approved",
  ...financialTriggers,
  "ranking_requires_verified_profile", "ranking_keep_verified_profile",
];

export async function onRequestGet(context) {
  let stage = "binding";
  try {
    const db = database(context);
    stage = "tables";
    const names = requiredTables.map(() => "?").join(", ");
    const result = await first(db,
      `SELECT COUNT(*) AS total FROM sqlite_master
       WHERE type = 'table' AND name IN (${names})`, ...requiredTables);
    stage = "triggers";
    const approval = await first(db,
      `SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'trigger'
       AND name IN (${requiredTriggers.map(() => "?").join(", ")})`, ...requiredTriggers);
    // Gatilhos presentes não corrigem pedidos antigos que ficaram sem arquivo.
    stage = "financial_archive";
    const unarchived = await first(db, `SELECT r.id FROM pro_requests r
      LEFT JOIN financial_records f ON f.request_id = r.id
      WHERE f.request_id IS NULL LIMIT 1`);
    if (Number(result?.total) === requiredTables.length &&
        Number(approval?.total) === requiredTriggers.length && !unarchived)
      return json({ status: "ready" });
    // Os totais ajudam a identificar migrações ausentes sem registrar dados pessoais.
    console.error("Health unavailable", {
      tables: Number(result?.total), triggers: Number(approval?.total),
      financialArchiveGap: Boolean(unarchived),
    });
  } catch (error) {
    // O estágio é suficiente para orientar o diagnóstico sem expor SQL ou perfis.
    console.error("Health query failed", { stage, errorType: error?.name || "Error" });
  }
  return json({ status: "unavailable" }, 503);
}
