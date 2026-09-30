"use strict";

function validateFeedback(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("Dados inválidos.");
  if (body.website) throw new Error("Envio inválido.");
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))
    throw new Error("Informe um e-mail válido.");
  if (comment.length < 10 || comment.length > 2000)
    throw new Error("Escreva um comentário entre 10 e 2.000 caracteres.");
  if (body.agree !== true)
    throw new Error("Confirme que leu o aviso de privacidade.");
  return { email, comment };
}

module.exports = { validateFeedback };
