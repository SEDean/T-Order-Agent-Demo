/**
 * Teams Calendar (#calview), the landing view. Two layouts from one data set:
 *   .cal-d  desktop Day view: toolbar (Today, ‹ ›, date), all-day banner, time grid, now-line
 *   .cal-m  mobile: month header, Agenda / Day toggle, week strip (tap a day, swipe for
 *           another week), then either the
 *           agenda (selected day and the next) or that day's time grid
 * CSS shows one or the other at the 720px Teams breakpoint (calendar.css).
 *
 * Today's meetings sit around an anchor hour (the current hour, held to 11–15) so the
 * now-line lands among them during a demo. Tomorrow is fixed; other weekdays draw from a
 * pool by date, and weekends are free. All meetings are generic sample content.
 * API: Teams.calendar.today() → [{ time, title }].
 */
"use strict";
(function () {
  const T = window.Teams, { el } = T.ui;
  const HOUR = 96;                      // px per hour in the time grid
  const TEAMS = "Microsoft Teams Meeting";

  /* ---------- sample data (generic, anonymized) ---------- */
  const ALL_DAY = { title: "Quarterly planning week", sub: TEAMS, org: "Chen, Morgan" };
  /* Today: h = start offset from the anchor hour, d = duration (hours), lane = [index, of]. */
  const TODAY = [
    { h: -3.5, d: 1.5, title: "Company Town Hall", org: "Internal Communications", lane: [0, 2] },
    { h: -3, d: 2, title: "Roadmap working session", lane: [1, 2], recur: true },
    { h: -1, d: 0.5, title: "Weekly 1:1", org: "Rivera, Alex", lane: [0, 2], recur: true },
    { h: -1, d: 0.5, title: "Vendor onboarding sync", org: "Patel, Sam", lane: [1, 2], tentative: true },
    { h: 1, d: 1, title: "Daily review", sub: TEAMS, lane: [0, 1], recur: true },
    { h: 3, d: 0.5, title: "Design critique", org: "Okafor, Jordan", lane: [0, 1] },
  ];
  /* Tomorrow and the pool: h = clock hour. */
  const TOMORROW = [
    { h: 8, d: 2, title: "Focus time", recur: true },
    { h: 10, d: 1, title: "Team weekly call", sub: TEAMS, recur: true, tentative: true },
    { h: 11, d: 0.5, title: "Monthly strategy sync", sub: TEAMS, recur: true },
    { h: 13, d: 1, title: "Weekly review", recur: true },
  ];
  const POOL = [
    { h: 9, d: 0.5, title: "Team standup", sub: TEAMS, recur: true },
    { h: 10, d: 1, title: "Vendor check-in", org: "Gutierrez, Jon" },
    { h: 11.5, d: 0.5, title: "Menu pricing review", org: "Lee, Priya" },
    { h: 13, d: 1, title: "Focus time", recur: true },
    { h: 14.5, d: 0.5, title: "Kiosk install sync", org: "Patel, Sam", tentative: true },
    { h: 15.5, d: 1, title: "Design critique", org: "Okafor, Jordan" },
    { h: 16.5, d: 0.5, title: "End-of-day wrap-up", recur: true },
  ];

  /* ---------- helpers ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const ICON = {
    recur: "M4 11a7 7 0 0112-4.9M20 13a7 7 0 01-12 4.9M16 3v3.5h-3.5M8 21v-3.5h3.5",
    chev: "M6 9l6 6 6-6", left: "M14.5 5.5L8 12l6.5 6.5", right: "M9.5 5.5L16 12l-6.5 6.5",
    cal: "M4 6.5A1.5 1.5 0 015.5 5h13A1.5 1.5 0 0120 6.5v12a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5zM4 9.5h16M9 13h2",
    split: "M4 6.5A1.5 1.5 0 015.5 5h13A1.5 1.5 0 0120 6.5v11a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5zM9 5v14M6 9.5l1.5 1.5L6 12.5",
    day: "M5 4.5h14v15H5zM5 8.5h14M9 12.5h6",
    filter: "M4 6h16M7 12h10M10 18h4",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    video: "M3 6.5h12.5v11H3zM15.5 10.8l5-3v8.4l-5-3",
    add: "M4 5.5h11v11H4zM9.5 8.5v5M7 11h5M16 16.5h5M18.5 14v5",
    replay: "M12 4a8 8 0 11-8 8M4 5v4h4M10 9.5v5l4-2.5z",
    search: "M11 4.5a6.5 6.5 0 110 13 6.5 6.5 0 010-13zM16 16l4.5 4.5",
    plus: "M12 5v14M5 12h14",
  };
  function icon(name, cls) {
    const s = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    if (cls) s.setAttribute("class", cls);
    p.setAttribute("d", ICON[name]);
    s.append(p);
    return s;
  }
  const btn = (cls, fn, ...kids) => {
    const b = el("button", cls, ...kids);
    b.type = "button";
    if (fn) b.addEventListener("click", fn);
    return b;
  };

  const now = new Date();
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const shift = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const diff = (d) => Math.round((d - day0) / 864e5);
  const fmt = (d, o) => d.toLocaleDateString("en-US", o);
  const clock = (h) => new Date(2000, 0, 1, Math.floor(h), Math.round((h % 1) * 60))
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const hourLabel = (h) => (h % 12 || 12) + (h < 12 ? " AM" : " PM");
  const length = (d) => (d < 1 ? d * 60 + " min" : d + " hr");
  const nowH = now.getHours() + now.getMinutes() / 60;
  const anchor = Math.min(15, Math.max(11, now.getHours()));
  const tz = (new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(now)
    .find((p) => p.type === "timeZoneName") || {}).value || "";
  const monday = shift(day0, -((now.getDay() + 6) % 7)), friday = shift(monday, 4);
  const allDay = (d) => d >= monday && d <= friday;
  const label = (d) => ({ 0: "Today", 1: "Tomorrow", "-1": "Yesterday" })[diff(d)] || fmt(d, { weekday: "long" });

  function eventsFor(d) {
    const n = diff(d);
    if (n === 0) return TODAY.map((e) => ({ ...e, h: anchor + e.h }));
    if (n === 1) return TOMORROW.map((e) => ({ ...e, lane: [0, 1] }));
    if (d.getDay() === 0 || d.getDay() === 6) return [];
    return POOL.filter((_, i) => (d.getDate() + i) % 3).map((e) => ({ ...e, lane: [0, 1] }));
  }

  let sel = day0, mode = "agenda";
  const set = (d) => { sel = d; render(); };

  /* ---------- time grid (desktop, and mobile Day view) ---------- */
  function grid(d) {
    const gutter = el("div", "cg-gutter");
    for (let h = 1; h < 24; h++) {
      const l = el("span", null, hourLabel(h));
      l.style.top = h * HOUR + "px";
      gutter.append(l);
    }
    const lanes = el("div", "cg-lanes");
    eventsFor(d).forEach((e) => {
      const ev = el("div", "cg-ev" + (e.tentative ? " tent" : "") + (e.d < 1 ? " short" : ""),
        el("span", "ev-t", el("b", null, e.title), e.org ? " " + e.org : null),
        e.sub ? el("span", "ev-s", e.sub) : null,
        e.recur ? icon("recur", "ev-r") : null);
      const [i, of] = e.lane;
      Object.assign(ev.style, {
        top: e.h * HOUR + 1 + "px", height: e.d * HOUR - 3 + "px",
        left: `calc(${(i / of) * 100}% + 4px)`, width: `calc(${100 / of}% - 8px)`,
      });
      lanes.append(ev);
    });
    if (!diff(d)) {
      const line = el("div", "cg-now");
      line.style.top = nowH * HOUR + "px";
      lanes.append(line);
    }
    const body = el("div", "cg-body", gutter, lanes);
    body.style.height = 24 * HOUR + "px";
    const g = el("div", "cal-grid fresh", body);
    g.dataset.top = (diff(d) ? 8 : nowH) * HOUR;
    requestAnimationFrame(() => place(g));
    return g;
  }

  /* Open a new grid with the now-line about 40% down (today), else at 8 AM. A grid built while
     its pane is hidden cannot scroll yet, so it stays "fresh" until it is on screen. */
  function place(g) {
    if (!g.classList.contains("fresh") || !g.clientHeight) return;
    g.scrollTop = Math.max(0, g.dataset.top - (diff(sel) ? 0 : g.clientHeight * 0.4));
    g.classList.remove("fresh");
  }
  document.addEventListener("teams:view", (e) => {
    if (e.detail.panes.has("calview")) requestAnimationFrame(() => document.querySelectorAll(".cal-grid.fresh").forEach(place));
  });

  /* ---------- desktop: Day view ---------- */
  const dateBtn = btn("cb-btn cb-date", null);
  const desk = el("div", "cal-d");
  const bar = el("div", "cal-bar",
    btn("cb-ic", null, icon("split")), el("span", "cb-sep"),
    btn("cb-btn", () => set(day0), icon("cal"), "Today"),
    btn("cb-ic", () => set(shift(sel, -1)), icon("left")), btn("cb-ic", () => set(shift(sel, 1)), icon("right")),
    dateBtn, el("span", "cb-fill"),
    btn("cb-btn", null, icon("day"), "Day", icon("chev", "cb-chev")),
    btn("cb-btn", null, icon("filter"), "Filter", icon("chev", "cb-chev")),
    btn("cb-ic", null, icon("more", "dots")), el("span", "cb-sep"),
    btn("cb-btn", () => T.call({ name: "Meet now", ini: "M", bg: "#5b5fc7" }), icon("video"), "Meet now"), btn("cb-ic", null, icon("chev")),
    el("span", "cb-new", btn("cb-new-main", null, icon("add"), "New"), btn("cb-new-drop", null, icon("chev"))));
  bar.querySelectorAll(".cb-ic")[1].setAttribute("aria-label", "Previous day");
  bar.querySelectorAll(".cb-ic")[2].setAttribute("aria-label", "Next day");

  function renderDesktop() {
    dateBtn.replaceChildren(fmt(sel, { month: "long", day: "numeric", year: "numeric" }), icon("chev", "cb-chev"));
    const head = el("div", "cal-head" + (diff(sel) ? " other" : ""),
      el("div", "ch-gutter", el("span", "ch-tz", tz)),
      el("div", "ch-day", el("b", null, String(sel.getDate())), el("span", null, fmt(sel, { weekday: "long" }))));
    const band = el("div", "cal-allday", el("div", "ch-gutter"), allDay(sel) ? el("div", "ad-band",
      el("span", "ad-edge", icon("left"), fmt(monday, { month: "short", day: "numeric" })),
      el("span", "ad-text", el("b", null, ALL_DAY.title), " " + ALL_DAY.sub + " " + ALL_DAY.org),
      el("span", "ad-edge", fmt(friday, { month: "short", day: "numeric" }), icon("right"))) : el("div", "ad-none"));
    desk.replaceChildren(bar, head, band, grid(sel));
  }

  /* ---------- mobile: Agenda / Day ---------- */
  function agendaRow(time, sub, e) {
    return el("div", "ag-row",
      el("div", "ag-time", el("span", null, time), sub ? el("small", null, sub) : null),
      el("span", "ag-bar" + (e.tentative ? " tent" : "")),
      el("div", "ag-main",
        el("div", "ag-title", e.title, e.recur ? icon("recur", "ag-r") : null),
        e.sub || e.org ? el("div", "ag-sub", e.sub || e.org) : null));
  }
  function agendaDay(d) {
    let events = eventsFor(d);
    if (!diff(d)) events = events.filter((e) => e.h + e.d > nowH);
    const rows = events.sort((a, b) => a.h - b.h).map((e) => agendaRow(clock(e.h), length(e.d), e));
    if (allDay(d)) rows.unshift(agendaRow("All day", null, { ...ALL_DAY, sub: "Mon–Fri · " + TEAMS }));
    return el("section", "ag-day",
      el("h3", null, fmt(d, { month: "short", day: "numeric" }), el("span", null, label(d))),
      rows.length ? rows : el("p", "ag-free", diff(d) ? "Nothing scheduled" : "Nothing else scheduled today"));
  }
  const mob = el("div", "cal-m");
  function renderMobile() {
    const week = el("div", "mw-week"), sunday = shift(sel, -sel.getDay());
    for (let i = 0; i < 7; i++) {
      const d = shift(sunday, i);
      const b = btn("mw-d" + (+d === +sel ? " on" : "") + (+d === +day0 ? " is-today" : ""), () => set(d),
        el("span", "mw-l", fmt(d, { weekday: "narrow" })),
        el("span", "mw-m", i === 0 || d.getDate() === 1 ? fmt(d, { month: "short" }) : ""),
        el("b", null, String(d.getDate())));
      b.setAttribute("aria-label", fmt(d, { weekday: "long", month: "long", day: "numeric" }));
      week.append(b);
    }
    const pill = (m, text) => {
      const b = btn("m-pill" + (mode === m ? " on" : ""), () => { mode = m; render(); }, text);
      b.setAttribute("aria-pressed", String(mode === m));
      return b;
    };
    const fab = btn("m-fab", null, icon("plus"));
    fab.setAttribute("aria-label", "New event");
    const ava = el("span", "m-ava", "JS");
    mob.replaceChildren(
      el("div", "m-head", ava, el("h2", null, fmt(sel, { month: "long" })),
        btn("m-ic", () => set(day0), icon("replay")), btn("m-ic", null, icon("search"))),
      el("div", "m-pills", pill("agenda", "Agenda"), pill("day", "Day")),
      week,
      el("div", "m-grab"),
      mode === "agenda" ? el("div", "ag-list", agendaDay(sel), agendaDay(shift(sel, 1))) : el("div", "m-daygrid", grid(sel)),
      fab);
    mob.querySelector(".m-ic").setAttribute("aria-label", "Back to today");
  }

  function render() { renderDesktop(); renderMobile(); }
  /* Swipe the week strip for the previous or next week. */
  let x0 = null;
  mob.addEventListener("touchstart", (e) => { x0 = e.target.closest(".mw-week") ? e.touches[0].clientX : null; }, { passive: true });
  mob.addEventListener("touchend", (e) => {
    const dx = x0 == null ? 0 : e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) set(shift(sel, dx < 0 ? 7 : -7));
    x0 = null;
  });
  const view = document.getElementById("calview");
  view.classList.add("pane", "main", "calview");
  view.append(desk, mob);
  render();

  T.calendar = {
    today: () => eventsFor(day0).sort((a, b) => a.h - b.h).map((e) => ({ time: clock(e.h), title: e.title })),
  };
})();
