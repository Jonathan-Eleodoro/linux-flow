// O corpo JSON é limitado antes de ser armazenado por inteiro na Function.
const test = require("node:test");
const assert = require("node:assert/strict");

const bodyRequest = (stream, headers = {}) => new Request("https://example.pages.dev/api/test", {
  method: "POST", body: stream, duplex: "half", headers,
});

test("readJson interrompe o fluxo ao ultrapassar o limite em bytes", async () => {
  const { readJson } = await import("../cloudflare/common.mjs");
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"x":"'));
      controller.enqueue(new TextEncoder().encode("a".repeat(100)));
    },
    cancel() { cancelled = true; },
  });
  await assert.rejects(readJson(bodyRequest(stream), 20), { status: 413 });
  assert.equal(cancelled, true);
});

test("readJson decodifica Unicode dividido em blocos e rejeita JSON inválido", async () => {
  const { readJson } = await import("../cloudflare/common.mjs");
  const encoded = new TextEncoder().encode('{"nome":"Pinguim 🐧"}');
  const stream = new ReadableStream({
    start(controller) {
      for (const byte of encoded) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    },
  });
  assert.deepEqual(await readJson(bodyRequest(stream), encoded.length), { nome: "Pinguim 🐧" });
  await assert.rejects(readJson(new Request("https://example.pages.dev/api/test", {
    method: "POST", body: "{incompleto",
  }), 100), { status: 400 });
});

test("readJson rejeita Content-Length acima do limite antes da leitura", async () => {
  const { readJson } = await import("../cloudflare/common.mjs");
  const request = bodyRequest(new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode("{}"));
    controller.close();
  } }), { "Content-Length": "1000" });
  await assert.rejects(readJson(request, 10), { status: 413 });
});
