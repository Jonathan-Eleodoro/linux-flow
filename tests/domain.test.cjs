// Executar com node --test tests/domain.test.cjs. Sem bibliotecas externas.
const test = require("node:test"),
  assert = require("node:assert/strict");
global.window = global;
require("../js/data.js");
require("../js/core.js");
require("../js/terminal.js");
const { questions } = FlowData;
test("Jornadas guiadas têm decisões válidas e quiz associado", () => {
  for (const id of ["historia", "instalacao"]) {
    const module = FlowData.learningModules[id];
    assert(module.steps.length >= 5);
    assert(FlowData.categories.some((category) => category.id === id));
    assert.equal(questions.filter((question) => question.category === id).length, 9);
    for (const step of module.steps) {
      assert.equal(new Set(step.choices).size, step.choices.length);
      assert(step.choices.length >= 3);
      assert(Number.isInteger(step.correct) && step.correct >= 0 && step.correct < step.choices.length);
      assert(step.feedback.trim());
    }
  }
});
test("Integridade editorial: IDs únicos, fontes e quatro alternativas diferentes", () => {
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => {
    assert.equal(new Set(q.options).size, 4, q.id);
    assert(q.options.includes(q.answer));
    assert(q.source.endsWith(".pdf"));
    assert([1, 2, 3].includes(q.level));
  });
});
test("Sorteio sem reposição, sem alterar o banco e sem corromper gabaritos", () => {
  const before = JSON.stringify(questions);
  for (let level = 1; level <= 3; level++) {
    const s = FlowCore.session(questions, "all", level, 10);
    assert.equal(s.length, 10);
    assert.equal(new Set(s.map((q) => q.id)).size, 10);
    assert(s.every((q) => q.level === level && q.options.includes(q.answer)));
  }
  assert.equal(JSON.stringify(questions), before);
  assert.throws(() => FlowCore.session(questions, "arquivos", 3, 100));
});
test("Rodadas FREE respeitam o limite de 100 mesmo com acervo maior", () => {
  const expanded = Array.from({ length: 101 }, (_, index) => ({ ...questions[0], id: `extra-${index}` }));
  assert.equal(FlowCore.session(expanded, "all", questions[0].level, 100).length, 100);
  assert.throws(() => FlowCore.session(expanded, "all", questions[0].level, 101));
});
test("novas rodadas mudam a ordem e a sequência de letras corretas", () => {
  const bank = FlowCore.pool(questions, "all", 1);
  let previous = [];
  for (let attempt = 0; attempt < 50; attempt++) {
    const current = FlowCore.session(bank, "all", 1, 10, previous);
    const summary = current.map((question) => ({
      id: question.id,
      answerIndex: question.options.indexOf(question.answer),
    }));
    assert(summary.every((item) => item.answerIndex >= 0));
    assert(summary.every((item, index) => index === 0 || item.answerIndex !== summary[index - 1].answerIndex));
    if (previous.length) {
      assert.notDeepEqual(summary.map((item) => item.id), previous.map((item) => item.id));
      assert.notDeepEqual(summary.map((item) => item.answerIndex), previous.map((item) => item.answerIndex));
      for (const item of summary) {
        const prior = previous.find((before) => before.id === item.id);
        if (prior) assert.notEqual(item.answerIndex, prior.answerIndex);
      }
    }
    previous = summary;
  }
});
test("rodadas de uma pergunta alternam quando há mais de uma disponível", () => {
  const bank = FlowCore.pool(questions, "all", 1).slice(0, 2);
  const first = FlowCore.session(bank, "all", 1, 1);
  const prior = [{ id: first[0].id, answerIndex: first[0].options.indexOf(first[0].answer) }];
  const second = FlowCore.session(bank, "all", 1, 1, prior);
  assert.notEqual(second[0].id, first[0].id);
  assert.deepEqual(new Set(second[0].options), new Set(bank.find((q) => q.id === second[0].id).options));
});
test("Certificação usa proporção real e exige prova geral com dez questões", () => {
  assert(FlowCore.qualifies({ category: "all", total: 10, correct: 8 }));
  assert(!FlowCore.qualifies({ category: "all", total: 9, correct: 9 }));
  assert(!FlowCore.qualifies({ category: "arquivos", total: 10, correct: 10 }));
  assert(!FlowCore.qualifies({ category: "all", total: 49, correct: 39 }));
});
test("Ranking mantém somente melhor tentativa por usuário e desempata pela data", () => {
  const list = FlowRanking([
    { userId: "a", correct: 8, total: 10, date: "2026-01-02" },
    { userId: "b", correct: 10, total: 10, date: "2026-01-01" },
    { userId: "a", correct: 10, total: 10, date: "2026-01-03" },
  ]);
  assert.deepEqual(
    list.map((r) => r.userId),
    ["b", "a"],
  );
  assert.equal(list[1].correct, 10);
});
test("As doze missões exigem a alteração ou consulta correspondente", () => {
  const commands = [
    ["pwd"],
    ["mkdir projeto", "cd projeto", "touch aula.txt"],
    ["cat notas.txt"],
    ["chmod 640 relatorio.txt"],
    ["ip addr", "ip route"],
    ["tcpdump -i eth0 icmp"],
    ["ls -a"],
    ["cp notas.txt notas-backup.txt"],
    ["mv rascunho.txt entrega.txt"],
    ["grep Linux notas.txt"],
    ["ps"],
    ["ss -tuln"],
  ];
  assert.equal(FlowTerminal.missions.length, commands.length);
  FlowTerminal.missions.forEach((mission) => {
    assert(mission.references.length > 0, mission.title);
    mission.references.forEach((reference) => {
      assert(reference.label.trim(), mission.title);
      assert(["www.gnu.org", "man7.org", "github.com"].includes(new URL(reference.url).hostname), mission.title);
    });
  });
  commands.forEach((seq, index) => {
    const terminal = FlowTerminal.create(index);
    assert(!terminal.run("help").done);
    let r;
    seq.forEach((c) => (r = terminal.run(c)));
    assert(r.done, index.toString());
  });
});
test("Terminal recusa execução arbitrária, pipes e operações fora do escopo", () => {
  const terminal = FlowTerminal.create(0);
  for (const c of [
    "rm -rf /",
    "fetch https://exemplo",
    "cat notas.txt | sh",
    "$(whoami)",
    "eval alert(1)",
  ]) {
    const r = terminal.run(c);
    assert(!r.done);
    assert.match(r.output, /não implementados|um comando simples/);
  }
});
