// Confere que o inventário docente lê o acervo atual sem inserir HTML das questões.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { FlowData } = require("../js/data.js");

const script = fs.readFileSync(path.join(__dirname, "../guias-cloudflare/pedagogia.js"), "utf8");

function render(data) {
  const elements = new Map();
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { textContent: "", innerHTML: "" });
    return elements.get(id);
  } };
  vm.runInNewContext(script, { window: { FlowData: data }, document });
  return Object.fromEntries([...elements].map(([id, element]) => [id, element]));
}

test("inventário docente acompanha o acervo e distingue relação de cobertura", () => {
  const page = render(FlowData);
  assert.equal(Number(page["audit-questions"].textContent), FlowData.questions.length);
  assert.equal(Number(page["audit-tracks"].textContent), FlowData.categories.length);
  assert.equal(Number(page["audit-objectives"].textContent), 19);
  assert.equal(Number(page["audit-gaps"].textContent), 1);
  assert.match(page["audit-categories"].innerHTML, /historia-1/);
  assert.match(page["audit-objective-list"].innerHTML, /Sem trilha relacionada/);
});

test("inventário escapa texto editorial antes de montar HTML", () => {
  const data = {
    categories: [{ id: "x", number: "01", name: "<script>", source: "fonte.pdf" }],
    questions: [{ id: "q1", category: "x", level: 1, prompt: "<img src=x>",
      answer: "certo", options: ["certo", "errado"], explanation: "<b>texto</b>",
      source: "fonte.pdf" }],
    lpiTopics: [{ objectives: [{ id: "1.1", title: "<teste>", categories: ["x"] }] }],
  };
  const page = render(data);
  assert.doesNotMatch(page["audit-categories"].innerHTML, /<script>|<img src=x>|<b>texto<\/b>/);
  assert.match(page["audit-categories"].innerHTML, /&lt;img src=x&gt;/);
  assert.match(page["audit-objective-list"].innerHTML, /&lt;teste&gt;/);
});
