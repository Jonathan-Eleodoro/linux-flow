"use strict";
// Valida dados recuperados do navegador antes de gravá-los no perfil sincronizado.
const { FlowData } = require("../js/data.js");
const categories = new Set(["all", ...FlowData.categories.map((category) => category.id)]);
const safeId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
const safeKey = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
// Controles e marcas de direção podem quebrar ou disfarçar apelidos exibidos a outras pessoas.
const unsafeNameControl = /[\u0000-\u001f\u007f-\u009f\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/;
const safeName = (value) => typeof value === "string" &&
  value.trim().length >= 2 && value.length <= 32 && !unsafeNameControl.test(value);

function validateResults(results) {
  // IDs repetidos e notas impossíveis não entram no histórico compartilhado.
  if (!Array.isArray(results) || results.length > 300)
    throw new Error("Histórico inválido.");
  const ids = new Set();
  return results.map((record) => {
    if (!record || !safeId(record.id) || ids.has(record.id) ||
        !categories.has(record.category) || ![1, 2, 3, 4, 5].includes(record.level) ||
        !Number.isInteger(record.total) || record.total < 1 || record.total > 100 ||
        !Number.isInteger(record.correct) || record.correct < 0 ||
        record.correct > record.total || typeof record.date !== "string" ||
        !Number.isFinite(Date.parse(record.date)))
      throw new Error("Resultado inválido.");
    ids.add(record.id);
    return record;
  });
}

function validateLabs(labs) {
  // Só as doze missões conhecidas podem compor o progresso persistido.
  if (!Array.isArray(labs) || labs.length > 12 ||
      labs.some((mission) => !Number.isInteger(mission) || mission < 0 || mission >= 12) ||
      new Set(labs).size !== labs.length)
    throw new Error("Missões inválidas.");
  return labs;
}

module.exports = { safeId, safeKey, safeName, validateResults, validateLabs };
