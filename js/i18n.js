/* Idioma da interface. O conteúdo didático e os enunciados mantêm a redação original. */
(function () {
  "use strict";
  const key = "linux_flow.language.v1";
  const supported = ["pt-BR", "es"];
  let locale = "pt-BR";
  try {
    const saved = localStorage.getItem(key);
    if (supported.includes(saved)) locale = saved;
    else if (saved) localStorage.setItem(key, "pt-BR");
  } catch {}
  document.documentElement.lang = locale;

  // Cada linha: texto original, português europeu, espanhol, francês, italiano, alemão.
  const rows = [
    ["Comunidade", "Comunidade", "Comunidad"],
    ["JOGAR E APRENDER JUNTO", "JOGAR E APRENDER JUNTO", "JUGAR Y APRENDER JUNTOS"],
    ["Pratique sozinho, dispute um duelo ou reúna a turma.", "Pratique sozinho, dispute um duelo ou reúna a turma.", "Practica a solas, disputa un duelo o reúne al grupo."],
    ["PARTIDA RÁPIDA", "PARTIDA RÁPIDA", "PARTIDA RÁPIDA"],
    ["Seu ritmo", "Seu ritmo", "A tu ritmo"],
    ["Uma rodada individual para testar o que você já sabe.", "Uma rodada individual para testar o que você já sabe.", "Una ronda individual para poner a prueba lo que sabes."],
    ["Abrir quiz →", "Abrir quiz →", "Abrir cuestionario →"],
    ["DUELO E TURMA", "DUELO E TURMA", "DUELO Y GRUPO"],
    ["Salas ao vivo", "Salas ao vivo", "Salas en vivo"],
    ["Partida rápida", "Partida rápida", "Partida rápida"],
    ["Jogue sozinho, sem precisar esperar a turma.", "Jogue sozinho, sem precisar esperar a turma.", "Juega a solas sin esperar al grupo."],
    ["Criar sala", "Criar sala", "Crear sala"],
    ["Nome da sessão", "Nome da sessão", "Nombre de la sesión"],
    ["Modo", "Modo", "Modo"],
    ["Assunto", "Assunto", "Tema"],
    ["Questões", "Questões", "Preguntas"],
    ["Tempo por questão", "Tempo por questão", "Tiempo por pregunta"],
    ["Sem cronômetro", "Sem cronômetro", "Sin temporizador"],
    ["Entrar com código", "Entrar com código", "Entrar con código"],
    ["Código da sala", "Código da sala", "Código de la sala"],
    ["Entrar na sala", "Entrar na sala", "Entrar en la sala"],
    ["Código do grupo", "Código do grupo", "Código del grupo"],
    ["Entrar no grupo", "Entrar no grupo", "Entrar en el grupo"],
    ["Grupo de estudo", "Grupo de estudo", "Grupo de estudio"],
    ["Nome do grupo", "Nome do grupo", "Nombre del grupo"],
    ["Criar grupo", "Criar grupo", "Crear grupo"],
    ["Seu personagem", "Seu personagem", "Tu personaje"],
    ["Mascote", "Mascote", "Mascota"],
    ["Cor", "Cor", "Color"],
    ["Faixa etária · opcional", "Faixa etária · opcional", "Rango de edad · opcional"],
    ["Prefiro não informar", "Prefiro não informar", "Prefiero no indicarlo"],
    ["Salvar personagem", "Salvar personagem", "Guardar personaje"],
    ["Minhas salas", "Minhas salas", "Mis salas"],
    ["Meus grupos", "Meus grupos", "Mis grupos"],
    ["Nenhuma sala ainda.", "Nenhuma sala ainda.", "Aún no hay salas."],
    ["Nenhum grupo ainda.", "Nenhum grupo ainda.", "Aún no hay grupos."],
    ["Aguardando participantes", "Aguardando participantes", "Esperando participantes"],
    ["Partida encerrada", "Partida encerrada", "Partida finalizada"],
    ["Iniciar partida", "Iniciar partida", "Iniciar partida"],
    ["Próxima questão", "Próxima questão", "Siguiente pregunta"],
    ["Encerrar", "Encerrar", "Finalizar"],
    ["Confirmar resposta", "Confirmar resposta", "Confirmar respuesta"],
    ["Placar", "Placar", "Marcador"],
    ["Registro do mestre", "Registro do mestre", "Registro del anfitrión"],
    ["Relatório de aprendizagem", "Relatório de aprendizagem", "Informe de aprendizaje"],
    ["Seu progresso no grupo", "Seu progresso no grupo", "Tu progreso en el grupo"],
    ["Sugerir conteúdo", "Sugerir conteúdo", "Sugerir contenido"],
    ["O que devemos acrescentar?", "O que devemos acrescentar?", "¿Qué deberíamos añadir?"],
    ["Enviar sugestão", "Enviar sugestão", "Enviar sugerencia"],
    ["Configurações", "Definições", "Configuración", "Paramètres", "Impostazioni", "Einstellungen"],
    ["Som", "Som", "Sonido", "Son", "Audio", "Ton"],
    ["Tema", "Tema", "Tema", "Thème", "Tema", "Design"],
    ["Ajuda", "Ajuda", "Ayuda", "Aide", "Aiuto", "Hilfe"],
    ["Idioma", "Idioma", "Idioma", "Langue", "Lingua", "Sprache"],
    ["Idioma da interface", "Idioma da interface", "Idioma de la interfaz", "Langue de l’interface", "Lingua dell’interfaccia", "Sprache der Oberfläche"],
    ["Aulas e questões ainda estão em português do Brasil.", "As aulas e perguntas ainda estão em português do Brasil.", "Las lecciones y preguntas aún están en portugués de Brasil.", "Les cours et les questions restent en portugais du Brésil.", "Le lezioni e le domande sono ancora in portoghese brasiliano.", "Lektionen und Fragen sind noch auf brasilianischem Portugiesisch."],
    ["Entrar", "Entrar", "Entrar", "Se connecter", "Accedi", "Anmelden"],
    ["Início", "Início", "Inicio", "Accueil", "Inizio", "Start"],
    ["Trilhas", "Percursos", "Rutas", "Parcours", "Percorsi", "Lernpfade"],
    ["Ranking", "Classificação", "Clasificación", "Classement", "Classifica", "Rangliste"],
    ["Objetivos", "Objetivos", "Objetivos", "Objectifs", "Obiettivi", "Lernziele"],
    ["Sugestões", "Sugestões", "Sugerencias", "Suggestions", "Suggerimenti", "Vorschläge"],
    ["Pesquisar", "Pesquisar", "Buscar", "Rechercher", "Cerca", "Suchen"],
    ["Pesquisar conteúdos", "Pesquisar conteúdos", "Buscar contenidos", "Rechercher des contenus", "Cerca contenuti", "Inhalte suchen"],
    ["Endereço", "Morada", "Dirección", "Adresse", "Indirizzo", "Adresse"],
    ["Contato", "Contacto", "Contacto", "Contact", "Contatto", "Kontakt"],
    ["Sobre", "Sobre", "Acerca de", "À propos", "Informazioni", "Über uns"],
    ["Privacidade", "Privacidade", "Privacidad", "Confidentialité", "Privacy", "Datenschutz"],
    ["Dados", "Dados", "Datos", "Données", "Dati", "Daten"],
    ["Visão geral", "Visão geral", "Vista general", "Vue d’ensemble", "Panoramica", "Überblick"],
    ["Quiz", "Questionário", "Cuestionario", "Quiz", "Quiz", "Quiz"],
    ["Terminal", "Terminal", "Terminal", "Terminal", "Terminale", "Terminal"],
    ["História", "História", "Historia", "Histoire", "Storia", "Geschichte"],
    ["Instalação", "Instalação", "Instalación", "Installation", "Installazione", "Installation"],
    ["Resultados", "Resultados", "Resultados", "Résultats", "Risultati", "Ergebnisse"],
    ["Conquistas", "Conquistas", "Logros", "Réussites", "Traguardi", "Erfolge"],
    ["Mascotes", "Mascotes", "Mascotas", "Mascottes", "Mascotte", "Maskottchen"],
    ["Manual", "Manual", "Manual", "Manuel", "Manuale", "Handbuch"],
    ["Aprenda. Pratique.", "Aprenda. Pratique.", "Aprende. Practica.", "Apprenez. Pratiquez.", "Impara. Esercitati.", "Lernen. Üben."],
    ["Evolua.", "Evolua.", "Avanza.", "Progressez.", "Progredisci.", "Vorankommen."],
    ["Escolha um assunto ou pratique livremente.", "Escolha um tema ou pratique livremente.", "Elige un tema o practica libremente.", "Choisissez un sujet ou entraînez-vous librement.", "Scegli un argomento o esercitati liberamente.", "Wähle ein Thema oder übe frei."],
    ["Abrir quiz ↗", "Abrir questionário ↗", "Abrir cuestionario ↗", "Ouvrir le quiz ↗", "Apri il quiz ↗", "Quiz öffnen ↗"],
    ["Abrir terminal", "Abrir terminal", "Abrir terminal", "Ouvrir le terminal", "Apri il terminale", "Terminal öffnen"],
    ["Seu mapa de evolução", "O seu mapa de evolução", "Tu mapa de progreso", "Votre parcours de progression", "La tua mappa dei progressi", "Dein Lernfortschritt"],
    ["Ver minhas conquistas →", "Ver as minhas conquistas →", "Ver mis logros →", "Voir mes réussites →", "Vedi i miei traguardi →", "Meine Erfolge ansehen →"],
    ["Conhecer os mascotes →", "Conhecer os mascotes →", "Conocer las mascotas →", "Découvrir les mascottes →", "Scopri le mascotte →", "Maskottchen entdecken →"],
    ["Crie seu espaço de estudo.", "Crie o seu espaço de estudo.", "Crea tu espacio de estudio.", "Créez votre espace d’étude.", "Crea il tuo spazio di studio.", "Erstelle deinen Lernbereich."],
    ["SEU PROGRESSO", "O SEU PROGRESSO", "TU PROGRESO", "VOTRE PROGRESSION", "I TUOI PROGRESSI", "DEIN FORTSCHRITT"],
    ["Escolha seu próximo passo", "Escolha o próximo passo", "Elige tu próximo paso", "Choisissez la prochaine étape", "Scegli il prossimo passo", "Wähle deinen nächsten Schritt"],
    ["Explorar trilhas →", "Explorar percursos →", "Explorar rutas →", "Explorer les parcours →", "Esplora i percorsi →", "Lernpfade erkunden →"],
    ["Experimentar o quiz", "Experimentar o questionário", "Probar el cuestionario", "Essayer le quiz", "Prova il quiz", "Quiz ausprobieren"],
    ["SEU CAMINHO", "O SEU PERCURSO", "TU CAMINO", "VOTRE PARCOURS", "IL TUO PERCORSO", "DEIN LERNWEG"],
    ["Escolha como começar", "Escolha como começar", "Elige cómo empezar", "Choisissez comment commencer", "Scegli come iniziare", "Wähle deinen Einstieg"],
    ["Estude nesta sessão", "Estude nesta sessão", "Estudia en esta sesión", "Étudiez pendant cette session", "Studia in questa sessione", "In dieser Sitzung lernen"],
    ["Continue neste dispositivo", "Continue neste dispositivo", "Continúa en este dispositivo", "Continuez sur cet appareil", "Continua su questo dispositivo", "Auf diesem Gerät fortsetzen"],
    ["Amplie a jornada", "Amplie o percurso", "Amplía tu recorrido", "Allez plus loin", "Amplia il percorso", "Erweitere deinen Lernweg"],
    ["Gratuito · sem conta", "Gratuito · sem conta", "Gratis · sin cuenta", "Gratuit · sans compte", "Gratis · senza account", "Kostenlos · ohne Konto"],
    ["Gratuito · escolha opcional", "Gratuito · opção facultativa", "Gratis · elección opcional", "Gratuit · choix facultatif", "Gratis · scelta facoltativa", "Kostenlos · optional"],
    ["Ativação manual · sem assinatura automática", "Ativação manual · sem subscrição automática", "Activación manual · sin suscripción automática", "Activation manuelle · sans abonnement automatique", "Attivazione manuale · senza abbonamento automatico", "Manuelle Freischaltung · kein automatisches Abo"],
    ["Conhecer o Premium →", "Conhecer o Premium →", "Conocer Premium →", "Découvrir Premium →", "Scopri Premium →", "Premium entdecken →"],
    ["COMO FUNCIONA", "COMO FUNCIONA", "CÓMO FUNCIONA", "COMMENT ÇA MARCHE", "COME FUNZIONA", "SO FUNKTIONIERT ES"],
    ["Do conceito ao comando.", "Do conceito ao comando.", "Del concepto al comando.", "Du concept à la commande.", "Dal concetto al comando.", "Vom Konzept zum Befehl."],
    ["Abrir terminal →", "Abrir terminal →", "Abrir terminal →", "Ouvrir le terminal →", "Apri il terminale →", "Terminal öffnen →"],
    ["Conhecer mascotes →", "Conhecer mascotes →", "Conocer las mascotas →", "Découvrir les mascottes →", "Scopri le mascotte →", "Maskottchen entdecken →"],
    ["Enviar sugestão →", "Enviar sugestão →", "Enviar sugerencia →", "Envoyer une suggestion →", "Invia un suggerimento →", "Vorschlag senden →"],
    ["Privacidade e LGPD →", "Privacidade e RGPD →", "Privacidad y LGPD →", "Confidentialité et LGPD →", "Privacy e LGPD →", "Datenschutz und LGPD →"],
    ["Quando eu pedir", "Quando eu pedir", "Cuando lo solicite", "À la demande", "Quando lo chiedo", "Auf Anfrage"],
    ["Sempre visível", "Sempre visível", "Siempre visible", "Toujours visible", "Sempre visibile", "Immer sichtbar"],
    ["Dispensar", "Dispensar", "Descartar", "Ignorer", "Ignora", "Ausblenden"],
    ["Iniciar passeio guiado", "Iniciar visita guiada", "Iniciar visita guiada", "Lancer la visite guidée", "Avvia la visita guidata", "Tour starten"],
    ["Alterar preferência", "Alterar preferência", "Cambiar preferencia", "Modifier la préférence", "Cambia preferenza", "Einstellung ändern"],
    ["Voltar", "Voltar", "Volver", "Retour", "Indietro", "Zurück"],
    ["Próximo", "Seguinte", "Siguiente", "Suivant", "Avanti", "Weiter"],
    ["Concluir", "Concluir", "Terminar", "Terminer", "Termina", "Fertig"],
    ["Sair", "Sair", "Salir", "Quitter", "Esci", "Schließen"],
    ["Aprenda Linux com prática, contexto e progresso visível.", "Aprenda Linux com prática, contexto e progresso visível.", "Aprende Linux con práctica, contexto y progreso visible.", "Apprenez Linux par la pratique, avec du contexte et des progrès visibles.", "Impara Linux con pratica, contesto e progressi visibili.", "Lerne Linux mit Praxis, Kontext und sichtbaren Fortschritten."],
    ["Explore trilhas, resolva quizzes com explicações e experimente comandos em um terminal simulado. Comece gratuitamente, no seu ritmo.", "Explore percursos, resolva questionários com explicações e experimente comandos num terminal simulado. Comece gratuitamente, ao seu ritmo.", "Explora rutas, resuelve cuestionarios con explicaciones y prueba comandos en un terminal simulado. Empieza gratis, a tu ritmo.", "Explorez des parcours, répondez à des quiz expliqués et essayez des commandes dans un terminal simulé. Commencez gratuitement, à votre rythme.", "Esplora percorsi, risolvi quiz con spiegazioni e prova i comandi in un terminale simulato. Inizia gratuitamente, al tuo ritmo.", "Erkunde Lernpfade, löse Quizfragen mit Erklärungen und teste Befehle in einem simulierten Terminal. Starte kostenlos in deinem Tempo."],
    ["Crie um apelido sem marcar o salvamento. Seu perfil e resultados ficam na memória e desaparecem ao fechar ou recarregar a página.", "Crie uma alcunha sem ativar a gravação. O perfil e os resultados ficam na memória e desaparecem ao fechar ou recarregar a página.", "Crea un alias sin activar el guardado. El perfil y los resultados permanecen en memoria y desaparecen al cerrar o recargar la página.", "Créez un pseudonyme sans activer l’enregistrement. Le profil et les résultats restent en mémoire et disparaissent à la fermeture ou au rechargement de la page.", "Crea un nome utente senza attivare il salvataggio. Profilo e risultati restano in memoria e scompaiono quando chiudi o ricarichi la pagina.", "Erstelle einen Spitznamen ohne Speicherung. Profil und Ergebnisse bleiben im Speicher und verschwinden beim Schließen oder Neuladen der Seite."],
    ["Autorize o salvamento local para manter perfil, resultados e preferências neste navegador. Se quiser usar outro aparelho, ative a sincronização e guarde seu código de acesso.", "Autorize a gravação local para manter perfil, resultados e preferências neste navegador. Para usar outro dispositivo, ative a sincronização e guarde o código de acesso.", "Permite el almacenamiento local para conservar el perfil, los resultados y las preferencias en este navegador. Para usar otro dispositivo, activa la sincronización y guarda tu código de acceso.", "Autorisez l’enregistrement local pour conserver profil, résultats et préférences dans ce navigateur. Pour utiliser un autre appareil, activez la synchronisation et conservez votre code d’accès.", "Consenti il salvataggio locale per conservare profilo, risultati e preferenze in questo browser. Per usare un altro dispositivo, attiva la sincronizzazione e conserva il codice di accesso.", "Erlaube die lokale Speicherung von Profil, Ergebnissen und Einstellungen in diesem Browser. Für ein anderes Gerät aktiviere die Synchronisierung und bewahre deinen Zugangscode auf."],
    ["Acesse Automação e Arquitetura com um perfil sincronizado e contribuição Pix a partir de R$ 9,90, após conferência e ativação manual.", "Aceda a Automação e Arquitetura com um perfil sincronizado e um contributo Pix a partir de R$ 9,90, após verificação e ativação manual.", "Accede a Automatización y Arquitectura con un perfil sincronizado y una contribución Pix desde R$ 9,90, tras la verificación y activación manual.", "Accédez à Automatisation et à l’Architecture avec un profil synchronisé et une contribution Pix à partir de 9,90 R$, après vérification et activation manuelle.", "Accedi ad Automazione e Architettura con un profilo sincronizzato e un contributo Pix da R$ 9,90, dopo verifica e attivazione manuale.", "Nutze Automatisierung und Architektur mit einem synchronisierten Profil und einem Pix-Beitrag ab R$ 9,90 nach manueller Prüfung und Freischaltung."],
    ["Uma trilha apresenta o tema, o quiz explica cada resposta e o laboratório permite praticar em um cenário isolado. Acompanhe conquistas sem confundir certificados didáticos com credenciais oficiais.", "Um percurso apresenta o tema, o questionário explica cada resposta e o laboratório permite praticar num cenário isolado. Acompanhe conquistas sem confundir certificados didáticos com credenciais oficiais.", "Una ruta presenta el tema, el cuestionario explica cada respuesta y el laboratorio permite practicar en un entorno aislado. Sigue tus logros sin confundir los certificados didácticos con credenciales oficiales.", "Un parcours présente le sujet, le quiz explique chaque réponse et le laboratoire permet de s’exercer dans un environnement isolé. Suivez vos réussites sans confondre les certificats pédagogiques avec des titres officiels.", "Un percorso introduce l’argomento, il quiz spiega ogni risposta e il laboratorio permette di esercitarsi in un ambiente isolato. Segui i tuoi traguardi senza confondere gli attestati didattici con credenziali ufficiali.", "Ein Lernpfad führt ins Thema ein, das Quiz erklärt jede Antwort und das Labor ermöglicht Übungen in einer isolierten Umgebung. Lernzertifikate sind keine offiziellen Qualifikationen."],
    ["Aprenda por tema e pratique no quiz ou no terminal.", "Aprenda por tema e pratique no questionário ou no terminal.", "Aprende por temas y practica en el cuestionario o el terminal.", "Apprenez par thème et entraînez-vous avec le quiz ou le terminal.", "Impara per argomento ed esercitati con il quiz o il terminale.", "Lerne nach Themen und übe im Quiz oder Terminal."],
    ["Aproveitamento de 80% em um quiz geral com pelo menos 10 questões libera o certificado do nível.", "Uma pontuação de 80% num questionário geral com pelo menos 10 perguntas desbloqueia o certificado do nível.", "Un 80 % de aciertos en un cuestionario general de al menos 10 preguntas desbloquea el certificado del nivel.", "Un score de 80 % à un quiz général d’au moins 10 questions débloque le certificat du niveau.", "L’80% di risposte corrette in un quiz generale di almeno 10 domande sblocca l’attestato del livello.", "80 % in einem allgemeinen Quiz mit mindestens 10 Fragen schalten das Zertifikat der Stufe frei."],
    ["Use um apelido para acompanhar quizzes, missões e conquistas.", "Use uma alcunha para acompanhar questionários, missões e conquistas.", "Usa un alias para seguir cuestionarios, misiones y logros.", "Utilisez un pseudonyme pour suivre vos quiz, missions et réussites.", "Usa un nome utente per seguire quiz, missioni e traguardi.", "Nutze einen Spitznamen, um Quizze, Missionen und Erfolge zu verfolgen."],
    ["Como deseja continuar?", "Como deseja continuar?", "¿Cómo quieres continuar?", "Comment souhaitez-vous continuer ?", "Come vuoi continuare?", "Wie möchtest du fortfahren?"],
    ["Já tenho conta", "Já tenho conta", "Ya tengo una cuenta", "J’ai déjà un compte", "Ho già un account", "Ich habe bereits ein Konto"],
    ["Criar perfil", "Criar perfil", "Crear perfil", "Créer un profil", "Crea un profilo", "Profil erstellen"],
    ["Conectar conta", "Associar conta", "Conectar cuenta", "Associer un compte", "Collega un account", "Konto verbinden"],
    ["Seguir livre", "Continuar livremente", "Continuar sin cuenta", "Continuer sans compte", "Continua senza account", "Ohne Konto fortfahren"],
    ["Abrir perfil deste dispositivo ou usar código de acesso.", "Abrir um perfil deste dispositivo ou usar o código de acesso.", "Abrir un perfil de este dispositivo o usar un código de acceso.", "Ouvrir un profil de cet appareil ou utiliser un code d’accès.", "Apri un profilo su questo dispositivo o usa un codice di accesso.", "Profil auf diesem Gerät öffnen oder Zugangscode verwenden."],
    ["Escolher apelido e como guardar o progresso.", "Escolher uma alcunha e como guardar o progresso.", "Elegir un alias y cómo guardar el progreso.", "Choisir un pseudonyme et comment enregistrer sa progression.", "Scegli un nome utente e come salvare i progressi.", "Spitznamen und Speicherart wählen."],
    ["Google, GitHub ou Apple quando configurados.", "Google, GitHub ou Apple quando estiverem configurados.", "Google, GitHub o Apple cuando estén configurados.", "Google, GitHub ou Apple après configuration.", "Google, GitHub o Apple quando configurati.", "Google, GitHub oder Apple nach Einrichtung."],
    ["Testar o quiz e o terminal nesta sessão.", "Experimentar o questionário e o terminal nesta sessão.", "Probar el cuestionario y el terminal en esta sesión.", "Essayer le quiz et le terminal pendant cette session.", "Prova il quiz e il terminale in questa sessione.", "Quiz und Terminal in dieser Sitzung testen."],
    ["Você controla seus dados.", "Controla os seus dados.", "Tú controlas tus datos.", "Vous gardez le contrôle de vos données.", "Hai il controllo dei tuoi dati.", "Du kontrollierst deine Daten."],
    ["Privacidade e LGPD", "Privacidade e RGPD", "Privacidad y LGPD", "Confidentialité et LGPD", "Privacy e LGPD", "Datenschutz und LGPD"],
    ["Entender as opções", "Compreender as opções", "Entender las opciones", "Comprendre les options", "Scopri le opzioni", "Optionen verstehen"],
    ["Entendi", "Compreendi", "Entendido", "Compris", "Ho capito", "Verstanden"],
    ["Armazenamento e privacidade", "Armazenamento e privacidade", "Almacenamiento y privacidad", "Stockage et confidentialité", "Archiviazione e privacy", "Speicherung und Datenschutz"],
    ["Ver política completa", "Ver a política completa", "Ver la política completa", "Lire la politique complète", "Leggi l’informativa completa", "Vollständige Richtlinie ansehen"],
    ["Fechar", "Fechar", "Cerrar", "Fermer", "Chiudi", "Schließen"],
    ["Pular para o conteúdo", "Saltar para o conteúdo", "Saltar al contenido", "Aller au contenu", "Vai al contenuto", "Zum Inhalt springen"],
    ["Neste dispositivo", "Neste dispositivo", "En este dispositivo", "Sur cet appareil", "Su questo dispositivo", "Auf diesem Gerät"],
    ["Sessão livre", "Sessão livre", "Sesión libre", "Session libre", "Sessione libera", "Freie Sitzung"],
    ["Sincronizando", "A sincronizar", "Sincronizando", "Synchronisation", "Sincronizzazione", "Synchronisierung"],
    ["Nuvem atualizada", "Nuvem atualizada", "Nube actualizada", "Cloud à jour", "Cloud aggiornato", "Cloud aktuell"],
    ["Nuvem indisponível", "Nuvem indisponível", "Nube no disponible", "Cloud indisponible", "Cloud non disponibile", "Cloud nicht verfügbar"],
    ["Na nuvem", "Na nuvem", "En la nube", "Dans le cloud", "Nel cloud", "In der Cloud"],
    ["Fundamentos", "Fundamentos", "Fundamentos", "Fondamentaux", "Fondamenti", "Grundlagen"],
    ["Aplicação", "Aplicação", "Aplicación", "Application", "Applicazione", "Anwendung"],
    ["Diagnóstico", "Diagnóstico", "Diagnóstico", "Diagnostic", "Diagnosi", "Diagnose"],
    ["Automação", "Automação", "Automatización", "Automatisation", "Automazione", "Automatisierung"],
    ["Arquitetura", "Arquitetura", "Arquitectura", "Architecture", "Architettura", "Architektur"],
    ["Disponível", "Disponível", "Disponible", "Disponible", "Disponibile", "Verfügbar"],
    ["Conquistado", "Conquistado", "Conseguido", "Obtenu", "Ottenuto", "Erreicht"],
    ["Navegação e arquivos", "Navegação e ficheiros", "Navegación y archivos", "Navigation et fichiers", "Navigazione e file", "Navigation und Dateien"],
    ["Texto e redirecionamento", "Texto e redirecionamento", "Texto y redirección", "Texte et redirection", "Testo e reindirizzamento", "Text und Umleitung"],
    ["Permissões e acesso", "Permissões e acesso", "Permisos y acceso", "Permissions et accès", "Permessi e accesso", "Berechtigungen und Zugriff"],
    ["Usuários e grupos", "Utilizadores e grupos", "Usuarios y grupos", "Utilisateurs et groupes", "Utenti e gruppi", "Benutzer und Gruppen"],
    ["Processos", "Processos", "Procesos", "Processus", "Processi", "Prozesse"],
    ["Redes e diagnóstico", "Redes e diagnóstico", "Redes y diagnóstico", "Réseaux et diagnostic", "Reti e diagnosi", "Netzwerke und Diagnose"],
    ["SSH e administração", "SSH e administração", "SSH y administración", "SSH et administration", "SSH e amministrazione", "SSH und Administration"],
    ["Kernel e hardware", "Kernel e hardware", "Kernel y hardware", "Noyau et matériel", "Kernel e hardware", "Kernel und Hardware"],
    ["Distribuições e pacotes", "Distribuições e pacotes", "Distribuciones y paquetes", "Distributions et paquets", "Distribuzioni e pacchetti", "Distributionen und Pakete"],
    ["Software livre e licenças", "Software livre e licenças", "Software libre y licencias", "Logiciel libre et licences", "Software libero e licenze", "Freie Software und Lizenzen"],
    ["Arquivos compactados", "Ficheiros comprimidos", "Archivos comprimidos", "Archives compressées", "Archivi compressi", "Komprimierte Archive"],
    ["Introdução a scripts", "Introdução a scripts", "Introducción a scripts", "Introduction aux scripts", "Introduzione agli script", "Einführung in Skripte"],
    ["Mapa de objetivos", "Mapa de objetivos", "Mapa de objetivos", "Carte des objectifs", "Mappa degli obiettivi", "Lernzielübersicht"],
    ["Referência / Linux Essentials", "Referência / Linux Essentials", "Referencia / Linux Essentials", "Référence / Linux Essentials", "Riferimento / Linux Essentials", "Referenz / Linux Essentials"],
    ["Explore os objetivos.", "Explore os objetivos.", "Explora los objetivos.", "Explorez les objectifs.", "Esplora gli obiettivi.", "Lernziele erkunden."],
    ["Veja a relação das trilhas com o Linux Essentials 010-160.", "Veja a relação dos percursos com o Linux Essentials 010-160.", "Consulta la relación entre las rutas y Linux Essentials 010-160.", "Découvrez les liens entre les parcours et Linux Essentials 010-160.", "Scopri il rapporto tra i percorsi e Linux Essentials 010-160.", "Sieh, wie die Lernpfade zu Linux Essentials 010-160 passen."],
    ["FONTE DE REFERÊNCIA", "FONTE DE REFERÊNCIA", "FUENTE DE REFERENCIA", "SOURCE DE RÉFÉRENCE", "FONTE DI RIFERIMENTO", "REFERENZQUELLE"],
    ["O material Linux Essentials 010-160 orienta este mapa. {related} dos {total} objetivos têm alguma trilha relacionada nesta versão. Uma trilha relacionada não significa cobertura completa ou preparação suficiente para o exame.", "O material Linux Essentials 010-160 orienta este mapa. {related} dos {total} objetivos têm um percurso relacionado nesta versão. Isso não significa cobertura completa nem preparação suficiente para o exame.", "El material Linux Essentials 010-160 guía este mapa. {related} de {total} objetivos tienen alguna ruta relacionada en esta versión. Esa relación no implica cobertura completa ni preparación suficiente para el examen.", "Le support Linux Essentials 010-160 guide cette carte. {related} objectifs sur {total} sont liés à un parcours dans cette version. Ce lien ne garantit ni une couverture complète ni une préparation suffisante à l’examen.", "Il materiale Linux Essentials 010-160 guida questa mappa. {related} obiettivi su {total} sono collegati a un percorso in questa versione. Il collegamento non garantisce una copertura completa né una preparazione sufficiente all’esame.", "Das Material Linux Essentials 010-160 dient als Grundlage dieser Übersicht. {related} von {total} Lernzielen sind hier mit einem Lernpfad verknüpft. Das bedeutet weder vollständige Abdeckung noch ausreichende Prüfungsvorbereitung."],
    ["Consultar objetivos oficiais ↗", "Consultar objetivos oficiais ↗", "Consultar objetivos oficiales ↗", "Consulter les objectifs officiels ↗", "Consulta gli obiettivi ufficiali ↗", "Offizielle Lernziele ansehen ↗"],
    ["objetivos com trilha relacionada", "objetivos com percurso relacionado", "objetivos con una ruta relacionada", "objectifs liés à un parcours", "obiettivi collegati a un percorso", "Lernziele mit passendem Lernpfad"],
    ["Ative a sincronização para acompanhar questões praticadas", "Ative a sincronização para acompanhar perguntas praticadas", "Activa la sincronización para seguir las preguntas practicadas", "Activez la synchronisation pour suivre les questions travaillées", "Attiva la sincronizzazione per seguire le domande svolte", "Aktiviere die Synchronisierung, um bearbeitete Fragen zu verfolgen"],
    ["{count} questões registradas em novas rodadas verificadas", "{count} perguntas registadas em novas rondas verificadas", "{count} preguntas registradas en nuevas rondas verificadas", "{count} questions enregistrées lors de nouvelles sessions vérifiées", "{count} domande registrate in nuove sessioni verificate", "{count} Fragen in neuen verifizierten Runden erfasst"],
    ["TÓPICO {id}", "TÓPICO {id}", "TEMA {id}", "THÈME {id}", "ARGOMENTO {id}", "THEMA {id}"],
    ["{count} trilha relacionada · {seen} questão(ões) registradas", "{count} percurso relacionado · {seen} perguntas registadas", "{count} ruta relacionada · {seen} preguntas registradas", "{count} parcours lié · {seen} questions enregistrées", "{count} percorso collegato · {seen} domande registrate", "{count} passender Lernpfad · {seen} Fragen erfasst"],
    ["{count} trilhas relacionadas · {seen} questão(ões) registradas", "{count} percursos relacionados · {seen} perguntas registadas", "{count} rutas relacionadas · {seen} preguntas registradas", "{count} parcours liés · {seen} questions enregistrées", "{count} percorsi collegati · {seen} domande registrate", "{count} passende Lernpfade · {seen} Fragen erfasst"],
    ["Ainda sem trilha correspondente", "Ainda sem percurso correspondente", "Aún sin ruta correspondiente", "Aucun parcours correspondant", "Nessun percorso corrispondente", "Noch kein passender Lernpfad"],
    ["Praticar {category} →", "Praticar {category} →", "Practicar {category} →", "S’exercer sur {category} →", "Esercitati su {category} →", "{category} üben →"],
    ["Mapa editorial independente. As questões existentes continuam vinculadas às fontes indicadas em cada resposta; o material oficial do LPI orienta a revisão e as futuras ampliações.", "Mapa editorial independente. As perguntas continuam associadas às fontes indicadas em cada resposta; o material oficial do LPI orienta a revisão e futuras ampliações.", "Mapa editorial independiente. Las preguntas siguen vinculadas a las fuentes indicadas en cada respuesta; el material oficial del LPI guía la revisión y futuras ampliaciones.", "Carte éditoriale indépendante. Les questions restent liées aux sources indiquées dans chaque réponse ; le support officiel du LPI guide la révision et les futurs ajouts.", "Mappa editoriale indipendente. Le domande restano collegate alle fonti indicate in ogni risposta; il materiale ufficiale LPI guida la revisione e i futuri ampliamenti.", "Unabhängige redaktionelle Übersicht. Die Fragen bleiben mit den bei jeder Antwort genannten Quellen verknüpft; das offizielle LPI-Material leitet Überarbeitung und Erweiterung."],
    ["Comunidade Linux e código aberto", "Comunidade Linux e código aberto", "Comunidad Linux y código abierto", "Communauté Linux et code ouvert", "Comunità Linux e codice aperto", "Linux-Community und Open Source"],
    ["Encontrando o caminho no Linux", "Encontrar o caminho no Linux", "Encontrar el camino en Linux", "Trouver son chemin dans Linux", "Orientarsi in Linux", "Den Weg in Linux finden"],
    ["O poder da linha de comando", "O poder da linha de comandos", "El poder de la línea de comandos", "La puissance de la ligne de commande", "La potenza della riga di comando", "Die Macht der Kommandozeile"],
    ["O sistema operacional Linux", "O sistema operativo Linux", "El sistema operativo Linux", "Le système d’exploitation Linux", "Il sistema operativo Linux", "Das Betriebssystem Linux"],
    ["Segurança e permissões", "Segurança e permissões", "Seguridad y permisos", "Sécurité et permissions", "Sicurezza e permessi", "Sicherheit und Berechtigungen"],
    ["Evolução do Linux e sistemas operacionais", "Evolução do Linux e sistemas operativos", "Evolución de Linux y sistemas operativos", "Évolution de Linux et des systèmes d’exploitation", "Evoluzione di Linux e dei sistemi operativi", "Entwicklung von Linux und Betriebssystemen"],
    ["Aplicações de código aberto", "Aplicações de código aberto", "Aplicaciones de código abierto", "Applications à code ouvert", "Applicazioni open source", "Open-Source-Anwendungen"],
    ["Habilidades de TIC e Linux", "Competências de TIC e Linux", "Competencias de TIC y Linux", "Compétences TIC et Linux", "Competenze TIC e Linux", "IT- und Linux-Kenntnisse"],
    ["Fundamentos da linha de comando", "Fundamentos da linha de comandos", "Fundamentos de la línea de comandos", "Bases de la ligne de commande", "Fondamenti della riga di comando", "Grundlagen der Kommandozeile"],
    ["Ajuda na linha de comando", "Ajuda na linha de comandos", "Ayuda en la línea de comandos", "Aide en ligne de commande", "Aiuto nella riga di comando", "Hilfe in der Kommandozeile"],
    ["Diretórios e listagem de arquivos", "Diretórios e listagem de ficheiros", "Directorios y listado de archivos", "Répertoires et liste des fichiers", "Directory ed elenco dei file", "Verzeichnisse und Dateilisten"],
    ["Criar, mover e remover arquivos", "Criar, mover e remover ficheiros", "Crear, mover y eliminar archivos", "Créer, déplacer et supprimer des fichiers", "Creare, spostare ed eliminare file", "Dateien erstellen, verschieben und entfernen"],
    ["Arquivos compactados e pacotes", "Ficheiros comprimidos e pacotes", "Archivos comprimidos y paquetes", "Archives compressées et paquets", "Archivi compressi e pacchetti", "Komprimierte Archive und Pakete"],
    ["Pesquisa e extração de dados", "Pesquisa e extração de dados", "Búsqueda y extracción de datos", "Recherche et extraction de données", "Ricerca ed estrazione di dati", "Suche und Datenextraktion"],
    ["Escolha de um sistema operacional", "Escolha de um sistema operativo", "Elección de un sistema operativo", "Choix d’un système d’exploitation", "Scelta di un sistema operativo", "Wahl eines Betriebssystems"],
    ["Hardware do computador", "Hardware do computador", "Hardware del ordenador", "Matériel de l’ordinateur", "Hardware del computer", "Computerhardware"],
    ["Onde os dados são armazenados", "Onde os dados são guardados", "Dónde se almacenan los datos", "Où les données sont stockées", "Dove sono archiviati i dati", "Wo Daten gespeichert werden"],
    ["Computador na rede", "Computador na rede", "Ordenador en la red", "Ordinateur sur le réseau", "Computer in rete", "Computer im Netzwerk"],
    ["Tipos de usuários", "Tipos de utilizadores", "Tipos de usuarios", "Types d’utilisateurs", "Tipi di utenti", "Benutzertypen"],
    ["Permissões e proprietários", "Permissões e proprietários", "Permisos y propietarios", "Permissions et propriétaires", "Permessi e proprietari", "Berechtigungen und Eigentümer"],
    ["Arquivos e diretórios especiais", "Ficheiros e diretórios especiais", "Archivos y directorios especiales", "Fichiers et répertoires spéciaux", "File e directory speciali", "Besondere Dateien und Verzeichnisse"],
    ["Organize a área de trabalho de um laboratório.", "Organize a área de trabalho de um laboratório.", "Organiza el área de trabajo de un laboratorio.", "Organisez l’espace de travail d’un laboratoire.", "Organizza l’area di lavoro di un laboratorio.", "Organisiere den Arbeitsbereich eines Labors."],
    ["Transforme comandos isolados em uma rotina útil.", "Transforme comandos isolados numa rotina útil.", "Convierte comandos aislados en una rutina útil.", "Transformez des commandes isolées en une routine utile.", "Trasforma comandi isolati in una procedura utile.", "Verbinde einzelne Befehle zu einem nützlichen Ablauf."],
    ["Distribua acesso sem abrir mão do controle.", "Distribua o acesso sem perder o controlo.", "Distribuye el acceso sin perder el control.", "Accordez les accès sans perdre le contrôle.", "Distribuisci gli accessi senza perdere il controllo.", "Vergib Zugriffe, ohne die Kontrolle zu verlieren."],
    ["Cada pessoa com a identidade e o acesso adequados.", "Cada pessoa com a identidade e o acesso adequados.", "Cada persona con la identidad y el acceso adecuados.", "Chaque personne avec l’identité et les accès adaptés.", "Ogni persona con l’identità e l’accesso adeguati.", "Jede Person erhält die passende Identität und den passenden Zugriff."],
    ["Descubra o que está em execução e controle as tarefas.", "Descubra o que está em execução e controle as tarefas.", "Descubre qué se está ejecutando y controla las tareas.", "Découvrez les processus en cours et gérez les tâches.", "Scopri cosa è in esecuzione e gestisci le attività.", "Erkenne laufende Prozesse und steuere Aufgaben."],
    ["Investigue interfaces, endereços e tráfego.", "Investigue interfaces, endereços e tráfego.", "Investiga interfaces, direcciones y tráfico.", "Examinez les interfaces, les adresses et le trafic.", "Esamina interfacce, indirizzi e traffico.", "Untersuche Schnittstellen, Adressen und Datenverkehr."],
    ["Entre com segurança e acompanhe os serviços.", "Aceda com segurança e acompanhe os serviços.", "Accede de forma segura y supervisa los servicios.", "Connectez-vous en sécurité et surveillez les services.", "Accedi in sicurezza e controlla i servizi.", "Melde dich sicher an und überwache die Dienste."],
    ["Observe os componentes que sustentam o sistema.", "Observe os componentes que sustentam o sistema.", "Observa los componentes que sostienen el sistema.", "Observez les composants qui font fonctionner le système.", "Osserva i componenti su cui si basa il sistema.", "Untersuche die Komponenten, die das System tragen."],
    ["Reconheça famílias e seus gerenciadores de pacotes.", "Reconheça famílias e os respetivos gestores de pacotes.", "Reconoce las familias y sus gestores de paquetes.", "Reconnaissez les familles et leurs gestionnaires de paquets.", "Riconosci le famiglie e i relativi gestori di pacchetti.", "Erkenne Distributionsfamilien und ihre Paketmanager."],
    ["Reconheça acesso ao código e condições de redistribuição.", "Reconheça o acesso ao código e as condições de redistribuição.", "Reconoce el acceso al código y las condiciones de redistribución.", "Comprenez l’accès au code et les conditions de redistribution.", "Riconosci l’accesso al codice e le condizioni di ridistribuzione.", "Verstehe Codezugang und Bedingungen für die Weitergabe."],
    ["Diferencie arquivos tar e compressão gzip.", "Distinga ficheiros tar de compressão gzip.", "Distingue los archivos tar de la compresión gzip.", "Distinguez les archives tar de la compression gzip.", "Distingui gli archivi tar dalla compressione gzip.", "Unterscheide tar-Archive von gzip-Komprimierung."],
    ["Leia a estrutura de um script simples de shell.", "Leia a estrutura de um script shell simples.", "Lee la estructura de un script de shell sencillo.", "Lisez la structure d’un script shell simple.", "Leggi la struttura di un semplice script shell.", "Lies den Aufbau eines einfachen Shell-Skripts."],
    ["História e fundamentos do Linux", "História e fundamentos do Linux", "Historia y fundamentos de Linux", "Histoire et fondements de Linux", "Storia e fondamenti di Linux", "Geschichte und Grundlagen von Linux"],
    ["Ordene as ideias que ligam Unix, GNU, kernel Linux e distribuições.", "Ordene as ideias que ligam Unix, GNU, o kernel Linux e as distribuições.", "Ordena las ideas que conectan Unix, GNU, el núcleo Linux y las distribuciones.", "Reliez Unix, GNU, le noyau Linux et les distributions dans l’ordre historique.", "Metti in ordine le idee che collegano Unix, GNU, il kernel Linux e le distribuzioni.", "Ordne die Zusammenhänge zwischen Unix, GNU, Linux-Kernel und Distributionen."],
    ["Instalação consciente", "Instalação consciente", "Instalación consciente", "Installation réfléchie", "Installazione consapevole", "Bewusste Installation"],
    ["Tome decisões sobre backup, imagem, mídia, teste e destino do disco em uma simulação.", "Tome decisões sobre cópia de segurança, imagem, suporte, teste e destino do disco numa simulação.", "Toma decisiones sobre copias de seguridad, imagen, medio, prueba y destino del disco en una simulación.", "Prenez des décisions sur la sauvegarde, l’image, le support, les tests et la destination du disque dans une simulation.", "Prendi decisioni su backup, immagine, supporto, test e destinazione del disco in una simulazione.", "Triff in einer Simulation Entscheidungen zu Backup, Image, Medium, Test und Ziellaufwerk."],
    ["Pronto para explorar", "Pronto para explorar", "Listo para explorar", "Prêt à explorer", "Pronto da esplorare", "Bereit zum Erkunden"],
    ["Praticar →", "Praticar →", "Practicar →", "S’exercer →", "Esercitati →", "Üben →"],
    ["Explorar →", "Explorar →", "Explorar →", "Explorer →", "Esplora →", "Erkunden →"],
    ["Melhor resultado: {score}%", "Melhor resultado: {score}%", "Mejor resultado: {score}%", "Meilleur résultat : {score} %", "Miglior risultato: {score}%", "Bestes Ergebnis: {score} %"],
    ["{count} questões", "{count} perguntas", "{count} preguntas", "{count} questions", "{count} domande", "{count} Fragen"],
    ["{tracks} trilhas · {questions} questões", "{tracks} percursos · {questions} perguntas", "{tracks} rutas · {questions} preguntas", "{tracks} parcours · {questions} questions", "{tracks} percorsi · {questions} domande", "{tracks} Lernpfade · {questions} Fragen"],
    ["Quizzes concluídos", "Questionários concluídos", "Cuestionarios completados", "Quiz terminés", "Quiz completati", "Abgeschlossene Quizze"],
    ["Acerto acumulado", "Taxa de acerto acumulada", "Aciertos acumulados", "Réussite cumulée", "Risposte corrette complessive", "Gesamttrefferquote"],
    ["Níveis certificados", "Níveis certificados", "Niveles certificados", "Niveaux validés", "Livelli certificati", "Zertifizierte Stufen"],
    ["{count} níveis", "{count} níveis", "{count} niveles", "{count} niveaux", "{count} livelli", "{count} Stufen"],
    ["NOVAS JORNADAS · Free", "NOVOS PERCURSOS · Free", "NUEVOS RECORRIDOS · Free", "NOUVEAUX PARCOURS · Free", "NUOVI PERCORSI · Free", "NEUE LERNWEGE · Free"],
    ["Entenda a origem. Planeje a instalação.", "Compreenda a origem. Planeie a instalação.", "Comprende el origen. Planifica la instalación.", "Comprenez les origines. Préparez l’installation.", "Comprendi le origini. Pianifica l’installazione.", "Verstehe die Ursprünge. Plane die Installation."],
    ["Descubra como o sistema se formou e ensaie decisões de instalação em segurança. Cada marco traz uma escolha, uma explicação e uma nova chance.", "Descubra como o sistema se formou e pratique decisões de instalação em segurança. Cada etapa traz uma escolha, uma explicação e uma nova oportunidade.", "Descubre cómo se formó el sistema y practica decisiones de instalación seguras. Cada etapa ofrece una elección, una explicación y otra oportunidad.", "Découvrez la formation du système et entraînez-vous à prendre des décisions d’installation sûres. Chaque étape propose un choix, une explication et une nouvelle chance.", "Scopri come si è formato il sistema ed esercitati a prendere decisioni di installazione sicure. Ogni tappa offre una scelta, una spiegazione e una nuova possibilità.", "Erfahre, wie das System entstand, und übe sichere Installationsentscheidungen. Jede Etappe bietet eine Wahl, eine Erklärung und eine neue Chance."],
    ["Explorar a história →", "Explorar a história →", "Explorar la historia →", "Explorer l’histoire →", "Esplora la storia →", "Geschichte erkunden →"],
    ["Simular instalação →", "Simular instalação →", "Simular instalación →", "Simuler l’installation →", "Simula l’installazione →", "Installation simulieren →"],
    ["Entrar →", "Entrar →", "Entrar →", "Se connecter →", "Accedi →", "Anmelden →"],
    ["Seu progresso", "O seu progresso", "Tu progreso", "Votre progression", "I tuoi progressi", "Dein Fortschritt"],
    ["Comece por aqui", "Comece por aqui", "Empieza aquí", "Commencez ici", "Inizia da qui", "Starte hier"],
    ["Trilhas de estudo", "Percursos de estudo", "Rutas de estudio", "Parcours d’étude", "Percorsi di studio", "Lernpfade"],
    ["Escolha o que estudar.", "Escolha o que estudar.", "Elige qué estudiar.", "Choisissez quoi étudier.", "Scegli cosa studiare.", "Wähle dein Lernthema."],
    ["Melhor aproveitamento em {category}", "Melhor aproveitamento em {category}", "Mejor resultado en {category}", "Meilleur résultat pour {category}", "Miglior risultato in {category}", "Bestes Ergebnis in {category}"],
    ["Continue de onde parou, em qualquer aparelho.", "Continue de onde parou, em qualquer dispositivo.", "Continúa donde lo dejaste en cualquier dispositivo.", "Reprenez là où vous en étiez sur n’importe quel appareil.", "Riprendi da dove eri rimasto su qualsiasi dispositivo.", "Setze auf jedem Gerät dort fort, wo du aufgehört hast."],
    ["Leve seu progresso com você.", "Leve o seu progresso consigo.", "Lleva tu progreso contigo.", "Emportez votre progression partout.", "Porta con te i tuoi progressi.", "Nimm deinen Fortschritt mit."],
    ["Resultados e missões deste perfil podem ser recuperados com seu código de acesso.", "Os resultados e missões deste perfil podem ser recuperados com o seu código de acesso.", "Los resultados y misiones de este perfil se pueden recuperar con tu código de acceso.", "Les résultats et les missions de ce profil peuvent être récupérés avec votre code d’accès.", "Risultati e missioni di questo profilo possono essere recuperati con il codice di accesso.", "Ergebnisse und Missionen dieses Profils lassen sich mit deinem Zugangscode wiederherstellen."],
    ["Ative a sincronização para guardar resultados e missões na nuvem e continuar em outro aparelho.", "Ative a sincronização para guardar resultados e missões na nuvem e continuar noutro dispositivo.", "Activa la sincronización para guardar resultados y misiones en la nube y continuar en otro dispositivo.", "Activez la synchronisation pour enregistrer vos résultats et missions dans le cloud et continuer sur un autre appareil.", "Attiva la sincronizzazione per salvare risultati e missioni nel cloud e continuare su un altro dispositivo.", "Aktiviere die Synchronisierung, um Ergebnisse und Missionen in der Cloud zu speichern und auf einem anderen Gerät fortzufahren."],
    ["Ver sincronização →", "Ver sincronização →", "Ver sincronización →", "Voir la synchronisation →", "Vedi sincronizzazione →", "Synchronisierung ansehen →"],
    ["Ativar sincronização →", "Ativar sincronização →", "Activar sincronización →", "Activer la synchronisation →", "Attiva sincronizzazione →", "Synchronisierung aktivieren →"],
    ["Avaliação / escolha sua sessão", "Avaliação / escolha a sua sessão", "Evaluación / elige tu sesión", "Évaluation / choisissez votre session", "Valutazione / scegli la sessione", "Bewertung / Sitzung wählen"],
    ["O que vamos praticar?", "O que vamos praticar?", "¿Qué vamos a practicar?", "Qu’allons-nous pratiquer ?", "Cosa esercitiamo?", "Was üben wir?"],
    ["Escolha o assunto, o nível e a quantidade. Cada resposta vem acompanhada de uma explicação técnica.", "Escolha o tema, o nível e a quantidade. Cada resposta inclui uma explicação técnica.", "Elige el tema, el nivel y la cantidad. Cada respuesta incluye una explicación técnica.", "Choisissez le sujet, le niveau et le nombre de questions. Chaque réponse comprend une explication technique.", "Scegli l’argomento, il livello e il numero di domande. Ogni risposta include una spiegazione tecnica.", "Wähle Thema, Stufe und Anzahl. Jede Antwort enthält eine technische Erklärung."],
    ["Assunto", "Tema", "Tema", "Sujet", "Argomento", "Thema"],
    ["Todos os assuntos", "Todos os temas", "Todos los temas", "Tous les sujets", "Tutti gli argomenti", "Alle Themen"],
    ["Dificuldade", "Dificuldade", "Dificultad", "Difficulté", "Difficoltà", "Schwierigkeit"],
    ["Quantidade de perguntas", "Número de perguntas", "Número de preguntas", "Nombre de questions", "Numero di domande", "Anzahl der Fragen"],
    ["{count} pergunta", "{count} pergunta", "{count} pregunta", "{count} question", "{count} domanda", "{count} Frage"],
    ["Uma rodada, novas combinações.", "Uma ronda, novas combinações.", "Una ronda, nuevas combinaciones.", "Une session, de nouvelles combinaisons.", "Un turno, nuove combinazioni.", "Eine Runde, neue Kombinationen."],
    ["As perguntas e as alternativas são embaralhadas. Não há repetição dentro da mesma rodada nem limite de tempo.", "As perguntas e opções são baralhadas. Não há repetições na mesma ronda nem limite de tempo.", "Las preguntas y opciones se mezclan. No hay repeticiones en una misma ronda ni límite de tiempo.", "Les questions et les réponses sont mélangées. Il n’y a ni répétition dans une session ni limite de temps.", "Domande e risposte sono mescolate. Non ci sono ripetizioni nello stesso turno né limiti di tempo.", "Fragen und Antworten werden gemischt. Innerhalb einer Runde gibt es keine Wiederholungen und kein Zeitlimit."],
    ["Iniciar quiz →", "Iniciar questionário →", "Iniciar cuestionario →", "Commencer le quiz →", "Avvia il quiz →", "Quiz starten →"],
    ["Três formas de avançar", "Três formas de avançar", "Tres formas de avanzar", "Trois façons de progresser", "Tre modi per progredire", "Drei Wege voranzukommen"],
    ["Reconheça comandos e suas finalidades.", "Reconheça comandos e as suas finalidades.", "Reconoce los comandos y su finalidad.", "Reconnaissez les commandes et leur utilité.", "Riconosci i comandi e il loro scopo.", "Erkenne Befehle und ihren Zweck."],
    ["Interprete opções, permissões e operações.", "Interprete opções, permissões e operações.", "Interpreta opciones, permisos y operaciones.", "Interprétez les options, permissions et opérations.", "Interpreta opzioni, permessi e operazioni.", "Deute Optionen, Berechtigungen und Vorgänge."],
    ["Resolva cenários e avalie detalhes de administração.", "Resolva cenários e avalie detalhes de administração.", "Resuelve situaciones y evalúa detalles de administración.", "Résolvez des scénarios et examinez les détails d’administration.", "Risolvi scenari e valuta i dettagli di amministrazione.", "Löse Szenarien und bewerte Administrationsdetails."],
    ["Processos e consultas DNS também aparecem no plano da disciplina. Consulte o professor sobre o recorte já trabalhado em aula.", "Processos e consultas DNS também constam do plano da disciplina. Consulte o professor sobre a matéria já abordada.", "Los procesos y las consultas DNS también forman parte del programa. Consulta al profesor qué contenidos se han tratado ya.", "Les processus et les requêtes DNS figurent aussi au programme. Demandez à l’enseignant quelles parties ont déjà été étudiées.", "Anche processi e query DNS fanno parte del programma. Chiedi al docente quali argomenti sono già stati trattati.", "Prozesse und DNS-Abfragen gehören ebenfalls zum Lehrplan. Frage die Lehrkraft, welche Inhalte bereits behandelt wurden."],
    ["Carregando perguntas Premium do servidor…", "A carregar perguntas Premium do servidor…", "Cargando preguntas Premium del servidor…", "Chargement des questions Premium depuis le serveur…", "Caricamento delle domande Premium dal server…", "Premium-Fragen werden vom Server geladen…"],
    ["{size} questões disponíveis neste recorte · até 100 por rodada {plan}. {mode}", "{size} perguntas disponíveis nesta seleção · até 100 por ronda {plan}. {mode}", "{size} preguntas disponibles en esta selección · hasta 100 por ronda {plan}. {mode}", "{size} questions disponibles pour cette sélection · jusqu’à 100 par session {plan}. {mode}", "{size} domande disponibili per questa selezione · fino a 100 per turno {plan}. {mode}", "{size} Fragen für diese Auswahl verfügbar · bis zu 100 pro {plan}-Runde. {mode}"],
    ["Quiz geral: com 10 ou mais questões, vale para o certificado do nível.", "Questionário geral: com 10 ou mais perguntas, conta para o certificado do nível.", "Cuestionario general: con 10 o más preguntas, cuenta para el certificado del nivel.", "Quiz général : avec au moins 10 questions, il compte pour le certificat du niveau.", "Quiz generale: con almeno 10 domande, vale per l’attestato del livello.", "Allgemeines Quiz: Ab 10 Fragen zählt es für das Zertifikat der Stufe."],
    ["Quiz por assunto: treino focado, sem emissão de certificado.", "Questionário por tema: treino específico, sem emissão de certificado.", "Cuestionario por tema: práctica específica, sin certificado.", "Quiz par sujet : entraînement ciblé, sans certificat.", "Quiz per argomento: esercizio mirato, senza attestato.", "Themenquiz: gezieltes Üben ohne Zertifikat."],
    ["Leia. Pense. Experimente.", "Leia. Pense. Experimente.", "Lee. Piensa. Prueba.", "Lisez. Réfléchissez. Essayez.", "Leggi. Pensa. Prova.", "Lies. Denk nach. Probiere aus."],
    ["Encerrar", "Terminar", "Terminar", "Quitter", "Termina", "Beenden"],
    ["Pergunta {index} de {total}", "Pergunta {index} de {total}", "Pregunta {index} de {total}", "Question {index} sur {total}", "Domanda {index} di {total}", "Frage {index} von {total}"],
    ["{count} acertos", "{count} respostas certas", "{count} aciertos", "{count} bonnes réponses", "{count} risposte corrette", "{count} richtige Antworten"],
    ["Progresso do quiz", "Progresso do questionário", "Progreso del cuestionario", "Progression du quiz", "Avanzamento del quiz", "Quiz-Fortschritt"],
    ["Confirmar resposta", "Confirmar resposta", "Confirmar respuesta", "Valider la réponse", "Conferma la risposta", "Antwort bestätigen"],
    ["Correto!", "Correto!", "¡Correcto!", "Correct !", "Corretto!", "Richtig!"],
    ["Ainda não. Vamos entender.", "Ainda não. Vamos compreender.", "Todavía no. Vamos a entenderlo.", "Pas encore. Voyons pourquoi.", "Non ancora. Vediamo perché.", "Noch nicht. Sehen wir uns das an."],
    ["Resposta:", "Resposta:", "Respuesta:", "Réponse :", "Risposta:", "Antwort:"],
    ["Ver resultado →", "Ver resultado →", "Ver resultado →", "Voir le résultat →", "Vedi il risultato →", "Ergebnis ansehen →"],
    ["Próxima pergunta →", "Pergunta seguinte →", "Siguiente pregunta →", "Question suivante →", "Domanda successiva →", "Nächste Frage →"],
    ["Encerrar esta rodada? Respostas parciais não entram no ranking.", "Terminar esta ronda? As respostas parciais não entram na classificação.", "¿Terminar esta ronda? Las respuestas parciales no aparecen en la clasificación.", "Quitter cette session ? Les réponses partielles ne comptent pas pour le classement.", "Terminare questo turno? Le risposte parziali non contano per la classifica.", "Diese Runde beenden? Teilantworten zählen nicht für die Rangliste."],
    ["01 / Fundamentos", "01 / Fundamentos", "01 / Fundamentos", "01 / Fondamentaux", "01 / Fondamenti", "01 / Grundlagen"],
    ["02 / Aplicação", "02 / Aplicação", "02 / Aplicación", "02 / Application", "02 / Applicazione", "02 / Anwendung"],
    ["03 / Diagnóstico", "03 / Diagnóstico", "03 / Diagnóstico", "03 / Diagnostic", "03 / Diagnosi", "03 / Diagnose"],
  ];
  const index = locale === "es" ? 2 : 0;
  const dictionary = new Map(rows.map((row) => [row[0], row[index]]));
  const t = (source, values = {}) => {
    const template = dictionary.get(source) || source;
    return template.replace(/\{([a-z]+)\}/g, (_, name) => String(values[name] ?? ""));
  };
  function translateText(node) {
    const original = node.nodeValue;
    const trimmed = original.trim();
    const translated = dictionary.get(trimmed);
    if (translated && translated !== trimmed) node.nodeValue = original.replace(trimmed, translated);
  }
  function translate(root = document.body) {
    if (locale === "pt-BR" || !root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      if (!root.parentElement?.closest("script, style, code, pre, textarea, [data-no-translate]")) translateText(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches("script, style, code, pre, textarea, [data-no-translate]")) return;
    for (const attribute of ["aria-label", "title", "placeholder"]) {
      const value = root.getAttribute(attribute);
      const translated = dictionary.get(value);
      if (translated && translated !== value) root.setAttribute(attribute, translated);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches("script, style, code, pre, textarea, [data-no-translate]")) { walker.currentNode = node; continue; }
        for (const attribute of ["aria-label", "title", "placeholder"]) {
          const value = node.getAttribute(attribute);
          const translated = dictionary.get(value);
          if (translated && translated !== value) node.setAttribute(attribute, translated);
        }
      } else if (!node.parentElement?.closest("script, style, code, pre, textarea, [data-no-translate]")) translateText(node);
    }
  }
  function initialize() {
    const select = document.querySelector("#language");
    select.value = locale;
    select.addEventListener("change", () => {
      if (!supported.includes(select.value)) return;
      try { localStorage.setItem(key, select.value); } catch {}
      location.reload();
    });
    translate();
    if (locale !== "pt-BR") {
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === "characterData") translate(record.target);
          else if (record.type === "attributes") translate(record.target);
          else for (const node of record.addedNodes) translate(node);
        }
      });
      observer.observe(document.body, { childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "title", "placeholder"], subtree: true });
    }
  }
  window.FlowI18n = { locale: () => locale, has: (source) => dictionary.has(source), t, translate };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
