/**
 * Shell behaviour: theme toggle, device-view toggle, cues toggle, and the frame's
 * loading state. Preferences live in prefs.js; the cue overlay lives in cues.js.
 * The Teams frame follows the theme through localStorage (see theme.js).
 */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const prefs = window.CentricPrefs;
  const viewBtns = document.querySelectorAll("[data-view-btn]");
  const cueBtn = $("#cueBtn");

  $("#app").addEventListener("load", () => $("#stage").classList.add("loaded"));
  $("#themeBtn").addEventListener("click", () => {
    window.CentricTheme.set(window.CentricTheme.current() === "light" ? "dark" : "light");
  });

  /* Reflect current prefs on the controls (aria-pressed drives their styling). */
  function sync() {
    const view = prefs.get("view"), cues = prefs.get("cues") === "on";
    viewBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.viewBtn === view)));
    cueBtn.setAttribute("aria-pressed", String(cues));
    cueBtn.querySelector(".cue-state").textContent = cues ? "on" : "off";
  }
  viewBtns.forEach((b) => b.addEventListener("click", () => prefs.set("view", b.dataset.viewBtn)));
  cueBtn.addEventListener("click", () => prefs.toggle("cues"));
  window.addEventListener("centric:prefs", sync);
  sync();
})();
