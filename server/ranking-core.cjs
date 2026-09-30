"use strict";
const { FlowData } = require("../js/data.js");
const { questions: proQuestions } = require("./pro-data.cjs");
const questions = new Map([...FlowData.questions, ...proQuestions].map((question) => [question.id, question]));
const categories = new Set(["all", ...FlowData.categories.map((category) => category.id)]);
const safeId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);

function validateAttempt(body, { allowPro = false } = {}) {
  if (!body || !safeId(body.id) || !safeId(body.participantId) ||
      typeof body.nickname !== "string" || body.nickname.trim().length < 2 ||
      body.nickname.length > 32 || !categories.has(body.category) ||
      !(allowPro ? [1, 2, 3, 4, 5] : [1, 2, 3]).includes(body.level) || !Array.isArray(body.answers) ||
      body.answers.length < 1 || body.answers.length > 100) {
    throw new Error("Tentativa inválida.");
  }
  const seen = new Set();
  let correct = 0;
  const outcomes = [];
  for (const answer of body.answers) {
    if (!answer || typeof answer.id !== "string" || seen.has(answer.id))
      throw new Error("Perguntas repetidas ou inválidas.");
    const question = questions.get(answer.id);
    if (!question || question.level !== body.level ||
        (body.category !== "all" && question.category !== body.category) ||
        !question.options.includes(answer.selected))
      throw new Error("Resposta inválida para esta rodada.");
    seen.add(answer.id);
    const right = answer.selected === question.answer;
    if (right) correct++;
    outcomes.push({ questionId: answer.id, correct: right });
  }
  return {
    id: body.id,
    participantId: body.participantId,
    nickname: body.nickname.trim(),
    category: body.category,
    level: body.level,
    total: body.answers.length,
    correct,
    outcomes,
  };
}

function validateFilter(params) {
  const category = params.get("category") || "all";
  const level = Number(params.get("level") || 1);
  const total = Number(params.get("total") || 10);
  if (!categories.has(category) || ![1, 2, 3].includes(level) ||
      !Number.isInteger(total) || total < 1 || total > 100)
    throw new Error("Filtro inválido.");
  return { category, level, total };
}

module.exports = { validateAttempt, validateFilter };
