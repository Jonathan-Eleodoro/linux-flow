import { randomUUID } from "node:crypto";
import { database } from "../server/db.mjs";
import feedbackCore from "../server/feedback-core.cjs";

const json = (value, status = 200) => Response.json(value, {
  status, headers: { "Cache-Control": "no-store" },
});

export async function POST(request) {
  try {
    const raw = await request.text();
    if (raw.length > 5000) return json({ error: "Comentário muito grande." }, 413);
    const { email, comment } = feedbackCore.validateFeedback(JSON.parse(raw));
    const [recent] = await database().execute(
      `SELECT COUNT(*) AS total FROM feedback_comments
       WHERE email = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 DAY`,
      [email],
    );
    if (recent[0].total >= 3)
      return json({ error: "Limite de três comentários por e-mail a cada 24 horas." }, 429);
    await database().execute(
      "INSERT INTO feedback_comments (id, email, comment) VALUES (?, ?, ?)",
      [randomUUID(), email, comment],
    );
    return json({ received: true }, 201);
  } catch (error) {
    if (error instanceof SyntaxError || error.message?.includes("Dados inválidos") ||
        error.message?.includes("Envio inválido") || error.message?.includes("Informe um e-mail") ||
        error.message?.includes("Escreva um comentário") || error.message?.includes("Confirme que leu"))
      return json({ error: error.message || "Envio inválido." }, 400);
    console.error("Falha ao registrar sugestão:", error);
    return json({ error: "Sugestões indisponíveis. Tente novamente mais tarde." }, 503);
  }
}
