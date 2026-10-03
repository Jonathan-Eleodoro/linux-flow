// Verifica recuperação local e proteção da chave de sincronização.
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../js/storage.js"), "utf8");

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
