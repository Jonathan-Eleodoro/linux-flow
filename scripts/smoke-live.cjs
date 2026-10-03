"use strict";

// Verifica a publicação sem autenticar, criar perfis ou ler pontuações pessoais.
const defaultOrigin = "https://linux-flow.pages.dev";

function originOf(input) {
  const url = new URL(input || defaultOrigin);
  if (url.protocol !== "https:" || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash)
    throw new Error("Informe somente a origem HTTPS, sem caminho ou credenciais.");
  return url.origin;
}

async function probe(origin, path, inspect, fetcher = fetch) {
  try {
    const response = await fetcher(`${origin}${path}`, {
      method: "GET", signal: AbortSignal.timeout(10000),
      headers: { Accept: path === "/" ? "text/html" : "application/json" },
    });
    const result = await inspect(response);
    return { ok: result.ok, status: response.status, detail: result.detail };
  } catch {
    return { ok: false, status: null, detail: "Sem resposta em até 10 s." };
  }
}

async function run(input, fetcher = fetch) {
  const origin = originOf(input);
  const checks = [
    ["Site", "/", async (response) => ({
      ok: response.ok && (response.headers.get("content-type") || "").includes("text/html"),
      detail: response.ok ? "HTML publicado" : "Site indisponível",
    })],
    ["API", "/api/health", async (response) => {
      const body = await response.json().catch(() => null);
      return { ok: response.status === 200 && body?.status === "ready",
        detail: body?.status === "ready" ? "D1 pronto" : "D1 ou Function indisponível" };
    }],
    ["Ranking", "/api/ranking?category=all&level=1&total=10", async (response) => {
      const body = await response.json().catch(() => null);
      return { ok: response.status === 200 && Array.isArray(body?.ranking),
        detail: Array.isArray(body?.ranking)
          ? `${body.ranking.length} posição(ões), sem exibir apelidos`
          : "Leitura indisponível" };
    }],
  ];
  const results = [];
  for (const [name, path, inspect] of checks)
    results.push({ name, ...(await probe(origin, path, inspect, fetcher)) });
  return { origin, results, ready: results.every((item) => item.ok) };
}

if (require.main === module) {
  run(process.argv[2]).then(({ origin, results, ready }) => {
    console.log(`Linux Flow · ${origin}`);
    for (const item of results)
      console.log(`${item.ok ? "OK" : "FALHA"} · ${item.name} · ${item.status || "rede"} · ${item.detail}`);
    if (!ready) {
      console.log("Diagnóstico: guias-cloudflare/11-validacao-publica.html");
      process.exitCode = 1;
    }
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 2;
  });
}

module.exports = { originOf, probe, run };
