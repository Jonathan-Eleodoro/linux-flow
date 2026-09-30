// Copia apenas o bloco indicado; os guias também funcionam sem JavaScript.
document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy);
    if (!source) return;
    const value = source.textContent.trim();
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const selection = getSelection();
        const range = document.createRange();
        range.selectNodeContents(source);
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = "Selecione e copie";
        return;
      }
      button.textContent = "Copiado";
    } catch {
      button.textContent = "Selecione e copie";
    }
    setTimeout(() => { button.textContent = "Copiar"; }, 2500);
  });
});
