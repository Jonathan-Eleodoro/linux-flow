/* Sugestões de estudo usam apenas progresso confirmado; não criam pontos artificiais. */
(function (root) {
  "use strict";
  function plan(results, labs, categories, missionCount, maxLevel, qualifies) {
    const validResults = Array.isArray(results) ? results : [];
    const completedMissions = new Set((Array.isArray(labs) ? labs : [])
      .filter((index) => Number.isInteger(index) && index >= 0 && index < missionCount));
    const explored = new Set(validResults.map((record) => record.category)
      .filter((id) => id !== "all" && categories.some((item) => item.id === id)));
    const certified = new Set(validResults.filter(qualifies).map((record) => record.level)
      .filter((level) => Number.isInteger(level) && level >= 1 && level <= maxLevel));
    const nextMission = Array.from({ length: missionCount }, (_, index) => index)
      .find((index) => !completedMissions.has(index));
    const recentByCategory = new Map();
    [...validResults].sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .forEach((record) => { if (record.category !== "all") recentByCategory.set(record.category, record); });
    const weak = categories.find((item) => {
      const record = recentByCategory.get(item.id);
      return record && record.total > 0 && record.correct / record.total < 0.8;
    });
    const nextLevel = Array.from({ length: maxLevel }, (_, index) => index + 1)
      .find((level) => !certified.has(level));
    const unseen = categories.find((item) => !explored.has(item.id));
    let focus;
    if (!validResults.length) focus = { kind: "learning", category: "historia" };
    else if (weak) focus = { kind: "review", category: weak.id,
      level: recentByCategory.get(weak.id).level };
    else if (nextLevel) focus = { kind: "certificate", level: nextLevel };
    else if (unseen) focus = { kind: "explore", category: unseen.id };
    else focus = { kind: "terminal", mission: nextMission ?? 0 };
    return { focus, explored: explored.size, certified: certified.size,
      completedMissions: completedMissions.size, nextMission };
  }
  root.FlowJourney = Object.freeze({ plan });
})(typeof window === "undefined" ? module.exports : window);
