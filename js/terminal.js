/* Laboratório em memória: nenhum comando chega ao sistema operacional. */
(function (root) {
  "use strict";
  const missions = [
    { title: "Localize seu ponto de partida", story: "Você recebeu uma estação nova. Descubra o caminho absoluto do diretório atual.", goal: "Consultar o diretório de trabalho.", hints: ["O comando deve apenas mostrar uma informação; não altere arquivos.", "Digite pwd e observe o caminho retornado."], choices: ["pwd", "whoami", "ls"], answer: "pwd" },
    { title: "Prepare a entrega", story: "Crie a pasta projeto dentro de sua pasta pessoal. Entre nela e crie aula.txt.", goal: "Ter /home/aluno/projeto/aula.txt no cenário.", hints: ["Crie a pasta antes de entrar nela.", "Execute, um por vez: mkdir projeto, cd projeto, touch aula.txt."], choices: ["mkdir projeto", "cd projeto", "touch aula.txt", "cat aula.txt"], answer: "mkdir projeto → cd projeto → touch aula.txt" },
    { title: "Leia antes de alterar", story: "O arquivo notas.txt contém orientações. Exiba seu conteúdo sem editá-lo.", goal: "Ler notas.txt.", hints: ["Use um comando de leitura de arquivo.", "Digite cat notas.txt."], choices: ["cat notas.txt", "touch notas.txt", "ls -l"], answer: "cat notas.txt" },
    { title: "Ajuste o acesso", story: "Em relatorio.txt, o dono precisa ler e escrever; o grupo, apenas ler; outros, nenhum acesso.", goal: "Definir a permissão 640 em relatorio.txt.", hints: ["Em notação octal, leitura vale 4 e escrita vale 2.", "Dono 6, grupo 4, outros 0: chmod 640 relatorio.txt. Confira com ls -l."], choices: ["ls -l", "chmod 640 relatorio.txt", "chmod 777 relatorio.txt"], answer: "chmod 640 relatorio.txt" },
    { title: "Inspecione a rede", story: "Antes de testar a conexão, identifique o endereço da interface e a rota padrão.", goal: "Consultar endereço e rotas.", hints: ["São duas consultas independentes.", "Execute ip addr e ip route em comandos separados."], choices: ["ip addr", "ip route", "ss -tuln"], answer: "ip addr → ip route" },
    { title: "Observe o tráfego", story: "Inspecione somente pacotes ICMP na interface eth0 deste cenário simulado.", goal: "Aplicar o filtro ICMP na captura fictícia.", hints: ["A captura precisa da interface e de um filtro.", "Digite tcpdump -i eth0 icmp. Nenhum pacote real é capturado."], choices: ["tcpdump -i eth0 icmp", "ip route", "ss -tuln"], answer: "tcpdump -i eth0 icmp" },
    { title: "Encontre arquivos ocultos", story: "A pasta pessoal contém uma configuração iniciada por ponto. Liste os arquivos, inclusive os ocultos.", goal: "Exibir .config no resultado.", hints: ["Uma listagem comum omite nomes iniciados por ponto.", "Use ls -a."], choices: ["ls", "ls -a", "ls -l"], answer: "ls -a" },
    { title: "Crie uma cópia segura", story: "Preserve notas.txt e crie uma cópia chamada notas-backup.txt na mesma pasta.", goal: "Manter os dois arquivos com o mesmo conteúdo.", hints: ["Você precisa copiar, não renomear.", "Use cp notas.txt notas-backup.txt e confira com ls."], choices: ["cp notas.txt notas-backup.txt", "mv notas.txt notas-backup.txt", "touch notas-backup.txt"], answer: "cp notas.txt notas-backup.txt" },
    { title: "Organize os nomes", story: "O arquivo rascunho.txt já está pronto. Renomeie-o para entrega.txt.", goal: "Encontrar entrega.txt e remover o nome antigo.", hints: ["Mover um arquivo para outro nome no mesmo diretório equivale a renomeá-lo.", "Use mv rascunho.txt entrega.txt."], choices: ["mv rascunho.txt entrega.txt", "cp rascunho.txt entrega.txt", "cat rascunho.txt"], answer: "mv rascunho.txt entrega.txt" },
    { title: "Localize uma linha", story: "Encontre as linhas que mencionam Linux em notas.txt.", goal: "Filtrar as linhas de notas.txt pelo texto Linux.", hints: ["Use uma busca de texto dentro do arquivo.", "Digite grep Linux notas.txt. A busca diferencia maiúsculas de minúsculas."], choices: ["grep Linux notas.txt", "cat notas.txt", "ls -a"], answer: "grep Linux notas.txt" },
    { title: "Observe processos", story: "Um serviço parece lento. Antes de qualquer intervenção, liste os processos deste cenário.", goal: "Consultar a tabela de processos simulados.", hints: ["Investigue antes de encerrar qualquer processo.", "Digite ps. A saída é fictícia e nenhuma tarefa real será afetada."], choices: ["ps", "whoami", "chmod 640 relatorio.txt"], answer: "ps" },
    { title: "Confira serviços de rede", story: "Verifique quais portas TCP e UDP aparecem como abertas ou em escuta.", goal: "Consultar os sockets simulados.", hints: ["Endereço da interface e rota não mostram portas de serviços.", "Digite ss -tuln. A saída é uma simulação local."], choices: ["ss -tuln", "ip addr", "ip route"], answer: "ss -tuln" },
  ];
  const references = [
    [{ label: "GNU Coreutils · pwd", url: "https://www.gnu.org/software/coreutils/manual/html_node/pwd-invocation.html" }],
    [
      { label: "GNU Coreutils · mkdir", url: "https://www.gnu.org/software/coreutils/manual/html_node/mkdir-invocation.html" },
      { label: "GNU Bash · cd", url: "https://www.gnu.org/software/bash/manual/html_node/Bourne-Shell-Builtins.html" },
      { label: "GNU Coreutils · touch", url: "https://www.gnu.org/software/coreutils/manual/html_node/touch-invocation.html" },
    ],
    [{ label: "GNU Coreutils · cat", url: "https://www.gnu.org/software/coreutils/manual/html_node/cat-invocation.html" }],
    [{ label: "GNU Coreutils · chmod", url: "https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html" }],
    [
      { label: "iproute2 · ip address(8)", url: "https://man7.org/linux/man-pages/man8/ip-address.8.html" },
      { label: "iproute2 · ip route(8)", url: "https://man7.org/linux/man-pages/man8/ip-route.8.html" },
    ],
    [{ label: "The Tcpdump Group · manual do tcpdump", url: "https://github.com/the-tcpdump-group/tcpdump/blob/master/tcpdump.1.in" }],
    [{ label: "GNU Coreutils · ls", url: "https://www.gnu.org/software/coreutils/manual/html_node/ls-invocation.html" }],
    [{ label: "GNU Coreutils · cp", url: "https://www.gnu.org/software/coreutils/manual/html_node/cp-invocation.html" }],
    [{ label: "GNU Coreutils · mv", url: "https://www.gnu.org/software/coreutils/manual/html_node/mv-invocation.html" }],
    [{ label: "GNU grep · manual de uso", url: "https://www.gnu.org/software/grep/manual/html_node/Invoking.html" }],
    [{ label: "procps-ng · ps(1)", url: "https://man7.org/linux/man-pages/man1/ps.1.html" }],
    [{ label: "iproute2 · ss(8)", url: "https://man7.org/linux/man-pages/man8/ss.8.html" }],
  ];
  missions.forEach((mission, index) => { mission.references = references[index]; });
  function create(index = 0) {
    if (!Number.isInteger(index) || index < 0 || index >= missions.length) throw new Error("Missão inválida.");
    let cwd = "/home/aluno";
    const fs = new Map([
      ["/", { dir: true }], ["/home", { dir: true }], ["/home/aluno", { dir: true }],
      ["/home/aluno/notas.txt", { text: "Linux é prática.\nLeia, experimente e revise.\n", mode: "644" }],
      ["/home/aluno/relatorio.txt", { text: "Relatório do laboratório.\n", mode: "666" }],
      ["/home/aluno/rascunho.txt", { text: "Entrega do laboratório.\n", mode: "644" }],
      ["/home/aluno/.config", { text: "tema=escuro\n", mode: "600" }],
    ]);
    const flags = new Set();
    function path(raw = ".") {
      const parts = [];
      for (const segment of (raw.startsWith("/") ? raw : cwd + "/" + raw).split("/")) {
        if (!segment || segment === ".") continue;
        if (segment === "..") parts.pop();
        else parts.push(segment);
      }
      return "/" + parts.join("/");
    }
    function done() {
      return [
        flags.has("pwd"), fs.has("/home/aluno/projeto/aula.txt"), flags.has("cat"),
        fs.get("/home/aluno/relatorio.txt").mode === "640",
        flags.has("addr") && flags.has("route"), flags.has("capture"),
        flags.has("hidden"), fs.get("/home/aluno/notas-backup.txt")?.text === fs.get("/home/aluno/notas.txt").text,
        fs.has("/home/aluno/entrega.txt") && !fs.has("/home/aluno/rascunho.txt"),
        flags.has("grep"), flags.has("ps"), flags.has("sockets"),
      ][index];
    }
    function run(raw) {
      if (typeof raw !== "string" || raw.length > 180) return { output: "Comando muito longo.", done: done(), cwd };
      const input = raw.trim().replace(/\s+/g, " ");
      if (!input) return { output: "Digite um comando ou help.", done: done(), cwd };
      if (/[;&|<>`$]/.test(input)) return { output: "Digite um comando simples por vez. Operadores não fazem parte deste simulador.", done: done(), cwd };
      const [cmd, ...args] = input.split(" ");
      let output = "";
      if (input === "help") output = "Comandos simulados: pwd, whoami, ls [-a|-l], cd, mkdir, touch, cat, cp, mv, grep, chmod, ip addr, ip route, tcpdump -i eth0 icmp, ps, ss -tuln, clear. Use um por vez. Caminhos e saídas são fictícios.";
      else if (input === "clear") return { output: "", clear: true, done: done(), cwd };
      else if (input === "pwd") { output = cwd; flags.add("pwd"); }
      else if (input === "whoami") output = "aluno";
      else if (cmd === "ls" && (args.length === 0 || (args.length === 1 && ["-a", "-l"].includes(args[0])))) {
        const entries = [...fs.entries()].filter(([p]) => p !== cwd && p.slice(0, p.lastIndexOf("/")) === cwd);
        output = entries.filter(([p]) => args[0] === "-a" || !p.split("/").pop().startsWith("."))
          .map(([p, v]) => `${args[0] === "-l" ? `${v.dir ? "d" : "-"} ${v.mode || "755"} aluno laboratorio  ` : ""}${p.split("/").pop()}${v.dir ? "/" : ""}`)
          .join("\n") || "(diretório vazio)";
        if (index === 6 && args[0] === "-a" && cwd === "/home/aluno") flags.add("hidden");
      } else if (cmd === "cd" && args.length === 1) {
        const target = path(args[0]);
        if (fs.get(target)?.dir) cwd = target;
        else output = "cd: diretório não encontrado.";
      } else if (["mkdir", "touch"].includes(cmd) && args.length === 1) {
        const target = path(args[0]);
        const parent = target.slice(0, target.lastIndexOf("/")) || "/";
        if (!fs.get(parent)?.dir) output = "Diretório pai não encontrado.";
        else if (fs.has(target)) output = cmd === "mkdir" ? "mkdir: caminho já existe." : "";
        else fs.set(target, cmd === "mkdir" ? { dir: true } : { text: "", mode: "644" });
      } else if (cmd === "cat" && args.length === 1) {
        const target = path(args[0]);
        const file = fs.get(target);
        if (file && !file.dir) { output = file.text; if (target === "/home/aluno/notas.txt") flags.add("cat"); }
        else output = "cat: arquivo não encontrado.";
      } else if (["cp", "mv"].includes(cmd) && args.length === 2) {
        const source = path(args[0]);
        const destination = path(args[1]);
        const parent = destination.slice(0, destination.lastIndexOf("/")) || "/";
        if (!fs.has(source) || fs.get(source).dir || !fs.get(parent)?.dir || fs.has(destination)) output = `${cmd}: origem ou destino inválido.`;
        else { fs.set(destination, { ...fs.get(source) }); if (cmd === "mv") fs.delete(source); }
      } else if (cmd === "grep" && args.length === 2) {
        const file = fs.get(path(args[1]));
        if (!file || file.dir) output = "grep: arquivo não encontrado.";
        else {
          output = file.text.split("\n").filter((line) => line.includes(args[0])).join("\n") || "(nenhuma linha encontrada)";
          if (args[0] === "Linux" && path(args[1]) === "/home/aluno/notas.txt") flags.add("grep");
        }
      } else if (cmd === "chmod" && args.length === 2 && /^[0-7]{3}$/.test(args[0])) {
        const file = fs.get(path(args[1]));
        if (file) file.mode = args[0];
        else output = "chmod: arquivo não encontrado.";
      } else if (["ip addr", "ip address", "ip address show"].includes(input)) {
        output = "eth0: UP\n    inet 192.168.1.20/24\nlo: UP\n    inet 127.0.0.1/8"; flags.add("addr");
      } else if (input === "ip route") {
        output = "default via 192.168.1.1 dev eth0\n192.168.1.0/24 dev eth0"; flags.add("route");
      } else if (input === "tcpdump -i eth0 icmp") {
        output = "Captura simulada:\n192.168.1.20 > 192.168.1.10: ICMP echo request\n192.168.1.10 > 192.168.1.20: ICMP echo reply\n2 pacotes fictícios. Nenhuma captura real."; flags.add("capture");
      } else if (input === "ps") { output = "PID  TTY   CMD\n101  pts/0 shell\n204  ?     nginx"; flags.add("ps"); }
      else if (input === "ss -tuln") { output = "Netid  State   Local Address:Port\ntcp    LISTEN  0.0.0.0:22\ntcp    LISTEN  127.0.0.1:80"; flags.add("sockets"); }
      else output = "Comando ou argumentos não implementados. Digite help para consultar o escopo.";
      return { output, done: done(), cwd };
    }
    return { run, get cwd() { return cwd; }, mission: missions[index] };
  }
  root.FlowTerminal = { create, missions };
})(typeof window === "undefined" ? globalThis : window);
