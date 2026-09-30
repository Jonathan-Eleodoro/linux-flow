import { createHash } from "node:crypto";
import { database } from "../server/db.mjs";
import profileCore from "../server/profile-core.cjs";
import rankingCore from "../server/ranking-core.cjs";

const { safeId, safeKey, safeName, validateResults, validateLabs } = profileCore;
const { validateAttempt } = rankingCore;
const json = (value, status = 200) => Response.json(value, {
  status, headers: { "Cache-Control": "no-store" },
});

function keyHash(key) {
  return createHash("sha256").update(Buffer.from(key, "hex")).digest();
}

async function authorized(request) {
  const match = /^Bearer ([0-9a-f]{64})$/.exec(request.headers.get("authorization") || "");
  if (!match) return null;
  const [rows] = await database().execute(
    "SELECT id, nickname, share_ranking AS shareRanking FROM synced_profiles WHERE access_key_hash = ?",
    [keyHash(match[1])],
  );
  return rows[0] || null;
}

async function snapshot(profile) {
  const [entitlements] = await database().execute(
    "SELECT profile_id FROM pro_entitlements WHERE profile_id = ?", [profile.id],
  );
  const [results] = await database().execute(
    `SELECT id, category, level, total, correct, completed_at AS date
     FROM profile_results WHERE profile_id = ?
     ORDER BY completed_at DESC LIMIT 300`, [profile.id],
  );
  const [labs] = await database().execute(
    "SELECT mission FROM profile_labs WHERE profile_id = ?", [profile.id],
  );
  const [questionProgress] = await database().execute(
    `SELECT question_id AS questionId, attempts, correct
     FROM profile_question_stats WHERE profile_id = ?`, [profile.id],
  );
  return { profile: { id: profile.id, name: profile.nickname,
    shareRanking: Boolean(profile.shareRanking), pro: entitlements.length > 0 },
    results: results.reverse().map((record) => ({ ...record,
      date: new Date(record.date).toISOString() })),
    labs: labs.map((lab) => lab.mission), questionProgress };
}

async function importResults(profileId, results) {
  for (let i = 0; i < results.length; i += 50) {
    const chunk = results.slice(i, i + 50);
    const values = chunk.flatMap((record) => [record.id, profileId,
      record.category, record.level, record.total, record.correct,
      new Date(record.date)]);
    await database().execute(
      `INSERT INTO profile_results
       (id, profile_id, category, level, total, correct, completed_at)
       VALUES ${chunk.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ")}
       ON DUPLICATE KEY UPDATE id = id`, values,
    );
  }
}

export async function GET(request) {
  try {
    const profile = await authorized(request);
    return profile ? json(await snapshot(profile)) : json({ error: "Código de acesso inválido." }, 401);
  } catch (error) {
    console.error("Falha ao consultar perfil:", error);
    return json({ error: "Perfil indisponível." }, 503);
  }
}

