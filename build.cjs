/* Build estático com lista de permissão: a publicação recebe só os arquivos
 * necessários. Documentos internos, testes e os PDFs originais não são expostos. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "dist");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const name of ["index.html", "css", "js", "assets"]) {
  fs.cpSync(path.join(root, name), path.join(out, name), { recursive: true });
}
console.log("Build concluído em dist. Sem dependências externas.");
