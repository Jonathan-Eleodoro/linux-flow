/* Persistência local opcional. O navegador é ambiente não confiável:
 * validamos dados reidratados e nunca os interpretamos como HTML ou código.
 * Falha de quota / modo privado degrada para memória, preservando o uso atual. */
(function () {
  "use strict";
  const KEY = "linux_flow.v1";
  let persistent = false;
  let state = empty();
  function empty() {
    return {
      profiles: [],
      current: null,
      results: [],
      labs: [],
      theme: "dark",
      sound: false,
    };
  }
  const safeName = (value) =>
    typeof value === "string" && value.trim().length >= 2 && value.length <= 32;
  const safeId = (value) =>
    typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
  function validRecord(r, ids) {
    return (
      r &&
      safeId(r.id) &&
      ids.has(r.userId) &&
      [1, 2, 3].includes(r.level) &&
      ["all", ...FlowData.categories.map((c) => c.id)].includes(r.category) &&
      Number.isInteger(r.total) &&
      r.total >= 1 &&
      r.total <= 100 &&
      Number.isInteger(r.correct) &&
      r.correct >= 0 &&
      r.correct <= r.total &&
      typeof r.date === "string" &&
      Number.isFinite(Date.parse(r.date))
    );
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && raw.length < 500000) {
      const saved = JSON.parse(raw);
      state.profiles = (Array.isArray(saved.profiles) ? saved.profiles : [])
        .filter((p) => p && safeId(p.id) && safeName(p.name))
        .slice(0, 30);
      const ids = new Set(state.profiles.map((p) => p.id));
      state.current = ids.has(saved.current) ? saved.current : null;
      state.results = (Array.isArray(saved.results) ? saved.results : [])
        .filter((r) => validRecord(r, ids))
        .slice(-300);
      state.labs = (Array.isArray(saved.labs) ? saved.labs : [])
        .filter(
          (l) =>
            l &&
            ids.has(l.userId) &&
            Number.isInteger(l.mission) &&
            l.mission >= 0 &&
            l.mission < 6,
        )
        .slice(-180);
      state.theme = saved.theme === "light" ? "light" : "dark";
      state.sound = saved.sound === true;
      persistent = true;
    }
  } catch {
    /* Um registro corrompido não deve impedir o carregamento da página. */
  }
  function save() {
    if (!persistent) return true;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch {
      persistent = false;
      return false;
    }
  }
  function permission(value) {
    persistent = value;
    if (value) return save();
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* Continua em memória. */
    }
    return true;
  }
  function clear() {
    state = empty();
    persistent = false;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* O navegador pode bloquear acesso. */
    }
  }
  window.FlowStore = {
    get state() {
      return state;
    },
    get persistent() {
      return persistent;
    },
    save,
    permission,
    clear,
    safeName,
  };
})();