export async function POST(request) {
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 100000) return json({ error: "Envio muito grande." }, 413);
    body = JSON.parse(raw);
    if (!body || !["create", "sync", "attempt"].includes(body.action))
      return json({ error: "Ação inválida." }, 400);
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }
  try {
    if (body.action === "create") {
      if (!safeId(body.id) || !safeKey(body.key) || !safeName(body.name))
        return json({ error: "Perfil inválido." }, 400);
      await database().execute(
        `INSERT INTO synced_profiles (id, access_key_hash, nickname, share_ranking)
         VALUES (?, ?, ?, ?)`,
        [body.id, keyHash(body.key), body.name.trim(), body.shareRanking === true],
      );
      return json({ created: true }, 201);
    }
    const profile = await authorized(request);
    if (!profile) return json({ error: "Código de acesso inválido." }, 401);
    if (body.action === "sync") {
      if (!safeName(body.name) || typeof body.shareRanking !== "boolean")
        return json({ error: "Perfil inválido." }, 400);
      const results = validateResults(body.results);
      const labs = validateLabs(body.labs);
      if (results.some((record) => record.level > 3)) {
        const [entitlements] = await database().execute(
          "SELECT profile_id FROM pro_entitlements WHERE profile_id = ?", [profile.id],
        );
        if (!entitlements.length) return json({ error: "Acesso Premium não ativo." }, 403);
      }
      await database().execute(
        "UPDATE synced_profiles SET nickname = ?, share_ranking = ? WHERE id = ?",
        [body.name.trim(), body.shareRanking, profile.id],
      );
      await importResults(profile.id, results);
      if (labs.length) await database().execute(
        `INSERT INTO profile_labs (profile_id, mission) VALUES
         ${labs.map(() => "(?, ?)").join(", ")}
         ON DUPLICATE KEY UPDATE mission = mission`,
        labs.flatMap((mission) => [profile.id, mission]),
      );
      return json(await snapshot({ ...profile, nickname: body.name.trim(),
        shareRanking: body.shareRanking }));
    }
    if (body.level > 3) {
      const [entitlements] = await database().execute(
        "SELECT profile_id FROM pro_entitlements WHERE profile_id = ?", [profile.id],
      );
      if (!entitlements.length) return json({ error: "Acesso Premium não ativo." }, 403);
    }
    const attempt = validateAttempt({ ...body, participantId: profile.id,
      nickname: profile.nickname }, { allowPro: body.level > 3 });
    if (typeof body.shareRanking !== "boolean")
      return json({ error: "Preferência inválida." }, 400);
    let published = false;
    const connection = await database().getConnection();
    try {
      await connection.beginTransaction();
      const [previous] = await connection.execute(
        "SELECT profile_id AS profileId, verified FROM profile_results WHERE id = ? FOR UPDATE",
        [attempt.id],
      );
      if (previous.length && previous[0].profileId !== profile.id) {
        const conflict = new Error("Resultado já existe.");
        conflict.code = "ER_DUP_ENTRY";
        throw conflict;
      }
      await connection.execute(
        "UPDATE synced_profiles SET share_ranking = ? WHERE id = ?",
        [body.shareRanking, profile.id],
      );
      if (!previous[0]?.verified) {
        await connection.execute(
          `INSERT INTO profile_results
           (id, profile_id, category, level, total, correct, completed_at, verified)
           VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), TRUE)
           ON DUPLICATE KEY UPDATE category = VALUES(category), level = VALUES(level),
             total = VALUES(total), correct = VALUES(correct), verified = TRUE`,
          [attempt.id, profile.id, attempt.category, attempt.level,
            attempt.total, attempt.correct],
        );
        const outcomes = attempt.outcomes;
        await connection.execute(
          `INSERT INTO profile_question_stats
           (profile_id, question_id, attempts, correct)
           VALUES ${outcomes.map(() => "(?, ?, 1, ?)").join(", ")}
           ON DUPLICATE KEY UPDATE attempts = attempts + 1,
             correct = correct + VALUES(correct),
             last_attempt_at = CURRENT_TIMESTAMP(3)`,
          outcomes.flatMap((outcome) => [profile.id, outcome.questionId,
            outcome.correct ? 1 : 0]),
        );
        if (body.shareRanking && attempt.level <= 3) await connection.execute(
          `INSERT INTO ranking_attempts
           (id, participant_id, nickname, category, level, total, correct)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE id = id`,
          [attempt.id, profile.id, profile.nickname, attempt.category,
            attempt.level, attempt.total, attempt.correct],
        );
        published = body.shareRanking && attempt.level <= 3;
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
    return json({ saved: true, correct: attempt.correct, total: attempt.total,
      ranked: published }, 201);
  } catch (error) {
    if (error.message?.includes("inválid") || error.message?.includes("repetid"))
      return json({ error: error.message }, 400);
    if (error.code === "ER_DUP_ENTRY") return json({ error: "Identificador já existe." }, 409);
    console.error("Falha ao salvar perfil:", error);
    return json({ error: "Não foi possível salvar o perfil." }, 503);
  }
}

export async function DELETE(request) {
  try {
    const profile = await authorized(request);
    if (!profile) return json({ error: "Código de acesso inválido." }, 401);
    const connection = await database().getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute("DELETE FROM ranking_attempts WHERE participant_id = ?", [profile.id]);
      await connection.execute("DELETE FROM synced_profiles WHERE id = ?", [profile.id]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
    return json({ deleted: true });
  } catch (error) {
    console.error("Falha ao apagar perfil:", error);
    return json({ error: "Não foi possível apagar o perfil." }, 503);
  }
}
