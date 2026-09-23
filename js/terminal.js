/* Laboratório determinístico: não é shell, emulador Linux ou acesso ao host.
 * Somente comandos enumerados são aceitos. Não usamos eval, Function, exec,
 * rede, iframe ou subprocessos. Todos os caminhos pertencem à árvore em memória.
 * Cada missão reinicia o cenário para isolar efeitos entre exercícios. */
(function () {
  "use strict";
  const missions = [
    {
      title: "Encontre a estação",
      story:
        "Você acaba de entrar no laboratório. Descubra em qual diretório está.",
      hint: "Consulte o caminho de trabalho com pwd.",
      answer: "pwd",
      source: "Jonathan Eleodoro - Exercícios.pdf",
    },
    {
      title: "Organize a entrega",
      story: "Crie a pasta projeto, entre nela e crie o arquivo aula.txt.",
      hint: "Use mkdir projeto, depois cd projeto e touch aula.txt.",
      answer: "mkdir projeto → cd projeto → touch aula.txt",
      source: "_Aula 2 Comandos iniciais.pdf",
    },
    {
      title: "Leia o relatório",
      story:
        "O arquivo notas.txt está na pasta pessoal. Mostre o conteúdo para conferir a atividade.",
      hint: "Use cat notas.txt.",
      answer: "cat notas.txt",
      source: "_Aula 2 Comandos iniciais.pdf",
    },
    {
      title: "Ajuste o acesso",
      story:
        "relatorio.txt deve permitir leitura e escrita ao dono e somente leitura ao grupo. Outros não terão acesso.",
      hint: "Use chmod 640 relatorio.txt e confira com ls -l.",
      answer: "chmod 640 relatorio.txt",
      source: "Permissões de Usuários.pdf",
    },
    {
      title: "Inspecione a rede",
      story:
        "Consulte os endereços e a rota padrão desta estação. São duas verificações.",
      hint: "Use ip addr e ip route, em comandos separados.",
      answer: "ip addr → ip route",
      source:
        "Comandos de redes.pptx (1).pdf; Plano_de_Trabalho_Linux_2026.pdf",
    },
    {
      title: "Observe o tráfego",
      story:
        "A conexão entre as VMs será estudada. Configure a captura simulada somente de ICMP na interface eth0.",
      hint: "Use tcpdump -i eth0 icmp.",
      answer: "tcpdump -i eth0 icmp",
      source: "Comandos de redes.pptx (1).pdf",
    },
  ];
  function create(index = 0) {
    let cwd = "/home/aluno";
    const fs = new Map([
      ["/", { dir: true }],
      ["/home", { dir: true }],
      ["/home/aluno", { dir: true }],
      [
        "/home/aluno/notas.txt",
        {
          text: "Linux é prática.\nLeia, experimente e revise.\n",
          mode: "644",
        },
      ],
      [
        "/home/aluno/relatorio.txt",
        { text: "Relatório do laboratório.\n", mode: "666" },
      ],
    ]);
    const flags = new Set();
    function path(raw = ".") {
      const chunks = (raw.startsWith("/") ? raw : cwd + "/" + raw).split("/");
      const parts = [];
      for (const c of chunks) {
        if (!c || c === ".") continue;
        if (c === "..") parts.pop();
        else parts.push(c);
      }
      return "/" + parts.join("/");
    }
    function done() {
      return [
        flags.has("pwd"),
        fs.has("/home/aluno/projeto/aula.txt"),
        flags.has("cat"),
        fs.get("/home/aluno/relatorio.txt").mode === "640",
        flags.has("addr") && flags.has("route"),
        flags.has("capture"),
      ][index];
    }
    function run(raw) {
      if (typeof raw !== "string" || raw.length > 180)
        return { output: "Comando muito longo.", done: done() };
      const input = raw.trim().replace(/\s+/g, " ");
      if (!input) return { output: "Digite um comando ou help.", done: done() };
      const [cmd, ...args] = input.split(" ");
      let output = "";
      const target = path(args[0]);
      if (/[;&|<>`$]/.test(input))
        output =
          "Este laboratório aceita um comando simples por vez. Operadores são estudados no quiz.";
      else if (cmd === "help")
        output =
          "Comandos simulados: pwd, ls, ls -l, cd caminho, mkdir nome, touch arquivo, cat arquivo, chmod 640 arquivo, ip addr, ip route, tcpdump -i eth0 icmp, whoami, clear. Sem aspas, globbing ou pipes. Caminhos e saídas são fictícios.";
      else if (input === "clear")
        return { output: "", clear: true, done: done() };
      else if (input === "pwd") {
        output = cwd;
        flags.add("pwd");
      } else if (input === "whoami") output = "aluno";
      else if (
        cmd === "ls" &&
        (args.length === 0 || (args.length === 1 && args[0] === "-l"))
      ) {
        output =
          [...fs.entries()]
            .filter(
              ([p]) => p !== cwd && p.slice(0, p.lastIndexOf("/")) === cwd,
            )
            .map(
              ([p, v]) =>
                (args[0] === "-l"
                  ? `${v.dir ? "d" : "-"} ${v.mode || "755"} aluno laboratorio  `
                  : "") +
                p.split("/").pop() +
                (v.dir ? "/" : ""),
            )
            .join("\n") || "(diretório vazio)";
      } else if (cmd === "cd" && args.length === 1) {
        if (fs.get(target)?.dir) cwd = target;
        else output = "cd: diretório não encontrado.";
      } else if ((cmd === "mkdir" || cmd === "touch") && args.length === 1) {
        const parent = target.slice(0, target.lastIndexOf("/")) || "/";
        if (!fs.get(parent)?.dir) output = "Diretório pai não encontrado.";
        else if (fs.has(target)) {
          output = cmd === "mkdir" ? "mkdir: caminho já existe." : "";
        } else
          fs.set(
            target,
            cmd === "mkdir" ? { dir: true } : { text: "", mode: "644" },
          );
      } else if (cmd === "cat" && args.length === 1) {
        const f = fs.get(target);
        if (f && !f.dir) {
          output = f.text;
          if (target === "/home/aluno/notas.txt") flags.add("cat");
        } else output = "cat: arquivo não encontrado.";
      } else if (
        cmd === "chmod" &&
        args.length === 2 &&
        /^[0-7]{3}$/.test(args[0])
      ) {
        const f = fs.get(path(args[1]));
        if (f) f.mode = args[0];
        else output = "chmod: arquivo não encontrado.";
      } else if (["ip addr", "ip address", "ip address show"].includes(input)) {
        output =
          "eth0: UP\n    inet 192.168.1.20/24\nlo: UP\n    inet 127.0.0.1/8";
        flags.add("addr");
      } else if (input === "ip route") {
        output = "default via 192.168.1.1 dev eth0\n192.168.1.0/24 dev eth0";
        flags.add("route");
      } else if (input === "tcpdump -i eth0 icmp") {
        output =
          "Captura simulada:\n192.168.1.20 > 192.168.1.10: ICMP echo request\n192.168.1.10 > 192.168.1.20: ICMP echo reply\n2 pacotes fictícios. Nenhuma captura real.";
        flags.add("capture");
      } else
        output =
          "Comando ou argumentos não implementados. Digite help para consultar o escopo.";
      return { output, done: done(), cwd };
    }
    return {
      run,
      get cwd() {
        return cwd;
      },
      mission: missions[index],
    };
  }
  window.FlowTerminal = { create, missions };
})();
