/**
 * Shell behaviour: theme toggle and the frame's loading state.
 * The Teams frame follows the theme through localStorage (see theme.js).
 */
(function () {
  "use strict";
  const frame = document.getElementById("app");
  const stage = document.getElementById("stage");
  const toggle = document.getElementById("themeBtn");

  frame.addEventListener("load", () => stage.classList.add("loaded"));
  toggle.addEventListener("click", () => {
    window.CentricTheme.set(window.CentricTheme.current() === "light" ? "dark" : "light");
  });
})();
