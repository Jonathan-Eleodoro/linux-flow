const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const data = require("../js/data.js").FlowData;

function translator(locale) {
  const window = {};
  const stored = new Map([["linux_flow.language.v1", locale]]);
  const context = {
    window,
    localStorage: {
      getItem: (key) => stored.get(key),
      setItem: (key, value) => stored.set(key, value),
    },
    document: {
      documentElement: { lang: "" },
      readyState: "loading",
      addEventListener() {},
    },
  };
  const source = fs.readFileSync(path.join(__dirname, "../js/i18n.js"), "utf8");
  vm.runInNewContext(source, context);
  return { ...window.FlowI18n, saved: stored.get("linux_flow.language.v1") };
}

test("português brasileiro e espanhol selecionáveis e interpolação do mapa de objetivos", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const options = html.match(/<select id="language"[^>]*>(.*?)<\/select>/s)?.[1] || "";
  assert.deepEqual([...options.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]), ["pt-BR", "es"]);
  for (const locale of ["pt-BR", "es"]) {
    const i18n = translator(locale);
    assert.equal(i18n.locale(), locale);
    assert.match(i18n.t("TÓPICO {id}", { id: 2 }), /2/);
    assert.match(i18n.t("O material Linux Essentials 010-160 orienta este mapa. {related} dos {total} objetivos têm alguma trilha relacionada nesta versão. Uma trilha relacionada não significa cobertura completa ou preparação suficiente para o exame.", { related: 18, total: 19 }), /18.*19/);
  }
  const spanish = translator("es");
  assert.equal(spanish.t("Explore os objetivos."), "Explora los objetivos.");
  const retired = translator("fr");
  assert.equal(retired.locale(), "pt-BR");
  assert.equal(retired.saved, "pt-BR");
  for (const topic of data.lpiTopics) {
    assert.notEqual(spanish.t(topic.title), topic.title);
    for (const objective of topic.objectives) {
      assert.notEqual(spanish.t(objective.title), objective.title);
    }
  }
});

test("cartões das trilhas têm títulos, descrições e estados localizados", () => {
  for (const locale of ["es"]) {
    const i18n = translator(locale);
    for (const category of data.categories) {
      assert.ok(i18n.has(category.name), `${locale}: ${category.name}`);
      assert.ok(i18n.has(category.description), `${locale}: ${category.description}`);
    }
    assert.notEqual(i18n.t("{count} questões", { count: 6 }), "6 questões");
    assert.notEqual(i18n.t("Pronto para explorar"), "Pronto para explorar");
    assert.notEqual(i18n.t("NOVAS JORNADAS · Free"), "NOVAS JORNADAS · Free");
  }
});

test("configuração e controles do quiz têm tradução nos idiomas adicionais", () => {
  const keys = [
    "Avaliação / escolha sua sessão", "O que vamos praticar?", "Assunto",
    "Todos os assuntos", "Dificuldade", "Quantidade de perguntas",
    "Uma rodada, novas combinações.", "Iniciar quiz →",
    "Três formas de avançar", "Confirmar resposta", "Próxima pergunta →",
  ];
  for (const locale of ["es"]) {
    const i18n = translator(locale);
    for (const key of keys) assert.ok(i18n.has(key), `${locale}: ${key}`);
    assert.match(i18n.t("{count} questões", { count: 10 }), /10/);
    assert.match(i18n.t("{size} questões disponíveis neste recorte · até 100 por rodada {plan}. {mode}", {
      size: 50, plan: "Free", mode: i18n.t("Quiz geral: com 10 ou mais questões, vale para o certificado do nível."),
    }), /50/);
  }
});
