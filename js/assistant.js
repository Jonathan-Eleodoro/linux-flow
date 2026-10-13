/* Orientação local sobre a interface. Nenhuma pergunta é enviada a um serviço. */
(function () {
  "use strict";
  const launch = document.querySelector("#orientador-launch");
  const panel = document.querySelector("#orientador-panel");
  const messages = document.querySelector("#orientador-messages");
  const suggestions = document.querySelector("#orientador-topics");
  const input = document.querySelector("#orientador-input");
  const spanish = () => window.FlowI18n?.locale() === "es";
  const say = (pt, es) => spanish() ? es : pt;
  const entries = [
    { id: "start", route: "inicio", keys: "começar inicio ajuda plataforma começar aprender empezar inicio ayuda plataforma", title: ["Por onde começar", "Por dónde empezar"], body: ["Abra Trilhas e escolha um assunto. Se preferir, experimente o quiz ou o terminal antes de criar um perfil. O progresso temporário desaparece ao fechar ou recarregar a página.", "Abre Rutas y elige un tema. También puedes probar el cuestionario o la terminal antes de crear un perfil. El progreso temporal desaparece al cerrar o recargar la página."] },
    { id: "tracks", route: "trilhas", keys: "trilhas trilha assunto etapa nivel rota rutas tema etapa nivel", title: ["Trilhas de estudo", "Rutas de estudio"], body: ["Em Trilhas, escolha um tema para estudar e praticar. Quiz, Terminal, História e Instalação aparecem como opções dessa área.", "En Rutas, elige un tema para estudiar y practicar. Cuestionario, Terminal, Historia e Instalación aparecen dentro de esta sección."] },
    { id: "history", route: "aprender-historia", keys: "historia origem unix gnu kernel história origen", title: ["História do Linux", "Historia de Linux"], body: ["Percorra os marcos sobre Unix, GNU, kernel Linux e distribuições. Cada decisão recebe uma explicação antes de você avançar.", "Recorre los hitos sobre Unix, GNU, el núcleo Linux y las distribuciones. Cada decisión recibe una explicación antes de avanzar."] },
    { id: "install", route: "aprender-instalacao", keys: "instalacao instalar imagem backup disco midia instalación instalar imagen copia disco medio", title: ["Instalação consciente", "Instalación consciente"], body: ["A simulação apresenta decisões sobre cópia de segurança, imagem, mídia de instalação, teste e destino do disco. Ela não instala nem altera seu computador.", "La simulación plantea decisiones sobre copias de seguridad, imagen, medio de instalación, pruebas y destino del disco. No instala ni modifica tu equipo."] },
    { id: "quiz", route: "quiz", keys: "quiz pergunta questao resposta alternativa dificuldade cantidad cuestionario pregunta respuesta opción dificultad", title: ["Quiz", "Cuestionario"], body: ["Escolha assunto, dificuldade e quantidade de perguntas. As alternativas mudam de ordem a cada rodada. Depois de responder, leia a explicação antes de seguir.", "Elige tema, dificultad y número de preguntas. Las opciones cambian de orden en cada ronda. Después de responder, lee la explicación antes de continuar."] },
    { id: "terminal", route: "terminal", keys: "terminal comando laboratorio missão pista executar misión pista ejecutar", title: ["Terminal simulado", "Terminal simulada"], body: ["Escolha uma missão, leia o objetivo e digite o comando sugerido pelas pistas. O ambiente é simulado e aceita apenas os comandos previstos pela atividade.", "Elige una misión, lee el objetivo y escribe el comando sugerido por las pistas. El entorno es simulado y solo acepta los comandos previstos por la actividad."] },
    { id: "profile", route: "sobre", keys: "perfil conta entrar criar apelido local temporario sessão libre cuenta perfil ingresar crear alias temporal", title: ["Perfil e acesso", "Perfil y acceso"], body: ["Em Entrar, você pode continuar livremente ou criar um perfil. A sessão livre é temporária; o salvamento local fica neste navegador. A sincronização permite retomar em outro aparelho com seu código de acesso.", "En Entrar, puedes continuar libremente o crear un perfil. La sesión libre es temporal; el guardado local permanece en este navegador. La sincronización permite continuar en otro dispositivo con tu código de acceso."] },
    { id: "sync", route: "sobre", keys: "sincronizar sincronizacao nuvem codigo acesso sair recuperar cloud sincronizar sincronizacion nube código acceso salir recuperar", title: ["Sincronização", "Sincronización"], body: ["Abra o menu da conta ou a área Sobre para sincronizar. Guarde seu código de acesso: ele é necessário para abrir o perfil em outro aparelho. Sair remove o acesso deste navegador, sem apagar o perfil na nuvem.", "Abre el menú de la cuenta o Acerca de para sincronizar. Guarda tu código de acceso: es necesario para abrir el perfil en otro dispositivo. Salir quita el acceso de este navegador sin borrar el perfil en la nube."] },
    { id: "ranking", route: "ranking", keys: "ranking placar pontos pontuação resultado classificacion marcador puntos resultado", title: ["Ranking e resultados", "Clasificación y resultados"], body: ["O ranking compartilhado exige perfil sincronizado, opção de publicação ativada e rodada verificada. Na mesma área, você encontra resultados, conquistas e mascotes.", "La clasificación compartida requiere perfil sincronizado, publicación activada y una ronda verificada. En la misma sección encontrarás resultados, logros y mascotas."] },
    { id: "mascots", route: "mascotes", keys: "mascotes conquistas certificado personagens mascote mascotas logros certificado personajes", title: ["Conquistas e mascotes", "Logros y mascotas"], body: ["Abra Ranking e escolha Conquistas ou Mascotes nas opções da seção. Os certificados são marcos didáticos, não credenciais oficiais.", "Abre Clasificación y elige Logros o Mascotas en las opciones de la sección. Los certificados son hitos didácticos, no credenciales oficiales."] },
    { id: "rooms", route: "comunidade", keys: "criar entrar sala salas duelo campeonato partida coletiva codigo mestre tempo competir crear entrar sala salas duelo campeonato partida colectiva codigo anfitrion tiempo", title: ["Salas e duelos", "Salas y duelos"], body: ["Com um perfil sincronizado, crie uma sala ou entre com o código de 12 caracteres. O duelo aceita até 2 pessoas e a sala coletiva até 40. O criador inicia e avança as questões; o cronômetro é opcional.", "Con un perfil sincronizado, crea una sala o entra con el código de 12 caracteres. El duelo admite hasta 2 personas y la sala colectiva hasta 40. El creador inicia y avanza las preguntas; el temporizador es opcional."] },
    { id: "groups", route: "comunidade", keys: "grupo grupos estudo relatorio professor docente sugestao grupo grupos estudio informe profesor docente sugerencia", title: ["Grupos de estudo", "Grupos de estudio"], body: ["Crie ou entre em um grupo pela área Comunidade. Cada pessoa acompanha o próprio progresso e pode sugerir conteúdo. Resultados individuais da turma exigem concessão docente aprovada.", "Crea o únete a un grupo desde Comunidad. Cada persona consulta su propio progreso y puede sugerir contenido. Los resultados individuales del grupo requieren autorización docente aprobada."] },
    { id: "objectives", route: "objetivos", keys: "objetivos lpi manual referencia documentação conteúdo exam objetivo manual referencia documentación contenido examen", title: ["Objetivos e manual", "Objetivos y manual"], body: ["Em Objetivos, veja a relação entre trilhas e objetivos Linux Essentials. Abra Manual nas opções da seção para consultar comandos. Essa relação não garante cobertura completa do exame.", "En Objetivos, consulta la relación entre rutas y objetivos Linux Essentials. Abre Manual en las opciones de la sección para consultar comandos. La relación no garantiza cobertura completa del examen."] },
    { id: "premium", route: "pro", keys: "premium pro pix pagamento pagar preço valor contribuição automatizacao arquitetura", title: ["Premium", "Premium"], body: ["O Premium libera etapas adicionais para perfis sincronizados. A contribuição Pix começa em R$ 9,90; a conferência e a ativação são manuais, sem assinatura automática.", "Premium desbloquea etapas adicionales para perfiles sincronizados. La contribución Pix empieza en R$ 9,90; la comprobación y la activación son manuales, sin suscripción automática."] },
    { id: "search", route: "pesquisa", keys: "pesquisar busca encontrar lupa conteúdo buscar búsqueda encontrar lupa contenido", title: ["Pesquisar conteúdo", "Buscar contenido"], body: ["Use a lupa no cabeçalho para procurar comandos, trilhas, missões e objetivos específicos.", "Usa la lupa del encabezado para buscar comandos, rutas, misiones y objetivos específicos."] },
    { id: "feedback", route: "sugestoes", keys: "sugestao comentario email contato feedback sugestão sugerencia comentario correo contacto", title: ["Sugestões", "Sugerencias"], body: ["Em Sugestões, informe e-mail e comentário para enviar uma ideia identificada. O grupo de estudo também aceita propostas de conteúdo dos integrantes.", "En Sugerencias, indica correo y comentario para enviar una idea identificada. El grupo de estudio también admite propuestas de contenido de sus integrantes."] },
    { id: "share", route: "ranking", keys: "compartilhar publicar redes sociais resultado certificado compartir publicar redes sociales resultado certificado", title: ["Compartilhar resultados", "Compartir resultados"], body: ["Depois de concluir um quiz, use as opções de compartilhamento do resultado. Revise o texto antes de abrir uma rede social. O ranking público é separado e depende da sua escolha de publicação.", "Después de terminar un cuestionario, usa las opciones para compartir el resultado. Revisa el texto antes de abrir una red social. La clasificación pública es independiente y depende de tu elección de publicación."] },
    { id: "settings", route: "sobre", keys: "configuracao tema claro escuro som idioma ajuda guia accesibilidade configuración tema claro oscuro sonido idioma ayuda guía accesibilidad", title: ["Configurações e ajuda", "Configuración y ayuda"], body: ["Abra a engrenagem no cabeçalho para mudar tema, som e idioma, ou iniciar o guia visual. Para consultar e apagar dados do perfil, abra Sobre.", "Abre el engranaje del encabezado para cambiar tema, sonido e idioma, o iniciar la guía visual. Para consultar y borrar datos del perfil, abre Acerca de."] },
    { id: "privacy", route: "privacidade", keys: "privacidade lgpd dados apagar excluir cookies compartilhar privacidad datos borrar eliminar cookies compartir", title: ["Privacidade e dados", "Privacidad y datos"], body: ["A área Privacidade explica o que fica na sessão, no navegador e na nuvem. Os controles de perfil e exclusão ficam em Sobre. Compartilhar um resultado só ocorre depois do seu clique.", "La sección Privacidad explica qué permanece en la sesión, en el navegador y en la nube. Los controles del perfil y de eliminación están en Acerca de. Compartir un resultado solo ocurre después de tu clic."] },
  ];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const normalize = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const stop = new Set("a o os as de do da e em no na para por como que uma um eu meu minha usar fazer onde pode quero el la los las de del en con como que una un mi mis quiero puedo".split(" "));
  const context = { inicio: ["start", "tracks", "profile", "rooms"], trilhas: ["tracks", "history", "install", "quiz"], "aprender-historia": ["history", "quiz", "tracks"], "aprender-instalacao": ["install", "quiz", "tracks"], quiz: ["quiz", "share", "ranking"], terminal: ["terminal", "tracks"], ranking: ["ranking", "mascots", "share"], conquistas: ["mascots", "ranking"], mascotes: ["mascots", "ranking"], comunidade: ["rooms", "groups", "profile"], pro: ["premium", "sync"], objetivos: ["objectives", "search"], manual: ["objectives", "terminal"], pesquisa: ["search", "tracks", "objectives"], sugestoes: ["feedback", "groups"], sobre: ["profile", "sync", "privacy"], privacidade: ["privacy", "profile"] };
  function bubble(text, fromUser = false, topic) {
    const item = document.createElement("div");
    item.className = `orientador-message ${fromUser ? "is-user" : "is-guide"}`;
    const copy = document.createElement("p");
    copy.textContent = text;
    item.append(copy);
    if (topic) {
      const link = document.createElement("a");
      link.href = `#${topic.route}`;
      link.textContent = say(`Abrir ${topic.title[0]} →`, `Abrir ${topic.title[1]} →`);
      link.addEventListener("click", () => close(false));
      item.append(link);
    }
    messages.append(item);
    while (messages.children.length > 14) messages.firstElementChild.remove();
    messages.scrollTop = messages.scrollHeight;
  }
  function topics(ids) {
    suggestions.replaceChildren();
    for (const id of ids) {
      const topic = byId.get(id);
      if (!topic) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = topic.title[spanish() ? 1 : 0];
      button.addEventListener("click", () => answer(topic));
      suggestions.append(button);
    }
  }
  function answer(topic) {
    bubble(topic.body[spanish() ? 1 : 0], false, topic);
    topics(context[topic.route] || ["tracks", "profile", "rooms", "privacy"]);
  }
  function match(question) {
    const words = normalize(question).split(" ").filter((word) => word.length > 2 && !stop.has(word));
    if (!words.length) return null;
    let best = null, highest = 0;
    for (const entry of entries) {
      const haystack = normalize(`${entry.keys} ${entry.title.join(" ")}`);
      const score = words.reduce((total, word) => total + (haystack.split(" ").includes(word) ? 2 : haystack.includes(word) ? 1 : 0), 0);
      if (score > highest) { best = entry; highest = score; }
    }
    return best;
  }
  function close(restoreFocus = true) {
    panel.hidden = true;
    launch.setAttribute("aria-expanded", "false");
    if (restoreFocus) launch.focus();
  }
  function open() {
    panel.hidden = false;
    launch.setAttribute("aria-expanded", "true");
    document.querySelector("#settings").open = false;
    suggestions.setAttribute("aria-label", say("Assuntos sugeridos", "Temas sugeridos"));
    if (!messages.children.length) bubble(say(
      "Olá! Posso orientar você pelas funções do Linux Flow. Escolha um assunto ou escreva sua dúvida.",
      "¡Hola! Puedo orientarte por las funciones de Linux Flow. Elige un tema o escribe tu duda."));
    topics(context[location.hash.slice(1)] || context.inicio);
    input.focus();
  }
  launch.addEventListener("click", () => panel.hidden ? open() : close());
  document.querySelector("#open-orientador").addEventListener("click", open);
  document.querySelector("#orientador-close").addEventListener("click", () => close());
  document.querySelector("#orientador-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    bubble(question, true);
    input.value = "";
    const topic = match(question);
    if (topic) answer(topic);
    else {
      bubble(say("Ainda não encontrei uma orientação específica. Escolha um dos assuntos abaixo ou envie sua sugestão pela plataforma.",
        "No encontré una orientación específica. Elige uno de los temas siguientes o envía tu sugerencia desde la plataforma."));
      topics(["tracks", "profile", "rooms", "privacy"]);
    }
    input.focus();
  });
  panel.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  window.addEventListener("hashchange", () => { if (!panel.hidden) topics(context[location.hash.slice(1)] || context.inicio); });
})();
