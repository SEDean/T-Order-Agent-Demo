/**
 * Thrive light/dark theme, shared by the shell and the Teams frame.
 * Light by default. Applies the saved choice before first paint. Changes are saved to
 * localStorage, and the browser's "storage" event carries them to the other same-page frame,
 * so no cross-window messaging is needed.
 * Real phones (the top page 560px or narrower) are always light: they have no theme toggle.
 */
(function () {
  "use strict";
  const KEY = "centric-theme";
  const root = document.documentElement;
  const read = () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } };
  const write = (t) => { try { localStorage.setItem(KEY, t); } catch (_) {} };
  const phone = (() => { try { return window.top.matchMedia("(max-width:560px)").matches; } catch (_) { return false; } })();
  const apply = (t) => { root.dataset.theme = !phone && t === "dark" ? "dark" : "light"; };

  apply(read());
  window.addEventListener("storage", (e) => { if (e.key === KEY) apply(e.newValue); });

  window.CentricTheme = {
    current: () => root.dataset.theme,
    set(t) { apply(t); write(root.dataset.theme); },
  };
})();
