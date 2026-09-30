import profileCore from "../../server/profile-core.cjs";
import rankingCore from "../../server/ranking-core.cjs";
import {
  accessKeyHash, authorized, database, first, json, prepared,
  publicError, readJson, rows,
} from "../../cloudflare/common.mjs";

const { safeId, safeKey, safeName, validateResults, validateLabs } = profileCore;
const { validateAttempt } = rankingCore;

// O snapshot junta progresso persistido sem expor o hash do código de acesso.
async function snapshot(db, profile) {
  const [entitlement, results, labs, questionProgress] = await Promise.all([
    first(db, "SELECT profile_id FROM pro_entitlements WHERE profile_id = ?", profile.id),
    rows(db, `SELECT id, category, level, total, correct, completed_at AS date
              FROM profile_results WHERE profile_id = ?
              ORDER BY completed_at DESC LIMIT 300`, profile.id),
    rows(db, "SELECT mission FROM profile_labs WHERE profile_id = ?", profile.id),
    rows(db, `SELECT question_id AS questionId, attempts, correct
              FROM profile_question_stats WHERE profile_id = ?`, profile.id),
  ]);
  return {
    profile: { id: profile.id, name: profile.nickname,
      shareRanking: Boolean(profile.shareRanking), pro: Boolean(entitlement) },
    results: results.reverse().map((record) => ({ ...record,
      date: new Date(record.date).toISOString() })),
    labs: labs.map((lab) => lab.mission), questionProgress,
  };
}

// Lotes pequenos respeitam o limite de parâmetros por consulta do D1.
function importedResultStatements(db, profileId, results) {
  const statements = [];
  for (let offset = 0; offset < results.length; offset += 14) {
    const chunk = results.slice(offset, offset + 14);
    const slots = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = chunk.flatMap((record) => [record.id, profileId,
      record.category, record.level, record.total, record.correct,
      new Date(record.date).toISOString()]);
    statements.push(prepared(db,
      `INSERT OR IGNORE INTO profile_results
       (id, profile_id, category, level, total, correct, completed_at)
       VALUES ${slots}`, ...values));
  }
  return statements;
}

