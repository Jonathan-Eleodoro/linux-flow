/* Regras puras: sem DOM e sem armazenamento. Separar domínio e apresentação
 * permite testar embaralhamento, avaliação e ranking sem abrir o navegador. */
(function (root) {
  "use strict";
  /** Fisher–Yates em uma cópia: evita alterar o banco editorial compartilhado.
   * Cada índice recebe uma oportunidade uniforme quando random é uniforme.
   * A injeção de random torna verificações determinísticas possíveis. */
  function shuffle(items, random = Math.random) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function pool(questions, category, level) {
    return questions.filter(
      (q) =>
        (category === "all" || q.category === category) &&
        q.level === Number(level),
    );
  }
  /** Sorteia sem reposição, distribui as letras corretas e evita repetir a
   * rodada anterior quando há mais de uma combinação possível. O acerto segue
   * comparado ao texto canônico, nunca à posição na tela. */
  function session(questions, category, level, count, previous = []) {
    const available = pool(questions, category, level);
    if (!Number.isInteger(count) || count < 1 || count > 100 || count > available.length)
      throw new Error("Quantidade indisponível.");
    const selected = shuffle(available).slice(0, count);
    if (previous.length === count && selected.every((q, i) => q.id === previous[i].id)) {
      if (count > 1) [selected[0], selected[1]] = [selected[1], selected[0]];
      else if (available.length > 1) selected[0] = available.find((q) => q.id !== previous[0].id);
    }
    const priorPosition = new Map(previous.map((q) =>
      [q.id, q.answerIndex ?? q.options?.indexOf(q.answer)]));
    const uses = [0, 0, 0, 0];
    let lastPosition = -1;
    return selected.map((q, index) => {
      const candidates = shuffle([0, 1, 2, 3]).filter((position) =>
        position !== lastPosition && position !== priorPosition.get(q.id)
        && position !== previous[index]?.answerIndex);
      const fewest = Math.min(...candidates.map((position) => uses[position]));
      const answerIndex = candidates.find((position) => uses[position] === fewest);
      const options = shuffle(q.options.filter((option) => option !== q.answer));
      options.splice(answerIndex, 0, q.answer);
      uses[answerIndex]++;
      lastPosition = answerIndex;
      return { ...q, options };
    });
  }
  function result(answers) {
    // A correção usa o texto canônico após o embaralhamento das alternativas.
    const correct = answers.filter(
      (a) => a.selected === a.question.answer,
    ).length;
    const total = answers.length;
    return {
      total,
      correct,
      errors: total - correct,
      percent: total ? Math.round((correct * 100) / total) : 0,
    };
  }
  /** Certificação exige prova geral, pelo menos dez questões e acerto real >=80%.
   * Não usa porcentagem arredondada, evitando aprovação por arredondamento. */
  function qualifies(record) {
    return (
      record.category === "all" &&
      record.total >= 10 &&
      record.correct / record.total >= 0.8
    );
  }
  function mascot(level) {
    return (
      [
        null,
        { name: "Pinguim explorador", src: "assets/mascots/penguin.svg",
          focus: "Reconhecer", description: "Identifica comandos, caminhos e conceitos essenciais antes de avançar." },
        { name: "Coruja analista", src: "assets/mascots/owl.svg",
          focus: "Interpretar", description: "Lê saídas e opções com atenção para entender o que o sistema está mostrando." },
        { name: "Raposa administradora", src: "assets/mascots/fox.svg",
          focus: "Diagnosticar", description: "Escolhe uma ação segura para resolver cenários de administração e rede." },
        { name: "Castor engenheiro", src: "assets/mascots/beaver.svg",
          focus: "Automatizar", description: "Planeja rotinas reproduzíveis, testa scripts e organiza tarefas recorrentes." },
        { name: "Lince arquiteta", src: "assets/mascots/lynx.svg",
          focus: "Projetar", description: "Relaciona serviços, segurança e observabilidade em ambientes mais complexos." },
      ][level] || { name: "Pinguim explorador", src: "assets/mascots/penguin.svg",
        focus: "Reconhecer", description: "Identifica comandos e conceitos essenciais." }
    );
  }
  /** Classificação comparável: a tela aplica nível/quantidade antes desta função.
   * Uma melhor tentativa por perfil; empates favorecem a conclusão mais antiga.
   * Não há relógio competitivo, para não penalizar leitura e acessibilidade. */
  function ranking(records) {
    // Retém a melhor tentativa por pessoa para não premiar volume de envios.
    const ordered = [...records].sort(
      (a, b) =>
        b.correct / b.total - a.correct / a.total ||
        a.date.localeCompare(b.date),
    );
    const seen = new Set();
    return ordered
      .filter((r) => !seen.has(r.userId) && seen.add(r.userId))
      .slice(0, 20);
  }
  root.FlowCore = Object.freeze({
    shuffle,
    pool,
    session,
    result,
    qualifies,
    mascot,
  });
  root.FlowRanking = ranking;
})(typeof window === "undefined" ? globalThis : window);
