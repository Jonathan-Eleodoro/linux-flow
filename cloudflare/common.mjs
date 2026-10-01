// Respostas da API não devem ser armazenadas pelo navegador ou por caches intermediários.
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

// Interrompe a leitura assim que ultrapassa o limite em bytes, inclusive sem Content-Length.
export async function readJson(request, maxBytes) {
  const tooLarge = () => {
    const error = new Error("Envio muito grande.");
    error.status = 413;
    return error;
  };
  const declaredSize = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > maxBytes) throw tooLarge();
  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  const parts = [];
  let bytes = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        try { await reader.cancel(); } catch { /* O limite continua sendo a causa da rejeição. */ }
        throw tooLarge();
      }
      parts.push(decoder.decode(value, { stream: true }));
    }
  }
  const raw = parts.join("") + decoder.decode();
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

export async function accessKeyHash(key) {
  // A chave hexadecimal é convertida em bytes antes do SHA-256.
  const bytes = Uint8Array.from(key.match(/.{2}/g), (part) => Number.parseInt(part, 16));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// O código de acesso é um segredo de posse; só seu hash é consultado no D1.
export async function authorized(context) {
  const match = /^Bearer ([0-9a-f]{64})$/.exec(context.request.headers.get("authorization") || "");
  if (!match) return null;
  return first(database(context),
    "SELECT id, nickname, share_ranking AS shareRanking FROM synced_profiles WHERE access_key_hash = ?",
    await accessKeyHash(match[1]));
}

// Falhas internas ficam nos logs do servidor; a resposta pública não expõe SQL.
export function publicError(error, fallback) {
  if (error.status) return json({ error: error.message }, error.status);
  if (/UNIQUE constraint failed/i.test(error.message || ""))
    return json({ error: "Identificador já existe." }, 409);
  console.error(fallback, error);
  return json({ error: fallback }, 503);
}
