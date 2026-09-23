/* Controlador de interface em JavaScript nativo.
 * O aplicativo tem uma única árvore de navegação e estado de rodada explícito.
 * Fontes e gabaritos são conteúdo público; um cliente estático não pode proteger
 * pontuações contra adulteração. Nunca trate este ranking como avaliação oficial.
 * Templates fixos usam HTML; toda entrada variável passa por escape ou textContent.
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const main = $("#main");
  const { categories, questions, manual } = FlowData;
  const core = FlowCore,
    store = FlowStore,
    cfg = FlowConfig;
  const levels = ["", "Fundamentos", "Aplicação", "Diagnóstico"];
  let setup = { category: "all", level: 1, count: 10 };
  let round = null,
    lastResult = null,
    terminal = null,
    missionIndex = 0,
    labCompleted = false;
  let toastTimer, audioContext;
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const uid = () =>
    globalThis.crypto?.randomUUID?.() ||
    "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  const user = () =>
    store.state.profiles.find((p) => p.id === store.state.current);
  const myResults = () =>
    store.state.results.filter((r) => r.userId === user()?.id);
  const categoryName = (id) =>
    categories.find((c) => c.id === id)?.name || "Todos os assuntos";
  const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR");
  function toast(message) {
    $("#toast").textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($("#toast").textContent = ""), 4500);
  }
  function save() {
    if (!store.save())
      toast(
        "O navegador não permitiu salvar. Seus dados continuam nesta sessão.",
      );
  }
  function button(text, fn, cls = "") {
    const b = document.createElement("button");
    b.textContent = text;
    b.className = cls;
    b.addEventListener("click", fn);
    return b;
  }
  function heading(label, title, description = "") {
    return `<div class="page-head"><div><p class="eyebrow">${esc(label)}</p><h1>${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ""}</div></div>`;
  }
  function applyPreferences() {
    document.documentElement.dataset.theme = store.state.theme;
    $("#theme").textContent =
      store.state.theme === "dark" ? "Tema claro" : "Tema escuro";
    $("#sound").textContent = store.state.sound ? "Som: sim" : "Som: não";
    $("#sound").setAttribute("aria-pressed", String(store.state.sound));
    $("#profile").textContent = user()?.name || "Criar perfil";
  }
  /** O áudio só é criado após um gesto explícito e respeita a preferência.
   * Osciladores curtos dispensam downloads, rastreadores e arquivos externos. */
  function beep(ok) {
    if (!store.state.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume();
      const oscillator = audioContext.createOscillator(),
        gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = ok ? 660 : 220;
      gain.gain.setValueAtTime(0.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.16,
      );
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.18);
    } catch {
      /* Áudio não é requisito para responder. */
    }
  }
  function navigate(view) {
    if (location.hash === "#" + view) render();
    else location.hash = view;
  }
  function requireUser() {
    if (user()) return true;
    openProfile();
    return false;
  }
  function openProfile() {
    if (round) {
      toast("Conclua ou encerre a rodada antes de trocar de perfil.");
      return;
    }
    $("#nickname").value = "";
    $("#remember").checked = store.persistent;
    $("#profile-error").textContent = "";
    const existing = $("#existing-profiles");
    existing.replaceChildren();
    if (store.state.profiles.length) {
      const p = document.createElement("p");
      p.textContent = "Ou continue com um perfil deste dispositivo:";
      existing.append(p);
      const list = document.createElement("div");
      list.className = "existing";
      store.state.profiles.forEach((p) =>
        list.append(
          button(p.name, () => {
            store.state.current = p.id;
            lastResult = null;
            save();
            $("#profile-dialog").close();
            applyPreferences();
            render();
          }),
        ),
      );
      existing.append(list);
    }
    $("#profile-dialog").showModal();
    $("#nickname").focus();
  }
  $("#profile").addEventListener("click", openProfile);
  $("#close-profile").addEventListener("click", () =>
    $("#profile-dialog").close(),
  );
  $("#profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#nickname").value.trim();
    if (!store.safeName(name)) {
      $("#profile-error").textContent = "Use entre 2 e 32 caracteres.";
      return;
    }
    let profile = store.state.profiles.find(
      (p) =>
        p.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"),
    );
    if (!profile) {
      if (store.state.profiles.length >= 30) {
        $("#profile-error").textContent =
          "Limite de 30 perfis neste dispositivo. Use um existente ou apague os dados em Sobre.";
        return;
      }
      profile = { id: uid(), name };
      store.state.profiles.push(profile);
    }
    store.state.current = profile.id;
    lastResult = null;
    const remembered = $("#remember").checked;
    const saved = store.permission(remembered);
    $("#profile-dialog").close();
    applyPreferences();
    render();
    toast(
      !saved
        ? "Perfil aberto nesta sessão. Não foi possível salvar."
        : remembered
          ? "Perfil salvo neste dispositivo."
          : "Perfil temporário criado.",
    );
  });
  $("#theme").addEventListener("click", () => {
    store.state.theme = store.state.theme === "dark" ? "light" : "dark";
    save();
    applyPreferences();
  });
  $("#sound").addEventListener("click", () => {
    store.state.sound = !store.state.sound;
    save();
    applyPreferences();
    beep(true);
  });
  function bestLevel() {
    return myResults()
      .filter(core.qualifies)
      .reduce((max, r) => Math.max(max, r.level), 0);
  }
  function dashboard() {
    const results = myResults();
    const total = results.reduce((n, r) => n + r.total, 0);
    const correct = results.reduce((n, r) => n + r.correct, 0);
    const mascot = core.mascot(bestLevel() || 1);
    main.innerHTML =
      heading(
        "Seu ponto de partida",
        "Pequenos comandos. Novas possibilidades.",
        "Escolha uma trilha, teste o que aprendeu e pratique no terminal simulado.",
      ) +
      `
    <div class="dashboard"><section class="panel welcome"><div class="welcome-top"><div><span class="badge green">${user() ? "Olá, " + esc(user().name) : "Seu laboratório está pronto"}</span><h2 class="welcome-title">O próximo comando<br>começa com você.</h2></div><span class="penguin" aria-hidden="true">${mascot.icon}</span></div><p>Do primeiro diretório ao diagnóstico de rede. Um quiz com explicações, espaço para errar e um caminho para evoluir.</p><div class="actions"><button id="start-home" class="primary">Começar um quiz ↗</button><button id="open-lab">Abrir o terminal</button></div><div class="stats"><div class="stat"><strong>${results.length}</strong><span>Quizzes concluídos</span></div><div class="stat"><strong>${total ? Math.round((correct * 100) / total) : 0}%</strong><span>Acerto acumulado</span></div><div class="stat"><strong>${new Set(results.filter(core.qualifies).map((r) => r.level)).size}/3</strong><span>Níveis certificados</span></div></div></section>
    <section class="panel"><div class="label-row"><h3>Seu mapa de evolução</h3><span class="badge">3 níveis</span></div><p class="small muted">Aproveitamento de 80% em um quiz geral com pelo menos 10 questões libera o certificado do nível.</p><div class="level-map">${[1, 2, 3].map((l) => `<div class="level-step"><span class="animal" aria-hidden="true">${core.mascot(l).icon}</span><div><strong>${levels[l]}</strong><p>${core.mascot(l).name}</p></div><span class="tag">${results.some((r) => r.level === l && core.qualifies(r)) ? "Conquistado" : "Disponível"}</span></div>`).join("")}</div><button id="view-achievements" class="text-button">Ver minhas conquistas →</button></section></div>
    <div class="section-heading"><h2>Escolha seu próximo passo</h2><span>9 trilhas · ${questions.length} questões</span></div><div class="cards">${categories
      .map((c) => {
        const attempts = results.filter((r) => r.category === c.id);
        const best = attempts.length
          ? Math.max(
              ...attempts.map((r) => Math.round((r.correct * 100) / r.total)),
            )
          : 0;
        return `<article class="panel track-card"><div class="label-row"><span class="track-number">/${c.number}</span><span class="badge">${questions.filter((q) => q.category === c.id).length} questões</span></div><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><progress value="${best}" max="100" aria-label="Melhor aproveitamento em ${esc(c.name)}"></progress><div class="foot"><span class="muted">${attempts.length ? "Melhor resultado: " + best + "%" : "Pronto para explorar"}</span><button class="text-button" data-track="${c.id}">Praticar →</button></div></article>`;
      })
      .join("")}</div>`;
    $("#start-home").onclick = () => {
      setup.category = "all";
      lastResult = null;
      navigate("quiz");
    };
    $("#open-lab").onclick = () => navigate("terminal");
    $("#view-achievements").onclick = () => navigate("conquistas");
    main.querySelectorAll("[data-track]").forEach(
      (b) =>
        (b.onclick = () => {
          setup.category = b.dataset.track;
          lastResult = null;
          navigate("quiz");
        }),
    );
  }
  function quizSetup() {
    main.innerHTML =
      heading(
        "Avaliação / escolha sua sessão",
        "O que vamos praticar?",
        "Escolha o assunto, o nível e a quantidade. Cada resposta vem acompanhada de uma explicação técnica.",
      ) +
      `
    <section class="panel setup"><form id="quiz-form"><div class="form-grid"><div><label for="category">Assunto</label><select id="category"><option value="all">Todos os assuntos</option>${categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div><div><label for="level">Dificuldade</label><select id="level">${[1, 2, 3].map((l) => `<option value="${l}">${levels[l]}</option>`).join("")}</select></div><div><label for="count">Quantidade de perguntas</label><select id="count"></select></div></div><p id="available" class="availability" aria-live="polite"></p><div class="callout"><strong>Uma rodada, novas combinações.</strong><br>As perguntas e as alternativas são embaralhadas. Não há repetição dentro da mesma rodada nem limite de tempo.</div><button class="primary" id="begin" type="submit">Iniciar quiz →</button></form></section>
    <section class="setup recommend"><h2>Três formas de avançar</h2><div class="flow-map"><div><strong>01 / Fundamentos</strong>Reconheça comandos e suas finalidades.</div><div><strong>02 / Aplicação</strong>Interprete opções, permissões e operações.</div><div><strong>03 / Diagnóstico</strong>Resolva cenários e avalie detalhes de administração.</div></div><p class="small muted">Processos e consultas DNS também aparecem no plano da disciplina. Consulte o professor sobre o recorte já trabalhado em aula.</p></section>`;
    $("#category").value = setup.category;
    $("#level").value = setup.level;
    function update() {
      setup.category = $("#category").value;
      setup.level = Number($("#level").value);
      const size = core.pool(questions, setup.category, setup.level).length;
      const old = setup.count;
      const choices = [...new Set([1, 3, 5, 10, 15, 20, size])]
        .filter((n) => n <= size && n > 0)
        .sort((a, b) => a - b);
      $("#count").innerHTML = choices
        .map(
          (n) =>
            `<option value="${n}">${n} ${n === 1 ? "pergunta" : "perguntas"}</option>`,
        )
        .join("");
      setup.count = choices.includes(old) ? old : choices.at(-1) || 0;
      $("#count").value = setup.count;
      $("#begin").disabled = !size;
      $("#available").textContent =
        `${size} questões disponíveis neste recorte. ${setup.category === "all" ? "Quiz geral: com 10 ou mais questões, vale para o certificado do nível." : "Quiz por assunto: treino focado, sem emissão de certificado."}`;
    }
    $("#category").onchange = update;
    $("#level").onchange = update;
    $("#count").onchange = () => (setup.count = Number($("#count").value));
    update();
    $("#quiz-form").onsubmit = (e) => {
      e.preventDefault();
      if (!requireUser()) return;
      round = {
        userId: user().id,
        settings: { ...setup },
        questions: core.session(
          questions,
          setup.category,
          setup.level,
          setup.count,
        ),
        index: 0,
        answers: [],
        selected: null,
        confirmed: false,
      };
      lastResult = null;
      quizQuestion();
    };
  }
  function quizQuestion() {
    if (!round) return quizSetup();
    const q = round.questions[round.index];
    main.innerHTML = `<div class="quiz-shell"><div class="page-head"><div><p class="eyebrow">${esc(categoryName(q.category))} / ${levels[round.settings.level]}</p><h1>Leia. Pense. Experimente.</h1></div><button id="quit">Encerrar</button></div><div class="quiz-meta"><span>Pergunta ${round.index + 1} de ${round.questions.length}</span><span>${round.answers.filter((a) => a.selected === a.question.answer).length} acertos</span></div><progress value="${round.index}" max="${round.questions.length}" aria-label="Progresso do quiz"></progress><section class="panel question-panel"><h2 id="question-title" tabindex="-1">${esc(q.prompt)}</h2>${q.code ? `<div class="code-block"><code>$ ${esc(q.code)}</code></div>` : ""}<div class="answers" role="group" aria-labelledby="question-title">${q.options.map((o, i) => `<button class="answer" data-answer="${i}" aria-pressed="false"><span class="letter" aria-hidden="true">${"ABCD"[i]}</span><span>${esc(o)}</span></button>`).join("")}</div><div id="feedback" aria-live="polite"></div><button id="confirm-answer" class="primary" disabled>Confirmar resposta</button></section></div>`;
    $("#quit").onclick = () => {
      if (
        confirm(
          "Encerrar esta rodada? Respostas parciais não entram no ranking.",
        )
      ) {
        round = null;
        quizSetup();
      }
    };
    const answerButtons = [...main.querySelectorAll("[data-answer]")];
    answerButtons.forEach(
      (b) =>
        (b.onclick = () => {
          if (round.confirmed) return;
          round.selected = q.options[Number(b.dataset.answer)];
          answerButtons.forEach((x) => {
            const selected = x === b;
            x.classList.toggle("selected", selected);
            x.setAttribute("aria-pressed", String(selected));
          });
          $("#confirm-answer").disabled = false;
        }),
    );
    // Reidrata a resposta já confirmada quando o aluno retorna de outra seção.
    // Não reaplica pontuação: a lista de respostas continua sendo a fonte única.
    if (round.confirmed) {
      const correct = round.selected === q.answer;
      answerButtons.forEach((b) => {
        const option = q.options[Number(b.dataset.answer)];
        b.disabled = true;
        b.setAttribute("aria-pressed", String(option === round.selected));
        if (option === q.answer) b.classList.add("correct");
        else if (option === round.selected) b.classList.add("wrong");
      });
      $("#feedback").innerHTML =
        `<div class="feedback ${correct ? "" : "wrong"}"><h3>${correct ? "Correto!" : "Ainda não. Vamos entender."}</h3><p><strong>Resposta:</strong> ${esc(q.answer)}</p><p>${esc(q.explanation)}</p><span class="source">Material-base: ${esc(q.source)}</span></div>`;
      $("#confirm-answer").disabled = false;
      $("#confirm-answer").textContent =
        round.index === round.questions.length - 1
          ? "Ver resultado →"
          : "Próxima pergunta →";
    } else if (round.selected !== null) {
      answerButtons.forEach((b) => {
        const selected = q.options[Number(b.dataset.answer)] === round.selected;
        b.classList.toggle("selected", selected);
        b.setAttribute("aria-pressed", String(selected));
      });
      $("#confirm-answer").disabled = false;
    }
    $("#confirm-answer").onclick = () => {
      if (!round.confirmed) {
        if (round.selected === null) return;
        round.confirmed = true;
        const correct = round.selected === q.answer;
        round.answers.push({ question: q, selected: round.selected });
        answerButtons.forEach((b) => {
          const option = q.options[Number(b.dataset.answer)];
          b.disabled = true;
          if (option === q.answer) b.classList.add("correct");
          else if (option === round.selected) b.classList.add("wrong");
        });
        $("#feedback").innerHTML =
          `<div class="feedback ${correct ? "" : "wrong"}"><h3>${correct ? "Correto!" : "Ainda não. Vamos entender."}</h3><p><strong>Resposta:</strong> ${esc(q.answer)}</p><p>${esc(q.explanation)}</p><span class="source">Material-base: ${esc(q.source)}</span></div>`;
        $("#confirm-answer").textContent =
          round.index === round.questions.length - 1
            ? "Ver resultado →"
            : "Próxima pergunta →";
        beep(correct);
      } else {
        round.index++;
        if (round.index >= round.questions.length) finishQuiz();
        else {
          round.selected = null;
          round.confirmed = false;
          quizQuestion();
          $("#question-title").focus();
        }
      }
    };
    $("#question-title").focus();
  }
  /** Grava somente uma rodada concluída. A referência é removida antes de exibir
   * o resultado, impedindo pontuação duplicada por cliques em botões anteriores. */
  function finishQuiz() {
    const summary = core.result(round.answers);
    const record = {
      id: uid(),
      userId: round.userId,
      level: round.settings.level,
      category: round.settings.category,
      total: summary.total,
      correct: summary.correct,
      date: new Date().toISOString(),
    };
    store.state.results.push(record);
    store.state.results = store.state.results.slice(-300);
    save();
    lastResult = { record, answers: round.answers };
    round = null;
    showResult();
  }
  function showResult() {
    const { record, answers } = lastResult;
    const summary = core.result(answers);
    const passed = core.qualifies(record);
    const weak = new Map();
    answers
      .filter((a) => a.selected !== a.question.answer)
      .forEach((a) =>
        weak.set(a.question.category, (weak.get(a.question.category) || 0) + 1),
      );
    const priority = [...weak].sort((a, b) => b[1] - a[1]).slice(0, 3);
    main.innerHTML =
      heading(
        "Rodada concluída",
        summary.percent >= 80
          ? "Bom trabalho. Continue avançando."
          : "Cada tentativa mostra um caminho.",
        "Seu resultado já está disponível no ranking deste navegador.",
      ) +
      `
    <section class="panel quiz-shell"><div class="score-grid">${[
      ["Perguntas", summary.total],
      ["Acertos", summary.correct],
      ["Erros", summary.errors],
      ["Aproveitamento", summary.percent + "%"],
    ]
      .map(
        ([label, v]) =>
          `<div class="score-cell"><strong>${v}</strong><span>${label}</span></div>`,
      )
      .join(
        "",
      )}</div><div class="callout">${passed ? `${core.mascot(record.level).icon} Certificado didático de ${levels[record.level].toLowerCase()} liberado.` : record.category !== "all" ? "Treino por assunto concluído. Para certificar um nível, faça um quiz geral com 10 ou mais questões e 80% de acertos." : "Para liberar o certificado, alcance pelo menos 80% em um quiz geral com 10 ou mais questões."}</div><div class="actions"><button id="retry" class="primary">Nova rodada</button><button id="result-ranking">Ver ranking</button>${passed ? '<button id="result-certificate">Ver certificado</button>' : ""}</div><section class="recommend"><h2>Seu próximo passo</h2>${priority.length ? "<p>Comece pelos assuntos com mais erros nesta rodada:</p>" : "<p>Você acertou todas. Experimente o próximo nível ou pratique uma missão no terminal.</p>"}<div class="actions">${priority.map(([c, n]) => `<button data-study="${c}">${esc(categoryName(c))} · ${n} ${n === 1 ? "erro" : "erros"}</button>`).join("")}<button id="result-lab">Praticar no terminal</button></div></section><section class="review recommend"><h2>Revisão da rodada</h2>${answers.map((a, i) => `<details><summary>${a.selected === a.question.answer ? "✓" : "×"} ${i + 1}. ${esc(a.question.prompt)}</summary><p>Sua resposta: ${esc(a.selected)}</p><p><strong>Resposta correta:</strong> ${esc(a.question.answer)}</p><p>${esc(a.question.explanation)}</p><span class="source">${esc(a.question.source)}</span></details>`).join("")}</section></section>`;
    $("#retry").onclick = () => {
      lastResult = null;
      quizSetup();
    };
    $("#result-ranking").onclick = () => navigate("ranking");
    $("#result-lab").onclick = () => navigate("terminal");
    if (passed)
      $("#result-certificate").onclick = () => showCertificate(record);
    main.querySelectorAll("[data-study]").forEach(
      (b) =>
        (b.onclick = () => {
          navigate("manual");
          setTimeout(() => {
            $("#manual-category").value = b.dataset.study;
            renderManualEntries();
          }, 0);
        }),
    );
  }
  function ranking() {
    main.innerHTML =
      heading(
        "Melhores resultados / neste dispositivo",
        "Uma boa prática merece registro.",
        "Uma melhor tentativa por perfil. Compare sessões do mesmo assunto, nível e quantidade de perguntas.",
      ) +
      `
    <section class="panel"><div class="filters"><div><label for="rank-category">Assunto</label><select id="rank-category"><option value="all">Todos os assuntos</option>${categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div><div><label for="rank-level">Nível</label><select id="rank-level">${[1, 2, 3].map((l) => `<option value="${l}">${levels[l]}</option>`).join("")}</select></div><div><label for="rank-count">Perguntas</label><select id="rank-count"></select></div></div><div id="rank-table"></div><p class="small muted recommend">Ranking local, atualizado ao concluir cada quiz. Em caso de empate, aparece primeiro o resultado concluído antes. Não há sincronização entre navegadores nem verificação contra adulteração.</p></section>`;
    if (lastResult) {
      $("#rank-category").value = lastResult.record.category;
      $("#rank-level").value = lastResult.record.level;
    }
    function counts() {
      const records = store.state.results.filter(
        (r) =>
          r.category === $("#rank-category").value &&
          r.level === Number($("#rank-level").value),
      );
      const values = [...new Set([10, ...records.map((r) => r.total)])].sort(
        (a, b) => a - b,
      );
      $("#rank-count").innerHTML = values
        .map((n) => `<option>${n}</option>`)
        .join("");
      if (lastResult && values.includes(lastResult.record.total))
        $("#rank-count").value = lastResult.record.total;
      table();
    }
    function table() {
      const records = FlowRanking(
        store.state.results.filter(
          (r) =>
            r.category === $("#rank-category").value &&
            r.level === Number($("#rank-level").value) &&
            r.total === Number($("#rank-count").value),
        ),
      );
      $("#rank-table").innerHTML = records.length
        ? `<div class="table-wrap"><table><thead><tr><th scope="col">Posição</th><th scope="col">Perfil</th><th scope="col">Acertos</th><th scope="col">Resultado</th><th scope="col">Data</th></tr></thead><tbody>${records.map((r, i) => `<tr><td>${String(i + 1).padStart(2, "0")}</td><td><strong>${esc(store.state.profiles.find((p) => p.id === r.userId)?.name || "Perfil removido")}</strong><br><span class="tiny">${core.mascot(r.level).icon} ${core.mascot(r.level).name}</span></td><td>${r.correct}/${r.total}</td><td>${Math.round((r.correct * 100) / r.total)}%</td><td>${fmtDate(r.date)}</td></tr>`).join("")}</tbody></table></div>`
        : '<div class="empty">Nenhum resultado neste recorte. Conclua um quiz para inaugurar o ranking.</div>';
    }
    $("#rank-category").onchange = counts;
    $("#rank-level").onchange = counts;
    $("#rank-count").onchange = table;
    counts();
  }
  function terminalView() {
    terminal = FlowTerminal.create(missionIndex);
    labCompleted = false;
    const mission = terminal.mission;
    main.innerHTML =
      heading(
        "Prática / terminal simulado",
        "Aprenda fazendo. Sem sair do navegador.",
        "Seis missões guiadas. Os comandos atuam apenas em um cenário fictício, sem acessar arquivos ou a rede do seu computador.",
      ) +
      `
    <div class="terminal-layout"><section class="panel"><h2>Missões do laboratório</h2><div class="mission-list">${FlowTerminal.missions.map((m, i) => `<button class="mission-button ${i === missionIndex ? "active" : ""}" data-mission="${i}"><span>${store.state.labs.some((l) => l.userId === user()?.id && l.mission === i) ? "✓" : String(i + 1).padStart(2, "0")}</span>${esc(m.title)}</button>`).join("")}</div></section><section><div class="mission-info"><h2>${missionIndex + 1}. ${esc(mission.title)}</h2><p>${esc(mission.story)}</p></div><div class="terminal-window"><div class="terminal-bar">aluno@linux-flow · cenário isolado em memória</div><div class="terminal-output" id="terminal-output" role="log" aria-live="polite" aria-label="Saída do terminal"><div class="entry">Bem-vindo ao laboratório. Digite help para ver os comandos disponíveis.</div></div><form class="terminal-form" id="terminal-form"><label for="command">$ <span class="sr-text">Comando</span></label><input id="command" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="180" placeholder="Digite um comando" required><button type="submit" class="primary">Executar</button></form></div><div id="mission-result" aria-live="polite"></div><details class="terminal-hint"><summary>Preciso de uma pista</summary><p>${esc(mission.hint)}</p></details><p class="source">Material-base: ${esc(mission.source)}</p><button id="restart-lab" class="text-button">Reiniciar esta missão</button></section></div>`;
    main.querySelectorAll("[data-mission]").forEach(
      (b) =>
        (b.onclick = () => {
          missionIndex = Number(b.dataset.mission);
          terminalView();
        }),
    );
    $("#restart-lab").onclick = terminalView;
    const history = [];
    let historyPosition = 0;
    $("#command").onkeydown = (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        historyPosition = Math.max(
          0,
          Math.min(
            history.length,
            historyPosition + (e.key === "ArrowUp" ? -1 : 1),
          ),
        );
        $("#command").value = history[historyPosition] || "";
      }
    };
    $("#terminal-form").onsubmit = (e) => {
      e.preventDefault();
      if (!requireUser()) return;
      const command = $("#command").value;
      history.push(command);
      historyPosition = history.length;
      const before = terminal.cwd;
      const result = terminal.run(command);
      const output = $("#terminal-output");
      if (result.clear) output.replaceChildren();
      else {
        const entry = document.createElement("div");
        entry.className = "entry";
        const prompt = document.createElement("div");
        prompt.className = "command";
        prompt.textContent = `aluno@linux-flow:${before}$ ${command}`;
        const response = document.createElement("div");
        response.textContent = result.output;
        entry.append(prompt, response);
        output.append(entry);
        while (output.childElementCount > 100)
          output.firstElementChild.remove();
      }
      $("#command").value = "";
      output.scrollTop = output.scrollHeight;
      $("#command").focus();
      if (result.done && !labCompleted) {
        labCompleted = true;
        if (
          !store.state.labs.some(
            (l) => l.userId === user().id && l.mission === missionIndex,
          )
        ) {
          store.state.labs.push({ userId: user().id, mission: missionIndex });
          save();
        }
        $("#mission-result").innerHTML =
          '<div class="callout"><strong>Missão cumprida!</strong><br>Você aplicou o comando ao cenário. Continue para a próxima missão.</div>';
        beep(true);
        if (missionIndex < 5)
          $("#mission-result").append(
            button(
              "Próxima missão →",
              () => {
                missionIndex++;
                terminalView();
              },
              "primary",
            ),
          );
      }
    };
  }
  function manualView() {
    main.innerHTML =
      heading(
        "Consulta / material das aulas",
        "A resposta também está no caminho.",
        "Pesquise comandos, compare distribuições e consulte explicações curtas antes de voltar à prática.",
      ) +
      `
    <details class="panel"><summary>Mapa de conceitos e distribuições</summary><div class="flow-map"><div><strong>Espaço de usuário</strong>Aplicações, shell e serviços.</div><div><strong>Kernel</strong>Gerencia memória, processos e dispositivos.</div><div><strong>Hardware</strong>CPU, discos e interfaces de rede.</div></div><div class="table-wrap"><table><thead><tr><th>Família</th><th>Exemplos do material</th><th>Pacotes e ferramentas</th></tr></thead><tbody><tr><td>Debian</td><td>Debian, Ubuntu, Linux Mint</td><td>DEB · dpkg · APT</td></tr><tr><td>Red Hat</td><td>Red Hat, Fedora, CentOS</td><td>RPM · rpm · yum / dnf, conforme versão</td></tr></tbody></table></div><p class="small muted">O shell reúne comandos comuns, mas gerenciadores, nomes de serviços e padrões podem variar entre distribuições. Não troque nomes de ferramentas presumindo que todas as opções serão iguais.</p><p class="source">Fontes: _Aula 2 Comandos iniciais.pdf; Apresentação sem título.pdf.</p></details>
    <div class="filters recommend"><div><label for="manual-search">Buscar no manual</label><input type="search" id="manual-search" placeholder="Ex.: chmod, ICMP, saída de erro"></div><div><label for="manual-category">Assunto</label><select id="manual-category"><option value="all">Todos os assuntos</option>${categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div></div><p id="manual-count" class="small muted" role="status"></p><div class="manual-grid" id="manual-entries"></div>`;
    $("#manual-search").oninput = renderManualEntries;
    $("#manual-category").onchange = renderManualEntries;
    renderManualEntries();
  }
  function renderManualEntries() {
    if (!$("#manual-search")) return;
    const term = $("#manual-search").value.toLocaleLowerCase("pt-BR");
    const cat = $("#manual-category").value;
    const entries = manual.filter(
      (m) =>
        (cat === "all" || m.category === cat) &&
        [m.command, m.action, m.explanation]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(term),
    );
    $("#manual-count").textContent = `${entries.length} entradas encontradas.`;
    $("#manual-entries").innerHTML = entries.length
      ? entries
          .map(
            (m) =>
              `<article class="panel manual-card"><span class="tiny">${esc(categoryName(m.category))}</span><h3>${esc(m.command)}</h3><p><strong>${esc(m.action)}.</strong> ${esc(m.explanation)}</p><div class="code-block"><code>${esc(m.example)}</code></div><p class="source no-margin">Material-base: ${esc(m.source)}</p></article>`,
          )
          .join("")
      : '<p class="empty">Nenhuma entrada encontrada. Tente outro termo ou remova o filtro.</p>';
  }
  function achievements() {
    const results = myResults();
    main.innerHTML =
      heading(
        "Seu percurso / conquistas",
        "Conhecimento que deixa uma marca.",
        "Os certificados são didáticos, emitidos por este projeto acadêmico. Não equivalem a certificações profissionais ou documentos oficiais da instituição.",
      ) +
      `<div class="cards">${[1, 2, 3]
        .map((l) => {
          const record = results
            .filter((r) => r.level === l && core.qualifies(r))
            .sort((a, b) => b.correct / b.total - a.correct / a.total)[0];
          return `<article class="certificate ${record ? "" : "locked"}"><span class="animal" aria-hidden="true">${core.mascot(l).icon}</span><p class="eyebrow">Nível ${l} / ${levels[l]}</p><h3>${core.mascot(l).name}</h3><p class="muted">${record ? "Conquistado em " + fmtDate(record.date) : "Conclua um quiz geral do nível, com pelo menos 10 questões e 80% de acertos."}</p>${record ? `<button class="primary" data-cert="${record.id}">Abrir certificado</button>` : `<button data-level="${l}">Praticar este nível</button>`}</article>`;
        })
        .join(
          "",
        )}</div><div class="callout">Missões concluídas: ${new Set(store.state.labs.filter((l) => l.userId === user()?.id).map((l) => l.mission)).size} de 6. As missões são prática complementar e não alteram a nota do quiz.</div>`;
    main
      .querySelectorAll("[data-cert]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            showCertificate(results.find((r) => r.id === b.dataset.cert))),
      );
    main.querySelectorAll("[data-level]").forEach(
      (b) =>
        (b.onclick = () => {
          setup = {
            category: "all",
            level: Number(b.dataset.level),
            count: 10,
          };
          lastResult = null;
          navigate("quiz");
        }),
    );
  }
  function showCertificate(record) {
    if (!record || record.userId !== user()?.id || !core.qualifies(record))
      return;
    main.innerHTML = `<div class="actions no-print"><button id="back-certs">← Conquistas</button><button id="print-cert" class="primary">Imprimir ou salvar como PDF</button></div><article class="certificate paper"><img src="assets/colegio.png" alt="Colégio Sinodal Progresso"><p class="eyebrow">Linux_Flow / ${cfg.year}</p><h1>Certificado didático de conclusão</h1><p>Registramos a conclusão do nível ${esc(levels[record.level].toLowerCase())} por</p><p class="recipient">${esc(user().name)}</p><p>${core.mascot(record.level).icon} ${esc(core.mascot(record.level).name)}</p><p>Quiz geral de Linux · ${record.total} questões · ${record.correct} acertos<br>Aproveitamento de ${Math.round((record.correct * 100) / record.total)}% · ${fmtDate(record.date)}</p><hr class="divider"><p>${esc(cfg.author)} · Projeto acadêmico<br>${esc(cfg.institution)} · ${esc(cfg.course)}</p><p class="small muted">Comprovante gerado localmente pelo Linux_Flow. Sem assinatura ou validação institucional.<br>Não equivale a uma certificação profissional. Sem carga horária atribuída.</p><p class="tiny">Registro local: ${esc(record.id)}</p></article>`;
    $("#back-certs").onclick = () => {
      if (location.hash === "#conquistas") achievements();
      else navigate("conquistas");
    };
    $("#print-cert").onclick = () => window.print();
  }
  function about() {
    main.innerHTML =
      heading(
        "Projeto / acesso e privacidade",
        "Feito para estudar. Fácil de compreender.",
        "Informações do projeto, funcionamento e controle dos dados deste dispositivo.",
      ) +
      `
    <div class="about-grid"><section class="panel"><div class="institution"><img src="assets/colegio.png" alt="Colégio Sinodal Progresso"><div><h2>${esc(cfg.institution)}</h2><p>${esc(cfg.course)} · ${cfg.year}</p></div></div><p><strong>Aluno:</strong> ${esc(cfg.author)}<br><strong>Disciplina:</strong> ${esc(cfg.subject)}<br><strong>Professor:</strong> ${esc(cfg.teacher)}</p><p>${esc(cfg.purpose)}</p><p><strong>Telefone:</strong> ${esc(cfg.phone || "Não informado")}<br><strong>E-mail:</strong> ${esc(cfg.email || "Não informado")}</p><p class="small muted">Marca institucional usada para identificar o contexto do trabalho acadêmico. A aplicação não representa um serviço oficial do colégio.</p></section>
    <section class="panel"><h2>Como funciona</h2><ol><li>Crie um perfil simples.</li><li>Escolha uma trilha ou um quiz geral.</li><li>Confirme uma alternativa e leia a explicação.</li><li>Revise o resultado, pratique e acompanhe suas conquistas.</li></ol><p>Som opcional, tema claro ou escuro e navegação por teclado. O terminal interpreta apenas os comandos listados em help.</p><p class="small muted">Funciona como site estático. Abrir index.html após extrair o ZIP também permite estudar sem conexão; a persistência em arquivos locais pode variar conforme o navegador.</p></section>
    <section class="panel"><h2>Acesso, cookies e dados locais</h2><p>O acesso é público. O perfil é um apelido, sem autenticação e sem senha. Qualquer pessoa neste dispositivo pode trocar de perfil e consultar os resultados.</p><p>O código da aplicação não usa cookies, analytics, publicidade nem envia respostas a servidores. Com sua escolha, usa localStorage para guardar apelido, pontuação, conquistas e preferências. Caso contrário, mantém tudo só na página aberta.</p><p>A hospedagem pode registrar acessos e dados técnicos conforme suas próprias políticas. Não informe dados sensíveis no apelido.</p><p>Retenção: até apagar os dados ou limpar o navegador; limite de 30 perfis e 300 resultados recentes. Não há recuperação após exclusão nem sincronização entre aparelhos.</p><label class="check"><input id="persist-setting" type="checkbox" ${store.persistent ? "checked" : ""}> Manter os dados neste dispositivo</label><button id="erase-data" class="danger">Apagar todos os dados locais</button></section>
    <section class="panel"><h2>Critérios de estudo</h2><p>Conteúdo derivado dos materiais enviados no ZIP, com a fonte em cada questão. Os exemplos de terminal usam dados fictícios.</p><p>Os três níveis têm acesso livre. Um quiz geral com pelo menos 10 questões e 80% de acertos libera o certificado daquele nível. Erros orientam a revisão por assunto.</p><p>O ranking é local e comparado por assunto, nível e quantidade. As respostas e pontuações ficam no cliente; não é uma plataforma de provas inviolável.</p><p class="small muted">Os PDFs originais não são publicados neste pacote. Consulte docs/fontes.md para o recorte, as adaptações e os tópicos ainda não cobertos.</p></section></div>`;
    $("#persist-setting").onchange = (e) => {
      if (!store.permission(e.target.checked)) {
        e.target.checked = false;
        toast("Não foi possível salvar. Mantido em memória.");
      } else
        toast(
          e.target.checked
            ? "Armazenamento local ativado."
            : "Cópia persistente removida. A sessão atual continua em memória.",
        );
    };
    $("#erase-data").onclick = () => {
      if (
        confirm(
          "Apagar todos os perfis, resultados, certificados e preferências deste navegador? Não é possível desfazer.",
        )
      ) {
        store.clear();
        round = null;
        lastResult = null;
        applyPreferences();
        about();
        toast("Dados locais apagados.");
      }
    };
  }
  /** Navegar para outra seção preserva uma rodada em memória. O botão Quiz a
   * retoma; mudar de perfil durante a rodada é bloqueado para manter autoria. */
  function render() {
    const view = location.hash.slice(1) || "trilhas";
    main.querySelectorAll("form").forEach((f) => f.reset());
    document.querySelectorAll("[data-view]").forEach((a) => {
      const active = a.dataset.view === view;
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    const views = {
      trilhas: dashboard,
      quiz: () =>
        round ? quizQuestion() : lastResult ? showResult() : quizSetup(),
      terminal: terminalView,
      ranking,
      manual: manualView,
      conquistas: achievements,
      sobre: about,
    };
    (views[view] || dashboard)();
    document.title = `Linux_Flow — ${{ trilhas: "Trilhas", quiz: "Quiz", terminal: "Terminal", ranking: "Ranking", manual: "Manual", conquistas: "Conquistas", sobre: "Sobre" }[view] || "Trilhas"}`;
    main.focus({ preventScroll: true });
  }
  // Uma API opcional de leitura usa as mesmas fontes da interface e nunca expõe
  // dados pessoais. Navegadores sem a API seguem o fluxo normal sem dependências.
  if (document.modelContext?.registerTool) {
    try {
      const controller = new AbortController();
      Promise.resolve(
        document.modelContext.registerTool(
          {
            name: "read_linux_flow_topics",
            title: "Consultar trilhas do Linux Flow",
            description:
              "Lê as trilhas disponíveis e quantidades por nível; não inicia nem responde quizzes.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute(input) {
              if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("Envie um objeto vazio.");
              return categories.map((c) => ({
                name: c.name,
                levels: [1, 2, 3].map((l) => ({
                  level: l,
                  count: core.pool(questions, c.id, l).length,
                })),
              }));
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
      window.addEventListener("pagehide", () => controller.abort(), {
        once: true,
      });
    } catch {
      /* API experimental: ausência não bloqueia a aplicação. */
    }
  }
  window.addEventListener("hashchange", render);
  window.addEventListener("beforeunload", (e) => {
    if (round) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  applyPreferences();
  render();
})();
