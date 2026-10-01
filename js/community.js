/* Salas e grupos usam perfis sincronizados. A faixa etária é opcional e privada. */
(function () {
  "use strict";
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&#39;" })[ch]);
  let activeCode = "", activeKind = "", timer = null, selected = "";
  let root, profile, quick;
  const key = () => profile?.syncKey;
  // Todas as ações coletivas enviam a chave do perfil para a mesma origem.
  async function api(method, body, query = "") {
    const response = await fetch(`/api/community${query}`, {
      method, headers: { Authorization: `Bearer ${key()}`,
        ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const value = await response.json().catch(() => ({ error: "API indisponível." }));
    if (!response.ok) throw new Error(value.error || "Não foi possível concluir.");
    return value;
  }
  const status = (message, error = false) => {
    const node = root.querySelector("#community-status");
    if (node) { node.textContent = message; node.dataset.error = String(error); }
  };
  async function act(body, after) {
    try { status("Aguarde…"); const value = await api("POST", body);
      status("Pronto."); if (after) await after(value); else await refresh(); }
    catch (error) { status(error.message, true); }
  }
  function shell() {
    root.innerHTML = `<div class="page-head"><div><p class="eyebrow">JOGAR E APRENDER JUNTO</p>
      <h1>Comunidade</h1><p>Pratique sozinho, dispute um duelo ou reúna a turma.</p></div></div>
      <p id="community-status" class="community-status" role="status" aria-live="polite"></p>
      <div id="community-content"></div>`;
  }
  function landing() {
    // Sem sincronização, a partida individual continua disponível.
    const area = root.querySelector("#community-content");
    area.innerHTML = `<div class="community-grid">
      <section class="panel"><span class="eyebrow">PARTIDA RÁPIDA</span><h2>Seu ritmo</h2>
        <p>Uma rodada individual para testar o que você já sabe.</p>
        <button id="quick-game" class="primary">Abrir quiz →</button></section>
      <section class="panel"><span class="eyebrow">DUELO E TURMA</span><h2>Salas ao vivo</h2>
        <p>O mestre escolhe as questões e avança a partida. Até 2 pessoas no duelo e 40 na coletiva.</p>
        <p>Ative um perfil sincronizado para entrar ou criar uma sala.</p></section>
      <section class="panel"><span class="eyebrow">GRUPOS DE ESTUDO</span><h2>Aprender em conjunto</h2>
        <p>Cada integrante vê seu progresso. O relatório da turma exige acesso docente aprovado.</p></section></div>`;
    area.querySelector("#quick-game").onclick = quick;
  }
  const options = (items, current) => items.map(([value, name]) =>
    `<option value="${esc(value)}" ${value === current ? "selected" : ""}>${esc(name)}</option>`).join("");
  function dashboard(value) {
    // Os formulários preservam a mesma API para criação e entrada por código.
    const area = root.querySelector("#community-content");
    area.innerHTML = `<div class="community-grid">
      <section class="panel"><h2>Partida rápida</h2><p>Jogue sozinho, sem precisar esperar a turma.</p>
        <button id="quick-game" class="primary">Abrir quiz →</button></section>
      <section class="panel"><h2>Criar sala</h2><form id="create-room" class="community-form">
        <label>Nome da sessão<input name="title" required minlength="2" maxlength="60" placeholder="Ex.: Revisão de comandos"></label>
        <label>Modo<select name="mode"><option value="duel">Duelo · 2 pessoas</option><option value="collective">Coletiva · até 40</option></select></label>
        <label>Assunto<select name="category"><option value="all">Todos os assuntos</option>${FlowData.categories.map((item) => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join("")}</select></label>
        <label>Questões<input name="count" type="number" value="10" min="2" max="20" required></label>
        <label>Tempo por questão<select name="seconds">${options([["0", "Sem cronômetro"], ["15", "15 segundos"], ["30", "30 segundos"], ["60", "1 minuto"], ["120", "2 minutos"]], "0")}</select></label>
        <button class="primary">Criar sala</button></form></section>
      <section class="panel"><h2>Entrar com código</h2><form id="join-room" class="community-form">
        <label>Código da sala<input name="code" required maxlength="12" minlength="12" autocapitalize="characters" placeholder="12 caracteres"></label>
        <button>Entrar na sala</button></form>
        <form id="join-group" class="community-form"><label>Código do grupo<input name="code" required maxlength="12" minlength="12" autocapitalize="characters" placeholder="12 caracteres"></label>
        <button>Entrar no grupo</button></form></section>
      <section class="panel"><h2>Grupo de estudo</h2><form id="create-group" class="community-form">
        <label>Nome do grupo<input name="title" required minlength="2" maxlength="60" placeholder="Ex.: Turma Linux"></label>
        <button>Criar grupo</button></form></section>
      <section class="panel"><h2>Seu personagem</h2><form id="personalize" class="community-form">
        <label>Mascote<select name="avatar">${options([["penguin", "Pinguim"], ["owl", "Coruja"], ["fox", "Raposa"], ["beaver", "Castor"], ["lynx", "Lince"]], value.personal.avatar)}</select></label>
        <label>Cor<select name="accent">${options([["lime", "Verde"], ["blue", "Azul"], ["amber", "Âmbar"], ["violet", "Violeta"], ["coral", "Coral"]], value.personal.accent)}</select></label>
        <label>Faixa etária · opcional<select name="ageBand">${options([["unspecified", "Prefiro não informar"], ["under13", "Até 12 anos"], ["13-15", "13 a 15 anos"], ["16-17", "16 ou 17 anos"], ["18plus", "18 anos ou mais"]], value.personal.ageBand)}</select></label>
        <p class="small muted">A faixa etária não aparece em salas, rankings ou relatórios.</p>
        <button>Salvar personagem</button></form></section></div>
      <section class="panel"><h2>Minhas salas</h2><div class="community-list">${value.rooms.length ? value.rooms.map((room) => `<button data-room="${esc(room.code)}">${esc(room.title)} · ${esc(room.status)} <small>${esc(room.code)}</small></button>`).join("") : "<p>Nenhuma sala ainda.</p>"}</div></section>
      <section class="panel"><h2>Meus grupos</h2><div class="community-list">${value.groups.length ? value.groups.map((group) => `<button data-group="${esc(group.code)}">${esc(group.title)} <small>${esc(group.code)}</small></button>`).join("") : "<p>Nenhum grupo ainda.</p>"}</div></section>`;
    area.querySelector("#quick-game").onclick = quick;
    function form(id, build, nextKind) {
      area.querySelector(id).onsubmit = (event) => {
        event.preventDefault();
        const fields = Object.fromEntries(new FormData(event.currentTarget));
        act(build(fields), async (result) => {
          if (nextKind) { activeKind = nextKind; activeCode = result.code; await refresh(); }
          else await overview();
        });
      };
    }
    form("#create-room", (f) => ({ action: "createRoom", title: f.title, mode: f.mode,
      category: f.category, count: Number(f.count), secondsPerQuestion: Number(f.seconds) }), "room");
    form("#join-room", (f) => ({ action: "joinRoom", code: f.code.trim().toUpperCase() }), "room");
    form("#create-group", (f) => ({ action: "createGroup", title: f.title }), "group");
    form("#join-group", (f) => ({ action: "joinGroup", code: f.code.trim().toUpperCase() }), "group");
    form("#personalize", (f) => ({ action: "personalize", ...f }));
    area.querySelectorAll("[data-room]").forEach((button) => button.onclick = () => {
      activeKind = "room"; activeCode = button.dataset.room; refresh(); });
    area.querySelectorAll("[data-group]").forEach((button) => button.onclick = () => {
      activeKind = "group"; activeCode = button.dataset.group; refresh(); });
  }
  function showRoom(value) {
    // O servidor define o estado; a tela não calcula acertos nem controla avanços.
    const { room, question, members, events } = value;
    const area = root.querySelector("#community-content");
    area.innerHTML = `<div class="community-top"><button id="community-back">← Comunidade</button>
      <span class="badge">${esc(room.mode === "duel" ? "Duelo" : "Coletiva")}</span></div>
      <section class="panel"><span class="eyebrow">SALA ${esc(room.code)}</span><h2>${esc(room.title)}</h2>
        <p>${room.status === "waiting" ? "Aguardando participantes" : room.status === "active" ? `Questão ${room.currentIndex + 1} de ${room.total}` : "Partida encerrada"}
        ${room.secondsPerQuestion ? ` · ${room.secondsPerQuestion}s por questão` : " · sem cronômetro"}</p>
        <p class="small muted">Compartilhe apenas o código com quem deseja convidar.</p>
        ${room.owner && room.status === "waiting" ? '<button id="room-start" class="primary">Iniciar partida</button>' : ""}
        ${room.owner && room.status === "active" ? '<div class="actions"><button id="room-next" class="primary">Próxima questão</button><button id="room-finish">Encerrar</button></div>' : ""}
      </section>
      ${question ? `<section class="panel"><p id="room-clock" class="eyebrow"></p>
        <h2>${esc(question.prompt)}</h2>${question.code ? `<pre><code>${esc(question.code)}</code></pre>` : ""}
        ${value.answered ? `<p class="community-result">Resposta registrada · ${value.ownCorrect ? "acerto" : "revise na próxima rodada"}</p>` :
        `<div class="community-options">${question.options.map((option, index) => `<button type="button" data-choice="${index}">${esc(option)}</button>`).join("")}</div>
        <button id="room-answer" class="primary" disabled>Confirmar resposta</button>`}</section>` : ""}
      <section class="panel"><h2>Placar</h2><ol class="community-score">${members.map((member) =>
        `<li><span><img src="assets/mascots/${esc(member.avatar)}.svg" alt="" class="community-avatar community-accent-${esc(member.accent)}">${esc(member.name)}</span><strong>${member.score} / ${room.total}</strong><small>${member.answered} respondidas</small></li>`).join("")}</ol></section>
      ${events ? `<section class="panel"><h2>Registro do mestre</h2><p class="small muted">Entradas, respostas, avanços e encerramento desta sessão.</p>
        <ol class="community-events">${(events || []).map((event) => `<li>${esc(event.date)} · ${esc(event.actor)} · ${esc(event.type)} ${esc(event.detail)}</li>`).join("")}</ol></section>` : ""}`;
    area.querySelector("#community-back").onclick = () => { activeCode = ""; overview(); };
    for (const [id, action] of [["room-start", "start"], ["room-next", "next"], ["room-finish", "finish"]]) {
      const button = area.querySelector(`#${id}`);
      if (button) button.onclick = () => act({ action, code: room.code });
    }
    area.querySelectorAll("[data-choice]").forEach((button) => button.onclick = () => {
      selected = question.options[Number(button.dataset.choice)];
      area.querySelectorAll("[data-choice]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      area.querySelector("#room-answer").disabled = false;
    });
    const answer = area.querySelector("#room-answer");
    if (answer) answer.onclick = () => act({ action: "answer", code: room.code,
      questionId: question.id, selected });
    const clock = area.querySelector("#room-clock");
    if (clock && room.deadlineAt) {
      const remaining = Math.max(0, Math.ceil((Date.parse(room.deadlineAt) - Date.now()) / 1000));
      clock.textContent = `${remaining}s restantes`;
      if (!remaining && answer) answer.disabled = true;
    }
  }
  function showGroup(value) {
    const { group, people, suggestions } = value;
    const area = root.querySelector("#community-content");
    area.innerHTML = `<div class="community-top"><button id="community-back">← Comunidade</button></div>
      <section class="panel"><span class="eyebrow">GRUPO ${esc(group.code)}</span><h2>${esc(group.title)}</h2>
      <p>Compartilhe o código somente com convidados. Os relatórios usam quizzes sincronizados e verificados.</p></section>
      <section class="panel"><h2>${group.canReview ? "Relatório de aprendizagem" : "Seu progresso no grupo"}</h2>
        <p>${value.summary.participants} participantes · ${value.summary.quizzes} ${group.canReview ? "quizzes do grupo" : "quizzes seus"} verificados</p>
        <div class="community-report">
        ${people.map((person) => `<article><strong>${esc(person.name)}</strong><span>${person.quizzes} quizzes · ${person.questions ? Math.round(100 * person.correct / person.questions) : 0}% de acertos</span></article>`).join("")}</div>
        <p class="small muted">Indicadores didáticos. O gabarito público não permite usar estes dados como avaliação oficial.</p></section>
      <section class="panel"><h2>Sugerir conteúdo</h2><form id="group-suggest" class="community-form">
        <label>O que devemos acrescentar?<textarea name="content" required minlength="10" maxlength="500" rows="3" placeholder="Ex.: mais exemplos de permissões"></textarea></label>
        <button class="primary">Enviar sugestão</button></form>
        <div class="community-list">${suggestions.map((item) => `<p><strong>${esc(item.author)}</strong> · ${esc(item.content)}</p>`).join("")}</div></section>`;
    area.querySelector("#community-back").onclick = () => { activeCode = ""; overview(); };
    area.querySelector("#group-suggest").onsubmit = (event) => {
      event.preventDefault();
      act({ action: "suggest", code: group.code,
        content: new FormData(event.currentTarget).get("content") });
    };
  }
  async function overview() {
    if (!root || location.hash !== "#comunidade") return;
    try { dashboard(await api("GET")); }
    catch (error) { status(error.message, true); }
  }
  async function refresh() {
    // A consulta periódica substitui tempo real enquanto não há canal persistente.
    if (!root || location.hash !== "#comunidade" || !activeCode) return;
    try {
      const value = await api("GET", null,
        `?${activeKind}=${encodeURIComponent(activeCode)}`);
      if (activeKind === "room") showRoom(value); else showGroup(value);
      status("");
    } catch (error) { status(error.message, true); }
  }
  function mount(target, currentProfile, quickGame) {
    // Ao sair da aba, o intervalo anterior é encerrado para poupar requisições.
    clearInterval(timer);
    root = target; profile = currentProfile; quick = quickGame;
    shell();
    if (!key()) { landing(); return; }
    activeCode = "";
    overview();
    timer = setInterval(() => {
      if (location.hash !== "#comunidade") { clearInterval(timer); return; }
      if (activeCode && activeKind === "room" &&
          !root.querySelector("#room-answer:not(:disabled)")) refresh();
    }, 3000);
  }
  window.FlowCommunity = Object.freeze({ mount });
})();
