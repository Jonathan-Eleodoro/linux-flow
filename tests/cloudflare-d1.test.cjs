// Exercita as Pages Functions sobre SQLite local com o esquema D1.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
let DatabaseSync;
try { ({ DatabaseSync } = require("node:sqlite")); } catch { /* Node 20 não inclui SQLite nativo. */ }
const { FlowData } = require("../js/data.js");

function d1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(fs.readFileSync(path.join(__dirname, "../sql/d1-schema.sql"), "utf8"));
  const wrap = (sql, params = []) => ({
    bind: (...values) => wrap(sql, values),
    first: async () => sqlite.prepare(sql).get(...params) || null,
    all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
    run: async () => ({ meta: { changes: sqlite.prepare(sql).run(...params).changes } }),
  });
  return {
    prepare: (sql) => wrap(sql),
    batch: async (statements) => {
      sqlite.exec("BEGIN");
      try {
        const result = [];
        for (const statement of statements) result.push(await statement.run());
        sqlite.exec("COMMIT");
        return result;
      } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
    sqlite,
  };
}

function context(db, method, path, body, key) {
  return { env: { DB: db, PIX_KEY: "john@example.com",
      PIX_RECEIVER_NAME: "LINUX FLOW", PIX_RECEIVER_CITY: "PORTO ALEGRE" },
    request: new Request(`https://example.pages.dev${path}`, { method,
      headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) }) };
}

test("Pages Functions persistem perfil, tentativa verificada, ranking, sugestão e Pix no D1",
  { skip: !DatabaseSync }, async () => {
  const db = d1();
  const profile = await import("../functions/api/profile.js");
  const ranking = await import("../functions/api/ranking.js");
  const feedback = await import("../functions/api/feedback.js");
  const pro = await import("../functions/api/pro.js");
  const key = "a".repeat(64);
  const id = "test-profile";
  let response = await profile.onRequestPost(context(db, "POST", "/api/profile", {
    action: "create", id, key, name: "Aluno Teste", shareRanking: true }));
  assert.equal(response.status, 201);
  response = await profile.onRequestGet(context(db, "GET", "/api/profile", null, key));
  assert.equal((await response.json()).profile.name, "Aluno Teste");
  const question = FlowData.questions.find((item) => item.level === 1);
  response = await profile.onRequestPost(context(db, "POST", "/api/profile", {
    action: "attempt", id: "test-attempt", level: 1, category: "all", shareRanking: true,
    answers: [{ id: question.id, selected: question.answer }] }, key));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).correct, 1);
  response = await ranking.onRequestGet(context(db, "GET",
    "/api/ranking?category=all&level=1&total=1"));
  assert.equal((await response.json()).ranking[0].nickname, "Aluno Teste");
  response = await feedback.onRequestPost(context(db, "POST", "/api/feedback", {
    email: "aluno@example.com", comment: "Gostei bastante das trilhas interativas!", agree: true,
  }));
  assert.equal(response.status, 201);
  response = await pro.onRequestPost(context(db, "POST", "/api/pro", {
    action: "create", amountCents: 990 }, key));
  assert.equal(response.status, 201);
  assert.match((await response.json()).qr, /^data:image\/svg\+xml;charset=utf-8,/);
  response = await profile.onRequestDelete(context(db, "DELETE", "/api/profile", null, key));
  assert.equal(response.status, 200);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM synced_profiles").get().n, 0);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM ranking_attempts").get().n, 0);
  db.sqlite.close();
});

test("sala coletiva, duelo, cronômetro, registros e grupo respeitam membros e mestre",
  { skip: !DatabaseSync }, async () => {
    const db = d1();
    const profile = await import("../functions/api/profile.js");
    const community = await import("../functions/api/community.js");
    const firstKey = "b".repeat(64), secondKey = "c".repeat(64);
    for (const [id, key, name] of [["master", firstKey, "Mestre"], ["learner", secondKey, "Aluno"]]) {
      const response = await profile.onRequestPost(context(db, "POST", "/api/profile",
        { action: "create", id, key, name, shareRanking: false }));
      assert.equal(response.status, 201);
    }
    const post = (key, body) => community.onRequestPost(context(db, "POST", "/api/community", body, key));
    let response = await post(firstKey, { action: "personalize", avatar: "owl",
      accent: "blue", ageBand: "16-17" });
    assert.equal(response.status, 200);
    response = await post(firstKey, { action: "createRoom", title: "Revisão Linux",
      mode: "duel", category: "all", count: 2, secondsPerQuestion: 30 });
    assert.equal(response.status, 201);
    const roomCode = (await response.json()).code;
    response = await post(secondKey, { action: "joinRoom", code: roomCode });
    assert.equal(response.status, 200);
    response = await post(secondKey, { action: "start", code: roomCode });
    assert.equal(response.status, 403);
    response = await post(firstKey, { action: "start", code: roomCode });
    assert.equal(response.status, 200);
    response = await community.onRequestGet(context(db, "GET",
      `/api/community?room=${roomCode}`, null, secondKey));
    const room = await response.json();
    assert.equal(room.room.status, "active");
    assert.ok(room.room.deadlineAt);
    assert.equal(room.events, undefined);
    response = await post(secondKey, { action: "answer", code: roomCode,
      questionId: room.question.id,
      selected: room.question.options[0] });
    assert.equal(response.status, 200);
    response = await post(secondKey, { action: "answer", code: roomCode,
      questionId: room.question.id,
      selected: room.question.options[0] });
    assert.equal(response.status, 409);
    response = await community.onRequestGet(context(db, "GET",
      `/api/community?room=${roomCode}`, null, firstKey));
    assert.ok((await response.json()).events.some((event) => event.type === "answered"));
    response = await post(firstKey, { action: "createGroup", title: "Estudo Linux" });
    const groupCode = (await response.json()).code;
    response = await post(secondKey, { action: "joinGroup", code: groupCode });
    assert.equal(response.status, 200);
    response = await post(secondKey, { action: "suggest", code: groupCode,
      content: "Adicionar exercícios práticos de permissões." });
    assert.equal(response.status, 201);
    response = await community.onRequestGet(context(db, "GET",
      `/api/community?group=${groupCode}`, null, firstKey));
    const group = await response.json();
    assert.equal(group.people.length, 2);
    assert.equal(group.suggestions.length, 1);
    db.sqlite.close();
  });
