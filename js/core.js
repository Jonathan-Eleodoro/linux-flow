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
  /** Sorteia sem reposição e embaralha alternativas independentemente.
   * O acerto é comparado ao texto canônico, nunca à posição na tela. */
  function session(questions, category, level, count) {
    const available = pool(questions, category, level);
    if (!Number.isInteger(count) || count < 1 || count > available.length)
      throw new Error("Quantidade indisponível.");
    return shuffle(available)
      .slice(0, count)
      .map((q) => ({ ...q, options: shuffle(q.options) }));
  }
  function result(answers) {
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
        { name: "Pinguim explorador", icon: "🐧" },
        { name: "Coruja analista", icon: "🦉" },
        { name: "Raposa administradora", icon: "🦊" },
      ][level] || { name: "Pinguim explorador", icon: "🐧" }
    );
  }
  /** Classificação comparável: a tela aplica nível/quantidade antes desta função.
   * Uma melhor tentativa por perfil; empates favorecem a conclusão mais antiga.
   * Não há relógio competitivo, para não penalizar leitura e acessibilidade. */
  function ranking(records) {
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
