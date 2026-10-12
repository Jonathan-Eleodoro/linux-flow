// Verifica recuperação local e proteção da chave de sincronização.
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../js/storage.js"), "utf8");

test("navegador e API aplicam a mesma regra de apelido", () => {
  const context = { window: {}, FlowData: { categories: [] },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
  vm.runInNewContext(source, context);
  const browserRule = context.window.FlowStore.safeName;
  const serverRule = require("../server/profile-core.cjs").safeName;
  for (const name of ["João Pérez", "Aluna", "João\nPérez", "Professor\u202Eadmin",
    "Ana\u200BMaria", "x", "a".repeat(33)])
    assert.equal(browserRule(name), serverRule(name), name);
});

test("código de acesso válido persiste por perfil e chave inválida é descartada", () => {
  const saved = JSON.stringify({
    profiles: [
      { id: "a", name: "Ana", shareRanking: true, syncKey: "a".repeat(64) },
      { id: "b", name: "Bia", shareRanking: false,
        shareRankingPending: true, syncKey: "curta" },
      { id: "c", name: "Cris", shareRanking: false,
        shareRankingPending: true, syncKey: "c".repeat(64) },
    ],
    current: "a", results: [], labs: [],
  });
  const context = {
    window: {}, FlowData: { categories: [] },
    localStorage: { getItem: () => saved, setItem: () => {}, removeItem: () => {} },
  };
  vm.runInNewContext(source, context);
  const profiles = context.window.FlowStore.state.profiles;
  assert.equal(profiles[0].syncKey, "a".repeat(64));
  assert.equal(profiles[0].shareRanking, true);
  assert.equal(profiles[1].syncKey, null);
  assert.equal(profiles[1].shareRanking, false);
  assert.equal(profiles[1].shareRankingPending, false);
  assert.equal(profiles[2].shareRankingPending, true);
});

test("sessão livre não entra na cópia persistida", () => {
  let written;
  const context = {
    window: {}, FlowData: { categories: [], questions: [] },
    localStorage: { getItem: () => null, setItem: (_key, value) => { written = JSON.parse(value); }, removeItem: () => {} },
  };
  vm.runInNewContext(source, context);
  const store = context.window.FlowStore;
  store.state.profiles.push({ id: "saved", name: "Aluno" },
    { id: "guest", name: "Visitante", temporary: true });
  store.state.current = "guest";
  store.state.results.push({ id: "one", userId: "guest" });
  store.permission(true);
  assert.deepEqual(written.profiles.map((profile) => profile.id), ["saved"]);
  assert.equal(written.current, null);
  assert.equal(written.results.length, 0);
});

test("sair remove a chave e o progresso local do perfil ativo sem apagar outro perfil", () => {
  let saved;
  const context = {
    window: {}, FlowData: { categories: [], questions: [] },
    localStorage: { getItem: () => saved || null,
      setItem: (_key, value) => { saved = value; }, removeItem: () => {} },
  };
  vm.runInNewContext(source, context);
  const store = context.window.FlowStore;
  store.state.profiles.push(
    { id: "adm", name: "Adm01", syncKey: "a".repeat(64) },
    { id: "aluno", name: "Aluno01", syncKey: "b".repeat(64) },
  );
  store.state.current = "adm";
  store.state.results.push({ id: "r1", userId: "adm" }, { id: "r2", userId: "aluno" });
  store.state.labs.push({ userId: "adm", mission: 1 });
  store.state.questionProgress.push({ userId: "adm", questionId: "q1" });
  store.permission(true);

  assert.equal(store.signOutCurrent(), true);
  const disk = JSON.parse(saved);
  assert.equal(store.state.current, null);
  assert.deepEqual(disk.profiles.map((profile) => profile.id), ["aluno"]);
  assert.deepEqual(disk.results.map((record) => record.id), ["r2"]);
  assert.equal(disk.labs.length, 0);
  assert.equal(disk.questionProgress.length, 0);
  assert.equal(saved.includes("a".repeat(64)), false);
});

test("falha ao salvar impede sair e mantém o perfil recuperável na sessão", () => {
  let fail = false;
  const context = {
    window: {}, FlowData: { categories: [], questions: [] },
    localStorage: { getItem: () => null,
      setItem: () => { if (fail) throw new Error("Armazenamento indisponível"); },
      removeItem: () => {} },
  };
  vm.runInNewContext(source, context);
  const store = context.window.FlowStore;
  store.state.profiles.push({ id: "adm", name: "Adm01", syncKey: "a".repeat(64) });
  store.state.current = "adm";
  store.permission(true);
  fail = true;
  assert.equal(store.signOutCurrent(), false);
  assert.equal(store.state.current, "adm");
  assert.equal(store.state.profiles[0].syncKey, "a".repeat(64));
});
