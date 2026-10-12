const test = require("node:test");
const assert = require("node:assert/strict");
const { FlowJourney } = require("../js/journey.js");

const categories = [{ id: "arquivos" }, { id: "redes" }];
const qualifies = (record) => record.category === "all" &&
  record.total >= 10 && record.correct / record.total >= 0.8;
const record = (category, correct, date, level = 1) =>
  ({ category, correct, total: 10, date, level });

test("primeiro acesso orienta a jornada histórica sem inventar progresso", () => {
  const value = FlowJourney.plan([], [], categories, 3, 3, qualifies);
  assert.deepEqual(value.focus, { kind: "learning", category: "historia" });
  assert.equal(value.explored, 0);
  assert.equal(value.completedMissions, 0);
  assert.equal(value.nextMission, 0);
});

test("revisão considera a tentativa mais recente e ignora falha já superada", () => {
  const results = [record("arquivos", 4, "2026-01-01"),
    record("arquivos", 9, "2026-01-02"), record("redes", 5, "2026-01-03")];
  const value = FlowJourney.plan(results, [0, 0, 2], categories, 3, 3, qualifies);
  assert.deepEqual(value.focus, { kind: "review", category: "redes", level: 1 });
  assert.equal(value.completedMissions, 2);
  assert.equal(value.nextMission, 1);
});

test("após dominar os assuntos, recomenda certificação pendente", () => {
  const results = [record("arquivos", 9, "2026-01-01"),
    record("redes", 8, "2026-01-02"), record("all", 9, "2026-01-03")];
  const value = FlowJourney.plan(results, [0, 1], categories, 2, 3, qualifies);
  assert.deepEqual(value.focus, { kind: "certificate", level: 2 });
  assert.equal(value.certified, 1);
  assert.equal(value.nextMission, undefined);
});
