/* Build estático com lista de permissão: a publicação recebe só os arquivos
 * necessários. Documentos internos, testes e os PDFs originais não são expostos. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "dist");
// dist é regenerado; nunca edite a saída nem copie código de servidor para ela.
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const name of ["index.html", "css", "js", "assets", "_headers", "_routes.json"]) {
  fs.cpSync(path.join(root, name), path.join(out, name), { recursive: true });
}
// Pages informa o SHA no build; o marcador público contém apenas esse ID do Git.
const commit = process.env.CF_PAGES_COMMIT_SHA;
if (/^[0-9a-f]{40}$/i.test(commit || ""))
  fs.writeFileSync(path.join(out, "deployment.json"),
    JSON.stringify({ commit: commit.toLowerCase() }) + "\n");
console.log("Build estático concluído em dist.");
