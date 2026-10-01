import { database, first, json } from "../../cloudflare/common.mjs";

// Confere apenas a infraestrutura; a resposta pública nunca revela dados ou esquema.
const requiredTables = [
  "synced_profiles", "ranking_attempts", "profile_results", "profile_labs",
  "profile_attempt_answers", "profile_question_stats", "pro_requests",
  "pro_entitlements", "feedback_comments", "community_profiles", "game_rooms",
  "game_members", "game_answers", "game_events", "study_groups",
  "study_members", "study_suggestions", "educator_grants",
];

export async function onRequestGet(context) {
  try {
    const db = database(context);
    const names = requiredTables.map(() => "?").join(", ");
    const result = await first(db,
      `SELECT COUNT(*) AS total FROM sqlite_master
       WHERE type = 'table' AND name IN (${names})`, ...requiredTables);
    const approval = await first(db,
      `SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'trigger'
       AND name IN ('pro_requests_grant_after_approval', 'pro_requests_keep_approved')`);
    if (Number(result?.total) === requiredTables.length && Number(approval?.total) === 2)
      return json({ status: "ready" });
  } catch {
    // Sem binding, com erro de conexão ou sem esquema, o serviço não está pronto.
  }
  return json({ status: "unavailable" }, 503);
}
