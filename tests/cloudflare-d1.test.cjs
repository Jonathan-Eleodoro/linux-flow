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
  sqlite.exec(fs.readFileSync(path.join(__dirname,
    "../sql/migrations/001-premium-approval.sql"), "utf8"));
  sqlite.exec(fs.readFileSync(path.join(__dirname,
    "../sql/migrations/002-educator-access.sql"), "utf8"));
  sqlite.exec(fs.readFileSync(path.join(__dirname,
    "../sql/migrations/003-financial-retention.sql"), "utf8"));
  sqlite.exec(fs.readFileSync(path.join(__dirname,
    "../sql/migrations/004-ranking-synced.sql"), "utf8"));
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

test("diagnóstico público distingue D1 pronto de binding ou esquema ausente",
  { skip: !DatabaseSync }, async () => {
    const health = await import("../functions/api/health.js");
    const db = d1();
    let response = await health.onRequestGet(context(db, "GET", "/api/health"));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ready" });
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    db.sqlite.exec("DROP TABLE study_groups");
    response = await health.onRequestGet(context(db, "GET", "/api/health"));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: "unavailable" });
    db.sqlite.close();
    const withoutMigration = d1();
    withoutMigration.sqlite.exec("DROP TRIGGER pro_requests_grant_after_approval");
    response = await health.onRequestGet(context(withoutMigration, "GET", "/api/health"));
    assert.equal(response.status, 503);
    withoutMigration.sqlite.close();
    const withoutEducator = d1();
    withoutEducator.sqlite.exec("DROP TABLE educator_grants");
    response = await health.onRequestGet(context(withoutEducator, "GET", "/api/health"));
    assert.equal(response.status, 503);
    withoutEducator.sqlite.close();
    const withoutFinancial = d1();
    withoutFinancial.sqlite.exec("DROP TRIGGER financial_request_created");
    response = await health.onRequestGet(context(withoutFinancial, "GET", "/api/health"));
    assert.equal(response.status, 503);
    withoutFinancial.sqlite.close();
    response = await health.onRequestGet({ env: {}, request: new Request("https://example.pages.dev/api/health") });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: "unavailable" });
  });

test("aprovação Premium é atômica e exige referência bancária única",
  { skip: !DatabaseSync }, () => {
    const db = d1();
    const sql = db.sqlite;
    sql.prepare("INSERT INTO synced_profiles (id, access_key_hash, nickname) VALUES (?, ?, ?)")
      .run("a", "a".repeat(64), "Teste A");
    sql.prepare("INSERT INTO synced_profiles (id, access_key_hash, nickname) VALUES (?, ?, ?)")
      .run("b", "b".repeat(64), "Teste B");
    const insert = sql.prepare(`INSERT INTO pro_requests
      (id, profile_id, txid, amount_cents) VALUES (?, ?, ?, 990)`);
    insert.run("pedido-a", "a", "TXIDA");
    insert.run("pedido-b", "b", "TXIDB");
    const approve = sql.prepare(`UPDATE pro_requests SET status = 'approved',
      confirmed_payment_reference = ?, approved_at = '2026-10-01T00:00:00Z'
      WHERE id = ?`);
    assert.throws(() => approve.run("EXTRATO-001", "pedido-a"), /approval_requires_claimed_payment/);
    assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pro_entitlements").get().n, 0);
    sql.exec("UPDATE pro_requests SET status = 'claimed' WHERE id IN ('pedido-a', 'pedido-b')");
    assert.throws(() => approve.run(null, "pedido-a"), /approval_requires_claimed_payment/);
    assert.equal(sql.prepare("SELECT status FROM pro_requests WHERE id = 'pedido-a'").get().status,
      "claimed");
    approve.run("EXTRATO-001", "pedido-a");
    assert.deepEqual({ ...sql.prepare(`SELECT profile_id, request_id, payment_reference
      FROM pro_entitlements WHERE profile_id = 'a'`).get() }, {
      profile_id: "a", request_id: "pedido-a", payment_reference: "EXTRATO-001",
    });
    assert.throws(() => approve.run("EXTRATO-001", "pedido-b"),
      /UNIQUE constraint failed/);
    assert.equal(sql.prepare("SELECT status FROM pro_requests WHERE id = 'pedido-b'").get().status,
      "claimed");
    assert.throws(() => sql.exec("UPDATE pro_requests SET status = 'rejected' WHERE id = 'pedido-a'"),
      /approved_payment_cannot_change_status/);
    sql.close();
  });

