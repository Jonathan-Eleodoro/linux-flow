import rankingCore from "../../server/ranking-core.cjs";
import { database, first, json, prepared, publicError, readJson, rows } from "../../cloudflare/common.mjs";

const { validateAttempt, validateFilter } = rankingCore;

export async function onRequestGet(context) {
  let filter;
  try { filter = validateFilter(new URL(context.request.url).searchParams); }
  catch (error) { return json({ error: error.message }, 400); }
  try {
    const ranking = await rows(database(context),
      `SELECT nickname, category, level, total, correct, created_at AS date FROM (
         SELECT nickname, category, level, total, correct, created_at,
                ROW_NUMBER() OVER (PARTITION BY participant_id
                  ORDER BY correct DESC, created_at ASC) AS participant_position
         FROM ranking_attempts WHERE category = ? AND level = ? AND total = ?
       ) WHERE participant_position = 1
       ORDER BY correct DESC, created_at ASC LIMIT 20`,
      filter.category, filter.level, filter.total);
    return json({ ranking });
  } catch (error) { return publicError(error, "Ranking indisponível."); }
}

export async function onRequestPost(context) {
  let attempt;
  try { attempt = validateAttempt(await readJson(context.request, 20000)); }
  catch (error) { return json({ error: error.message }, error.status || 400); }
  try {
    const db = database(context);
    const synced = await first(db, "SELECT id FROM synced_profiles WHERE id = ?", attempt.participantId);
    if (synced) return json({ error: "Use o perfil sincronizado para publicar." }, 403);
    const prior = await first(db, "SELECT participant_id FROM ranking_attempts WHERE id = ?", attempt.id);
    if (prior && prior.participant_id !== attempt.participantId)
      return json({ error: "Identificador já existe." }, 409);
    await prepared(db,
      `INSERT OR IGNORE INTO ranking_attempts
       (id, participant_id, nickname, category, level, total, correct)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      attempt.id, attempt.participantId, attempt.nickname, attempt.category,
      attempt.level, attempt.total, attempt.correct).run();
    return json({ saved: true, correct: attempt.correct, total: attempt.total }, 201);
  } catch (error) { return publicError(error, "Não foi possível salvar no ranking."); }
}
