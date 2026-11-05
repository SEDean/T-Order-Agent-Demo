/**
 * Teams Calendar: the landing view of the Teams frame.
 * Renders two layouts from one data set into #calview:
 *   .cal-d  desktop Day view (toolbar, all-day banner, time grid, now-line)
 *   .cal-m  mobile Agenda view (month header, week strip, Today / Tomorrow list)
 * CSS shows one or the other at the 720px Teams breakpoint (calendar.css).
 *
 * The date is always the viewer's today. Today's meetings sit around an anchor hour
 * (the current hour, held to 11–15) so the now-line lands among them during a demo.
 * All meetings are generic sample content. Nodes are built with createElement/textContent.
 */
"use strict";
(function () {
  const HOUR = 96;                      // px per hour in the desktop grid
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
  /* Tomorrow: h = clock hour. */
  const TOMORROW = [
    { h: 8, d: 2, title: "Focus time", recur: true },
    { h: 10, d: 1, title: "Team weekly call", sub: TEAMS, recur: true, tentative: true },
    { h: 11, d: 0.5, title: "Monthly strategy sync", sub: TEAMS, recur: true },
    { h: 13, d: 1, title: "Weekly review", recur: true },
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
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    if (cls) s.setAttribute("class", cls);
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", ICON[name]);
    s.append(p);
    return s;
  }
  function el(tag, cls, ...kids) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    kids.flat().forEach((k) => k != null && n.append(k));
    return n;
  }
  const btn = (cls, ...kids) => { const b = el("button", cls, ...kids); b.type = "button"; return b; };

  const now = new Date();
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const addDays = (n) => new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() + n);
  const fmt = (d, o) => d.toLocaleDateString("en-US", o);
  const clock = (h) => new Date(2000, 0, 1, Math.floor(h), Math.round((h % 1) * 60))
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const hourLabel = (h) => (h % 12 || 12) + (h < 12 ? " AM" : " PM");
  const length = (d) => (d < 1 ? d * 60 + " min" : d + " hr");
  const nowH = now.getHours() + now.getMinutes() / 60;
  const anchor = Math.min(15, Math.max(11, now.getHours()));
  const today = TODAY.map((e) => ({ ...e, h: anchor + e.h }));
  const tz = (new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(now)
    .find((p) => p.type === "timeZoneName") || {}).value || "";
  const monday = addDays(-((now.getDay() + 6) % 7));

  /* ---------- desktop: Day view ---------- */
  function desktop() {
    const bar = el("div", "cal-bar",
      btn("cb-ic", icon("split")), el("span", "cb-sep"),
      btn("cb-btn", icon("cal"), "Today"),
      btn("cb-ic", icon("left")), btn("cb-ic", icon("right")),
      btn("cb-btn cb-date", fmt(now, { month: "long", day: "numeric", year: "numeric" }), icon("chev", "cb-chev")),
      el("span", "cb-fill"),
      btn("cb-btn", icon("day"), "Day", icon("chev", "cb-chev")),
      btn("cb-btn", icon("filter"), "Filter", icon("chev", "cb-chev")),
      btn("cb-ic", icon("more", "dots")), el("span", "cb-sep"),
      btn("cb-btn", icon("video"), "Meet now"), btn("cb-ic", icon("chev")),
      el("span", "cb-new", btn("cb-new-main", icon("add"), "New"), btn("cb-new-drop", icon("chev"))));

    const head = el("div", "cal-head",
      el("div", "ch-gutter", el("span", "ch-tz", tz)),
      el("div", "ch-day", el("b", null, String(now.getDate())), el("span", null, fmt(now, { weekday: "long" }))));

    const allday = el("div", "cal-allday", el("div", "ch-gutter"),
      el("div", "ad-band",
        el("span", "ad-edge", icon("left"), fmt(monday, { month: "short", day: "numeric" })),
        el("span", "ad-text", el("b", null, ALL_DAY.title), " " + ALL_DAY.sub + " " + ALL_DAY.org),
        el("span", "ad-edge", fmt(new Date(monday.getTime() + 11 * 864e5), { month: "short", day: "numeric" }), icon("right"))));

    const gutter = el("div", "cg-gutter");
    for (let h = 1; h < 24; h++) {
      const l = el("span", null, hourLabel(h));
      l.style.top = h * HOUR + "px";
      gutter.append(l);
    }
    const lanes = el("div", "cg-lanes");
    today.forEach((e) => {
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
    const line = el("div", "cg-now");
    line.style.top = nowH * HOUR + "px";
    lanes.append(line);

    const grid = el("div", "cal-grid", el("div", "cg-body", gutter, lanes));
    grid.querySelector(".cg-body").style.height = 24 * HOUR + "px";
    /* open with the now-line about 40% down the grid */
    requestAnimationFrame(() => { grid.scrollTop = Math.max(0, nowH * HOUR - grid.clientHeight * 0.4); });
    return el("div", "cal-d", bar, head, allday, grid);
  }

  /* ---------- mobile: Agenda view ---------- */
  function agendaRow(time, sub, e) {
    return el("div", "ag-row",
      el("div", "ag-time", el("span", null, time), sub ? el("small", null, sub) : null),
      el("span", "ag-bar" + (e.tentative ? " tent" : "")),
      el("div", "ag-main",
        el("div", "ag-title", e.title, e.recur ? icon("recur", "ag-r") : null),
        e.sub ? el("div", "ag-sub", e.sub) : null));
  }
  function agendaDay(date, label, events) {
    const sec = el("section", "ag-day",
      el("h3", null, fmt(date, { month: "short", day: "numeric" }), el("span", null, label)),
      agendaRow("All day", null, { ...ALL_DAY, sub: "Mon–Fri · " + TEAMS }));
    events.forEach((e) => sec.append(agendaRow(clock(e.h), length(e.d), e)));
    return sec;
  }
  function mobile() {
    const week = el("div", "mw-week");
    const sunday = addDays(-now.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
      week.append(el("div", "mw-d" + (+d === +day0 ? " on" : ""),
        el("span", "mw-l", fmt(d, { weekday: "narrow" })),
        el("span", "mw-m", i === 0 || d.getDate() === 1 ? fmt(d, { month: "short" }) : ""),
        el("b", null, String(d.getDate()))));
    }
    const left = today.filter((e) => e.h + e.d > nowH);
    const list = el("div", "ag-list",
      agendaDay(day0, "Today", left),
      agendaDay(addDays(1), "Tomorrow", TOMORROW));
    const fab = btn("m-fab", icon("plus"));
    fab.setAttribute("aria-label", "New event");
    return el("div", "cal-m",
      el("div", "m-head",
        el("span", "m-ava", "JS"),
        el("h2", null, fmt(now, { month: "long" })),
        btn("m-ic", icon("replay")), btn("m-ic", icon("search"))),
      el("div", "m-pills", btn("m-pill on", "Agenda"), btn("m-pill", "Day")),
      week, el("div", "m-grab"), list, fab);
  }

  document.getElementById("calview").append(desktop(), mobile());
})();