test("migração Premium preserva pedidos já criados e exige data de aprovação",
  { skip: !DatabaseSync }, () => {
    const sql = new DatabaseSync(":memory:");
    sql.exec(fs.readFileSync(path.join(__dirname, "../sql/d1-schema.sql"), "utf8"));
    sql.prepare("INSERT INTO synced_profiles (id, access_key_hash, nickname) VALUES (?, ?, ?)")
      .run("legacy", "d".repeat(64), "Teste legado");
    sql.prepare(`INSERT INTO pro_requests (id, profile_id, txid, amount_cents, status)
      VALUES ('antigo', 'legacy', 'TXIDLEGACY', 990, 'claimed')`).run();
    sql.exec(fs.readFileSync(path.join(__dirname,
      "../sql/migrations/001-premium-approval.sql"), "utf8"));
    assert.throws(() => sql.exec(`UPDATE pro_requests SET status = 'approved',
      confirmed_payment_reference = 'EXTRATO-002' WHERE id = 'antigo'`),
    /approval_requires_claimed_payment/);
    assert.equal(sql.prepare("SELECT status FROM pro_requests WHERE id = 'antigo'").get().status,
      "claimed");
    sql.exec(`UPDATE pro_requests SET status = 'approved',
      confirmed_payment_reference = 'EXTRATO-002',
      approved_at = '2026-10-01T00:00:00Z' WHERE id = 'antigo'`);
    assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pro_entitlements").get().n, 1);
    sql.close();
  });

test("ranking rejeita envio sem perfil e remove pontuações legadas anônimas",
  { skip: !DatabaseSync }, async () => {
    const ranking = await import("../functions/api/ranking.js");
    const db = d1();
    const response = await ranking.onRequestPost(context(db, "POST", "/api/ranking", {
      id: "fake", participantId: "anon", nickname: "Visitante", category: "all",
      level: 1, answers: [],
    }));
    assert.equal(response.status, 403);
    assert.throws(() => db.sqlite.prepare(`INSERT INTO ranking_attempts
      (id, participant_id, nickname, category, level, total, correct)
      VALUES ('fake', 'anon', 'Visitante', 'all', 1, 10, 10)`).run(),
    /ranking_requires_verified_profile/);
    db.sqlite.exec("DROP TRIGGER ranking_requires_verified_profile");
    db.sqlite.exec(`INSERT INTO ranking_attempts
      (id, participant_id, nickname, category, level, total, correct)
      VALUES ('fake', 'anon', 'Visitante', 'all', 1, 10, 10)`);
    const publicResult = await ranking.onRequestGet(context(db, "GET",
      "/api/ranking?category=all&level=1&total=10"));
    assert.deepEqual(await publicResult.json(), { ranking: [] });
    db.sqlite.close();

    const legacy = new DatabaseSync(":memory:");
    legacy.exec(fs.readFileSync(path.join(__dirname, "../sql/d1-schema.sql"), "utf8"));
    legacy.exec(`INSERT INTO ranking_attempts
      (id, participant_id, nickname, category, level, total, correct)
      VALUES ('old', 'anon', 'Visitante', 'all', 1, 10, 10)`);
    legacy.exec(fs.readFileSync(path.join(__dirname,
      "../sql/migrations/004-ranking-synced.sql"), "utf8"));
    assert.equal(legacy.prepare("SELECT COUNT(*) AS n FROM ranking_attempts").get().n, 0);
    legacy.close();
  });

test("migração financeira guarda pedidos preexistentes sem duplicar o histórico",
  { skip: !DatabaseSync }, () => {
    const sql = new DatabaseSync(":memory:");
    sql.exec(fs.readFileSync(path.join(__dirname, "../sql/d1-schema.sql"), "utf8"));
    sql.exec(fs.readFileSync(path.join(__dirname,
      "../sql/migrations/001-premium-approval.sql"), "utf8"));
    sql.exec(`INSERT INTO synced_profiles (id, access_key_hash, nickname)
      VALUES ('legacy-buyer', '${"e".repeat(64)}', 'Comprador Antigo')`);
    sql.exec(`INSERT INTO pro_requests (id, profile_id, txid, amount_cents)
      VALUES ('legacy-order', 'legacy-buyer', 'TXID-LEGADO', 990)`);
    const migration = fs.readFileSync(path.join(__dirname,
      "../sql/migrations/003-financial-retention.sql"), "utf8");
    sql.exec(migration);
    sql.exec(migration);
    assert.equal(sql.prepare(`SELECT COUNT(*) AS n FROM financial_records
      WHERE request_id = 'legacy-order'`).get().n, 1);
    assert.equal(sql.prepare(`SELECT COUNT(*) AS n FROM financial_events
      WHERE request_id = 'legacy-order'`).get().n, 1);
    sql.close();
  });

