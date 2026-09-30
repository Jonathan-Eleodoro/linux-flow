// Confere recálculo de notas e filtros do ranking.
const test = require("node:test");
const assert = require("node:assert/strict");
const { FlowData } = require("../js/data.js");
const { validateAttempt, validateFilter } = require("../server/ranking-core.cjs");

test("API recalcula acertos a partir do gabarito e rejeita nota enviada pelo cliente", () => {
  const q = FlowData.questions[0];
  const attempt = validateAttempt({
    id: "round-1", participantId: "person-1", nickname: "Aluno",
    category: q.category, level: q.level, correct: 100,
    answers: [{ id: q.id, selected: q.answer }],
  });
  assert.equal(attempt.correct, 1);
  assert.equal(attempt.total, 1);
  assert.equal(attempt.nickname, "Aluno");
  assert.deepEqual(attempt.outcomes, [{ questionId: q.id, correct: true }]);
});

test("API registra acerto e erro por questão para o progresso sincronizado", () => {
  const [right, wrong] = FlowData.questions.filter((q) => q.level === 1).slice(0, 2);
  const attempt = validateAttempt({
    id: "round-outcomes", participantId: "person-1", nickname: "Aluno",
    category: "all", level: 1,
    answers: [
      { id: right.id, selected: right.answer },
      { id: wrong.id, selected: wrong.options.find((option) => option !== wrong.answer) },
    ],
  });
  assert.equal(attempt.correct, 1);
  assert.deepEqual(attempt.outcomes, [
    { questionId: right.id, correct: true },
    { questionId: wrong.id, correct: false },
  ]);
});

test("API rejeita perguntas repetidas, alternativas estranhas e categoria divergente", () => {
  const q = FlowData.questions[0];
  const base = { id: "round-1", participantId: "person-1", nickname: "Aluno",
    category: q.category, level: q.level,
    answers: [{ id: q.id, selected: q.answer }] };
  assert.throws(() => validateAttempt({ ...base, answers: [...base.answers, ...base.answers] }));
  assert.throws(() => validateAttempt({ ...base, answers: [{ id: q.id, selected: "inexistente" }] }));
  assert.throws(() => validateAttempt({ ...base, category: "all", level: 3 }));
  assert.deepEqual(validateFilter(new URLSearchParams("category=all&level=1&total=10")),
    { category: "all", level: 1, total: 10 });
  assert.throws(() => validateFilter(new URLSearchParams("level=999")));
});
