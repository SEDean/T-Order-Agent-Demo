/**
 * Thrive light/dark theme, shared by the shell and the Teams frame.
 * Applies the saved choice before first paint. Changes are saved to localStorage,
 * and the browser's "storage" event carries them to the other same-page frame, so
 * no cross-window messaging is needed.
 */
(function () {
  "use strict";
  const KEY = "centric-theme";
  const root = document.documentElement;
  const read = () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } };
  const write = (t) => { try { localStorage.setItem(KEY, t); } catch (_) {} };
  const apply = (t) => { root.dataset.theme = t === "light" ? "light" : "dark"; };

  apply(read());
  window.addEventListener("storage", (e) => { if (e.key === KEY) apply(e.newValue); });

  window.CentricTheme = {
    current: () => root.dataset.theme,
    set(t) { apply(t); write(root.dataset.theme); },
  };
})();