test("registros financeiros sobrevivem à exclusão do perfil por pelo menos um ano",
  { skip: !DatabaseSync }, async () => {
    const db = d1();
    const sql = db.sqlite;
    sql.prepare("INSERT INTO synced_profiles (id, access_key_hash, nickname) VALUES (?, ?, ?)")
      .run("buyer", "d".repeat(64), "Comprador Teste");
    sql.prepare(`INSERT INTO pro_requests (id, profile_id, txid, amount_cents)
      VALUES ('pedido-fin', 'buyer', 'TXID-FIN', 990)`).run();
    sql.exec(`UPDATE pro_requests SET status = 'claimed', payer_reference = 'REF-CLIENTE',
      claimed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 'pedido-fin'`);
    sql.exec(`UPDATE pro_requests SET status = 'approved',
      confirmed_payment_reference = 'EXTRATO-UNICO-FIN',
      approved_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 'pedido-fin'`);
    assert.equal(sql.prepare(`SELECT COUNT(*) AS n FROM financial_events
      WHERE request_id = 'pedido-fin'`).get().n, 4);
    sql.exec("DELETE FROM synced_profiles WHERE id = 'buyer'");
    assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pro_requests").get().n, 0);
    assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pro_entitlements").get().n, 0);
    const record = sql.prepare(`SELECT profile_id, amount_cents, status,
      confirmed_payment_reference AS paymentReference, granted_at AS grantedAt,
      retain_until AS retainUntil
      FROM financial_records WHERE request_id = 'pedido-fin'`).get();
    assert.equal(record.profile_id, "buyer");
    assert.equal(record.amount_cents, 990);
    assert.equal(record.status, "approved");
    assert.equal(record.paymentReference, "EXTRATO-UNICO-FIN");
    assert.ok(record.grantedAt);
    assert.ok(Date.parse(record.retainUntil) > Date.now() + 360 * 24 * 60 * 60 * 1000);
    assert.equal(sql.prepare(`SELECT event_type FROM financial_events
      WHERE request_id = 'pedido-fin' ORDER BY id DESC LIMIT 1`).get().event_type, "removed");
    assert.throws(() => sql.exec("DELETE FROM financial_records WHERE request_id = 'pedido-fin'"),
      /financial_retention_not_elapsed/);
    assert.throws(() => sql.exec("DELETE FROM financial_events WHERE request_id = 'pedido-fin'"),
      /financial_retention_not_elapsed/);
    assert.throws(() => sql.exec("UPDATE financial_events SET status = 'rejected'"),
      /financial_event_immutable/);
    sql.prepare("INSERT INTO synced_profiles (id, access_key_hash, nickname) VALUES (?, ?, ?)")
      .run("buyer-two", "f".repeat(64), "Outro Comprador");
    sql.exec(`INSERT INTO pro_requests (id, profile_id, txid, amount_cents, status)
      VALUES ('pedido-two', 'buyer-two', 'TXID-TWO', 990, 'claimed')`);
    assert.throws(() => sql.exec(`UPDATE pro_requests SET status = 'approved',
      confirmed_payment_reference = 'EXTRATO-UNICO-FIN',
      approved_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 'pedido-two'`),
    /UNIQUE constraint failed/);
    assert.equal(sql.prepare("SELECT status FROM pro_requests WHERE id = 'pedido-two'").get().status,
      "claimed");
    sql.close();
  });

