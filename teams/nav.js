/**
 * Teams navigation inside the frame: Calendar ⇄ Chat (Thrive), and the More apps panel.
 * - .window[data-view] is "calendar" (landing) or "chat"; CSS shows the matching view.
 * - [data-go="calendar|chat"] buttons switch views (rail, mobile nav, mobile back arrow).
 * - [data-apps] buttons open #apps: a flyout beside the rail on desktop, a bottom sheet
 *   on mobile (same DOM, styled in nav.css). Picking Thrive opens the Thrive chat.
 * Ordering state lives in ordering.js and is kept across view switches.
 */
"use strict";
(function () {
  const win = document.querySelector(".window");
  const apps = document.getElementById("apps");
  const card = apps.querySelector(".apps-card");
  const list = document.getElementById("appsList");
  let opener = null;

  /* Placeholder apps; only Thrive opens. g = SVG path drawn on a coloured tile. */
  const APPS = [
    { name: "Approvals", bg: "#2f7d5b", g: "M7 12.5l3 3 7-7" },
    { name: "Planner", bg: "#3f7c3a", g: "M7 7h10M7 12h10M7 17h6" },
    { name: "Shifts", bg: "#8a5a2b", g: "M12 6v6l4 2M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17z" },
    { name: "Lists", bg: "#a33f6e", g: "M9 7h9M9 12h9M9 17h9M5.5 7h.01M5.5 12h.01M5.5 17h.01" },
    { name: "Bookings", bg: "#1f6aa5", g: "M5 6.5h14v12H5zM5 10h14M9 4v4M15 4v4" },
    { name: "Forms", bg: "#3a7a7a", g: "M7 5h10v14H7zM10 9h4M10 13h4" },
  ];
  const NS = "http://www.w3.org/2000/svg";
  APPS.forEach((a) => {
    const tile = document.createElement("span");
    tile.className = "app-ic";
    tile.style.background = a.bg;
    const s = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
    s.setAttribute("viewBox", "0 0 24 24");
    p.setAttribute("d", a.g);
    s.append(p);
    tile.append(s);
    const row = document.createElement("button");
    row.type = "button";
    row.className = "app-row";
    row.disabled = true;                       // demo: visual only
    row.append(tile, document.createTextNode(a.name));
    list.append(row);
  });

  function go(view) {
    closeApps();
    win.dataset.view = view;
    document.querySelectorAll("[data-go]").forEach((b) => b.classList.toggle("on", b.dataset.go === view));
  }

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

  document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
  document.querySelectorAll("[data-apps]").forEach((b) =>
    b.addEventListener("click", () => (apps.hidden ? openApps(b) : closeApps())));
  document.getElementById("appThrive").addEventListener("click", () => go("chat"));
  apps.addEventListener("click", (e) => { if (e.target === apps) closeApps(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeApps(); });
  window.addEventListener("resize", closeApps);
})();
