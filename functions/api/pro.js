import QRCode from "qrcode";
import pixCore from "../../server/pix-core.cjs";
import proData from "../../server/pro-data.cjs";
import { authorized, database, first, json, prepared, publicError, readJson } from "../../cloudflare/common.mjs";

const { payload, amountCents, newTxid } = pixCore;

function pixSettings(env) {
  const { PIX_KEY: key, PIX_RECEIVER_NAME: name, PIX_RECEIVER_CITY: city } = env;
  return key && name && city ? { key, name, city } : null;
}

async function status(db, profileId) {
  const [entitlement, request] = await Promise.all([
    first(db, "SELECT profile_id FROM pro_entitlements WHERE profile_id = ?", profileId),
    first(db, `SELECT id, txid, amount_cents AS amountCents, status,
      payer_reference AS payerReference, created_at AS createdAt
      FROM pro_requests WHERE profile_id = ? ORDER BY created_at DESC LIMIT 1`, profileId),
  ]);
  return { pro: Boolean(entitlement), request: request || null };
}

async function present(context, profileId) {
  const current = await status(database(context), profileId);
  const settings = pixSettings(context.env);
  if (!current.request || current.pro || current.request.status !== "pending" || !settings)
    return { ...current, paymentReady: Boolean(settings) };
  const copyPaste = payload({ ...settings, cents: current.request.amountCents,
    txid: current.request.txid });
  const qr = await QRCode.toDataURL(copyPaste,
    { errorCorrectionLevel: "M", margin: 3, width: 300 });
  return { ...current, paymentReady: true, receiver: settings.name,
    copyPaste, qr };
}

export async function onRequestGet(context) {
  try {
    const profile = await authorized(context);
    if (!profile) return json({ error: "Perfil sincronizado necessário." }, 401);
    const level = Number(new URL(context.request.url).searchParams.get("level"));
    if ([4, 5].includes(level)) {
      const current = await status(database(context), profile.id);
      if (!current.pro) return json({ error: "Acesso Premium não ativo." }, 403);
      return json({ questions: proData.questions.filter((question) => question.level === level) });
    }
    return json(await present(context, profile.id));
  } catch (error) { return publicError(error, "Consulta Premium indisponível."); }
}

export async function onRequestPost(context) {
  let body;
  try { body = await readJson(context.request, 2000); }
  catch (error) { return json({ error: error.message }, error.status || 400); }
  if (!body || typeof body !== "object") return json({ error: "Envio inválido." }, 400);
  try {
    const profile = await authorized(context);
    if (!profile) return json({ error: "Perfil sincronizado necessário." }, 401);
    const db = database(context);
    if (body.action === "create") {
      if (!pixSettings(context.env)) return json({ error: "Pix ainda não configurado." }, 503);
      const cents = amountCents(body.amountCents);
      const current = await status(db, profile.id);
      if (current.pro) return json({ pro: true });
      if (current.request && ["pending", "claimed"].includes(current.request.status)) {
        if (current.request.amountCents !== cents)
          return json({ error: "Já existe um pedido aberto. Use o Pix exibido ou aguarde a análise." }, 409);
        return json(await present(context, profile.id));
      }
      const recent = await first(db,
        `SELECT COUNT(*) AS total FROM pro_requests WHERE profile_id = ?
         AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')`, profile.id);
      if (recent.total >= 3)
        return json({ error: "Limite de pedidos deste perfil atingido. Tente novamente amanhã." }, 429);
      try {
        await prepared(db,
          "INSERT INTO pro_requests (id, profile_id, txid, amount_cents) VALUES (?, ?, ?, ?)",
          crypto.randomUUID(), profile.id, newTxid(), cents).run();
      } catch (error) {
        if (/UNIQUE constraint failed/i.test(error.message || ""))
          return json({ error: "Já existe um pedido aberto. Atualize a situação." }, 409);
        throw error;
      }
      return json(await present(context, profile.id), 201);
    }
    if (body.action === "claim") {
      if (typeof body.requestId !== "string" || !/^[0-9a-f-]{36}$/.test(body.requestId))
        return json({ error: "Pedido inválido." }, 400);
      const reference = typeof body.payerReference === "string" ? body.payerReference.trim() : "";
      if (reference.length > 100 || !/^[\p{L}\p{N} ._:-]*$/u.test(reference))
        return json({ error: "Referência inválida." }, 400);
      const result = await prepared(db,
        `UPDATE pro_requests SET status = 'claimed', payer_reference = ?,
         claimed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND profile_id = ? AND status = 'pending'`,
        reference || null, body.requestId, profile.id).run();
      if (!result.meta.changes)
        return json({ error: "Pedido não encontrado ou já analisado." }, 409);
      return json(await present(context, profile.id));
    }
    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    if (/Contribuição|Dados Pix/i.test(error.message || ""))
      return json({ error: error.message }, 400);
    return publicError(error, "Pedido Premium indisponível.");
  }
}
