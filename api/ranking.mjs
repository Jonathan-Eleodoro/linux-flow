import rankingCore from "../server/ranking-core.cjs";
import { database } from "../server/db.mjs";

const { validateAttempt, validateFilter } = rankingCore;
function json(value, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request) {
  let filter;
  try { filter = validateFilter(new URL(request.url).searchParams); }
  catch (error) { return json({ error: error.message }, 400); }
  try {
    const [rows] = await database().execute(
      `SELECT nickname, category, level, total, correct, created_at AS date
       FROM (
         SELECT nickname, category, level, total, correct, created_at,
                ROW_NUMBER() OVER (
                  PARTITION BY participant_id
                  ORDER BY correct DESC, created_at ASC
                ) AS position_for_participant
         FROM ranking_attempts
         WHERE category = ? AND level = ? AND total = ?
       ) AS best
       WHERE position_for_participant = 1
       ORDER BY correct DESC, created_at ASC LIMIT 20`,
      [filter.category, filter.level, filter.total],
    );
    return json({ ranking: rows });
  } catch (error) {
    console.error("Falha na leitura do ranking:", error);
    return json({ error: "Ranking indisponível." }, 503);
  }
}

export async function POST(request) {
  let attempt;
  try {
    const raw = await request.text();
    if (raw.length > 20000) return json({ error: "Envio muito grande." }, 413);
    const body = JSON.parse(raw);
    attempt = validateAttempt(body);
  } catch (error) {
    return json({ error: error instanceof SyntaxError ? "JSON inválido." : error.message }, 400);
  }
  try {
    const [synced] = await database().execute(
      "SELECT id FROM synced_profiles WHERE id = ? LIMIT 1",
      [attempt.participantId],
    );
    if (synced.length) return json({ error: "Use o perfil sincronizado para publicar." }, 403);
    await database().execute(
      `INSERT INTO ranking_attempts
       (id, participant_id, nickname, category, level, total, correct)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [attempt.id, attempt.participantId, attempt.nickname, attempt.category,
        attempt.level, attempt.total, attempt.correct],
    );
    return json({ saved: true, correct: attempt.correct, total: attempt.total }, 201);
  } catch (error) {
    console.error("Falha na gravação do ranking:", error);
    return json({ error: "Não foi possível salvar no ranking." }, 503);
  }
}
