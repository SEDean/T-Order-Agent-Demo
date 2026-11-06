/**
 * Shared building blocks for the Teams screens, exposed as window.Teams.ui.
 *   el(tag, cls, ...kids)       element with class and children (strings become text nodes)
 *   icon(name | path, cls)      24×24 stroke icon from ICON (or a raw path)
 *   button(cls, ...kids)        type="button" element
 *   avatar(person, cls)         initials circle with optional presence dot
 *   when(day, time)             "9:52 AM" today, else "Yesterday" / "Mon" / "10/28"
 *   listPane(opts)              a Teams list screen: header, search, filter chips, list
 * Everything is built with createElement/textContent; nothing parses HTML.
 */
"use strict";
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const ICON = {
    search: "M11 4.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM16 16l4.5 4.5",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    back: "M14.5 5.5L8 12l6.5 6.5",
    edit: "M13 5l6 6-9.5 9.5H4V15L13 5zM11 7.5l5.5 5.5",
    video: "M3 6.5h12.5v11H3zM15.5 10.8l5-3v8.4l-5-3",
    call: "M5 4h4l1.5 4.5-2.3 1.7a12 12 0 005.6 5.6l1.7-2.3L20 15v4a2 2 0 01-2.2 2A16.5 16.5 0 013 6.2 2 2 0 015 4z",
    chat: "M12 3a9 9 0 00-7.7 13.7L3 21l4.5-1.2A9 9 0 1012 3z",
    people: "M9 9a3 3 0 100-.01M3.5 19a5.5 5.5 0 0111 0M17 10a2.3 2.3 0 100-.01M15.6 14.6a4.6 4.6 0 015 4.4",
    send: "M4.5 12L20 4.5 16.5 20l-4.3-5.2L4.5 12zM12.2 14.8L20 4.5",
    plus: "M12 5v14M5 12h14",
    close: "M6 6l12 12M18 6L6 18",
    chev: "M9.5 5.5L16 12l-6.5 6.5",
    down: "M6 9l6 6 6-6",
    star: "M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z",
    mic: "M12 4a2.5 2.5 0 012.5 2.5v5a2.5 2.5 0 01-5 0v-5A2.5 2.5 0 0112 4zM6.5 11.5a5.5 5.5 0 0011 0M12 17v3",
    speaker: "M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11",
    sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
    hash: "M9 4L7 20M17 4l-2 16M4.5 9h15M3.5 15h15",
    in: "M17 7L7 17M7 9.5V17h7.5",
    out: "M7 17L17 7M9.5 7H17v7.5",
    missed: "M4 8l6 6 3-3 7 7M14 18h6v-6",
    voicemail: "M4 12.5a3 3 0 106 0 3 3 0 10-6 0M14 12.5a3 3 0 106 0 3 3 0 10-6 0M7 15.5h10",
    note: "M6 4h12v16H6zM9 8h6M9 12h6M9 16h3",
    file: "M7 3.5h7l4.5 4.5v12.5H7zM14 3.5V8h4.5",
  };
  function icon(name, cls) {
    const s = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("class", "ic" + (name === "more" ? " dots" : "") + (cls ? " " + cls : ""));
    p.setAttribute("d", ICON[name] || name);
    s.append(p);
    return s;
  }
  function el(tag, cls, ...kids) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    kids.flat().forEach((k) => k != null && k !== false && n.append(k));
    return n;
  }
  function button(cls, ...kids) { const b = el("button", cls, ...kids); b.type = "button"; return b; }
  function iconButton(name, title, cls) {
    const b = button("btn-ic" + (cls ? " " + cls : ""), icon(name));
    b.title = title;
    b.setAttribute("aria-label", title);
    return b;
  }
  function avatar(p, cls) {
    const a = el("span", "cava" + (cls ? " " + cls : ""), p.ini, p.presence ? el("span", "dot " + p.presence) : null);
    a.style.background = p.bg;
    return a;
  }

  const today = new Date();
  const dayStart = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);
  function when(day, time) {
    if (!day) return time || "";
    if (day === 1) return "Yesterday";
    const d = dayStart(day);
    return day < 7 ? d.toLocaleDateString("en-US", { weekday: "short" }) : (d.getMonth() + 1) + "/" + d.getDate();
  }

  /**
   * A Teams list screen. opts: { id, title, cls, chips: [{key, label, test}], actions: [button],
   * search: placeholder, searchText(item) }. Returns { pane, list, add(row, item), refresh(),
   * filter(key) }. One chip at a time; tapping the active chip clears it. Search matches
   * searchText(item) case-insensitively. Rows whose item fails the chip or search are hidden.
   */
  function listPane(o) {
    const pane = document.getElementById(o.id);
    pane.classList.add("pane", "side");
    if (o.cls) pane.classList.add(...o.cls.split(" "));
    const back = iconButton("back", "Back", "back");
    back.dataset.back = "";
    const head = el("div", "cl-h", back, el("span", "cl-ava", "JS"), el("h2", null, o.title), o.actions);
    const rows = [];
    let chip = null, query = "";
    const refresh = () => rows.forEach(({ row, item }) => {
      const c = o.chips && o.chips.find((x) => x.key === chip);
      row.hidden = (c && !c.test(item)) || (!!query && !o.searchText(item).toLowerCase().includes(query));
    });
    const chips = o.chips ? el("div", "cl-filters", o.chips.map((c) => {
      const b = button("pillbtn", c.label);
      b.dataset.chip = c.key;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => filter(chip === c.key ? null : c.key));
      return b;
    })) : null;
    function filter(key) {
      chip = key;
      chips && chips.querySelectorAll("[data-chip]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.chip === key)));
      refresh();
    }
    let box = null;
    if (o.search) {
      const input = el("input", "cl-q");
      input.placeholder = o.search;
      input.setAttribute("aria-label", o.search);
      input.addEventListener("input", () => { query = input.value.trim().toLowerCase(); refresh(); });
      const clear = iconButton("close", "Clear search");
      clear.addEventListener("click", () => { input.value = ""; query = ""; refresh(); box.hidden = true; });
      box = el("div", "cl-search", icon("search"), input, clear);
      box.hidden = true;
      const open = iconButton("search", "Search");
      open.addEventListener("click", () => { box.hidden = !box.hidden; if (!box.hidden) input.focus(); else clear.click(); });
      head.append(open);
    }
    const list = el("div", "cl-scroll");
    pane.append(...[head, box, chips, list].filter(Boolean));
    return {
      pane, list, filter, refresh,
      add(row, item) { rows.push({ row, item }); list.append(row); return row; },
    };
  }

  /* Rows are role="button" divs (they hold other buttons); make Enter/Space activate them. */
  function clickable(row, fn) {
    row.setAttribute("role", "button");
    row.tabIndex = 0;
    row.addEventListener("click", (e) => { if (!e.target.closest("button")) fn(e); });
    row.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target === row) { e.preventDefault(); fn(e); }
    });
    return row;
  }

  window.Teams = Object.assign(window.Teams || {}, {
    ui: { el, icon, button, iconButton, avatar, when, listPane, clickable },
  });
})();
