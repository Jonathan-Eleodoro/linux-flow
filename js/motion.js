/* Movimento progressivo: o conteúdo permanece legível sem animação ou API visual. */
(function (root) {
  "use strict";
  const reduced = () => root.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let observer;
  let showcaseTimer;
  function enter(element) {
    if (reduced() || !element?.animate) return;
    element.animate([
      { opacity: 0.72, transform: "translateY(10px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" });
  }
  function reveal(container) {
    observer?.disconnect();
    if (reduced() || !root.IntersectionObserver || !container) return;
    const current = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.animate?.([
          { opacity: 0.75, transform: "translateY(14px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 360, easing: "cubic-bezier(.2,.7,.2,1)" });
        current.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -24px 0px", threshold: 0.08 });
    observer = current;
    container.querySelectorAll(".panel, .track-card, .certificate")
      .forEach((element) => current.observe(element));
  }
  function showcase(container) {
    clearInterval(showcaseTimer);
    if (!container) return;
    const scenes = [...container.querySelectorAll(".landing-scene")];
    const controls = [...container.querySelectorAll("[data-scene]")];
    let index = 0;
    const select = (next) => {
      index = next;
      scenes.forEach((scene, number) => { scene.hidden = number !== index; });
      controls.forEach((control, number) => {
        control.setAttribute("aria-pressed", String(number === index));
      });
    };
    controls.forEach((control, number) => control.addEventListener("click", () => {
      clearInterval(showcaseTimer);
      select(number);
    }));
    select(index);
    if (!reduced() && scenes.length > 1) showcaseTimer = setInterval(() => {
      if (document.visibilityState === "visible" && container.isConnected) select((index + 1) % scenes.length);
      if (!container.isConnected) clearInterval(showcaseTimer);
    }, 7000);
  }
  root.FlowMotion = Object.freeze({ enter, reveal, showcase });
})(window);
