const test = require("node:test");
const assert = require("node:assert/strict");
const { validateFeedback } = require("../server/feedback-core.cjs");

test("sugestões exigem e-mail, comentário e ciência de privacidade", () => {
  assert.deepEqual(validateFeedback({ email: "  Aluno@Exemplo.com ",
    comment: "  Gostaria de uma trilha sobre redes.  ", agree: true }),
  { email: "aluno@exemplo.com", comment: "Gostaria de uma trilha sobre redes." });
  assert.throws(() => validateFeedback({ email: "inválido", comment: "Comentário suficiente", agree: true }));
  assert.throws(() => validateFeedback({ email: "a@b.com", comment: "curto", agree: true }));
  assert.throws(() => validateFeedback({ email: "a@b.com", comment: "Comentário suficiente", agree: false }));
});
