/**
 * Most recent chat (Harborview Digital Launch): sample conversation for the Chat view.
 * Renders into #convMsgs with the same bubble markup as the Thrive chat (ordering.css),
 * and lets the viewer send a message of their own. Content is fictional.
 * Nodes are built with createElement/textContent.
 */
"use strict";
(function () {
  const PEOPLE = {
    JO: { name: "Okafor, Jordan", bg: "#8e562e" },
    PL: { name: "Lee, Priya", bg: "#116149" },
    FS: { name: "Sato, Frankie", bg: "#a33f6e" },
  };
  /* who: a PEOPLE key, or null for you. The last message matches the chat-list preview. */
  const MESSAGES = [
    ["JO", "9:12 AM", "Morning all. The menu sync for the Harborview kiosks is booked for 11:00 today."],
    ["PL", "9:20 AM", "The updated price file is in the shared folder: 42 items changed, mostly beverages."],
    [null, "9:31 AM", "Thanks, Priya. I'll push it to the test kiosk first and confirm before we go live."],
    ["JO", "9:38 AM", "Sounds good. Can we also check that the new combo images load on the small screens?"],
    [null, "9:44 AM", "Pushed. The test kiosk should pick it up within a few minutes."],
    ["FS", "9:52 AM", "Still not seeing the updated prices on the test kiosk. Clearing the cache and will report back."],
  ];

  const list = document.getElementById("convMsgs");
  const scroll = document.getElementById("convScroll");
  const input = document.getElementById("convInput");
  const el = (tag, cls, ...kids) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    kids.forEach((k) => k != null && n.append(k));
    return n;
  };

  function message(who, time, text) {
    const p = who && PEOPLE[who];
    const meta = el("div", "meta", p ? el("span", "name", p.name) : null, el("span", "time", time));
    const stack = el("div", "stack", meta, el("div", "bwrap", el("div", "bubble", el("div", "body", el("p", null, text)))));
    let av = null;
    if (p) { av = el("div", "av cv-av", who); av.style.background = p.bg; }
    list.append(el("div", "brow" + (p ? "" : " me"), av, stack));
  }

  MESSAGES.forEach((m) => message(...m));

  function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    message(null, new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), text);
    scroll.scrollTop = scroll.scrollHeight;
  }
  document.getElementById("convSend").addEventListener("click", send);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });

  /* Keep the newest message in view whenever the pane is shown (nav.js toggles data-view). */
  new MutationObserver(() => { scroll.scrollTop = scroll.scrollHeight; })
    .observe(document.querySelector(".window"), { attributes: true, attributeFilter: ["data-view"] });
})();