test("Pix e exclusão com pedido falham se o arquivo financeiro está incompleto",
  { skip: !DatabaseSync }, async () => {
    const db = d1();
    const profile = await import("../functions/api/profile.js");
    const pro = await import("../functions/api/pro.js");
    const key = "9".repeat(64);
    let response = await profile.onRequestPost(context(db, "POST", "/api/profile", {
      action: "create", id: "buyer-incomplete", key, name: "Comprador Teste",
      shareRanking: false,
    }));
    assert.equal(response.status, 201);
    db.sqlite.exec("DROP TRIGGER financial_request_created");
    response = await pro.onRequestPost(context(db, "POST", "/api/pro", {
      action: "create", amountCents: 990,
    }, key));
    assert.equal(response.status, 503);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM pro_requests").get().n, 0);
    db.sqlite.exec(`INSERT INTO pro_requests (id, profile_id, txid, amount_cents)
      VALUES ('unarchived', 'buyer-incomplete', 'TXID-UNARCHIVED', 990)`);
    response = await profile.onRequestDelete(context(db, "DELETE", "/api/profile", null, key));
    assert.equal(response.status, 503);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM synced_profiles").get().n, 1);
    db.sqlite.close();
  });

test("Pix fica suspenso para perfil com pedido sem arquivo financeiro",
  { skip: !DatabaseSync }, async () => {
    const db = d1();
    const profile = await import("../functions/api/profile.js");
    const pro = await import("../functions/api/pro.js");
    const health = await import("../functions/api/health.js");
    const key = "8".repeat(64);
    let response = await profile.onRequestPost(context(db, "POST", "/api/profile", {
      action: "create", id: "buyer-legacy-gap", key, name: "Comprador Teste",
      shareRanking: false,
    }));
    assert.equal(response.status, 201);
    const trigger = db.sqlite.prepare(`SELECT sql FROM sqlite_master
      WHERE type = 'trigger' AND name = 'financial_request_created'`).get().sql;
    db.sqlite.exec("DROP TRIGGER financial_request_created");
    db.sqlite.exec(`INSERT INTO pro_requests (id, profile_id, txid, amount_cents)
      VALUES ('missing-archive', 'buyer-legacy-gap', 'TXID-MISSING', 990)`);
    db.sqlite.exec(trigger);
    response = await health.onRequestGet(context(db, "GET", "/api/health"));
    assert.equal(response.status, 503);
    response = await pro.onRequestGet(context(db, "GET", "/api/pro", null, key));
    assert.equal(response.status, 503);
    response = await pro.onRequestPost(context(db, "POST", "/api/pro", {
      action: "create", amountCents: 990,
    }, key));
    assert.equal(response.status, 503);
    response = await profile.onRequestDelete(context(db, "DELETE", "/api/profile", null, key));
    assert.equal(response.status, 503);
    db.sqlite.close();
  });

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
  response = await profile.onRequestPost(context(db, "POST", "/api/profile", {
    action: "sync", name: "Aluno Teste", shareRanking: false, results: [], labs: [],
  }, key));
  assert.equal(response.status, 200);
  response = await ranking.onRequestGet(context(db, "GET",
    "/api/ranking?category=all&level=1&total=1"));
  assert.deepEqual(await response.json(), { ranking: [] });
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM ranking_attempts").get().n, 0);
  response = await feedback.onRequestPost(context(db, "POST", "/api/feedback", {
    email: "aluno@example.com", comment: "Gostei bastante das trilhas interativas!", agree: true,
  }));
  assert.equal(response.status, 201);
  response = await pro.onRequestPost(context(db, "POST", "/api/pro", {
    action: "create", amountCents: 990 }, key));
  assert.equal(response.status, 201);
  const order = await response.json();
  assert.match(order.qr, /^data:image\/svg\+xml;charset=utf-8,/);
  response = await profile.onRequestDelete(context(db, "DELETE", "/api/profile", null, key));
  assert.equal(response.status, 200);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM synced_profiles").get().n, 0);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM ranking_attempts").get().n, 0);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM financial_records WHERE request_id = ?")
    .get(order.request.id).n, 1);
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
    assert.ok(room.members.every((member) => !("id" in member)));
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
    assert.equal((await response.json()).events, undefined);
    response = await post(firstKey, { action: "createGroup", title: "Estudo Linux" });
    const groupCode = (await response.json()).code;
    response = await post(secondKey, { action: "joinGroup", code: groupCode });
    assert.equal(response.status, 200);
    const question = FlowData.questions.find((item) => item.level === 1);
    response = await profile.onRequestPost(context(db, "POST", "/api/profile", {
      action: "attempt", id: "learner-attempt", level: 1, category: "all",
      shareRanking: false, answers: [{ id: question.id, selected: question.answer }],
    }, secondKey));
    assert.equal(response.status, 201);
    response = await post(secondKey, { action: "suggest", code: groupCode,
      content: "Adicionar exercícios práticos de permissões." });
    assert.equal(response.status, 201);
    response = await community.onRequestGet(context(db, "GET",
      `/api/community?group=${groupCode}`, null, firstKey));
    let group = await response.json();
    assert.equal(group.people.length, 1);
    assert.equal(group.group.canReview, false);
    assert.equal(group.summary.quizzes, 0);
    assert.equal(group.suggestions.length, 1);
    const grant = db.sqlite.prepare(
      "INSERT INTO educator_grants (profile_id, approved_by) VALUES (?, ?)");
    grant.run("master", "Responsável da escola");
    assert.throws(() => grant.run("master", "Outro responsável"), /UNIQUE constraint failed/);
    response = await community.onRequestGet(context(db, "GET",
      `/api/community?room=${roomCode}`, null, firstKey));
    assert.ok((await response.json()).events.some((event) => event.type === "answered"));
    response = await community.onRequestGet(context(db, "GET",
      `/api/community?group=${groupCode}`, null, firstKey));
    group = await response.json();
    assert.equal(group.group.canReview, true);
    assert.equal(group.people.length, 2);
    assert.equal(group.summary.quizzes, 1);
    assert.ok(group.people.every((person) => !("id" in person)));
    response = await community.onRequestGet(context(db, "GET",
      `/api/community?group=${groupCode}`, null, secondKey));
    assert.equal((await response.json()).people.length, 1);
    db.sqlite.prepare(`UPDATE educator_grants SET revoked_at =
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), revoked_by = 'Responsável da escola'
      WHERE profile_id = 'master' AND revoked_at IS NULL`).run();
    response = await community.onRequestGet(context(db, "GET",
      `/api/community?group=${groupCode}`, null, firstKey));
    assert.equal((await response.json()).people.length, 1);
    response = await community.onRequestGet(context(db, "GET",
      `/api/community?room=${roomCode}`, null, firstKey));
    assert.equal((await response.json()).events, undefined);
    db.sqlite.close();
  });

