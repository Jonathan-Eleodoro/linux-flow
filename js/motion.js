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
    const rail = container.querySelector(".feature-rail");
    const cards = [...rail.querySelectorAll(".feature-card")];
    let index = 0;
    let direction = 1;
    let pauseUntil = 0;
    const pause = () => { pauseUntil = Date.now() + 15000; };
    const move = (next) => {
      index = Math.max(0, Math.min(cards.length - 1, next));
      rail.scrollTo({ left: cards[index].offsetLeft - cards[0].offsetLeft,
        behavior: reduced() ? "auto" : "smooth" });
    };
    container.querySelector("#feature-prev").addEventListener("click", () => { pause(); move(index - 1); });
    container.querySelector("#feature-next").addEventListener("click", () => { pause(); move(index + 1); });
    rail.addEventListener("pointerdown", pause);
    rail.addEventListener("focusin", pause);
    rail.addEventListener("scroll", () => {
      const left = rail.scrollLeft;
      index = cards.reduce((nearest, card, number) =>
        Math.abs(card.offsetLeft - cards[0].offsetLeft - left) <
        Math.abs(cards[nearest].offsetLeft - cards[0].offsetLeft - left) ? number : nearest, 0);
    }, { passive: true });
    if (!reduced() && cards.length > 1) showcaseTimer = setInterval(() => {
      if (!container.isConnected) clearInterval(showcaseTimer);
      else if (document.visibilityState === "visible" && Date.now() > pauseUntil &&
        !container.matches(":hover, :focus-within") &&
        container.getBoundingClientRect().top < root.innerHeight &&
        container.getBoundingClientRect().bottom > 0) {
        if (index === cards.length - 1 || rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 4) direction = -1;
        if (rail.scrollLeft <= 4) direction = 1;
        move(index + direction);
      }
    }, 5000);
  }
  root.FlowMotion = Object.freeze({ enter, reveal, showcase });
})(window);
