/* Chave de acesso aleatória fica só no navegador; o servidor guarda o hash. */
(function () {
  "use strict";
  const validKey = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
  function newKey() {
    // A chave usa aleatoriedade criptográfica; não deriva do apelido.
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  async function request(method, key, body) {
    // A chave só vai no cabeçalho para a API de mesma origem.
    const response = await fetch("/api/profile", {
      method,
      headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json().catch(() => ({ error: "API de sincronização indisponível." }));
    if (!response.ok) throw new Error(result.error || "Sincronização indisponível.");
    return result;
  }
  async function proRequest(method, key, body, level) {
    const response = await fetch(`/api/pro${level ? `?level=${level}` : ""}`, {
      method,
      headers: { Authorization: `Bearer ${key}`,
        ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json().catch(() => ({ error: "API Premium indisponível." }));
    if (!response.ok) throw new Error(result.error || "API Premium indisponível.");
    return result;
  }
  window.FlowSync = Object.freeze({
    // Esta fachada mantém o restante da interface independente de fetch.
    validKey,
    newKey,
    create: (profile, key) => request("POST", null, {
      action: "create", id: profile.id, key, name: profile.name,
      shareRanking: profile.shareRanking === true,
    }),
    load: (key) => request("GET", key),
    sync: (profile, results, labs) => request("POST", profile.syncKey, {
      action: "sync", name: profile.name,
      shareRanking: profile.shareRanking === true, results, labs,
    }),
    attempt: (profile, body) => request("POST", profile.syncKey, {
      ...body, action: "attempt", shareRanking: profile.shareRanking === true,
    }),
    remove: (key) => request("DELETE", key),
    proStatus: (key) => proRequest("GET", key),
    proCreate: (key, amountCents) => proRequest("POST", key, { action: "create", amountCents }),
    proClaim: (key, requestId, payerReference) => proRequest("POST", key, { action: "claim", requestId, payerReference }),
    proQuestions: (key, level) => proRequest("GET", key, null, level),
  });
})();
