/**
 * Shell view preferences: device view (desktop | mobile) and app cues (on | off).
 * Loaded in <head> so the chosen view is applied before first paint (no layout flash).
 *
 * Precedence: URL query (?view=desktop|mobile&cues=on|off) > saved choice > default.
 * URL values apply to this visit only, so a shared demo link never overwrites a
 * presenter's saved setup. Toggling a control saves the new choice to localStorage.
 *
 * State is mirrored on <html> as data-view / data-cues for CSS, and announced with a
 * "centric:prefs" event for shell.js.
 *
 * The Teams frame runs the app cues (teams/cues.js), and it cannot always read this page
 * (opened from file://, the browser isolates frames). So, like the theme, the effective
 * value is published to localStorage under "<key>-live", and the frame's changes come
 * back through the browser's "storage" event. No cross-window messaging is needed.
 */
(function () {
  "use strict";
  const root = document.documentElement;
  const OPTIONS = {
    view: { key: "centric-view", values: ["mobile", "desktop"] },   // first value = default
    cues: { key: "centric-cues", values: ["on", "off"] },
  };
  const query = new URLSearchParams(location.search);
  const read = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const valid = (name, v) => OPTIONS[name].values.includes(v);

  const live = (name) => OPTIONS[name].key + "-live";

  for (const [name, { key, values }] of Object.entries(OPTIONS)) {
    const pick = [query.get(name), read(key)].find((v) => valid(name, v));
    root.dataset[name] = pick || values[0];
    write(live(name), root.dataset[name]);
  }

  window.CentricPrefs = {
    get: (name) => root.dataset[name],
    set(name, value) {
      if (!valid(name, value) || root.dataset[name] === value) return;
      root.dataset[name] = value;
      write(OPTIONS[name].key, value);
      write(live(name), value);
      window.dispatchEvent(new CustomEvent("centric:prefs", { detail: { name, value } }));
    },
    toggle(name) {
      const [a, b] = OPTIONS[name].values;
      this.set(name, root.dataset[name] === a ? b : a);
    },
  };

  /* A change made in the frame (the cue tip's × button) arrives as a storage event. */
  window.addEventListener("storage", (e) => {
    const name = Object.keys(OPTIONS).find((n) => e.key === live(n));
    if (name) window.CentricPrefs.set(name, e.newValue);
  });
})();
