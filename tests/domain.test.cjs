// Executar com node --test tests/domain.test.cjs. Sem bibliotecas externas.
const test = require("node:test"),
  assert = require("node:assert/strict");
global.window = global;
require("../js/data.js");
require("../js/core.js");
require("../js/terminal.js");
const { questions } = FlowData;
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
test("As seis missões exigem a alteração ou consulta correspondente", () => {
  const commands = [
    ["pwd"],
    ["mkdir projeto", "cd projeto", "touch aula.txt"],
    ["cat notas.txt"],
    ["chmod 640 relatorio.txt"],
    ["ip addr", "ip route"],
    ["tcpdump -i eth0 icmp"],
  ];
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
