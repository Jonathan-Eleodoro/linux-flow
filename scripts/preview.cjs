/* Prévia local do frontend. Pages Functions e D1 não rodam neste servidor. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };

http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400).end(); return; }
  // A resolução e a checagem seguinte bloqueiam caminhos fora do projeto.
  const file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile() || !types[path.extname(file)]) {
      response.writeHead(404).end(); return;
    }
    response.writeHead(200, { "Content-Type": types[path.extname(file)] });
    fs.createReadStream(file).pipe(response);
  });
}).listen(4173, "127.0.0.1", () =>
  console.log("Prévia local: http://127.0.0.1:4173"),
);
