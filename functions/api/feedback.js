import feedbackCore from "../../server/feedback-core.cjs";
import { database, first, json, prepared, publicError, readJson } from "../../cloudflare/common.mjs";

export async function onRequestPost(context) {
  let feedback;
  try { feedback = feedbackCore.validateFeedback(await readJson(context.request, 5000)); }
  catch (error) { return json({ error: error.message }, error.status || 400); }
  try {
    const db = database(context);
    const recent = await first(db,
      `SELECT COUNT(*) AS total FROM feedback_comments
       WHERE email = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')`,
      feedback.email);
    if (recent.total >= 3)
      return json({ error: "Limite de três comentários por e-mail a cada 24 horas." }, 429);
    await prepared(db,
      "INSERT INTO feedback_comments (id, email, comment) VALUES (?, ?, ?)",
      crypto.randomUUID(), feedback.email, feedback.comment).run();
    return json({ received: true }, 201);
  } catch (error) { return publicError(error, "Sugestões indisponíveis. Tente novamente mais tarde."); }
}
