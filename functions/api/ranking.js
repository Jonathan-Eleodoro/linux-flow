import rankingCore from "../../server/ranking-core.cjs";
import { database, json, publicError, rows } from "../../cloudflare/common.mjs";

const { validateFilter } = rankingCore;

// Cada participante ocupa no máximo uma posição por filtro: sua melhor nota.
export async function onRequestGet(context) {
  let filter;
  try { filter = validateFilter(new URL(context.request.url).searchParams); }
  catch (error) { return json({ error: error.message }, 400); }
  try {
    const ranking = await rows(database(context),
      `SELECT nickname, category, level, total, correct, created_at AS date FROM (
         SELECT r.nickname, r.category, r.level, r.total, r.correct, r.created_at,
                ROW_NUMBER() OVER (PARTITION BY r.participant_id
                  ORDER BY r.correct DESC, r.created_at ASC) AS participant_position
         FROM ranking_attempts r
         JOIN synced_profiles p ON p.id = r.participant_id
         JOIN profile_results v ON v.id = r.id AND v.profile_id = p.id AND v.verified = 1
         WHERE r.category = ? AND r.level = ? AND r.total = ?
       ) WHERE participant_position = 1
       ORDER BY correct DESC, created_at ASC LIMIT 20`,
      filter.category, filter.level, filter.total);
    return json({ ranking });
  } catch (error) { return publicError(error, "Ranking indisponível."); }
}

export async function onRequestPost() {
  // Publicação só ocorre via /api/profile, com chave e respostas verificadas.
  return json({ error: "Sincronize um perfil antes de publicar no ranking." }, 403);
}
