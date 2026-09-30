import { createHash } from "node:crypto";

export function json(value, status = 200) {
  return Response.json(value, { status, headers: {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  } });
}

export function database(context) {
  if (!context.env?.DB) throw new Error("Binding D1 DB não configurado.");
  return context.env.DB;
}

export async function readJson(request, maxLength) {
  const raw = await request.text();
  if (raw.length > maxLength) {
    const error = new Error("Envio muito grande.");
    error.status = 413;
    throw error;
  }
  try { return JSON.parse(raw); }
  catch {
    const error = new Error("JSON inválido.");
    error.status = 400;
    throw error;
  }
}

export const prepared = (db, sql, ...params) => db.prepare(sql).bind(...params);
export const first = (db, sql, ...params) => prepared(db, sql, ...params).first();
export async function rows(db, sql, ...params) {
  return (await prepared(db, sql, ...params).all()).results;
}

export function accessKeyHash(key) {
  return createHash("sha256").update(Buffer.from(key, "hex")).digest("hex");
}

export async function authorized(context) {
  const match = /^Bearer ([0-9a-f]{64})$/.exec(context.request.headers.get("authorization") || "");
  if (!match) return null;
  return first(database(context),
    "SELECT id, nickname, share_ranking AS shareRanking FROM synced_profiles WHERE access_key_hash = ?",
    accessKeyHash(match[1]));
}

export function publicError(error, fallback) {
  if (error.status) return json({ error: error.message }, error.status);
  if (/UNIQUE constraint failed/i.test(error.message || ""))
    return json({ error: "Identificador já existe." }, 409);
  console.error(fallback, error);
  return json({ error: fallback }, 503);
}