// A tentativa verificada grava nota, respostas por questão e ranking em um batch.
function verifiedAttemptStatements(db, profile, attempt, shareRanking) {
  const statements = [
    prepared(db, "UPDATE synced_profiles SET share_ranking = ? WHERE id = ?",
      Number(shareRanking), profile.id),
    prepared(db, `INSERT INTO profile_results
      (id, profile_id, category, level, total, correct, completed_at, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET category = excluded.category,
        level = excluded.level, total = excluded.total, correct = excluded.correct,
        verified = 1
      WHERE profile_results.profile_id = excluded.profile_id
        AND profile_results.verified = 0`,
    attempt.id, profile.id, attempt.category, attempt.level,
    attempt.total, attempt.correct, new Date().toISOString()),
  ];
  for (let offset = 0; offset < attempt.outcomes.length; offset += 20) {
    const chunk = attempt.outcomes.slice(offset, offset + 20);
    statements.push(prepared(db,
      `INSERT OR IGNORE INTO profile_attempt_answers
       (result_id, profile_id, question_id, correct) VALUES
       ${chunk.map(() => "(?, ?, ?, ?)").join(", ")}`,
      ...chunk.flatMap((outcome) => [attempt.id, profile.id,
        outcome.questionId, Number(outcome.correct)])));
  }
  for (let offset = 0; offset < attempt.outcomes.length; offset += 40) {
    const ids = attempt.outcomes.slice(offset, offset + 40)
      .map((outcome) => outcome.questionId);
    statements.push(prepared(db,
      `INSERT INTO profile_question_stats (profile_id, question_id, attempts, correct)
       SELECT profile_id, question_id, COUNT(*), SUM(correct)
       FROM profile_attempt_answers
       WHERE profile_id = ? AND question_id IN (${ids.map(() => "?").join(", ")})
       GROUP BY profile_id, question_id
       ON CONFLICT(profile_id, question_id) DO UPDATE SET
         attempts = excluded.attempts, correct = excluded.correct`,
      profile.id, ...ids));
  }
  if (shareRanking && attempt.level <= 3) statements.push(prepared(db,
    `INSERT OR IGNORE INTO ranking_attempts
     (id, participant_id, nickname, category, level, total, correct)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, attempt.id, profile.id,
    profile.nickname, attempt.category, attempt.level,
    attempt.total, attempt.correct));
  return statements;
}

export async function onRequestGet(context) {
  try {
    const profile = await authorized(context);
    return profile ? json(await snapshot(database(context), profile))
      : json({ error: "Código de acesso inválido." }, 401);
  } catch (error) { return publicError(error, "Perfil indisponível."); }
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await readJson(context.request, 100000);
    if (!body || !["create", "sync", "attempt"].includes(body.action))
      return json({ error: "Ação inválida." }, 400);
  } catch (error) { return json({ error: error.message }, error.status || 400); }
  try {
    const db = database(context);
    if (body.action === "create") {
      if (!safeId(body.id) || !safeKey(body.key) || !safeName(body.name))
        return json({ error: "Perfil inválido." }, 400);
      await prepared(db,
        `INSERT INTO synced_profiles (id, access_key_hash, nickname, share_ranking)
         VALUES (?, ?, ?, ?)`, body.id, accessKeyHash(body.key),
        body.name.trim(), Number(body.shareRanking === true)).run();
      return json({ created: true }, 201);
    }
    const profile = await authorized(context);
    if (!profile) return json({ error: "Código de acesso inválido." }, 401);
    if (body.action === "sync") {
      // A importação de histórico local não comprova nota e não publica ranking.
      if (!safeName(body.name) || typeof body.shareRanking !== "boolean")
        return json({ error: "Perfil inválido." }, 400);
      const results = validateResults(body.results);
      const labs = validateLabs(body.labs);
      if (results.some((record) => record.level > 3) &&
          !await first(db, "SELECT profile_id FROM pro_entitlements WHERE profile_id = ?", profile.id))
        return json({ error: "Acesso Premium não ativo." }, 403);
      const statements = [prepared(db,
        "UPDATE synced_profiles SET nickname = ?, share_ranking = ? WHERE id = ?",
        body.name.trim(), Number(body.shareRanking), profile.id),
      ...importedResultStatements(db, profile.id, results)];
      if (labs.length) statements.push(prepared(db,
        `INSERT OR IGNORE INTO profile_labs (profile_id, mission) VALUES
         ${labs.map(() => "(?, ?)").join(", ")}`,
        ...labs.flatMap((mission) => [profile.id, mission])));
      await db.batch(statements);
      return json(await snapshot(db, { ...profile, nickname: body.name.trim(),
        shareRanking: body.shareRanking }));
    }
    if (typeof body.shareRanking !== "boolean")
      return json({ error: "Preferência inválida." }, 400);
    if (body.level > 3 &&
        !await first(db, "SELECT profile_id FROM pro_entitlements WHERE profile_id = ?", profile.id))
      return json({ error: "Acesso Premium não ativo." }, 403);
    const attempt = validateAttempt({ ...body, participantId: profile.id,
      nickname: profile.nickname }, { allowPro: body.level > 3 });
    const previous = await first(db,
      "SELECT profile_id AS profileId, verified FROM profile_results WHERE id = ?", attempt.id);
    if (previous && previous.profileId !== profile.id)
      return json({ error: "Identificador já existe." }, 409);
    if (previous?.verified) return json({ saved: true, correct: attempt.correct,
      total: attempt.total, ranked: false }, 201);
    await db.batch(verifiedAttemptStatements(db, profile, attempt, body.shareRanking));
    return json({ saved: true, correct: attempt.correct, total: attempt.total,
      ranked: body.shareRanking && attempt.level <= 3 }, 201);
  } catch (error) {
    if (/inválid|repetid/i.test(error.message || ""))
      return json({ error: error.message }, 400);
    return publicError(error, "Não foi possível salvar o perfil.");
  }
}

export async function onRequestDelete(context) {
  try {
    const profile = await authorized(context);
    if (!profile) return json({ error: "Código de acesso inválido." }, 401);
    const db = database(context);
    // A chave estrangeira remove progresso e salas; o ranking é removido à parte.
    await db.batch([
      prepared(db, "DELETE FROM ranking_attempts WHERE participant_id = ?", profile.id),
      prepared(db, "DELETE FROM synced_profiles WHERE id = ?", profile.id),
    ]);
    return json({ deleted: true });
  } catch (error) { return publicError(error, "Não foi possível apagar o perfil."); }
}
