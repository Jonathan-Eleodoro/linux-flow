// Valida o BR Code Pix e o isolamento das perguntas Premium.
const test = require("node:test");
const assert = require("node:assert/strict");
const { payload, crc16, amountCents, newTxid } = require("../server/pix-core.cjs");
const { questions } = require("../server/pro-data.cjs");
const { validateAttempt } = require("../server/ranking-core.cjs");

test("BR Code Pix contém valor, txid e CRC válido", () => {
  assert.equal(crc16("123456789"), "29B1");
  const txid = newTxid();
  const code = payload({ key: "contato@example.com", name: "José Exemplo",
    city: "São Paulo", cents: 990, txid });
  assert.match(code, /54049\.90/);
  assert(code.includes(txid));
  assert.match(code, /JOSE EXEMPLO/);
  assert.equal(code.slice(-4), crc16(code.slice(0, -4)));
  assert.equal(amountCents(990), 990);
  assert.throws(() => amountCents(989));
});

test("Perguntas PRO ficam no servidor e tentativas exigem autorização explícita", () => {
  assert.equal(questions.filter((question) => question.level === 4).length, 10);
  assert.equal(questions.filter((question) => question.level === 5).length, 10);
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
  for (const question of questions) {
    assert.equal(new Set(question.options).size, 4, question.id);
    assert(question.options.includes(question.answer), question.id);
    const attempt = { id: "pro-test", participantId: "learner", nickname: "Aluno",
      category: "all", level: question.level,
      answers: [{ id: question.id, selected: question.answer }] };
    assert.throws(() => validateAttempt(attempt));
    assert.equal(validateAttempt(attempt, { allowPro: true }).correct, 1);
  }
});
