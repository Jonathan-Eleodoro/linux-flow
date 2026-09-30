import { createHash, randomUUID } from "node:crypto";
import { database } from "../server/db.mjs";
import pixCore from "../server/pix-core.cjs";
import proData from "../server/pro-data.cjs";

const { payload, amountCents, newTxid } = pixCore;
const json = (value, status = 200) => Response.json(value, {
  status, headers: { "Cache-Control": "no-store" },
});
async function authorized(request) {
  const match = /^Bearer ([0-9a-f]{64})$/.exec(request.headers.get("authorization") || "");
  if (!match) return null;
  const hash = createHash("sha256").update(Buffer.from(match[1], "hex")).digest();
  const [rows] = await database().execute(
    "SELECT id FROM synced_profiles WHERE access_key_hash = ?", [hash],
  );
  return rows[0] || null;
}
async function status(profileId) {
  const [entitled] = await database().execute(
    "SELECT profile_id FROM pro_entitlements WHERE profile_id = ?", [profileId],
  );
  const [requests] = await database().execute(
    `SELECT id, txid, amount_cents AS amountCents, status, payer_reference AS payerReference, created_at AS createdAt
     FROM pro_requests WHERE profile_id = ? ORDER BY created_at DESC LIMIT 1`, [profileId],
  );
  return { pro: entitled.length > 0, request: requests[0] || null };
}
function pixSettings() {
  const { PIX_KEY: key, PIX_RECEIVER_NAME: name, PIX_RECEIVER_CITY: city } = process.env;
  if (!key || !name || !city) return null;
  return { key, name, city };
}
async function present(profileId) {
  const current = await status(profileId);
  const settings = pixSettings();
  if (!current.request || current.pro || current.request.status !== "pending")
    return { ...current, paymentReady: Boolean(settings) };
  if (!settings) return { ...current, paymentReady: false };
  const copyPaste = payload({ ...settings, cents: current.request.amountCents,
    txid: current.request.txid });
  const { default: QRCode } = await import("qrcode");
  const qr = await QRCode.toDataURL(copyPaste, { errorCorrectionLevel: "M", margin: 3, width: 300 });
  return { ...current, paymentReady: true, receiver: settings.name,
    copyPaste, qr };
}
export async function GET(request) {
  try {
    const profile = await authorized(request);
    if (!profile) return json({ error: "Perfil sincronizado necessário." }, 401);
    const level = Number(new URL(request.url).searchParams.get("level"));
    if ([4, 5].includes(level)) {
      const current = await status(profile.id);
      if (!current.pro) return json({ error: "Acesso Premium não ativo." }, 403);
      return json({ questions: proData.questions.filter((question) => question.level === level) });
    }
    return json(await present(profile.id));
  } catch (error) {
    console.error("Falha ao consultar Premium:", error);
    return json({ error: "Consulta Premium indisponível." }, 503);
  }
}
export async function POST(request) {
  try {
    const profile = await authorized(request);
    if (!profile) return json({ error: "Perfil sincronizado necessário." }, 401);
    const raw = await request.text();
    if (raw.length > 2000) return json({ error: "Envio muito grande." }, 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object") return json({ error: "Envio inválido." }, 400);
    if (body.action === "create") {
      if (!pixSettings()) return json({ error: "Pix ainda não configurado." }, 503);
      const cents = amountCents(body.amountCents);
      const connection = await database().getConnection();
      let outcome = "created";
      try {
        await connection.beginTransaction();
        await connection.execute("SELECT id FROM synced_profiles WHERE id = ? FOR UPDATE", [profile.id]);
        const [entitled] = await connection.execute(
          "SELECT profile_id FROM pro_entitlements WHERE profile_id = ?", [profile.id],
        );
        const [requests] = await connection.execute(
          `SELECT amount_cents AS amountCents, status FROM pro_requests
           WHERE profile_id = ? ORDER BY created_at DESC LIMIT 1`, [profile.id],
        );
        if (entitled.length) outcome = "pro";
        else if (requests[0] && ["pending", "claimed"].includes(requests[0].status))
          outcome = requests[0].amountCents === cents ? "existing" : "conflict";
        else {
          const [recent] = await connection.execute(
            `SELECT COUNT(*) AS total FROM pro_requests
             WHERE profile_id = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 DAY`,
            [profile.id],
          );
          if (recent[0].total >= 3) outcome = "rate";
          else await connection.execute(
            "INSERT INTO pro_requests (id, profile_id, txid, amount_cents) VALUES (?, ?, ?, ?)",
            [randomUUID(), profile.id, newTxid(), cents],
          );
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally { connection.release(); }
      if (outcome === "pro") return json({ pro: true });
      if (outcome === "conflict")
        return json({ error: "Já existe um pedido aberto. Use o Pix exibido ou aguarde a análise." }, 409);
      if (outcome === "rate")
        return json({ error: "Limite de pedidos deste perfil atingido. Tente novamente amanhã." }, 429);
      if (outcome === "existing") return json(await present(profile.id));
      return json(await present(profile.id), 201);
    }
    if (body.action === "claim") {
      if (typeof body.requestId !== "string" || !/^[0-9a-f-]{36}$/.test(body.requestId))
        return json({ error: "Pedido inválido." }, 400);
      const reference = typeof body.payerReference === "string" ? body.payerReference.trim() : "";
      if (reference.length > 100 || !/^[\p{L}\p{N} ._:-]*$/u.test(reference))
        return json({ error: "Referência inválida." }, 400);
      const [result] = await database().execute(
        `UPDATE pro_requests SET status = 'claimed', payer_reference = ?, claimed_at = CURRENT_TIMESTAMP(3)
         WHERE id = ? AND profile_id = ? AND status = 'pending'`,
        [reference || null, body.requestId, profile.id],
      );
      if (!result.affectedRows) return json({ error: "Pedido não encontrado ou já analisado." }, 409);
      return json(await present(profile.id));
    }
    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    if (error instanceof SyntaxError || error.message?.includes("Contribuição") ||
        error.message?.includes("Dados Pix")) return json({ error: error.message || "Envio inválido." }, 400);
    console.error("Falha ao solicitar Premium:", error);
    return json({ error: "Pedido Premium indisponível." }, 503);
  }
}
