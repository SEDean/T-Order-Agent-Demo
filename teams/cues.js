/**
 * App cues: a guided overlay that rings the next control in the ordering flow
 * (More apps → Thrive → Chat tab → pick a spot → choose a category → add an item →
 * check out) with a short tip. Turned on and off from the shell header ("Cues on/off") or the tip's ×.
 *
 * How it works
 * - Runs inside the Teams frame, so it works however the site is opened (http(s),
 *   the single-file build, or straight from disk, where browsers isolate frames).
 * - On/off follows the shell through localStorage ("centric-cues-live") and the
 *   browser's "storage" event, the same way the theme does. No cross-window messaging.
 * - Event-driven, not a per-frame poll: DOM mutations, scrolls, image loads and resizes
 *   "kick" a short requestAnimationFrame loop that runs until the target has settled.
 * - A cue appears only once its target has held still for a few frames, so it never
 *   chases a bubble that is still animating in.
 * - Nodes are built with createElement/textContent; positions are set through CSSOM.
 * - The tip goes below its target, or right, above, or left of it: the first spot that fits on
 *   screen and covers none of the conversation's text, cards, buttons, or form fields.
 * - Reads the Teams UI's DOM only; ordering.js and nav.js know nothing about cues.
 */
"use strict";
(function () {
  const KEY = "centric-cues-live";
  const SETTLE_MS = 900;   // keep tracking this long after the last change
  const STABLE = 3;        // frames a target must hold still before the cue shows
  const PAD = 4;           // ring padding around the target, px
  /* What a tip must not cover: the conversation's text, cards and buttons, form fields, and tabs. */
  const CONTENT = "#chat .body > p, #chat .nm, #chat .ds, #chat .cardname, #chat .fname, #chat .tile, #chat .mimg img, " +
    "#chat .chip, #chat .btn, #chat .ci, .modal .fld, .modal .btn, .tabs .tab, .app-row, .rit, .mnav button";
  const narrow = window.matchMedia("(max-width:720px)");   // Teams' single-column layout

  const read = () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch (_) {} };
  let on = read() !== "off";   // default on, matching the shell

  /* ---------- overlay nodes (built once) ---------- */
  const make = (tag, cls, text) => {
    const n = document.createElement(tag);
    n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  const layer = make("div", "cues");
  const ring = make("div", "cue-ring");
  const tip = make("div", "cue-tip");
  const label = make("span", "cue-label");
  const go = make("button", "cue-go", "Show me ↓");
  const close = make("button", "cue-x", "×");
  go.type = close.type = "button";
  close.setAttribute("aria-label", "Turn off cues");
  label.setAttribute("role", "status");
  tip.append(label, go, close);
  document.body.append(layer);

  close.addEventListener("click", () => { on = false; write("off"); hide(); });
  go.addEventListener("click", () => {
    try { cue.jump && cue.jump.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_) {}
  });

  /* ---------- which step are we on? ---------- */
  const $ = (id) => document.getElementById(id);
  const verb = () => (narrow.matches ? "Tap" : "Click");
  const shown = (el) => { const r = el && el.getBoundingClientRect(); return !!r && r.width > 0 && r.height > 0; };

  /* Rules for the latest Thrive message: the first rule with a matching button wins. */
  const RULES = [
    { match: /^(Confirm & )?Checkout$/, text: () => "Check out" },
    { match: /^Add to Cart$/, text: () => "Add an item to your cart" },
    { match: /^Select$/, text: (msg) => (/Pick a spot/.test(msg) ? "Pick a spot" : "Choose a category") },
    { match: /Start a new order/, text: () => "Start a new order" },
  ];

  /** Returns { el, text } to ring, { jump, text } when the target is scrolled away, or null. */
  function nextStep() {
    if (document.querySelector(".callx")) return null;     // no tips over the in-call screen
    /* Until Thrive is open: More apps (rail on desktop, bottom nav on mobile) → Thrive.
       In a full-screen mobile chat, where More is hidden, point at the back arrow first. */
    if (document.querySelector(".window").dataset.view !== "thrive") {
      if (!$("apps").hidden) return { el: $("appThrive"), text: verb() + " Thrive to open it" };
      const more = [...document.querySelectorAll("[data-apps]")].find(shown);
      if (more) return { el: more, text: narrow.matches ? "Tap More to find Thrive" : "Click More apps to find Thrive" };
      const back = [...document.querySelectorAll("[data-back]")].find(shown);
      return back && { el: back, text: "Tap back, then More to find Thrive" };
    }
    if ($("overlay").classList.contains("show")) return { el: $("modalCreate"), text: "Create your pre-order" };
    const tab = document.querySelector('.tab[data-tab="messages"]');
    if (tab.getAttribute("aria-selected") !== "true") return { el: tab, text: verb() + " Chat to start ordering" };

    const rows = $("chat").querySelectorAll(".brow");
    const last = rows[rows.length - 1];
    if (!last || last.classList.contains("me") || last.querySelector(".typing")) return null;

    const msg = ((last.querySelector(".body") || last).textContent || "").trim();
    const buttons = [...last.querySelectorAll("button.btn, button.chip")];
    const view = $("chatScroll").getBoundingClientRect();
    const inView = (b) => { const r = b.getBoundingClientRect(); return r.height > 0 && r.top >= view.top - 1 && r.bottom <= view.bottom + 1; };

    /* Option chips (View Options) have free-form labels, so match on the prompt. */
    const rule = /^Customize /.test(msg)
      ? { hits: buttons.filter((b) => b.classList.contains("chip")), text: "Pick an option" }
      : RULES.map((r) => ({ hits: buttons.filter((b) => r.match.test(b.textContent.trim())), text: r.text(msg) }))
             .find((r) => r.hits.length);
    if (!rule || !rule.hits.length) return null;
    const visible = rule.hits.find(inView);
    return visible ? { el: visible, text: rule.text } : { jump: rule.hits[0], text: "Next: " + rule.text };
  }

  /* ---------- render ---------- */
  let raf = 0, settleUntil = 0, cue = {}, sig = "", lastKey = "", stable = 0;

  function hide() {
    if (layer.firstChild) layer.replaceChildren();
    sig = lastKey = ""; stable = 0; cue = {};
  }

  function place(el) {
    const r = el.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const key = [r.left, r.top, r.width, r.height].map(Math.round).join();
    if (key !== lastKey) { lastKey = key; stable = 0; } else stable++;
    if (!layer.firstChild && stable < STABLE) return false;      // wait until it settles

    if (!layer.firstChild) layer.append(ring, tip);
    ring.style.transform = `translate(${r.left - PAD}px,${r.top - PAD}px)`;
    ring.style.width = r.width + PAD * 2 + "px";
    ring.style.height = r.height + PAD * 2 + "px";

    const tw = tip.offsetWidth, th = tip.offsetHeight, gap = PAD + 10;
    const midX = r.left + r.width / 2, midY = r.top + r.height / 2;
    const clampX = (x) => Math.max(8, Math.min(x, W - tw - 8));
    /* Candidate spots in order of preference: below, right, below the whole button row, above,
       left. The first that fits on screen and covers no content (message text, cards, buttons,
       form fields) wins; otherwise below, or above when below is off-screen. */
    const group = el.closest(".actions,.chips");          // a wrapped row of buttons or chips
    const spots = [
      { side: "below", x: clampX(midX - tw / 2), y: r.bottom + gap },
      { side: "right", x: r.right + gap, y: midY - th / 2 },
      group && { side: "below", x: clampX(midX - tw / 2), y: group.getBoundingClientRect().bottom + gap },
      { side: "above", x: clampX(midX - tw / 2), y: r.top - gap - th },
      { side: "left", x: r.left - gap - tw, y: midY - th / 2 },
    ];
    const fits = (s) => s.x >= 8 && s.y >= 8 && s.x + tw <= W - 8 && s.y + th <= H - 8;
    const content = [...document.querySelectorAll(CONTENT)].filter((n) => n !== el && !n.contains(el) && !el.contains(n))
      .map((n) => n.getBoundingClientRect()).filter((b) => b.width && b.height);
    const clear = (s) => !content.some((b) => b.left < s.x + tw && b.right > s.x && b.top < s.y + th && b.bottom > s.y);
    const spot = spots.find((s) => s && fits(s) && clear(s)) || (fits(spots[0]) ? spots[0] : spots[2]);

    tip.className = "cue-tip " + spot.side + (tip.classList.contains("jump") ? " jump" : "");
    tip.style.transform = `translate(${spot.x}px,${Math.max(8, spot.y)}px)`;
    /* arrow position: --ax along the top/bottom edge, --ay along the left/right edge */
    tip.style.setProperty("--ax", Math.max(14, Math.min(midX - spot.x, tw - 14)) + "px");
    tip.style.setProperty("--ay", Math.max(10, Math.min(midY - Math.max(8, spot.y), th - 10)) + "px");
    return true;
  }

  function placeJump() {
    if (!layer.firstChild) layer.append(tip);
    tip.classList.remove("above", "below", "right", "left");
    tip.style.removeProperty("--ax");
    const composer = document.querySelector(".composer");
    const bottom = composer ? composer.getBoundingClientRect().top : innerHeight;
    tip.style.transform = `translate(${(innerWidth - tip.offsetWidth) / 2}px,${bottom - tip.offsetHeight - 16}px)`;
  }

  function tick() {
    raf = 0;
    let c = null;
    if (on) { try { c = nextStep(); } catch (_) { c = null; } }
    if (!c || (c.el && !shown(c.el))) { hide(); return; }

    const next = (c.jump ? "jump|" : "ring|") + c.text;
    if (next !== sig) { hide(); sig = next; label.textContent = c.text; tip.classList.toggle("jump", !!c.jump); }
    cue = c;
    const settled = c.jump ? (placeJump(), true) : place(c.el);
    if (!settled || performance.now() < settleUntil) raf = requestAnimationFrame(tick);
  }

  function kick() {
    settleUntil = performance.now() + SETTLE_MS;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  /* ---------- wiring ---------- */
  /* Ignore the overlay's own changes, or it would keep itself awake. */
  new MutationObserver((recs) => { if (recs.some((m) => !layer.contains(m.target))) kick(); }).observe(document.body, {
    subtree: true, childList: true, attributes: true, attributeFilter: ["class", "aria-selected", "hidden", "data-view"],
  });
  document.addEventListener("scroll", kick, true);
  document.addEventListener("load", kick, true);            // images settling the layout
  document.addEventListener("transitionend", kick, true);
  window.addEventListener("resize", kick);
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) { on = e.newValue !== "off"; kick(); }
  });
  kick();
})();
