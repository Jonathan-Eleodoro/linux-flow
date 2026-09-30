import data from "../../js/data.js";
import { authorized, database, first, json, prepared, publicError, readJson, rows } from "../../cloudflare/common.mjs";

const bank = data.FlowData.questions;
const byId = new Map(bank.map((question) => [question.id, question]));
const categories = new Set(["all", ...data.FlowData.categories.map((item) => item.id)]);
const avatars = new Set(["penguin", "owl", "fox", "beaver", "lynx"]);
const accents = new Set(["lime", "blue", "amber", "violet", "coral"]);
const ageBands = new Set(["unspecified", "under13", "13-15", "16-17", "18plus"]);
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(6)),
  (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
const label = (value, max = 60) => typeof value === "string" &&
  value.trim().length >= 2 && value.trim().length <= max ? value.trim() : null;
const roomCode = (value) => typeof value === "string" && /^[0-9A-F]{12}$/.test(value.toUpperCase())
  ? value.toUpperCase() : null;
const fail = (message, status = 400) => json({ error: message }, status);
const log = (db, room, actor, event, detail = "") => prepared(db,
  "INSERT INTO game_events (id, room_id, actor_id, event_type, detail) VALUES (?, ?, ?, ?, ?)",
  crypto.randomUUID(), room, actor, event, detail);

async function roomState(db, room, profile) {
  const member = await first(db,
    "SELECT 1 AS ok FROM game_members WHERE room_id = ? AND profile_id = ?", room.id, profile.id);
  if (!member) return fail("Entre na sala com o código recebido.", 403);
  const members = await rows(db, `SELECT p.id, p.nickname AS name,
    COALESCE(c.avatar, 'penguin') AS avatar,
    COALESCE(c.accent, 'lime') AS accent, COUNT(a.question_index) AS answered,
    COALESCE(SUM(a.correct), 0) AS score
    FROM game_members m JOIN synced_profiles p ON p.id = m.profile_id
    LEFT JOIN community_profiles c ON c.profile_id = p.id
    LEFT JOIN game_answers a ON a.room_id = m.room_id AND a.profile_id = m.profile_id
    WHERE m.room_id = ? GROUP BY p.id ORDER BY score DESC, m.joined_at`, room.id);
  const ids = JSON.parse(room.question_ids);
  const question = room.status === "active" ? byId.get(ids[room.current_index]) : null;
  const ownAnswer = question ? await first(db,
    "SELECT correct FROM game_answers WHERE room_id = ? AND profile_id = ? AND question_index = ?",
    room.id, profile.id, room.current_index) : null;
  const events = room.owner_id === profile.id ? await rows(db,
    `SELECT e.event_type AS type, e.detail, e.created_at AS date,
      COALESCE(p.nickname, 'Participante removido') AS actor
     FROM game_events e LEFT JOIN synced_profiles p ON p.id = e.actor_id
     WHERE e.room_id = ? ORDER BY e.created_at DESC LIMIT 100`, room.id) : undefined;
  return json({ room: { code: room.code, title: room.title, mode: room.mode,
    status: room.status, owner: room.owner_id === profile.id,
    secondsPerQuestion: room.seconds_per_question, currentIndex: room.current_index,
    total: ids.length, deadlineAt: room.deadline_at },
  question: question ? { id: question.id, prompt: question.prompt,
    options: question.options, code: question.code || null } : null,
  answered: ownAnswer !== null, ownCorrect: ownAnswer?.correct === 1,
  members, ...(events ? { events } : {}) });
}

async function groupState(db, group, profile) {
  const member = await first(db,
    "SELECT 1 AS ok FROM study_members WHERE group_id = ? AND profile_id = ?", group.id, profile.id);
  if (!member) return fail("Entre no grupo com o código recebido.", 403);
  const people = await rows(db, `SELECT p.id, p.nickname AS name,
    COUNT(r.id) AS quizzes, COALESCE(SUM(r.correct), 0) AS correct,
    COALESCE(SUM(r.total), 0) AS questions
    FROM study_members m JOIN synced_profiles p ON p.id = m.profile_id
    LEFT JOIN profile_results r ON r.profile_id = p.id AND r.verified = 1
    WHERE m.group_id = ? GROUP BY p.id ORDER BY p.nickname`, group.id);
  const suggestions = await rows(db, `SELECT s.content, s.created_at AS date,
    p.nickname AS author FROM study_suggestions s
    JOIN synced_profiles p ON p.id = s.profile_id
    WHERE s.group_id = ? ORDER BY s.created_at DESC LIMIT 50`, group.id);
  return json({ group: { code: group.code, title: group.title,
    owner: group.owner_id === profile.id },
  people: group.owner_id === profile.id ? people : people.filter((person) => person.id === profile.id),
  summary: { participants: people.length,
    quizzes: people.reduce((sum, person) => sum + person.quizzes, 0) }, suggestions });
}

export async function onRequestGet(context) {
  try {
    const profile = await authorized(context);
    if (!profile) return fail("Ative um perfil sincronizado para participar.", 401);
    const db = database(context);
    const params = new URL(context.request.url).searchParams;
    const room = roomCode(params.get("room"));
    if (room) {
      const record = await first(db, "SELECT * FROM game_rooms WHERE code = ?", room);
      return record ? roomState(db, record, profile) : fail("Sala não encontrada.", 404);
    }
    const group = roomCode(params.get("group"));
    if (group) {
      const record = await first(db, "SELECT * FROM study_groups WHERE code = ?", group);
      return record ? groupState(db, record, profile) : fail("Grupo não encontrado.", 404);
    }
    const [rooms, groups, personal] = await Promise.all([
      rows(db, `SELECT r.code, r.title, r.mode, r.status FROM game_rooms r
        JOIN game_members m ON m.room_id = r.id WHERE m.profile_id = ?
        ORDER BY r.created_at DESC LIMIT 20`, profile.id),
      rows(db, `SELECT g.code, g.title FROM study_groups g
        JOIN study_members m ON m.group_id = g.id WHERE m.profile_id = ?
        ORDER BY g.created_at DESC LIMIT 20`, profile.id),
      first(db, "SELECT avatar, accent, age_band AS ageBand FROM community_profiles WHERE profile_id = ?", profile.id),
    ]);
    return json({ rooms, groups, personal: personal || {
      avatar: "penguin", accent: "lime", ageBand: "unspecified" } });
  } catch (error) { return publicError(error, "Espaço coletivo indisponível."); }
}

export async function onRequestPost(context) {
  let body;
  try { body = await readJson(context.request, 4000); }
  catch (error) { return fail(error.message, error.status || 400); }
  try {
    const profile = await authorized(context);
    if (!profile) return fail("Ative um perfil sincronizado para participar.", 401);
    const db = database(context);
    if (body.action === "personalize") {
      if (!avatars.has(body.avatar) || !accents.has(body.accent) || !ageBands.has(body.ageBand))
        return fail("Personalização inválida.");
      await prepared(db, `INSERT INTO community_profiles (profile_id, avatar, accent, age_band)
        VALUES (?, ?, ?, ?) ON CONFLICT(profile_id) DO UPDATE SET avatar = excluded.avatar,
        accent = excluded.accent, age_band = excluded.age_band,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      profile.id, body.avatar, body.accent, body.ageBand).run();
      return json({ saved: true });
    }
    if (body.action === "createRoom") {
      const title = label(body.title);
      const mode = body.mode;
      const category = body.category;
      const count = Number(body.count);
      const seconds = Number(body.secondsPerQuestion);
      if (!title || !["duel", "collective"].includes(mode) || !categories.has(category) ||
          !Number.isInteger(count) || count < 2 || count > 20 ||
          ![0, 15, 30, 60, 120].includes(seconds)) return fail("Configuração da sala inválida.");
      const recent = await first(db, `SELECT COUNT(*) AS total FROM game_rooms
        WHERE owner_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')`, profile.id);
      if (recent.total >= 10) return fail("Limite de dez salas por dia.", 429);
      const pool = bank.filter((question) => question.level <= 3 &&
        (category === "all" || question.category === category));
      if (pool.length < count) return fail(`Este assunto oferece no máximo ${pool.length} questões.`);
      const selected = pool.map((question) => question.id);
      for (let index = selected.length - 1; index > 0; index--) {
        const other = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
        [selected[index], selected[other]] = [selected[other], selected[index]];
      }
      selected.length = count;
      const id = crypto.randomUUID(), joinCode = code();
      await db.batch([
        prepared(db, `INSERT INTO game_rooms
          (id, code, owner_id, title, mode, category, question_ids, seconds_per_question)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, id, joinCode, profile.id, title,
          mode, category, JSON.stringify(selected), seconds),
        prepared(db, "INSERT INTO game_members (room_id, profile_id) VALUES (?, ?)", id, profile.id),
        log(db, id, profile.id, "created"),
      ]);
      return json({ code: joinCode }, 201);
    }
    if (body.action === "joinRoom") {
      const joinCode = roomCode(body.code);
      const room = joinCode && await first(db, "SELECT * FROM game_rooms WHERE code = ?", joinCode);
      if (!room) return fail("Sala não encontrada.", 404);
      if (room.status !== "waiting") return fail("Esta sala já começou.", 409);
      const count = await first(db, "SELECT COUNT(*) AS total FROM game_members WHERE room_id = ?", room.id);
      if (count.total >= (room.mode === "duel" ? 2 : 40)) return fail("Sala lotada.", 409);
      const result = await prepared(db,
        "INSERT OR IGNORE INTO game_members (room_id, profile_id) VALUES (?, ?)", room.id, profile.id).run();
      if (result.meta.changes) await log(db, room.id, profile.id, "joined").run();
      return json({ code: joinCode });
    }
    if (body.action === "createGroup") {
      const title = label(body.title);
      if (!title) return fail("Dê um nome ao grupo.");
      const recent = await first(db, `SELECT COUNT(*) AS total FROM study_groups
        WHERE owner_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')`, profile.id);
      if (recent.total >= 5) return fail("Limite de cinco grupos por dia.", 429);
      const id = crypto.randomUUID(), joinCode = code();
      await db.batch([
        prepared(db, "INSERT INTO study_groups (id, code, owner_id, title) VALUES (?, ?, ?, ?)",
          id, joinCode, profile.id, title),
        prepared(db, "INSERT INTO study_members (group_id, profile_id) VALUES (?, ?)", id, profile.id),
      ]);
      return json({ code: joinCode }, 201);
    }
    if (body.action === "joinGroup") {
      const joinCode = roomCode(body.code);
      const group = joinCode && await first(db, "SELECT id FROM study_groups WHERE code = ?", joinCode);
      if (!group) return fail("Grupo não encontrado.", 404);
      const count = await first(db, "SELECT COUNT(*) AS total FROM study_members WHERE group_id = ?", group.id);
      if (count.total >= 80) return fail("Grupo lotado.", 409);
      await prepared(db, "INSERT OR IGNORE INTO study_members (group_id, profile_id) VALUES (?, ?)",
        group.id, profile.id).run();
      return json({ code: joinCode });
    }
    const joinCode = roomCode(body.code);
    if (!joinCode) return fail("Código inválido.");
    if (body.action === "suggest") {
      const group = await first(db, "SELECT id FROM study_groups WHERE code = ?", joinCode);
      if (!group) return fail("Grupo não encontrado.", 404);
      const member = await first(db,
        "SELECT 1 AS ok FROM study_members WHERE group_id = ? AND profile_id = ?", group.id, profile.id);
      if (!member) return fail("Entre no grupo antes de sugerir.", 403);
      const content = label(body.content, 500);
      if (!content || content.length < 10) return fail("Descreva a sugestão em 10 a 500 caracteres.");
      const recent = await first(db, `SELECT COUNT(*) AS total FROM study_suggestions
        WHERE group_id = ? AND profile_id = ?
          AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')`, group.id, profile.id);
      if (recent.total >= 3) return fail("Limite de três sugestões por dia neste grupo.", 429);
      await prepared(db,
        "INSERT INTO study_suggestions (id, group_id, profile_id, content) VALUES (?, ?, ?, ?)",
        crypto.randomUUID(), group.id, profile.id, content).run();
      return json({ saved: true }, 201);
    }
    const room = await first(db, "SELECT * FROM game_rooms WHERE code = ?", joinCode);
    if (!room) return fail("Sala não encontrada.", 404);
    if (body.action === "start" || body.action === "next" || body.action === "finish") {
      if (room.owner_id !== profile.id) return fail("Somente o mestre controla a rodada.", 403);
      const total = JSON.parse(room.question_ids).length;
      if (body.action === "start") {
        const members = await first(db, "SELECT COUNT(*) AS total FROM game_members WHERE room_id = ?", room.id);
        if (room.status !== "waiting" || members.total < 2)
          return fail("Aguarde pelo menos duas pessoas antes de iniciar.", 409);
      } else if (room.status !== "active") return fail("A partida não está ativa.", 409);
      const nextIndex = body.action === "next" ? room.current_index + 1 : room.current_index;
      const finished = body.action === "finish" || nextIndex >= total;
      const deadline = !finished && room.seconds_per_question
        ? new Date(Date.now() + room.seconds_per_question * 1000).toISOString() : null;
      await db.batch([
        prepared(db, `UPDATE game_rooms SET status = ?, current_index = ?,
          started_at = COALESCE(started_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          deadline_at = ? WHERE id = ?`, finished ? "finished" : "active",
          nextIndex, deadline, room.id),
        log(db, room.id, profile.id, finished ? "finished" : body.action,
          finished ? "" : String(nextIndex + 1)),
      ]);
      return json({ updated: true });
    }
    if (body.action === "answer") {
      if (room.status !== "active") return fail("A partida não está ativa.", 409);
      const member = await first(db,
        "SELECT 1 AS ok FROM game_members WHERE room_id = ? AND profile_id = ?", room.id, profile.id);
      if (!member) return fail("Entre na sala antes de responder.", 403);
      if (room.deadline_at && Date.now() > Date.parse(room.deadline_at))
        return fail("O tempo desta questão terminou.", 409);
      const question = byId.get(JSON.parse(room.question_ids)[room.current_index]);
      if (!question || body.questionId !== question.id || !question.options.includes(body.selected))
        return fail("Questão encerrada ou resposta inválida.", 409);
      const correct = Number(body.selected === question.answer);
      const result = await prepared(db, `INSERT OR IGNORE INTO game_answers
        (room_id, profile_id, question_index, selected, correct) VALUES (?, ?, ?, ?, ?)`,
      room.id, profile.id, room.current_index, body.selected, correct).run();
      if (!result.meta.changes) return fail("Você já respondeu esta questão.", 409);
      await log(db, room.id, profile.id, "answered", `${room.current_index + 1}:${correct}`).run();
      return json({ saved: true, correct: Boolean(correct) });
    }
    return fail("Ação desconhecida.");
  } catch (error) { return publicError(error, "Não foi possível atualizar o espaço coletivo."); }
}
