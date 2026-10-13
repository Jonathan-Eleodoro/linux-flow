const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "assistant.js"), "utf8");

function visit(locale = "pt-BR") {
  class Element {
    constructor() { this.children = []; this.events = {}; this.attributes = {}; this.hidden = false; this.value = ""; }
    addEventListener(name, fn) { this.events[name] = fn; }
    setAttribute(name, value) { this.attributes[name] = value; }
    append(child) { child.parent = this; this.children.push(child); }
    replaceChildren() { this.children = []; }
    remove() { this.parent.children.splice(this.parent.children.indexOf(this), 1); }
    focus() { this.focused = true; }
    get firstElementChild() { return this.children[0]; }
    get scrollHeight() { return this.children.length * 100; }
  }
  const ids = ["orientador-launch", "orientador-panel", "orientador-messages",
    "orientador-topics", "orientador-input", "orientador-close", "orientador-form",
    "open-orientador", "settings"];
  const nodes = Object.fromEntries(ids.map((id) => [`#${id}`, new Element()]));
  nodes["#orientador-panel"].hidden = true;
  const document = { querySelector: (selector) => nodes[selector], createElement: () => new Element() };
  vm.runInNewContext(source, { document, window: { FlowI18n: { locale: () => locale }, addEventListener() {} },
    location: { hash: "#comunidade" }, fetch: () => { throw new Error("O chat não deve chamar a rede"); } });
  return nodes;
}

test("orientador abre no contexto da sala e oferece instruções sem rede", () => {
  const ui = visit();
  ui["#orientador-launch"].events.click();
  assert.equal(ui["#orientador-panel"].hidden, false);
  assert.equal(ui["#orientador-launch"].attributes["aria-expanded"], "true");
  assert.equal(ui["#orientador-topics"].children[0].textContent, "Salas e duelos");
  ui["#orientador-input"].value = "Como criar uma sala para duelo?";
  ui["#orientador-form"].events.submit({ preventDefault() {} });
  const reply = ui["#orientador-messages"].children.at(-1);
  assert.match(reply.children[0].textContent, /até 2 pessoas/);
  assert.equal(reply.children[1].href, "#comunidade");
});

test("orientador responde em espanhol e fecha pelo teclado", () => {
  const ui = visit("es");
  ui["#open-orientador"].events.click();
  ui["#orientador-input"].value = "¿Cómo sincronizo mi perfil?";
  ui["#orientador-form"].events.submit({ preventDefault() {} });
  const reply = ui["#orientador-messages"].children.at(-1);
  assert.match(reply.children[0].textContent, /código de acceso/);
  assert.equal(reply.children[1].href, "#sobre");
  ui["#orientador-panel"].events.keydown({ key: "Escape" });
  assert.equal(ui["#orientador-panel"].hidden, true);
});
