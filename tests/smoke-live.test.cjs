"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { originOf, run } = require("../scripts/smoke-live.cjs");

test("checagem pública aceita apenas origem HTTPS e nunca inclui credenciais", () => {
  assert.equal(originOf(), "https://linux-flow.pages.dev");
  assert.throws(() => originOf("https://user:secret@example.com"));
  assert.throws(() => originOf("https://example.com/api/health"));
  assert.throws(() => originOf("http://example.com"));
});

test("checagem pública exige API pronta e não expõe apelidos do ranking", async () => {
  const paths = [];
  const fetcher = async (url, options) => {
    paths.push([new URL(url).pathname, options.method]);
    if (url.endsWith("/api/health"))
      return Response.json({ status: "ready" });
    if (url.endsWith("/deployment.json"))
      return Response.json({ commit: "a".repeat(40) });
    if (url.includes("/api/ranking?"))
      return Response.json({ ranking: [{ nickname: "Pessoa Fictícia" }] });
    return new Response("<!doctype html>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  };
  const result = await run(undefined, fetcher);
  assert.equal(result.ready, true);
  assert.equal(result.results.length, 4);
  assert.deepEqual(paths, [["/", "GET"], ["/deployment.json", "GET"],
    ["/api/health", "GET"],
    ["/api/ranking", "GET"]]);
  assert.ok(!JSON.stringify(result).includes("Pessoa Fictícia"));

  const unavailable = await run(undefined, async (url) =>
    url.endsWith("/api/health") ? Response.json({ status: "unavailable" }, { status: 503 })
      : new Response("<!doctype html>", { headers: { "Content-Type": "text/html" } }));
  assert.equal(unavailable.ready, false);
  assert.equal(unavailable.results[2].status, 503);
  assert.equal(unavailable.results[3].ok, false);
});
