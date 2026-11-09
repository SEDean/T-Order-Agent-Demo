/**
 * Teams navigation inside the frame (window.Teams.go / back / reveal).
 *
 * A view is a set of panes. LAYOUT lists, per view, the panes shown on desktop (d) and on
 * mobile (m, 720px and below, one pane at a time). Panes are elements with class "pane";
 * the visible ones get class "on" (nav.css). .window[data-view] names the current view.
 *
 * Mobile "detail" views (a chat, a channel, a note, Thrive, and screens opened from More)
 * hide the bottom nav and show a back arrow, which returns to the view they were opened from.
 * After every change a "teams:view" event carries { view, panes } so screens can react.
 *
 * - [data-go="<view>"] buttons (rail, mobile nav, More sheet) switch views.
 * - [data-back] arrows go back. [data-apps] buttons open #apps: a flyout beside the rail on
 *   desktop, a bottom sheet on mobile. Picking Thrive there is the only way into Thrive.
 * Ordering state lives in ordering.js and is kept across view switches.
 */
"use strict";
(function () {
  const T = window.Teams, { el, icon, button } = T.ui;
  const win = document.querySelector(".window");
  const narrow = window.matchMedia("(max-width:720px)");

  /* tab = highlighted nav button (defaults to the view it was opened from). */
  const LAYOUT = {
    calendar: { d: "calview", m: "calview", tab: "calendar" },
    activity: { d: "actlist convpane", m: "actlist", tab: "activity" },
    chats:    { d: "clist convpane", m: "clist", tab: "chats" },
    conv:     { d: "clist convpane", m: "convpane", detail: true },
    thrive:   { d: "clist chatpane", m: "chatpane", detail: true, tab: "chats" },
    teams:    { d: "teamlist chanpane", m: "teamlist", tab: "teams", mDetail: true },
    channel:  { d: "teamlist chanpane", m: "chanpane", detail: true, tab: "teams" },
    calls:    { d: "callpad callhist", m: "callhist", tab: "calls" },
    files:    { d: "filelist", m: "filelist", tab: "files" },
    copilot:  { d: "copilot", m: "copilot", tab: "copilot", mDetail: true },
    notes:    { d: "notelist notepane", m: "notelist", tab: "notes", mDetail: true },
    note:     { d: "notelist notepane", m: "notepane", detail: true, tab: "notes" },
    people:   { d: "peoplelist", m: "peoplelist", tab: "people", mDetail: true },
  };
  /* Where a detail pane lives on desktop, beside its list. */
  const HOME = { conv: "chats", channel: "teams", note: "notes" };
  const origin = {};
  const isDetail = (v) => narrow.matches && !!(LAYOUT[v].detail || LAYOUT[v].mDetail);
  const tabOf = (v) => LAYOUT[v].tab || (origin[v] ? tabOf(origin[v]) : "chats");
  const panesOf = (v) => new Set(LAYOUT[v][narrow.matches ? "m" : "d"].split(" "));

  function apply() {
    const view = win.dataset.view, show = panesOf(view);
    document.querySelectorAll(".pane").forEach((p) => p.classList.toggle("on", show.has(p.id)));
    win.classList.toggle("detail", isDetail(view));
    const tab = tabOf(view);
    document.querySelectorAll("[data-go]").forEach((b) => b.classList.toggle("on", b.dataset.go === tab));
    document.dispatchEvent(new CustomEvent("teams:view", { detail: { view, panes: show } }));
  }
  function go(view, returning) {
    if (!LAYOUT[view]) return;
    closeApps();
    const was = win.dataset.view;
    if (was !== view && isDetail(view) && !returning) origin[view] = was;
    win.dataset.view = view;
    apply();
  }
  const back = () => go(origin[win.dataset.view] || "calendar", true);
  /* Show a detail view: on mobile go to it; on desktop show its pane beside the current list
     if it is already there (e.g. a chat beside Activity), else go to its home list. */
  function reveal(detail) {
    if (narrow.matches) go(detail);
    else if (!panesOf(win.dataset.view).has(LAYOUT[detail].d.split(" ").pop())) go(HOME[detail] || detail);
  }

  /* ---------- More apps ---------- */
  const apps = document.getElementById("apps");
  const card = apps.querySelector(".apps-card");
  const list = document.getElementById("appsList");
  let opener = null;
  /* After Thrive: Teams screens that are on the desktop rail but not in the mobile bottom nav
     (shown in the sheet on mobile only). Only working entries are listed. g = SVG path on a tile. */
  [
    { name: "Teams", bg: "#4f52b2", g: "people", go: "teams" },
    { name: "Copilot", bg: "#5b5fc7", g: "sparkle", go: "copilot" },
    { name: "Notes", bg: "#b3740f", g: "note", go: "notes" },
    { name: "People", bg: "#2b6c80", g: "M12 8a3.2 3.2 0 100-.01M5.5 20a6.5 6.5 0 0113 0", go: "people" },
  ].forEach((a) => {
    const tile = el("span", "app-ic", icon(a.g));
    tile.style.background = a.bg;
    const row = button("app-row m-only", tile, a.name);
    row.dataset.go = a.go;
    list.append(row);
  });

  function openApps(btn) {
    opener = btn;
    apps.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    /* Desktop flyout sits beside the rail, aligned to the button; mobile CSS ignores this. */
    const w = win.getBoundingClientRect(), r = btn.getBoundingClientRect();
    card.style.top = Math.max(8, Math.min(r.top - w.top - 8, w.height - card.offsetHeight - 8)) + "px";
    card.style.left = r.right - w.left + 10 + "px";
    document.getElementById("appThrive").focus({ preventScroll: true });
  }
  function closeApps() {
    if (apps.hidden) return;
    apps.hidden = true;
    if (opener) { opener.setAttribute("aria-expanded", "false"); opener = null; }
  }

  /* Delegated, so buttons that screens build later work too. */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go],[data-back],[data-apps]");
    if (!t || t.disabled) return;
    if (t.hasAttribute("data-apps")) apps.hidden ? openApps(t) : closeApps();
    else if (t.hasAttribute("data-back")) back();
    else go(t.dataset.go);
  });
  document.getElementById("appThrive").addEventListener("click", () => go("thrive"));
  apps.addEventListener("click", (e) => { if (e.target === apps) closeApps(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeApps(); });
  window.addEventListener("resize", closeApps);
  narrow.addEventListener("change", apply);

  Object.assign(T, { go, back, reveal, narrow });
  /* First layout once every screen has built its panes. */
  document.addEventListener("DOMContentLoaded", apply);
})();
