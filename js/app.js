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
  const { categories, questions, manual, lpiTopics, learningModules } = FlowData;
  const core = FlowCore,
    store = FlowStore,
    sync = FlowSync,
    cfg = FlowConfig;
  const tr = (source, values) => window.FlowI18n?.t(source, values) || source;
  const levels = ["", "Fundamentos", "Aplicação", "Diagnóstico", "Automação", "Arquitetura"];
  let setup = { category: "all", level: 1, count: 10 };
  let pendingManualSearch = "";
  let pendingSearchTerm = "";
  let lastRenderedView = "";
  const proQuestionCache = new Map();
  const previousQuizSessions = new Map();
  let round = null,
    lastResult = null,
    terminal = null,
    missionIndex = 0,
    labCompleted = false;
  let toastTimer, audioContext;
  let syncState = "local";
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
  const mascotArt = (level) =>
    `<img class="mascot-art" src="${core.mascot(level).src}" alt="" aria-hidden="true">`;
  const uid = () =>
    globalThis.crypto?.randomUUID?.() ||
    "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  const user = () =>
    store.state.profiles.find((p) => p.id === store.state.current);
  const myResults = () =>
    store.state.results.filter((r) => r.userId === user()?.id);
  const categoryName = (id) =>
    categories.find((c) => c.id === id)?.name || "Todos os assuntos";
  const fmtDate = (d) => new Date(d).toLocaleDateString(window.FlowI18n?.locale() || "pt-BR");
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
  function updateSyncStatus(state = syncState) {
    syncState = state;
    const status = $("#sync-status");
    const active = user();
    status.hidden = !active;
    const current = active?.syncKey ? state : "local";
    status.dataset.state = current;
    status.textContent = !active ? "" : active.temporary ? "Sessão livre" : !active.syncKey
      ? "Neste dispositivo" : ({ syncing: "Sincronizando", ready: "Nuvem atualizada",
        error: "Nuvem indisponível" })[current] || "Na nuvem";
    status.setAttribute("aria-label", `${status.textContent}. Abrir ajustes do perfil`);
  }
  $("#institution-address").textContent = cfg.institutionAddress;
  $("#project-contact").textContent = cfg.email;
  $("#project-contact").href = `mailto:${cfg.email}`;
  const GUIDE_KEY = "linux_flow.guide.v1";
  let guideMode = "ask", guideOpen = false, tourRoot = null, tourIndex = 0, tourTargets = [];
  const tourSteps = [
    { selector: ".brand", title: "Início", body: "Volte à apresentação inicial por aqui." },
    { selector: "#header-search-form", title: "Pesquisa", body: "Encontre comandos, trilhas, missões e objetivos." },
    { selector: '#sidebar [data-view="trilhas"]', title: "Menu de funções", body: "No computador, passe o mouse nos ícones para ver os nomes. No celular, use a barra inferior." },
    { selector: "#section-nav", title: "Opções da seção", body: "Aqui aparecem Quiz e Terminal em Trilhas, Conquistas em Ranking e Manual em Objetivos." },
    { selector: "#main > :first-child", title: "Conteúdo", body: "Esta área mostra a página escolhida e as atividades disponíveis." },
    { selector: "#profile", title: "Seu perfil", body: "Entre, crie um perfil ou continue livremente." },
    { selector: "#settings", title: "Configurações", body: "Altere tema, som e preferência do guia." },
  ];
  try { const saved = localStorage.getItem(GUIDE_KEY); if (["request", "always", "off"].includes(saved)) guideMode = saved; } catch {}
  function guide() {
    const target = $("#feature-guide");
    target.hidden = guideMode === "off" || Boolean(tourRoot);
    if (guideMode === "off") { target.innerHTML = ""; return; }
    if (guideMode === "request" && !guideOpen) {
      target.innerHTML = '<button type="button" data-guide-open aria-label="Abrir ajuda">? <span>Ajuda</span></button>';
    } else if (guideMode === "ask") {
      target.innerHTML = '<h2>Conheça o Linux_Flow</h2><p>Quer ajuda para encontrar as funções?</p><div class="guide-actions"><button type="button" data-guide-mode="request">Quando eu pedir</button><button type="button" data-guide-mode="always" class="primary">Sempre visível</button><button type="button" data-guide-mode="off">Dispensar</button></div>';
    } else {
      target.innerHTML = `<div class="guide-head"><strong>Ajuda</strong>${guideMode === "request" ? '<button type="button" data-guide-close aria-label="Fechar ajuda">×</button>' : ""}</div><p>Conheça as áreas da tela ou vá direto ao assunto.</p><button type="button" data-guide-tour class="primary">Iniciar passeio guiado</button><div class="guide-links"><a href="#trilhas">Trilhas e prática</a><a href="#ranking">Resultados</a><a href="#objetivos">Objetivos e manual</a><a href="#sobre">Perfil e dados</a></div><button type="button" data-guide-change class="text-button">Alterar preferência</button>`;
    }
    target.querySelectorAll("[data-guide-mode]").forEach((button) => button.onclick = () => {
      guideMode = button.dataset.guideMode;
      guideOpen = false;
      try { localStorage.setItem(GUIDE_KEY, guideMode); } catch {}
      guide();
    });
    const open = target.querySelector("[data-guide-open]");
    if (open) open.onclick = () => { guideOpen = true; guide(); };
    const close = target.querySelector("[data-guide-close]");
    if (close) close.onclick = () => { guideOpen = false; guide(); };
    const change = target.querySelector("[data-guide-change]");
    if (change) change.onclick = () => { guideMode = "ask"; guideOpen = false; guide(); };
    const tour = target.querySelector("[data-guide-tour]");
    if (tour) tour.onclick = startTour;
  }
  function stopTour() {
    if (!tourRoot) return;
    tourRoot.remove();
    tourRoot = null;
    guide();
  }
  function drawTour(moveFocus = true) {
    if (!tourRoot) return;
    const item = tourTargets[tourIndex];
    const target = document.querySelector(item.selector);
    if (!target) return stopTour();
    const rect = target.getBoundingClientRect();
    const highlight = tourRoot.querySelector(".tour-highlight");
    const bubble = tourRoot.querySelector(".tour-bubble");
    const left = Math.max(4, rect.left - 4);
    const top = Math.max(4, rect.top - 4);
    Object.assign(highlight.style, { left: `${left}px`, top: `${top}px`, width: `${Math.min(innerWidth - left - 4, rect.width + 8)}px`, height: `${Math.min(innerHeight - top - 4, rect.height + 8)}px` });
    if (bubble.dataset.step !== String(tourIndex)) {
      bubble.innerHTML = `<small>Área ${tourIndex + 1} de ${tourTargets.length}</small><strong>${item.title}</strong><p>${item.body}</p><div class="actions"><button type="button" data-tour-prev ${tourIndex === 0 ? "disabled" : ""}>Voltar</button><button type="button" data-tour-next class="primary">${tourIndex === tourTargets.length - 1 ? "Concluir" : "Próximo"}</button><button type="button" data-tour-close>Sair</button></div>`;
      bubble.dataset.step = String(tourIndex);
      bubble.querySelector("[data-tour-prev]").onclick = () => { tourIndex--; drawTour(); };
      bubble.querySelector("[data-tour-next]").onclick = () => { if (++tourIndex === tourTargets.length) stopTour(); else drawTour(); };
      bubble.querySelector("[data-tour-close]").onclick = stopTour;
    }
    const bubbleWidth = Math.min(290, innerWidth - 16);
    const bubbleLeft = Math.max(8, Math.min(rect.left, innerWidth - bubbleWidth - 8));
    const bubbleTop = rect.bottom + 190 < innerHeight ? rect.bottom + 12 : Math.max(8, rect.top - 194);
    Object.assign(bubble.style, { left: `${bubbleLeft}px`, top: `${Math.max(8, Math.min(bubbleTop, innerHeight - 190))}px` });
    if (moveFocus) bubble.querySelector("[data-tour-next]").focus();
  }
  function startTour() {
    stopTour();
    tourTargets = tourSteps.filter((step) => {
      const element = document.querySelector(step.selector);
      return element && getComputedStyle(element).display !== "none" && element.getBoundingClientRect().width > 0;
    });
    if (!tourTargets.length) return;
    tourIndex = 0;
    tourRoot = document.createElement("div");
    tourRoot.innerHTML = '<div class="tour-overlay"></div><div class="tour-highlight"></div><div class="tour-bubble" role="dialog" aria-label="Passeio pelas funcionalidades"></div>';
    document.body.append(tourRoot);
    guide();
    drawTour();
  }
  window.addEventListener("resize", () => { if (tourRoot) drawTour(false); });
  window.addEventListener("scroll", () => { if (tourRoot) drawTour(false); }, { passive: true });
  $("#guide-settings").onclick = () => { $("#settings").open = false; guideMode = "ask"; guideOpen = false; guide(); };
  function localProgress(profile) {
    return {
      results: store.state.results.filter((record) => record.userId === profile.id),
      labs: [...new Set(store.state.labs.filter((lab) => lab.userId === profile.id)
        .map((lab) => lab.mission))],
    };
  }
  function mergeProgress(profile, snapshot) {
    profile.pro = snapshot.profile?.pro === true;
    const known = new Set(store.state.results.map((record) => record.id));
    for (const record of snapshot.results) {
      if (!known.has(record.id)) {
        store.state.results.push({ ...record, userId: profile.id });
        known.add(record.id);
      }
    }
    store.state.results.sort((a, b) => a.date.localeCompare(b.date));
    store.state.results = store.state.results.slice(-300);
    for (const mission of snapshot.labs) {
      if (!store.state.labs.some((lab) => lab.userId === profile.id && lab.mission === mission))
        store.state.labs.push({ userId: profile.id, mission });
    }
    store.state.labs = store.state.labs.slice(-180);
    if (Array.isArray(snapshot.questionProgress)) {
      store.state.questionProgress = (store.state.questionProgress || [])
        .filter((item) => item.userId !== profile.id)
        .concat(snapshot.questionProgress.map((item) => ({ ...item, userId: profile.id })));
    }
    save();
    if (user()?.id === profile.id && !round && location.hash !== "#terminal") render();
  }
  async function syncProfile(profile) {
    if (!profile?.syncKey) return;
    if (user()?.id === profile.id) updateSyncStatus("syncing");
    try {
      const progress = localProgress(profile);
      const snapshot = await sync.sync(profile, progress.results, progress.labs);
      mergeProgress(profile, snapshot);
      if (user()?.id === profile.id) updateSyncStatus("ready");
    } catch (error) {
      if (user()?.id === profile.id) updateSyncStatus("error");
      throw error;
    }
  }
  function button(text, fn, cls = "") {
    const b = document.createElement("button");
    b.textContent = text;
    b.className = cls;
    b.addEventListener("click", fn);
    return b;
  }
  function heading(label, title, description = "") {
    return `<div class="page-head"><div><p class="eyebrow">${esc(tr(label))}</p><h1>${esc(tr(title))}</h1>${description ? `<p>${esc(tr(description))}</p>` : ""}</div></div>`;
  }
  function landing() {
    main.innerHTML = `<section class="landing-hero"><div class="landing-copy"><span class="eyebrow">APRENDA LINUX · ${cfg.year}</span><h1>Aprenda Linux com prática, contexto e progresso visível.</h1><p>Explore trilhas, resolva quizzes com explicações e experimente comandos em um terminal simulado. Comece gratuitamente, no seu ritmo.</p><div class="actions"><button id="landing-start" class="primary">Explorar trilhas →</button><button id="landing-quiz">Experimentar o quiz</button></div><div class="landing-metrics"><span><strong>3</strong> etapas Free</span><span><strong>12</strong> missões</span><span><strong>5</strong> mascotes</span></div></div><div class="landing-art" aria-hidden="true"><span class="landing-orbit orbit-one">${mascotArt(1)}</span><span class="landing-orbit orbit-two">${mascotArt(2)}</span><span class="landing-orbit orbit-three">${mascotArt(3)}</span><div class="landing-terminal"><span>aluno@linux-flow:~$</span><code>pwd</code><em>/home/aluno</em><code>_</code></div></div></section>
    <section class="landing-section"><div class="section-heading"><div><span class="eyebrow">SEU CAMINHO</span><h2>Escolha como começar</h2></div></div><div class="access-grid"><article class="panel access-card"><span class="access-number">01 / TEMPORÁRIO</span><h3>Estude nesta sessão</h3><p>Crie um apelido sem marcar o salvamento. Seu perfil e resultados ficam na memória e desaparecem ao fechar ou recarregar a página.</p><strong>Gratuito · sem conta</strong></article><article class="panel access-card"><span class="access-number">02 / SALVO</span><h3>Continue neste dispositivo</h3><p>Autorize o salvamento local para manter perfil, resultados e preferências neste navegador. Se quiser usar outro aparelho, ative a sincronização e guarde seu código de acesso.</p><strong>Gratuito · escolha opcional</strong></article><article class="panel access-card access-pro"><span class="access-number">03 / Premium</span><h3>Amplie a jornada</h3><p>Acesse Automação e Arquitetura com um perfil sincronizado e contribuição Pix a partir de R$ 9,90, após conferência e ativação manual.</p><strong>Ativação manual · sem assinatura automática</strong></article></div><div class="actions"><button id="landing-profile">Entrar</button><button id="landing-pro">Conhecer o Premium →</button></div></section>
    <section class="panel landing-bottom"><div><span class="eyebrow">COMO FUNCIONA</span><h2>Do conceito ao comando.</h2><p>Uma trilha apresenta o tema, o quiz explica cada resposta e o laboratório permite praticar em um cenário isolado. Acompanhe conquistas sem confundir certificados didáticos com credenciais oficiais.</p></div><div class="landing-links"><button id="landing-lab">Abrir terminal →</button><button id="landing-mascots">Conhecer mascotes →</button><button id="landing-suggestions">Enviar sugestão →</button><button id="landing-policy">Privacidade e LGPD →</button></div></section>`;
    $("#landing-start").onclick = () => navigate("trilhas");
    $("#landing-quiz").onclick = () => navigate("quiz");
    $("#landing-profile").onclick = openProfile;
    $("#landing-pro").onclick = () => navigate("pro");
    $("#landing-lab").onclick = () => navigate("terminal");
    $("#landing-mascots").onclick = () => navigate("mascotes");
    $("#landing-suggestions").onclick = () => navigate("sugestoes");
    $("#landing-policy").onclick = () => navigate("privacidade");
  }
  function privacyView() {
    main.innerHTML = heading("Transparência / LGPD", "Privacidade e controle dos seus dados.", "Saiba o que fica nesta sessão, neste dispositivo e na nuvem; escolha o que deseja publicar.") + `<div class="privacy-grid"><section class="panel"><h2>Quais dados usamos</h2><p>O quiz pode ser usado com um apelido, sem e-mail, CPF ou senha. Durante a sessão, guardamos em memória o perfil, respostas, resultados e missões. Ao escolher salvar neste dispositivo, esses dados, as preferências de tema e som e eventual código de acesso passam ao localStorage.</p><p>Ao ativar a sincronização, apelido, resultados, missões e progresso são enviados à API e guardados no banco D1 da Cloudflare. A API guarda apenas o hash do código de acesso. Quem possui o código pode abrir e alterar o perfil. Em Comunidade, o banco também guarda salas, respostas, placares, grupos, sugestões e uma faixa etária opcional. A faixa etária não é exibida aos demais.</p></section><section class="panel"><h2>Cookies e serviços externos</h2><p>Este aplicativo não cria cookies próprios, nem usa anúncios, rastreadores ou análise de uso. O aviso de armazenamento é lembrado somente nesta aba pelo sessionStorage. A hospedagem pode manter registros técnicos conforme suas políticas.</p><p>Compartilhar um resultado pelo sistema do aparelho ou por um link de rede social só acontece após seu clique; essa ação abre o serviço escolhido, sujeito à política dele.</p></section><section class="panel"><h2>Ranking e Premium</h2><p>O ranking compartilhado é opcional e publica apelido, assunto, nível, número de questões, acertos e data. Desativá-lo afeta novas rodadas; para remover as antigas da nuvem, apague o perfil sincronizado.</p><p>O Premium requer sincronização, pedido Pix e liberação manual. O site não coleta dados bancários nem confirma pagamentos automaticamente. Os resultados e certificados Premium são locais ou sincronizados; não entram no ranking público.</p></section><section class="panel"><h2>Suas escolhas</h2><p>Você pode usar uma sessão temporária, ativar ou desligar o armazenamento local, optar pelo ranking e apagar o perfil na nuvem. A tela Sobre reúne esses controles. A cópia local dura até você apagá-la ou limpar o navegador; apagar só a cópia local não remove a nuvem.</p><p>Para solicitações sobre dados, use ${cfg.email ? `<a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>` : "o contato do responsável pelo projeto informado na apresentação institucional"}. Consulte também a <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" rel="noopener noreferrer">LGPD</a> e o <a href="https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais" target="_blank" rel="noopener noreferrer">guia de cookies da ANPD</a>.</p><button id="privacy-controls" class="primary">Gerenciar meus dados →</button></section></div>`;
    main.querySelector(".privacy-grid").insertAdjacentHTML("beforeend", `<section class="panel"><h2>Sugestões identificadas</h2><p>O formulário solicita e-mail e comentário para análise e eventual resposta. Esses dados ficam privados no banco D1 da Cloudflare. Para solicitar acesso ou exclusão, escreva para <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>, informando o e-mail usado no envio.</p></section>`);
    $("#privacy-controls").onclick = () => navigate("sobre");
  }
  function searchView() {
    const items = [
      ...manual.map((entry) => ({ type: "Manual", title: entry.command,
        detail: `${entry.action}. ${entry.explanation}`, target: "manual", term: entry.command })),
      ...categories.map((entry) => ({ type: "Trilha", title: entry.name,
        detail: entry.description, target: "trilhas", category: entry.id })),
      ...FlowTerminal.missions.map((entry, index) => ({ type: "Terminal", title: entry.title,
        detail: `${entry.story} ${entry.goal}`, target: "terminal", mission: index })),
      ...lpiTopics.flatMap((topic) => topic.objectives.map((entry) => ({ type: "Objetivo LPI",
        title: entry.title || entry.name || entry.id, detail: `${topic.title} ${entry.description || ""}`,
        target: "objetivos" }))),
    ];
    const normalize = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    main.innerHTML = heading("Pesquisa / conteúdos", "Encontre o que você precisa.",
      "Pesquise comandos, assuntos, missões do terminal e objetivos de estudo.") +
      `<section class="panel search-panel"><label for="site-search">Pesquisar conteúdo</label><div class="search-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input id="site-search" type="search" autocomplete="off" placeholder="Ex.: chmod, rede, processos" /></div><p id="search-count" class="small muted" role="status"></p><div id="search-results" class="search-results"></div></section>`;
    const input = $("#site-search"), results = $("#search-results"), count = $("#search-count");
    input.value = pendingSearchTerm;
    pendingSearchTerm = "";
    input.oninput = () => {
      const term = normalize(input.value.trim());
      if (term.length < 2) {
        count.textContent = "Digite pelo menos duas letras para começar.";
        results.replaceChildren();
        return;
      }
      const matches = items.filter((item) => normalize(`${item.title} ${item.detail}`).includes(term)).slice(0, 40);
      count.textContent = `${matches.length}${matches.length === 40 ? "+" : ""} resultado(s).`;
      results.innerHTML = matches.length ? matches.map((item, index) =>
        `<button type="button" data-search-result="${index}" class="search-result"><span class="eyebrow">${esc(item.type)}</span><strong>${esc(item.title)}</strong><span>${esc(item.detail)}</span></button>`).join("")
        : '<p class="empty">Nada encontrado. Tente outro termo.</p>';
      results.querySelectorAll("[data-search-result]").forEach((button) => {
        button.onclick = () => {
          const item = matches[Number(button.dataset.searchResult)];
          if (item.term) pendingManualSearch = item.term;
          if (Number.isInteger(item.mission)) missionIndex = item.mission;
          navigate(item.target);
        };
      });
    };
    input.oninput();
  }
  function suggestionsView() {
    main.innerHTML = heading("Participação / sugestões", "Ajude a melhorar o Linux_Flow.",
      "Envie uma sugestão ou comentário identificado por seu e-mail.") +
      `<section class="panel suggestions-panel"><h2>Escreva para o projeto</h2><p>O comentário e o e-mail ficam privados para análise do responsável. Eles não aparecem no ranking nem em uma lista pública. Não envie senhas, códigos de acesso ou dados sensíveis.</p><form id="suggestion-form"><label for="suggestion-email">Seu e-mail</label><input id="suggestion-email" type="email" autocomplete="email" maxlength="254" required placeholder="voce@exemplo.com"><label for="suggestion-comment">Sugestão ou comentário</label><textarea id="suggestion-comment" minlength="10" maxlength="2000" rows="7" required placeholder="Conte o que poderia melhorar ou qual conteúdo gostaria de estudar."></textarea><label class="check"><input id="suggestion-agree" type="checkbox" required> Li o <a href="#privacidade">aviso de privacidade</a> e concordo com o envio do e-mail e comentário para resposta e avaliação.</label><div class="suggestion-trap" aria-hidden="true"><label for="suggestion-website">Deixe em branco</label><input id="suggestion-website" tabindex="-1" autocomplete="off"></div><button class="primary" type="submit">Enviar sugestão</button><p id="suggestion-status" role="status" aria-live="polite"></p></form><p class="small muted">Envios requerem a versão publicada com API e banco D1 configurados. Limite de três comentários por e-mail a cada 24 horas.</p></section>`;
    $("#suggestion-form").onsubmit = async (event) => {
      event.preventDefault();
      const button = $("#suggestion-form button[type=submit]");
      const status = $("#suggestion-status");
      button.disabled = true;
      status.textContent = "Enviando…";
      try {
        const response = await fetch("/api/feedback", { method: "POST",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({
            email: $("#suggestion-email").value, comment: $("#suggestion-comment").value,
            agree: $("#suggestion-agree").checked, website: $("#suggestion-website").value,
          }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Envio indisponível.");
        $("#suggestion-form").reset();
        status.textContent = "Sugestão recebida. Obrigado por contribuir.";
      } catch (error) { status.textContent = error.message || "Não foi possível enviar."; }
      finally { button.disabled = false; }
    };
  }
  $("#header-search-form").onsubmit = (event) => {
    event.preventDefault();
    pendingSearchTerm = $("#header-search").value.trim();
    navigate("pesquisa");
  };
  function dismissCookieNotice() {
    $("#cookie-banner").hidden = true;
    $("#cookie-dialog").close();
    try { sessionStorage.setItem("linux_flow.notice.v1", "seen"); } catch {}
  }
  $("#cookie-dismiss").onclick = dismissCookieNotice;
  $("#cookie-ok").onclick = dismissCookieNotice;
  $("#cookie-details").onclick = () => $("#cookie-dialog").showModal();
  $("#cookie-settings").onclick = () => $("#cookie-dialog").showModal();
  $("#close-cookie").onclick = () => $("#cookie-dialog").close();
  $("#cookie-go-policy").onclick = () => { $("#cookie-dialog").close(); navigate("privacidade"); };
  $("#cookie-policy").onclick = () => { $("#cookie-banner").hidden = true; navigate("privacidade"); };
  try { $("#cookie-banner").hidden = sessionStorage.getItem("linux_flow.notice.v1") === "seen"; } catch { $("#cookie-banner").hidden = false; }
  function applyPreferences() {
    document.documentElement.dataset.theme = store.state.theme;
    const dark = store.state.theme === "dark";
    const themeButton = $("#theme");
    const soundButton = $("#sound");
    themeButton.querySelector(".control-label").textContent = "Tema";
    themeButton.setAttribute("aria-pressed", String(dark));
    themeButton.setAttribute("aria-label", dark ? "Ativar modo claro" : "Ativar modo escuro");
    themeButton.title = dark ? "Ativar modo claro" : "Ativar modo escuro";
    soundButton.querySelector(".control-label").textContent = "Som";
    soundButton.setAttribute("aria-pressed", String(store.state.sound));
    soundButton.setAttribute("aria-label", store.state.sound ? "Desativar som" : "Ativar som");
    soundButton.title = store.state.sound ? "Desativar som" : "Ativar som";
    $("#profile").textContent = user()?.name || "Entrar";
    updateSyncStatus(user()?.syncKey ? "cloud" : "local");
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
  function setAccessMode(mode) {
    document.querySelectorAll("[data-access-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.accessPanel !== mode;
    });
    $("#profile-title").textContent = ({ choice: "Como deseja continuar?", login: "Entrar na sua conta", create: "Criar perfil", social: "Conectar conta" })[mode];
    $("#access-back").hidden = mode === "choice";
    if (mode === "create") $("#nickname").focus();
    else if (mode === "login") ($("#existing-profiles button") || $("#access-code")).focus();
    else if (mode === "social") $("#social-panel button:not(:disabled)")?.focus();
    else $("[data-access-panel=choice] button")?.focus();
  }
  function openProfile() {
    if (round) {
      toast("Conclua ou encerre a rodada antes de trocar de perfil.");
      return;
    }
    $("#nickname").value = "";
    $("#remember").checked = store.persistent;
    $("#share-ranking").checked = user()?.shareRanking === true;
    $("#profile-error").textContent = "";
    $("#import-error").textContent = "";
    const existing = $("#existing-profiles");
    existing.replaceChildren();
    if (store.state.profiles.length) {
      const p = document.createElement("p");
      p.textContent = "Perfis deste dispositivo:";
      existing.append(p);
      const list = document.createElement("div");
      list.className = "existing";
      store.state.profiles.forEach((p) =>
        list.append(
          button(`${p.name} · ${p.temporary ? "Sessão livre" : p.syncKey ? "Nuvem" : "Local"}`, () => {
            store.state.current = p.id;
            proQuestionCache.clear();
            $("#share-ranking").checked = p.shareRanking === true;
            lastResult = null;
            save();
            $("#profile-dialog").close();
            applyPreferences();
            render();
            syncProfile(p).catch(() => toast("Sincronização indisponível. Seu progresso local continua salvo."));
          }),
        ),
      );
      existing.append(list);
    }
    $("#profile-dialog").showModal();
    setAccessMode("choice");
  }
  $("#profile").addEventListener("click", openProfile);
  document.querySelectorAll("[data-access-mode]").forEach((button) => {
    button.addEventListener("click", () => setAccessMode(button.dataset.accessMode));
  });
  $("#access-back").onclick = () => setAccessMode("choice");
  $("#continue-free").onclick = () => {
    let guest = store.state.profiles.find((profile) => profile.temporary && profile.name === "Visitante");
    if (!guest) {
      guest = { id: uid(), name: "Visitante", temporary: true, shareRanking: false };
      store.state.profiles.push(guest);
    }
    store.state.current = guest.id;
    lastResult = null;
    proQuestionCache.clear();
    save();
    $("#profile-dialog").close();
    applyPreferences();
    render();
    toast("Sessão livre iniciada. O progresso do visitante não será salvo ao sair.");
  };
  $("#sync-status").addEventListener("click", () => navigate("sobre"));
  $("#close-profile").addEventListener("click", () =>
    $("#profile-dialog").close(),
  );
  $("#import-profile").addEventListener("click", async () => {
    const key = $("#access-code").value.trim().toLowerCase();
    if (!sync.validKey(key)) {
      $("#import-error").textContent = "Cole um código de 64 caracteres válido.";
      return;
    }
    $("#import-error").textContent = "Buscando perfil…";
    try {
      const snapshot = await sync.load(key);
      let profile = store.state.profiles.find((p) => p.id === snapshot.profile.id);
      if (!profile && store.state.profiles.length >= 30)
        throw new Error("Limite de 30 perfis neste dispositivo.");
      if (!profile) {
        profile = { id: snapshot.profile.id };
        store.state.profiles.push(profile);
      }
      profile.name = snapshot.profile.name;
      profile.shareRanking = snapshot.profile.shareRanking;
      profile.pro = snapshot.profile.pro === true;
      profile.syncKey = key;
      store.state.current = profile.id;
      proQuestionCache.clear();
      store.permission(true);
      mergeProgress(profile, snapshot);
      $("#access-code").value = "";
      $("#profile-dialog").close();
      applyPreferences();
      render();
      toast("Perfil e progresso carregados da nuvem.");
    } catch (error) {
      $("#import-error").textContent = error.message;
    }
  });
  $("#profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#nickname").value.trim();
    if (!store.safeName(name)) {
      $("#profile-error").textContent = "Use entre 2 e 32 caracteres.";
      return;
    }
    const existingProfile = store.state.profiles.find(
      (p) =>
        p.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"),
    );
    if (existingProfile) {
      $("#profile-error").textContent = "Esse apelido já existe neste dispositivo. Use Entrar para continuar com ele.";
      return;
    }
    if (store.state.profiles.filter((profile) => !profile.temporary).length >= 30) {
      $("#profile-error").textContent = "Limite de 30 perfis neste dispositivo. Use um existente ou apague os dados em Sobre.";
      return;
    }
    const remembered = $("#remember").checked;
    const profile = { id: uid(), name, temporary: !remembered };
    store.state.profiles.push(profile);
    store.state.current = profile.id;
    proQuestionCache.clear();
    profile.shareRanking = $("#share-ranking").checked;
    lastResult = null;
    const saved = remembered ? store.permission(true) : store.save();
    $("#profile-dialog").close();
    applyPreferences();
    render();
    syncProfile(profile).catch(() => toast("Sincronização indisponível. Seu progresso local continua salvo."));
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
  document.addEventListener("pointerdown", (event) => {
    if (!$("#settings").contains(event.target)) $("#settings").open = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { $("#settings").open = false; stopTour(); }
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
    main.innerHTML =
      heading(
        "Trilhas de estudo",
        "Escolha o que estudar.",
        "Aprenda por tema e pratique no quiz ou no terminal.",
      ) +
      `
    <div class="dashboard"><section class="panel welcome"><div class="welcome-top"><div><span class="badge green">${user() ? "Olá, " + esc(user().name) : "Comece por aqui"}</span><h2 class="welcome-title">Aprenda. Pratique.<br>Evolua.</h2></div><span class="penguin" aria-hidden="true">${mascotArt(bestLevel() || 1)}</span></div><p>Escolha um assunto ou pratique livremente.</p><div class="actions"><button id="start-home" class="primary">Abrir quiz ↗</button><button id="open-lab">Abrir terminal</button></div><div class="stats"><div class="stat"><strong>${results.length}</strong><span>Quizzes concluídos</span></div><div class="stat"><strong>${total ? Math.round((correct * 100) / total) : 0}%</strong><span>Acerto acumulado</span></div><div class="stat"><strong>${new Set(results.filter(core.qualifies).map((r) => r.level)).size}/${user()?.pro ? 5 : 3}</strong><span>Níveis certificados</span></div></div></section>
    <section class="panel"><div class="label-row"><h3>Seu mapa de evolução</h3><span class="badge">${esc(tr("{count} níveis", { count: user()?.pro ? 5 : 3 }))}</span></div><p class="small muted">Aproveitamento de 80% em um quiz geral com pelo menos 10 questões libera o certificado do nível.</p><div class="level-map">${[1, 2, 3, ...(user()?.pro ? [4, 5] : [])].map((l) => `<div class="level-step"><span class="animal" aria-hidden="true">${mascotArt(l)}</span><div><strong>${esc(tr(levels[l]))}</strong><p>${esc(tr(core.mascot(l).name))}</p></div><span class="tag">${esc(tr(results.some((r) => r.level === l && core.qualifies(r)) ? "Conquistado" : "Disponível"))}</span></div>`).join("")}</div><button id="view-achievements" class="text-button">Ver minhas conquistas →</button></section></div>
    <section class="panel cloud-card"><div class="cloud-symbol" aria-hidden="true">↗</div><div><span class="eyebrow">Seu progresso</span><h2>${user()?.syncKey ? "Continue de onde parou, em qualquer aparelho." : user() ? "Leve seu progresso com você." : "Crie seu espaço de estudo."}</h2><p>${user()?.syncKey ? "Resultados e missões deste perfil podem ser recuperados com seu código de acesso." : user() ? "Ative a sincronização para guardar resultados e missões na nuvem e continuar em outro aparelho." : "Use um apelido para acompanhar quizzes, missões e conquistas."}</p></div><button id="cloud-action" class="cloud-action">${user()?.syncKey ? "Ver sincronização" : user() ? "Ativar sincronização" : "Entrar"} →</button></section>
    <section class="panel learning-feature"><div><span class="eyebrow">NOVAS JORNADAS · Free</span><h2>Entenda a origem. Planeje a instalação.</h2><p>Descubra como o sistema se formou e ensaie decisões de instalação em segurança. Cada marco traz uma escolha, uma explicação e uma nova chance.</p></div><div class="actions"><button id="feature-history" class="primary">Explorar a história →</button><button id="feature-install">Simular instalação →</button></div></section>
    <div class="section-heading"><h2>${esc(tr("Escolha seu próximo passo"))}</h2><span>${esc(tr("{tracks} trilhas · {questions} questões", { tracks: categories.length, questions: questions.length }))}</span></div><div class="cards">${categories
      .map((c) => {
        const attempts = results.filter((r) => r.category === c.id);
        const best = attempts.length
          ? Math.max(
              ...attempts.map((r) => Math.round((r.correct * 100) / r.total)),
            )
          : 0;
        return `<article class="panel track-card"><div class="label-row"><span class="track-number">/${c.number}</span><span class="badge">${esc(tr("{count} questões", { count: questions.filter((q) => q.category === c.id).length }))}</span></div><h3>${esc(tr(c.name))}</h3><p>${esc(tr(c.description))}</p><progress value="${best}" max="100" aria-label="${esc(tr("Melhor aproveitamento em {category}", { category: tr(c.name) }))}"></progress><div class="foot"><span class="muted">${esc(attempts.length ? tr("Melhor resultado: {score}%", { score: best }) : tr("Pronto para explorar"))}</span><button class="text-button" data-track="${c.id}">${esc(tr(learningModules[c.id] ? "Explorar →" : "Praticar →"))}</button></div></article>`;
      })
      .join("")}</div>`;
    $("#start-home").onclick = () => {
      setup.category = "all";
      lastResult = null;
      navigate("quiz");
    };
    $("#open-lab").onclick = () => navigate("terminal");
    $("#feature-history").onclick = () => navigate("aprender-historia");
    $("#feature-install").onclick = () => navigate("aprender-instalacao");
    $("#view-achievements").onclick = () => navigate("conquistas");
    $("#view-achievements").insertAdjacentElement("afterend",
      button("Conhecer os mascotes →", () => navigate("mascotes"), "text-button"));
    $("#cloud-action").onclick = () => user() ? navigate("sobre") : openProfile();
    main.querySelectorAll("[data-track]").forEach(
      (b) =>
        (b.onclick = () => {
          setup.category = b.dataset.track;
          lastResult = null;
          navigate(learningModules[b.dataset.track] ? `aprender-${b.dataset.track}` : "quiz");
        }),
    );
  }
  function learningView(id) {
    const module = learningModules[id];
    if (!module) return dashboard();
    let stepIndex = 0;
    let mistakes = 0;
    let answered = false;
    const renderStep = () => {
      const step = module.steps[stepIndex];
      const done = stepIndex === module.steps.length;
      main.innerHTML = heading(module.label, categories.find((item) => item.id === id).name, module.intro) +
        `<section class="panel learning-panel"><div class="learning-top"><strong>${done ? "Jornada concluída" : `Marco ${stepIndex + 1} de ${module.steps.length}`}</strong><span>${mistakes} ${mistakes === 1 ? "revisão" : "revisões"}</span></div><progress value="${stepIndex}" max="${module.steps.length}" aria-label="Progresso da trilha"></progress>${done
          ? `<div class="learning-finish"><h2>Agora aplique o que aprendeu.</h2><p>Você percorreu ${module.steps.length} decisões e revisou ${mistakes} ${mistakes === 1 ? "resposta" : "respostas"}. Faça o quiz da trilha para registrar um resultado no seu perfil.</p><div class="actions"><button id="learning-quiz" class="primary">Praticar no quiz →</button><button id="learning-restart">Recomeçar a jornada</button></div></div>`
          : `<div class="learning-content"><span class="eyebrow">${esc(step.title)}</span><p>${esc(step.context)}</p><h2>${esc(step.prompt)}</h2><div class="learning-choices">${step.choices.map((choice, index) => `<button type="button" data-choice="${index}">${esc(choice)}</button>`).join("")}</div><p id="learning-feedback" class="learning-feedback" role="status" aria-live="polite">Escolha uma alternativa para avançar.</p><button id="learning-next" class="primary" disabled>${stepIndex + 1 === module.steps.length ? "Concluir jornada →" : "Próximo marco →"}</button></div>`}</section><div class="learning-sources"><a href="${module.sourceUrl}" target="_blank" rel="noopener noreferrer">Fonte principal ↗</a><a href="${module.extraUrl}" target="_blank" rel="noopener noreferrer">Leitura complementar ↗</a><button id="learning-back" class="text-button">Voltar às trilhas</button></div>`;
      $("#learning-back").onclick = () => navigate("trilhas");
      if (done) {
        $("#learning-quiz").onclick = () => { setup.category = id; lastResult = null; navigate("quiz"); };
        $("#learning-restart").onclick = () => { stepIndex = 0; mistakes = 0; renderStep(); };
        return;
      }
      main.querySelectorAll("[data-choice]").forEach((choice) => choice.onclick = () => {
        if (answered) return;
        const correct = Number(choice.dataset.choice) === step.correct;
        if (!correct) mistakes++;
        choice.classList.add(correct ? "is-correct" : "is-incorrect");
        const feedback = $("#learning-feedback");
        feedback.textContent = `${correct ? "Correto." : "Ainda não. Tente outra opção."} ${step.feedback}`;
        feedback.classList.toggle("is-incorrect", !correct);
        if (correct) { answered = true; $("#learning-next").disabled = false; main.querySelectorAll("[data-choice]").forEach((button) => button.disabled = true); }
        else choice.disabled = true;
      });
      $("#learning-next").onclick = () => { stepIndex++; answered = false; renderStep(); };
    };
    renderStep();
  }
  function quizSetup() {
    main.innerHTML =
      heading(
        "Avaliação / escolha sua sessão",
        "O que vamos praticar?",
        "Escolha o assunto, o nível e a quantidade. Cada resposta vem acompanhada de uma explicação técnica.",
      ) +
      `
    <section class="panel setup"><form id="quiz-form"><div class="form-grid"><div><label for="category">Assunto</label><select id="category"><option value="all">Todos os assuntos</option>${categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div><div><label for="level">Dificuldade</label><select id="level">${[1, 2, 3, ...(user()?.pro ? [4, 5] : [])].map((l) => `<option value="${l}">${levels[l]}${l > 3 ? " · Premium" : ""}</option>`).join("")}</select></div><div><label for="count">Quantidade de perguntas</label><select id="count"></select></div></div><p id="available" class="availability" aria-live="polite"></p><div class="callout"><strong>Uma rodada, novas combinações.</strong><br>As perguntas e as alternativas são embaralhadas. Não há repetição dentro da mesma rodada nem limite de tempo.</div><button class="primary" id="begin" type="submit">Iniciar quiz →</button></form></section>
    <section class="setup recommend"><h2>Três formas de avançar</h2><div class="flow-map"><div><strong>01 / Fundamentos</strong>Reconheça comandos e suas finalidades.</div><div><strong>02 / Aplicação</strong>Interprete opções, permissões e operações.</div><div><strong>03 / Diagnóstico</strong>Resolva cenários e avalie detalhes de administração.</div></div><p class="small muted">Processos e consultas DNS também aparecem no plano da disciplina. Consulte o professor sobre o recorte já trabalhado em aula.</p></section>`;
    $("#category").value = setup.category;
    $("#level").value = setup.level;
    function update() {
      setup.category = $("#category").value;
      setup.level = Number($("#level").value);
      const pro = setup.level > 3;
      if (pro) { setup.category = "all"; $("#category").value = "all"; }
      $("#category").disabled = pro;
      if (pro && !proQuestionCache.has(setup.level)) {
        $("#begin").disabled = true;
        $("#available").textContent = tr("Carregando perguntas Premium do servidor…");
        const requestedLevel = setup.level;
        sync.proQuestions(user()?.syncKey, requestedLevel).then(({ questions: bank }) => {
          proQuestionCache.set(requestedLevel, bank);
          if (setup.level === requestedLevel && $("#quiz-form")) update();
        }).catch((error) => { if (setup.level === requestedLevel && $("#available")) $("#available").textContent = error.message; });
        return;
      }
      const bank = pro ? proQuestionCache.get(setup.level) : questions;
      const size = core.pool(bank, setup.category, setup.level).length;
      const old = setup.count;
      const choices = [...new Set([1, 3, 5, 10, 15, 20, 30, 50, 75, 100, Math.min(size, 100)])]
        .filter((n) => n <= size && n > 0 && n <= 100)
        .sort((a, b) => a - b);
      $("#count").innerHTML = choices
        .map(
          (n) =>
            `<option value="${n}">${esc(tr(n === 1 ? "{count} pergunta" : "{count} questões", { count: n }))}</option>`,
        )
        .join("");
      setup.count = choices.includes(old) ? old : choices.at(-1) || 0;
      $("#count").value = setup.count;
      $("#begin").disabled = !size;
      $("#available").textContent = tr("{size} questões disponíveis neste recorte · até 100 por rodada {plan}. {mode}", {
        size, plan: pro ? "Premium" : "Free",
        mode: tr(setup.category === "all" ? "Quiz geral: com 10 ou mais questões, vale para o certificado do nível." : "Quiz por assunto: treino focado, sem emissão de certificado."),
      });
      window.FlowI18n?.translate($("#quiz-form"));
    }
    $("#category").onchange = update;
    $("#level").onchange = update;
    $("#count").onchange = () => (setup.count = Number($("#count").value));
    update();
    $("#quiz-form").onsubmit = (e) => {
      e.preventDefault();
      if (!requireUser()) return;
      const sessionKey = `${setup.category}:${setup.level}:${setup.count}`;
      const sessionQuestions = core.session(
        setup.level > 3 ? proQuestionCache.get(setup.level) : questions,
        setup.category,
        setup.level,
        setup.count,
        previousQuizSessions.get(sessionKey),
      );
      previousQuizSessions.set(sessionKey, sessionQuestions.map((question) => ({
        id: question.id,
        answerIndex: question.options.indexOf(question.answer),
      })));
      round = {
        userId: user().id,
        settings: { ...setup },
        questions: sessionQuestions,
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
    main.innerHTML = `<div class="quiz-shell"><div class="page-head"><div><p class="eyebrow">${esc(tr(categoryName(q.category)))} / ${esc(tr(levels[round.settings.level]))}</p><h1>${esc(tr("Leia. Pense. Experimente."))}</h1></div><button id="quit">${esc(tr("Encerrar"))}</button></div><div class="quiz-meta"><span>${esc(tr("Pergunta {index} de {total}", { index: round.index + 1, total: round.questions.length }))}</span><span>${esc(tr("{count} acertos", { count: round.answers.filter((a) => a.selected === a.question.answer).length }))}</span></div><progress value="${round.index}" max="${round.questions.length}" aria-label="${esc(tr("Progresso do quiz"))}"></progress><section class="panel question-panel"><h2 id="question-title" tabindex="-1">${esc(tr(q.prompt))}</h2>${q.code ? `<div class="code-block"><code>$ ${esc(q.code)}</code></div>` : ""}<div class="answers" role="group" aria-labelledby="question-title">${q.options.map((o, i) => `<button class="answer" data-answer="${i}" aria-pressed="false"><span class="letter" aria-hidden="true">${"ABCD"[i]}</span><span>${esc(tr(o))}</span></button>`).join("")}</div><div id="feedback" aria-live="polite"></div><button id="confirm-answer" class="primary" disabled>${esc(tr("Confirmar resposta"))}</button></section></div>`;
    $("#quit").onclick = () => {
      if (
        confirm(
          tr("Encerrar esta rodada? Respostas parciais não entram no ranking."),
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
        `<div class="feedback ${correct ? "" : "wrong"}"><h3>${esc(tr(correct ? "Correto!" : "Ainda não. Vamos entender."))}</h3><p><strong>${esc(tr("Resposta:"))}</strong> ${esc(tr(q.answer))}</p><p>${esc(tr(q.explanation))}</p></div>`;
      $("#confirm-answer").disabled = false;
      $("#confirm-answer").textContent =
        round.index === round.questions.length - 1
          ? tr("Ver resultado →")
          : tr("Próxima pergunta →");
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
          `<div class="feedback ${correct ? "" : "wrong"}"><h3>${esc(tr(correct ? "Correto!" : "Ainda não. Vamos entender."))}</h3><p><strong>${esc(tr("Resposta:"))}</strong> ${esc(tr(q.answer))}</p><p>${esc(tr(q.explanation))}</p></div>`;
        $("#confirm-answer").textContent =
          round.index === round.questions.length - 1
            ? tr("Ver resultado →")
            : tr("Próxima pergunta →");
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
    const profile = store.state.profiles.find((p) => p.id === record.userId);
    if (profile?.syncKey) {
      updateSyncStatus("syncing");
      sync.attempt(profile, {
        id: record.id, category: record.category, level: record.level,
        answers: round.answers.map((answer) => ({ id: answer.question.id, selected: answer.selected })),
      }).then(() => {
        updateSyncStatus("ready");
        toast("Progresso sincronizado na nuvem.");
        syncProfile(profile).catch(() => {});
      }).catch(() => {
        updateSyncStatus("error");
        toast("Resultado salvo localmente; sincronização indisponível.");
      });
    } else if (profile?.shareRanking) {
      fetch("/api/ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          participantId: record.userId,
          nickname: profile.name,
          category: record.category,
          level: record.level,
          answers: round.answers.map((answer) => ({ id: answer.question.id, selected: answer.selected })),
        }),
      }).then((response) => {
        if (!response.ok) throw new Error("Falha ao salvar ranking.");
        toast("Pontuação publicada no ranking compartilhado.");
      }).catch(() => toast("Pontuação salva localmente; ranking compartilhado indisponível."));
    }
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
      )}</div><div class="callout">${passed ? `${mascotArt(record.level)} Certificado didático de ${levels[record.level].toLowerCase()} liberado.` : record.category !== "all" ? "Treino por assunto concluído. Para certificar um nível, faça um quiz geral com 10 ou mais questões e 80% de acertos." : "Para liberar o certificado, alcance pelo menos 80% em um quiz geral com 10 ou mais questões."}</div><div class="actions"><button id="retry" class="primary">Nova rodada</button><button id="result-ranking">Ver ranking</button>${passed ? '<button id="result-certificate">Ver certificado</button>' : ""}</div><section class="result-share"><h2>Compartilhe sua conquista</h2><p>Você decide se quer compartilhar. O texto inclui apenas nível, acertos e total; não envia respostas nem código de acesso. O link abre a apresentação do projeto, sem validar a pontuação.</p><div class="actions"><button id="share-native" type="button">Compartilhar no aparelho</button><button id="share-copy" type="button">Copiar texto</button><a id="share-whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a><a id="share-bluesky" target="_blank" rel="noopener noreferrer">Bluesky ↗</a></div><p class="small muted">Para publicar no ranking do Linux_Flow, ative essa opção no perfil antes da próxima rodada.</p></section><section class="recommend"><h2>Seu próximo passo</h2>${priority.length ? "<p>Comece pelos assuntos com mais erros nesta rodada:</p>" : "<p>Você acertou todas. Experimente o próximo nível ou pratique uma missão no terminal.</p>"}<div class="actions">${priority.map(([c, n]) => `<button data-study="${c}">${esc(categoryName(c))} · ${n} ${n === 1 ? "erro" : "erros"}</button>`).join("")}<button id="result-lab">Praticar no terminal</button></div></section><section class="review recommend"><h2>Revisão da rodada</h2>${answers.map((a, i) => `<details><summary>${a.selected === a.question.answer ? "✓" : "×"} ${i + 1}. ${esc(a.question.prompt)}</summary><p>Sua resposta: ${esc(a.selected)}</p><p><strong>Resposta correta:</strong> ${esc(a.question.answer)}</p><p>${esc(a.question.explanation)}</p></details>`).join("")}</section></section>`;
    $("#retry").onclick = () => {
      lastResult = null;
      quizSetup();
    };
    $("#result-ranking").onclick = () => navigate("ranking");
    $("#result-lab").onclick = () => navigate("terminal");
    const localPreview = ["localhost", "127.0.0.1", ""].includes(location.hostname) || location.protocol === "file:";
    const projectUrl = localPreview
      ? "https://github.com/Jonathan-Eleodoro/linux-flow"
      : `${location.origin}${location.pathname}#inicio`;
    const shareText = `Concluí o nível ${levels[record.level]} no Linux_Flow: ${record.correct}/${record.total} acertos (${summary.percent}%). Certificado didático, sem validação oficial. ${projectUrl}`;
    $("#share-whatsapp").href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    $("#share-bluesky").href = `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`;
    $("#share-native").onclick = async () => {
      if (!navigator.share) { toast("Compartilhamento do aparelho indisponível. Use Copiar texto."); return; }
      try { await navigator.share({ title: "Meu resultado no Linux_Flow", text: shareText }); }
      catch (error) { if (error.name !== "AbortError") toast("Não foi possível compartilhar. Use Copiar texto."); }
    };
    $("#share-copy").onclick = async () => {
      try { await navigator.clipboard.writeText(shareText); toast("Texto do resultado copiado."); }
      catch { toast("Cópia indisponível neste navegador."); }
    };
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
        "Melhores resultados",
        "Compare seus resultados.",
        "Filtre por assunto, nível e quantidade de perguntas.",
      ) +
      `
    <section class="panel ranking-panel"><div class="ranking-tabs" role="group" aria-label="Origem do ranking"><button id="rank-local" type="button" aria-pressed="true">Neste dispositivo</button><button id="rank-shared" type="button" aria-pressed="false">Compartilhado</button></div><p id="ranking-description" class="small muted">Resultados salvos neste navegador, incluindo o progresso recuperado do seu perfil.</p><div class="filters"><div><label for="rank-category">Assunto</label><select id="rank-category"><option value="all">Todos os assuntos</option>${categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div><div><label for="rank-level">Nível</label><select id="rank-level">${[1, 2, 3, ...(user()?.pro ? [4, 5] : [])].map((l) => `<option value="${l}">${levels[l]}</option>`).join("")}</select></div><div><label for="rank-count">Perguntas</label><select id="rank-count"></select></div></div><div id="rank-table" aria-live="polite"></div><p class="small muted recommend">O ranking é didático: apelidos não comprovam identidade e o gabarito é público.</p></section>`;
    let shared = false;
    function setRankingMode(value) {
      shared = value;
      $("#rank-local").setAttribute("aria-pressed", String(!shared));
      $("#rank-shared").setAttribute("aria-pressed", String(shared));
      $("#ranking-description").textContent = shared
        ? "Pontuações publicadas voluntariamente por perfis de diferentes aparelhos."
        : "Resultados salvos neste navegador, incluindo o progresso recuperado do seu perfil.";
      table();
    }
    $("#rank-local").onclick = () => setRankingMode(false);
    $("#rank-shared").onclick = () => setRankingMode(true);
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
      if (shared && Number($("#rank-level").value) > 3) {
        $("#rank-table").textContent = "Etapas Premium têm resultados locais e certificados; não entram no ranking compartilhado.";
        return;
      }
      if (shared) {
        const target = $("#rank-table");
        target.textContent = "Carregando ranking compartilhado…";
        const query = new URLSearchParams({
          category: $("#rank-category").value,
          level: $("#rank-level").value,
          total: $("#rank-count").value,
        });
        const expected = query.toString();
        fetch(`/api/ranking?${query}`).then((response) => {
          if (!response.ok) throw new Error("Falha ao carregar ranking.");
          return response.json();
        }).then(({ ranking }) => {
          if (!target.isConnected || !shared ||
              new URLSearchParams({ category: $("#rank-category").value,
                level: $("#rank-level").value,
                total: $("#rank-count").value }).toString() !== expected) return;
          target.innerHTML = ranking.length
            ? `<div class="table-wrap"><table><thead><tr><th scope="col">Posição</th><th scope="col">Apelido</th><th scope="col">Acertos</th><th scope="col">Resultado</th><th scope="col">Data</th></tr></thead><tbody>${ranking.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.nickname)}</td><td>${r.correct}/${r.total}</td><td>${Math.round(100 * r.correct / r.total)}%</td><td>${fmtDate(r.date)}</td></tr>`).join("")}</tbody></table></div>`
            : '<div class="empty">Ainda não há resultados publicados neste recorte.</div>';
        }).catch(() => { if (target.isConnected && shared) target.textContent = "Ranking compartilhado indisponível. Seus resultados locais continuam acessíveis."; });
        return;
      }
      const records = FlowRanking(
        store.state.results.filter(
          (r) =>
            r.category === $("#rank-category").value &&
            r.level === Number($("#rank-level").value) &&
            r.total === Number($("#rank-count").value),
        ),
      );
      $("#rank-table").innerHTML = records.length
        ? `<div class="table-wrap"><table><thead><tr><th scope="col">Posição</th><th scope="col">Perfil</th><th scope="col">Acertos</th><th scope="col">Resultado</th><th scope="col">Data</th></tr></thead><tbody>${records.map((r, i) => `<tr><td>${String(i + 1).padStart(2, "0")}</td><td><strong>${esc(store.state.profiles.find((p) => p.id === r.userId)?.name || "Perfil removido")}</strong><br><span class="tiny">${mascotArt(r.level)} ${core.mascot(r.level).name}</span></td><td>${r.correct}/${r.total}</td><td>${Math.round((r.correct * 100) / r.total)}%</td><td>${fmtDate(r.date)}</td></tr>`).join("")}</tbody></table></div>`
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
        "Pratique no terminal simulado.",
        `${FlowTerminal.missions.length} missões guiadas em um cenário fictício. Seus arquivos e sua rede não são acessados.`,
      ) +
      `
    <div class="terminal-layout"><section class="panel"><h2>Missões do laboratório</h2><div class="mission-list">${FlowTerminal.missions.map((m, i) => `<button class="mission-button ${i === missionIndex ? "active" : ""}" data-mission="${i}"><span>${store.state.labs.some((l) => l.userId === user()?.id && l.mission === i) ? "✓" : String(i + 1).padStart(2, "0")}</span>${esc(m.title)}</button>`).join("")}</div></section><section><div class="mission-info"><span class="eyebrow">MISSÃO ${String(missionIndex + 1).padStart(2, "0")} / ${FlowTerminal.missions.length}</span><h2>${esc(mission.title)}</h2><p>${esc(mission.story)}</p><p><strong>Objetivo verificável:</strong> ${esc(mission.goal)}</p></div><div class="terminal-window"><div class="terminal-bar">aluno@linux-flow · cenário isolado em memória</div><div class="terminal-output" id="terminal-output" role="log" aria-live="polite" aria-label="Saída do terminal"><div class="entry">Bem-vindo ao laboratório. Digite help para ver os comandos disponíveis.</div></div><form class="terminal-form" id="terminal-form"><label for="command">$ <span class="sr-text">Comando</span></label><input id="command" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="180" placeholder="Digite um comando" required><button type="submit" class="primary">Executar</button></form></div><div class="command-options"><strong>Comandos para explorar</strong><p class="small muted">Algumas opções são distrações. Selecione uma para preencher o terminal; depois execute e confira a saída.</p><div class="actions">${mission.choices.map((choice) => `<button type="button" class="command-choice" data-command="${esc(choice)}"><code>${esc(choice)}</code></button>`).join("")}</div></div><div id="mission-result" aria-live="polite"></div><details class="terminal-hint"><summary>Pista 1 · como pensar</summary><p>${esc(mission.hints[0])}</p></details><details class="terminal-hint"><summary>Pista 2 · sequência de execução</summary><p>${esc(mission.hints[1])}</p></details><button id="restart-lab" class="text-button">Reiniciar esta missão</button></section></div>`;
    $("#restart-lab").insertAdjacentHTML("beforebegin",
      `<aside class="terminal-references" aria-label="Referências técnicas da missão"><h3>Documentação técnica</h3><p>Os comandos seguem estas referências. As saídas do laboratório são simuladas e podem diferir de um sistema Linux real.</p><ul>${mission.references.map((reference) => `<li><a href="${esc(reference.url)}" target="_blank" rel="noopener noreferrer">${esc(reference.label)} ↗</a></li>`).join("")}</ul></aside>`);
    main.querySelectorAll("[data-command]").forEach((choice) => {
      choice.onclick = () => { $("#command").value = choice.dataset.command; $("#command").focus(); };
    });
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
          syncProfile(user()).catch(() => toast("Missão salva localmente; sincronização indisponível."));
        }
        $("#mission-result").innerHTML =
          '<div class="callout"><strong>Missão cumprida!</strong><br>Você aplicou o comando ao cenário. Continue para a próxima missão.</div>';
        beep(true);
        if (missionIndex < FlowTerminal.missions.length - 1)
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
        "Consulte o manual.",
        "Busque comandos, conceitos e distribuições.",
      ) +
      `
    <details class="panel"><summary>Mapa de conceitos e distribuições</summary><div class="flow-map"><div><strong>Espaço de usuário</strong>Aplicações, shell e serviços.</div><div><strong>Kernel</strong>Gerencia memória, processos e dispositivos.</div><div><strong>Hardware</strong>CPU, discos e interfaces de rede.</div></div><div class="table-wrap"><table><thead><tr><th>Família</th><th>Exemplos</th><th>Pacotes e ferramentas</th></tr></thead><tbody><tr><td>Debian</td><td>Debian, Ubuntu, Linux Mint</td><td>DEB · dpkg · APT</td></tr><tr><td>Red Hat</td><td>Red Hat, Fedora, CentOS</td><td>RPM · rpm · yum / dnf, conforme versão</td></tr></tbody></table></div><p class="small muted">O shell reúne comandos comuns, mas gerenciadores, nomes de serviços e padrões podem variar entre distribuições. Não troque nomes de ferramentas presumindo que todas as opções serão iguais.</p></details>
    <div class="filters recommend"><div><label for="manual-search">Buscar no manual</label><input type="search" id="manual-search" placeholder="Ex.: chmod, ICMP, saída de erro"></div><div><label for="manual-category">Assunto</label><select id="manual-category"><option value="all">Todos os assuntos</option>${categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div></div><p id="manual-count" class="small muted" role="status"></p><div class="manual-grid" id="manual-entries"></div>`;
    $("#manual-search").value = pendingManualSearch;
    pendingManualSearch = "";
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
              `<article class="panel manual-card"><span class="tiny">${esc(categoryName(m.category))}</span><h3>${esc(m.command)}</h3><p><strong>${esc(m.action)}.</strong> ${esc(m.explanation)}</p><div class="code-block"><code>${esc(m.example)}</code></div></article>`,
          )
          .join("")
      : '<p class="empty">Nenhuma entrada encontrada. Tente outro termo ou remova o filtro.</p>';
  }
  function achievements() {
    const results = myResults();
    main.innerHTML =
      heading(
        "Seu percurso / conquistas",
        "Acompanhe suas conquistas.",
        "Certificados didáticos do projeto; não são credenciais oficiais.",
      ) +
      `<div class="cards">${[1, 2, 3, ...(user()?.pro ? [4, 5] : [])]
        .map((l) => {
          const record = results
            .filter((r) => r.level === l && core.qualifies(r))
            .sort((a, b) => b.correct / b.total - a.correct / a.total)[0];
          return `<article class="certificate ${record ? "" : "locked"}"><span class="animal" aria-hidden="true">${mascotArt(l)}</span><p class="eyebrow">Nível ${l} / ${levels[l]}</p><h3>${core.mascot(l).name}</h3><p class="muted">${record ? "Conquistado em " + fmtDate(record.date) : "Conclua um quiz geral do nível, com pelo menos 10 questões e 80% de acertos."}</p>${record ? `<button class="primary" data-cert="${record.id}">Abrir certificado</button>` : `<button data-level="${l}">Praticar este nível</button>`}</article>`;
        })
        .join(
          "",
        )}</div><div class="callout">Missões concluídas: ${new Set(store.state.labs.filter((l) => l.userId === user()?.id).map((l) => l.mission)).size} de ${FlowTerminal.missions.length}. As missões são prática complementar e não alteram a nota do quiz.</div>`;
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
  function mascotsView() {
    const results = myResults();
    main.innerHTML = heading(
      "Personagens / etapas",
      "Conheça os mascotes.",
      "Cada mascote representa uma etapa. Três são gratuitas; duas fazem parte do Premium.",
    ) + `<div class="mascot-grid">${[1, 2, 3, 4, 5].map((level) => {
      const mascot = core.mascot(level);
      const pro = level > 3;
      const earned = results.some((record) => record.level === level && core.qualifies(record));
      return `<article class="panel mascot-card ${pro ? "mascot-card-pro" : ""}"><div class="mascot-portrait">${mascotArt(level)}</div><div class="mascot-copy"><span class="eyebrow">Etapa ${level} · ${esc(levels[level])} ${pro ? "· Premium" : "· Free"}</span><h2>${esc(mascot.name)}</h2><span class="mascot-focus">${esc(mascot.focus)}</span><p>${esc(mascot.description)}</p><p class="small muted">${pro ? user()?.pro ? "Acesso Premium ativo neste perfil sincronizado." : "Acesso por contribuição Pix a partir de R$ 9,90, após conferência manual e ativação pelo responsável." : earned ? "Conquistado com uma rodada geral deste nível." : "Disponível para estudar. Conquiste-o em uma rodada geral com 10 questões e 80% de acertos."}</p>${pro ? `<button data-pro-level="${level}" class="primary">${user()?.pro ? "Praticar" : "Conhecer o Premium"} →</button>` : `<button data-mascot-level="${level}" class="primary">Praticar ${esc(levels[level].toLowerCase())} →</button>`}</div></article>`;
    }).join("")}</div><section class="panel mascot-note"><h2>Como as etapas funcionam</h2><p>Os mascotes e certificados são recursos criados para este projeto acadêmico. Eles não são símbolos, níveis ou credenciais oficiais do LPI, da Linux Foundation ou do colégio.</p><button id="mascot-achievements">Ver minhas conquistas →</button></section>`;
    main.querySelectorAll("[data-mascot-level]").forEach((button) => {
      button.onclick = () => {
        setup.level = Number(button.dataset.mascotLevel);
        setup.category = "all";
        lastResult = null;
        navigate("quiz");
      };
    });
    main.querySelectorAll("[data-pro-level]").forEach((button) => {
      button.onclick = () => {
        if (!user()?.pro) return navigate("pro");
        setup.level = Number(button.dataset.proLevel);
        setup.category = "all";
        lastResult = null;
        navigate("quiz");
      };
    });
    $("#mascot-achievements").onclick = () => navigate("conquistas");
  }
  function proView() {
    main.innerHTML = heading("Linux_Flow Premium", "Apoie e continue estudando.",
      "Contribuição voluntária a partir de R$ 9,90 via Pix. Acesso liberado manualmente após conferência do recebimento.") +
      `<section class="panel pro-panel"><h2>Automação e Arquitetura</h2><p>O Premium inclui duas etapas adicionais, com perguntas próprias, explicações e certificados didáticos. O pagamento não é detectado automaticamente; acompanhe o estado do pedido aqui.</p><div id="pro-content" aria-live="polite">Consultando seu perfil…</div></section>`;
    const target = $("#pro-content");
    if (!user()) {
      target.innerHTML = '<p>Crie um perfil e ative a sincronização para pedir acesso Premium.</p><button id="pro-profile" class="primary">Entrar</button>';
      $("#pro-profile").onclick = openProfile;
      return;
    }
    if (!user().syncKey) {
      target.innerHTML = '<p>Ative a sincronização deste perfil antes de gerar o Pix. A liberação Premium ficará vinculada à sua chave de acesso.</p><button id="pro-sync" class="primary">Configurar sincronização</button>';
      $("#pro-sync").onclick = () => navigate("sobre");
      return;
    }
    const profile = user();
    function show(state) {
      if (!target.isConnected || user()?.id !== profile.id) return;
      profile.pro = state.pro === true;
      save();
      if (state.pro) {
        target.innerHTML = '<div class="callout"><strong>Premium ativo neste perfil.</strong> As etapas adicionais já podem ser praticadas.</div><div class="actions"><button data-pro-start="4" class="primary">Automação →</button><button data-pro-start="5">Arquitetura →</button></div>';
        target.querySelectorAll("[data-pro-start]").forEach((button) => button.onclick = () => {
          setup = { category: "all", level: Number(button.dataset.proStart), count: 10 };
          navigate("quiz");
        });
        return;
      }
      if (!state.request || !["pending", "claimed"].includes(state.request.status)) {
        if (!state.paymentReady) {
          target.innerHTML = '<p>O recebedor ainda não configurou a chave Pix. O pedido de contribuição estará disponível após essa configuração.</p>';
          return;
        }
        target.innerHTML = `<form id="pro-form"><label for="pro-amount">Valor da contribuição (R$)</label><input id="pro-amount" type="number" min="9.90" max="1000" step="0.01" value="9.90" required><button type="submit" class="primary">Gerar Pix de contribuição</button></form><p class="small muted">O acesso só será liberado após conferência manual. Não envie comprovantes ou dados bancários pelo perfil.</p>`;
        $("#pro-form").onsubmit = async (event) => {
          event.preventDefault();
          const cents = Math.round(Number($("#pro-amount").value) * 100);
          try { show(await sync.proCreate(profile.syncKey, cents)); }
          catch (error) { toast(error.message); }
        };
        return;
      }
      const request = state.request;
      target.innerHTML = `<div class="callout"><strong>${request.status === "claimed" ? "Pagamento informado; aguardando conferência" : "Pedido criado; aguardando pagamento"}</strong><br>Valor: R$ ${(request.amountCents / 100).toFixed(2).replace(".", ",")} · Referência: ${esc(request.txid)}</div>${state.paymentReady ? `<div class="pix-box"><img src="${state.qr}" alt="QR Code Pix para a contribuição de R$ ${(request.amountCents / 100).toFixed(2).replace(".", ",")}"><div><p><strong>Recebedor:</strong> ${esc(state.receiver)}</p><label for="pix-code">Pix Copia e Cola</label><textarea id="pix-code" readonly rows="5">${esc(state.copyPaste)}</textarea><button id="copy-pix" type="button">Copiar código Pix</button></div></div>` : request.status === "claimed" ? '<p>Pedido em conferência. Atualize esta página depois da liberação pelo responsável.</p>' : '<p>O Pix ainda não foi configurado pelo responsável. Não faça pagamento por outro código.</p>'}<p class="small muted">Confira o nome do recebedor e o valor no aplicativo do seu banco antes de confirmar. Informar pagamento aqui não libera o Premium automaticamente.</p>${request.status === "pending" && state.paymentReady ? '<label for="payer-reference">Identificador da transação no comprovante (opcional)</label><input id="payer-reference" maxlength="100" placeholder="Ajuda a localizar o pagamento"><button id="pro-claim" class="primary">Já paguei · solicitar conferência</button>' : ""}<button id="pro-refresh">Atualizar situação</button>`;
      if ($("#copy-pix")) $("#copy-pix").onclick = () => {
        if (!navigator.clipboard?.writeText) { $("#pix-code").select(); toast("Selecione e copie o código exibido."); return; }
        navigator.clipboard.writeText(state.copyPaste)
          .then(() => toast("Código Pix copiado."))
          .catch(() => { $("#pix-code").select(); toast("Selecione e copie o código exibido."); });
      };
      if ($("#pro-claim")) $("#pro-claim").onclick = async () => {
        try { show(await sync.proClaim(profile.syncKey, request.id, $("#payer-reference")?.value || "")); }
        catch (error) { toast(error.message); }
      };
      $("#pro-refresh").onclick = () => sync.proStatus(profile.syncKey).then(show)
        .catch((error) => toast(error.message));
    }
    sync.proStatus(profile.syncKey).then(show).catch((error) => { target.textContent = error.message; });
  }
  function objectivesView() {
    const metrics = store.state.questionProgress || [];
    const practiced = new Set(metrics.filter((item) => item.userId === user()?.id)
      .map((item) => item.questionId));
    const objectives = lpiTopics.flatMap((topic) => topic.objectives);
    const related = objectives.filter((objective) => objective.categories.length).length;
    main.innerHTML = heading(
      "Referência / Linux Essentials",
      "Explore os objetivos.",
      "Veja a relação das trilhas com o Linux Essentials 010-160.",
    ) + `<section class="panel lpi-intro"><div><span class="eyebrow">${esc(tr("FONTE DE REFERÊNCIA"))}</span><h2>Linux Professional Institute (LPI)</h2><p>${esc(tr("O material Linux Essentials 010-160 orienta este mapa. {related} dos {total} objetivos têm alguma trilha relacionada nesta versão. Uma trilha relacionada não significa cobertura completa ou preparação suficiente para o exame.", { related, total: objectives.length }))}</p><a class="inline-link" href="https://www.lpi.org/pt-br/exam-010-objectives/" target="_blank" rel="noopener noreferrer">${esc(tr("Consultar objetivos oficiais ↗"))}</a></div><div class="lpi-summary"><strong>${related}/${objectives.length}</strong><span>${esc(tr("objetivos com trilha relacionada"))}</span><small>${esc(user()?.syncKey ? tr("{count} questões registradas em novas rodadas verificadas", { count: practiced.size }) : tr("Ative a sincronização para acompanhar questões praticadas"))}</small></div></section><div class="lpi-topic-grid">${lpiTopics.map((topic) => `<section class="panel lpi-topic"><div class="lpi-topic-head"><span class="track-number">${esc(tr("TÓPICO {id}", { id: topic.id }))}</span><h2>${esc(tr(topic.title))}</h2></div><div class="lpi-objectives">${topic.objectives.map((objective) => {
      const relatedCategories = objective.categories;
      const category = categories.find((item) => item.id === relatedCategories[0]);
      const questionIds = questions.filter((question) => relatedCategories.includes(question.category))
        .map((question) => question.id);
      const seen = questionIds.filter((id) => practiced.has(id)).length;
      return `<div class="lpi-objective"><div><span class="lpi-code">${objective.id}</span><strong>${esc(tr(objective.title))}</strong></div><p>${esc(category ? tr(relatedCategories.length === 1 ? "{count} trilha relacionada · {seen} questão(ões) registradas" : "{count} trilhas relacionadas · {seen} questão(ões) registradas", { count: relatedCategories.length, seen }) : tr("Ainda sem trilha correspondente"))}</p>${category ? `<button data-lpi-category="${category.id}" class="text-button">${esc(tr("Praticar {category} →", { category: tr(category.name) }))}</button>` : ""}</div>`;
    }).join("")}</div></section>`).join("")}</div><p class="small muted lpi-disclaimer">${esc(tr("Mapa editorial independente. As questões existentes continuam vinculadas às fontes indicadas em cada resposta; o material oficial do LPI orienta a revisão e as futuras ampliações."))}</p>`;
    main.querySelectorAll("[data-lpi-category]").forEach((button) => {
      button.onclick = () => {
        setup.category = button.dataset.lpiCategory;
        lastResult = null;
        navigate("quiz");
      };
    });
  }
  function showCertificate(record) {
    if (!record || record.userId !== user()?.id || !core.qualifies(record))
      return;
    main.innerHTML = `<div class="actions no-print"><button id="back-certs">← Conquistas</button><button id="print-cert" class="primary">Imprimir ou salvar como PDF</button></div><article class="certificate paper"><img src="assets/colegio.png" alt="Colégio Sinodal Progresso"><p class="eyebrow">Linux_Flow / ${cfg.year}</p><h1>Certificado didático de conclusão</h1><p>Registramos a conclusão do nível ${esc(levels[record.level].toLowerCase())} por</p><p class="recipient">${esc(user().name)}</p><p>${mascotArt(record.level)} ${esc(core.mascot(record.level).name)}</p><p>Quiz geral de Linux · ${record.total} questões · ${record.correct} acertos<br>Aproveitamento de ${Math.round((record.correct * 100) / record.total)}% · ${fmtDate(record.date)}</p><hr class="divider"><p>Linux_Flow · ${cfg.year}<br>${esc(cfg.institution)} · ${esc(cfg.course)}</p><p class="small muted">Comprovante gerado localmente pelo Linux_Flow. Sem assinatura ou validação institucional.<br>Não equivale a uma certificação profissional. Sem carga horária atribuída.</p><p class="tiny">Registro local: ${esc(record.id)}</p></article>`;
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
        "Acompanhe sua sincronização e escolha como guardar seus dados.",
      ) +
      `
    <div class="about-grid"><section class="panel"><div class="institution"><span class="institution-mark"><img src="assets/colegio.png" alt="Colégio Sinodal Progresso"></span><div><span class="eyebrow">INSTITUIÇÃO DE ENSINO</span><h2>${esc(cfg.institution)}</h2><p>${esc(cfg.course)} · ${cfg.year}</p></div></div><p><strong>Aluno:</strong> ${esc(cfg.author)}<br><strong>Disciplina:</strong> ${esc(cfg.subject)}<br><strong>Professor:</strong> ${esc(cfg.teacher)}</p><p>${esc(cfg.purpose)}</p><p><strong>Telefone:</strong> ${esc(cfg.phone || "Não informado")}<br><strong>E-mail:</strong> ${esc(cfg.email || "Não informado")}</p><p class="small muted">Marca institucional usada para identificar o contexto do trabalho acadêmico. A aplicação não representa um serviço oficial do colégio.</p></section>
    <section class="panel"><h2>Como funciona</h2><ol><li>Crie um perfil simples.</li><li>Escolha uma trilha ou um quiz geral.</li><li>Confirme uma alternativa e leia a explicação.</li><li>Revise o resultado, pratique e acompanhe suas conquistas.</li></ol><p>Som opcional, tema claro ou escuro e navegação por teclado. O terminal interpreta apenas os comandos listados em help.</p><p class="small muted">Funciona como site estático. Abrir index.html após extrair o ZIP também permite estudar sem conexão; a persistência em arquivos locais pode variar conforme o navegador.</p></section>
<section class="panel"><h2>Acesso, cookies e dados locais</h2><p>O acesso ao site é público. Perfis locais usam apelidos; perfis sincronizados usam um código secreto para recuperar dados em outro aparelho. Quem tiver o código pode acessar o perfil.</p><p>Com sua escolha, o navegador usa localStorage para guardar apelido, pontuação, conquistas e preferências. Caso contrário, mantém tudo só na página aberta. Ao ativar a sincronização, resultados e missões são guardados também no banco D1 da Cloudflare. Novas rodadas enviam respostas à API para recalcular os acertos. A opção de ranking decide se a pontuação também aparece publicamente.</p><p>A hospedagem pode registrar acessos e dados técnicos conforme suas próprias políticas. Não informe dados sensíveis no apelido.</p><p>Os dados locais duram até você apagá-los ou limpar o navegador; há limite de 30 perfis e 300 resultados recentes. Apagar dados locais não remove a cópia na nuvem. Use Apagar perfil da nuvem para remover perfil, progresso e pontuações publicadas do banco. Tema e som continuam locais.</p><label class="check"><input id="persist-setting" type="checkbox" ${store.persistent ? "checked" : ""}> Manter os dados neste dispositivo</label><label class="check"><input id="share-setting" type="checkbox" ${user()?.shareRanking ? "checked" : ""} ${user() ? "" : "disabled"}> Publicar próximas pontuações deste perfil no ranking compartilhado</label><button id="erase-data" class="danger">Apagar todos os dados locais</button></section>
    <section class="panel"><h2>Critérios de estudo</h2><p>Questões elaboradas para a prática didática. Os exemplos de terminal usam dados fictícios.</p><p>Os três níveis têm acesso livre. Um quiz geral com pelo menos 10 questões e 80% de acertos libera o certificado do nível. Erros orientam a revisão por assunto.</p><p>O ranking local guarda as rodadas neste navegador. O ranking compartilhado recebe somente as rodadas que você escolher publicar; as pontuações são recalculadas no servidor. Nenhum dos dois serve como avaliação oficial.</p><p class="small muted">Os PDFs originais não são publicados neste pacote. Consulte docs/fontes.md para o recorte, as adaptações e os tópicos ainda não cobertos.</p></section></div>`;
    main.querySelector(".about-grid").insertAdjacentHTML("afterbegin", `<section class="panel sync-panel"><div class="sync-heading"><div><span class="eyebrow">PERFIL E PROGRESSO</span><h2>Continue em outro aparelho</h2></div><span class="badge green">${user()?.syncKey ? "Nuvem ativada" : "Neste dispositivo"}</span></div><p>${user()?.syncKey ? "Resultados e missões deste perfil são sincronizados. Guarde o código para recuperar o acesso." : "Ative a nuvem para guardar seu progresso e continuar de onde parou em outro navegador."}</p>${user() ? user().syncKey ? '<div class="actions sync-actions"><button id="sync-now" class="primary">Sincronizar agora</button><button id="show-access-code">Mostrar código</button><button id="copy-access-code">Copiar código</button></div><div id="access-code-display" class="access-code" aria-live="polite"></div><p class="small muted">Quem tiver o código poderá acessar este perfil. Guarde-o em local seguro.</p><button id="delete-cloud" class="text-button danger">Apagar perfil da nuvem</button>' : '<button id="enable-sync" class="primary">Ativar sincronização →</button><div id="access-code-display" class="access-code" aria-live="polite"></div><p class="small muted">Um código de acesso será criado para este perfil. Você poderá copiá-lo e usá-lo em outro aparelho.</p>' : '<button id="create-from-about" class="primary">Entrar →</button>'}</section>`);
    if (!user()) $("#create-from-about").onclick = openProfile;
    if (user()?.syncKey) {
      $("#sync-now").onclick = () => syncProfile(user())
        .then(() => toast("Progresso sincronizado."))
        .catch(() => toast("Sincronização indisponível."));
      $("#show-access-code").onclick = () => {
        $("#access-code-display").textContent = user().syncKey;
      };
      $("#copy-access-code").onclick = () => {
        if (!navigator.clipboard?.writeText) {
          $("#access-code-display").textContent = user().syncKey;
          toast("Selecione e copie o código exibido.");
          return;
        }
        navigator.clipboard.writeText(user().syncKey)
          .then(() => toast("Código copiado."))
          .catch(() => {
            $("#access-code-display").textContent = user().syncKey;
            toast("Selecione e copie o código exibido.");
          });
      };
      $("#delete-cloud").onclick = async () => {
        const profile = user();
        if (!confirm("Apagar este perfil, progresso e pontuações da nuvem? Os dados locais permanecerão neste dispositivo.")) return;
        try {
          await sync.remove(profile.syncKey);
          profile.syncKey = null;
          save();
          about();
          toast("Perfil da nuvem apagado. Progresso local preservado.");
        } catch { toast("Não foi possível apagar o perfil da nuvem."); }
      };
    } else if (user()) {
      $("#enable-sync").onclick = async () => {
        const profile = user();
        const key = sync.newKey();
        $("#access-code-display").textContent = "Criando perfil na nuvem…";
        try {
          await sync.create(profile, key);
          profile.syncKey = key;
          profile.temporary = false;
          store.permission(true);
          await syncProfile(profile);
          about();
          $("#access-code-display").textContent = key;
          toast("Perfil sincronizado. Guarde o código de acesso exibido.");
        } catch {
          if (profile.syncKey) save();
          $("#access-code-display").textContent = profile.syncKey
            ? `Perfil criado. Guarde o código: ${key}. Tente sincronizar novamente mais tarde.`
            : "Não foi possível criar o perfil na nuvem.";
        }
      };
    }
    $("#persist-setting").onchange = (e) => {
      if (e.target.checked && user()) user().temporary = false;
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
    $("#share-setting").onchange = (e) => {
      if (!user()) return;
      user().shareRanking = e.target.checked;
      save();
      syncProfile(user()).catch(() => {});
      toast(e.target.checked ? "Próximas pontuações serão publicadas." : "Publicação das próximas pontuações desativada.");
    };
    $("#erase-data").onclick = () => {
      if (
        confirm(
          "Apagar todos os perfis, resultados, certificados e preferências deste navegador? Não é possível desfazer.",
        )
      ) {
        store.clear();
        try { localStorage.removeItem(GUIDE_KEY); } catch {}
        guideMode = "ask";
        guideOpen = false;
        guide();
        proQuestionCache.clear();
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
    const view = location.hash.slice(1) || "inicio";
    const sections = {
      trilhas: ["trilhas", "quiz", "terminal", "aprender-historia", "aprender-instalacao"],
      ranking: ["ranking", "conquistas", "mascotes"],
      objetivos: ["objetivos", "manual"],
    };
    const parent = Object.keys(sections).find((key) => sections[key].includes(view));
    const labels = { trilhas: "Visão geral", quiz: "Quiz", terminal: "Terminal", "aprender-historia": "História", "aprender-instalacao": "Instalação", ranking: "Resultados", conquistas: "Conquistas", mascotes: "Mascotes", objetivos: "Mapa de objetivos", manual: "Manual" };
    const sectionNav = $("#section-nav");
    sectionNav.hidden = !parent;
    sectionNav.innerHTML = parent ? sections[parent].map((item) => `<a href="#${item}" ${item === view ? 'aria-current="page"' : ""}>${labels[item]}</a>`).join("") : "";
    main.querySelectorAll("form").forEach((f) => f.reset());
    document.querySelectorAll("[data-view]").forEach((a) => {
      const active = a.dataset.view === (parent || view);
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    const views = {
      inicio: landing,
      pesquisa: searchView,
      sugestoes: suggestionsView,
      trilhas: dashboard,
      "aprender-historia": () => learningView("historia"),
      "aprender-instalacao": () => learningView("instalacao"),
      quiz: () =>
        round ? quizQuestion() : lastResult ? showResult() : quizSetup(),
      terminal: terminalView,
      ranking,
      comunidade: () => FlowCommunity.mount(main, user(), () => navigate("quiz")),
      manual: manualView,
      conquistas: achievements,
      mascotes: mascotsView,
      objetivos: objectivesView,
      pro: proView,
      sobre: about,
      privacidade: privacyView,
    };
    (views[view] || dashboard)();
    document.title = `Linux_Flow — ${tr({ inicio: "Início", pesquisa: "Pesquisa", sugestoes: "Sugestões", trilhas: "Trilhas", "aprender-historia": "História do Linux", "aprender-instalacao": "Instalação consciente", quiz: "Quiz", terminal: "Terminal", ranking: "Ranking", comunidade: "Comunidade", manual: "Manual", conquistas: "Conquistas", mascotes: "Mascotes", objetivos: "Objetivos LPI", pro: "Premium", sobre: "Sobre", privacidade: "Privacidade" }[view] || "Início")}`;
    window.FlowI18n?.translate(document.body);
    if (view !== lastRenderedView) window.scrollTo(0, 0);
    lastRenderedView = view;
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
  window.addEventListener("hashchange", stopTour);
  window.addEventListener("hashchange", render);
  window.addEventListener("beforeunload", (e) => {
    if (round) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  applyPreferences();
  guide();
  render();
  syncProfile(user()).catch(() => toast("Sincronização indisponível. Seu progresso local continua salvo."));
})();
