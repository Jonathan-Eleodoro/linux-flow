/* Inventário local gerado a partir do mesmo acervo exibido aos alunos. */
(() => {
  const data = window.FlowData;
  const categoryRoot = document.getElementById("audit-categories");
  const objectiveRoot = document.getElementById("audit-objective-list");
  if (!data?.categories || !data?.questions || !data?.lpiTopics) {
    categoryRoot.textContent = "Não foi possível ler o acervo local.";
    objectiveRoot.textContent = "Confira se js/data.js está disponível.";
    return;
  }
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const categories = new Map(data.categories.map((category) => [category.id, category]));
  const objectives = data.lpiTopics.flatMap((topic) => topic.objectives);
  const count = (id, level) => data.questions.filter((question) =>
    question.category === id && (!level || question.level === level)).length;
  document.getElementById("audit-tracks").textContent = data.categories.length;
  document.getElementById("audit-questions").textContent = data.questions.length;
  document.getElementById("audit-objectives").textContent = objectives.length;
  document.getElementById("audit-gaps").textContent = objectives.filter((item) => !item.categories.length).length;

  categoryRoot.innerHTML = data.categories.map((category) => {
    const questions = data.questions.filter((question) => question.category === category.id);
    const related = objectives.filter((item) => item.categories.includes(category.id))
      .map((item) => item.id);
    return `<details class="audit-category"><summary><span class="audit-index">${esc(category.number)}</span>
      <strong>${esc(category.name)}</strong><span class="tag">${questions.length} questões</span></summary>
      <div class="audit-category-body"><p>Objetivos relacionados: ${related.length ? related.map(esc).join(", ") : "nenhum"}.
      Fonte da trilha: ${esc(category.source)}.</p>
      <div class="audit-levels" aria-label="Distribuição por dificuldade">
        ${[1, 2, 3].map((level) => `<span>Nível ${level}: <strong>${count(category.id, level)}</strong></span>`).join("")}</div>
      <ol class="audit-questions">${questions.map((question) => `<li><span class="audit-question-id">${esc(question.id)} · nível ${question.level}</span>
        <strong>${esc(question.prompt)}</strong>
        <ol class="audit-choices">${question.options.map((option) => `<li class="${option === question.answer ? "correct" : ""}">${esc(option)}</li>`).join("")}</ol>
        <p><b>Explicação:</b> ${esc(question.explanation)}</p><small>Fonte registrada: ${esc(question.source)}</small></li>`).join("")}</ol></div></details>`;
  }).join("");

  objectiveRoot.innerHTML = objectives.map((objective) => {
    const related = objective.categories.map((id) => categories.get(id)?.name || id);
    return `<div class="audit-objective ${related.length ? "" : "missing"}"><span>${esc(objective.id)}</span>
      <strong>${esc(objective.title)}</strong><small>${related.length ? `Trilhas relacionadas: ${related.map(esc).join(", ")}` : "Sem trilha relacionada"}</small></div>`;
  }).join("");
})();
