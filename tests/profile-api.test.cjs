// Confere os limites de dados importados para um perfil sincronizado.
const test = require("node:test");
const assert = require("node:assert/strict");
const { validateResults, validateLabs, safeKey, safeName } = require("../server/profile-core.cjs");

test("apelidos mantêm acentos e rejeitam quebras ou inversão visual", () => {
  assert.equal(safeName("João Pérez"), true);
  assert.equal(safeName("João\nPérez"), false);
  assert.equal(safeName("Professor\u202Eadmin"), false);
  assert.equal(safeName("Ana\u200BMaria"), false);
});

test("perfil aceita chave forte e histórico local válido", () => {
  assert.equal(safeKey("a".repeat(64)), true);
  assert.equal(safeKey("a".repeat(20)), false);
  const record = { id: "round-1", category: "all", level: 1,
    total: 10, correct: 8, date: "2026-09-28T12:00:00.000Z" };
  assert.deepEqual(validateResults([record]), [record]);
  assert.deepEqual(validateLabs([0, 2, 5]), [0, 2, 5]);
  assert.deepEqual(validateLabs([0, 6, 11]), [0, 6, 11]);
});

test("perfil rejeita histórico inconsistente e missões repetidas", () => {
  const record = { id: "round-1", category: "all", level: 1,
    total: 10, correct: 11, date: "2026-09-28T12:00:00.000Z" };
  assert.throws(() => validateResults([record]));
  assert.throws(() => validateLabs([1, 1]));
  assert.throws(() => validateLabs([12]));
});