test("lotação de sala e grupo é verificada no INSERT e preserva membros atuais",
  { skip: !DatabaseSync }, async () => {
    const db = d1();
    const profile = await import("../functions/api/profile.js");
    const community = await import("../functions/api/community.js");
    const ownerKey = "e".repeat(64), outsiderKey = "f".repeat(64);
    for (const [id, key] of [["owner", ownerKey], ["outsider", outsiderKey]]) {
      const response = await profile.onRequestPost(context(db, "POST", "/api/profile",
        { action: "create", id, key, name: id, shareRanking: false }));
      assert.equal(response.status, 201);
    }
    const post = (key, body) => community.onRequestPost(context(db, "POST", "/api/community", body, key));
    const roomResponse = await post(ownerKey, { action: "createRoom", title: "Sala lotada",
      mode: "collective", category: "all", count: 2, secondsPerQuestion: 0 });
    const roomCode = (await roomResponse.json()).code;
    const roomId = db.sqlite.prepare("SELECT id FROM game_rooms WHERE code = ?").get(roomCode).id;
    const groupResponse = await post(ownerKey, { action: "createGroup", title: "Grupo lotado" });
    const groupCode = (await groupResponse.json()).code;
    const groupId = db.sqlite.prepare("SELECT id FROM study_groups WHERE code = ?").get(groupCode).id;
    const addProfile = db.sqlite.prepare(`INSERT INTO synced_profiles
      (id, access_key_hash, nickname) VALUES (?, ?, ?)`);
    const addRoomMember = db.sqlite.prepare("INSERT INTO game_members (room_id, profile_id) VALUES (?, ?)");
    const addGroupMember = db.sqlite.prepare("INSERT INTO study_members (group_id, profile_id) VALUES (?, ?)");
    for (let index = 1; index <= 79; index++) {
      const id = `fill-${index}`;
      addProfile.run(id, `test-hash-${index}`, id);
      addGroupMember.run(groupId, id);
      if (index <= 39) addRoomMember.run(roomId, id);
    }
    assert.equal((await post(outsiderKey, { action: "joinRoom", code: roomCode })).status, 409);
    assert.equal((await post(ownerKey, { action: "joinRoom", code: roomCode })).status, 200);
    assert.equal((await post(outsiderKey, { action: "joinGroup", code: groupCode })).status, 409);
    assert.equal((await post(ownerKey, { action: "joinGroup", code: groupCode })).status, 200);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM game_members").get().n, 40);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM study_members").get().n, 80);
    db.sqlite.close();
  });
