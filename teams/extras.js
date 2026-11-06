/**
 * The simpler Teams screens:
 *   Copilot (#copilot)  greeting, suggestions, and canned answers built from the demo data
 *   Notes   (#notelist, #notepane)  note list and the open note
 *   People  (#peoplelist)  contacts with presence, chat and call buttons
 */
"use strict";
(function () {
  const T = window.Teams, { el, icon, button, iconButton, avatar, when, listPane, clickable } = T.ui;
  const { PEOPLE, NOTES, CALLS } = T.data;

  /* ---------- Copilot ---------- */
  const cp = document.getElementById("copilot");
  cp.classList.add("pane", "main", "copilot");
  const back = iconButton("back", "Back", "back");
  back.dataset.back = "";
  const thread = el("div", "co-thread");
  const scroll = el("div", "scroll", el("div", "co-hero", el("span", "co-logo", icon("sparkle")),
    el("h2", null, "Hi John, how can I help?"),
    el("p", null, "Ask about your chats, meetings, and files.")), thread);
  const input = el("input");
  input.placeholder = "Message Copilot";
  input.setAttribute("aria-label", "Message Copilot");
  const send = iconButton("send", "Send", "send");
  const PROMPTS = ["Summarize my unread activity", "What's on my calendar today?", "Who tried to call me?"];
  const chips = el("div", "co-chips", PROMPTS.map((t) => {
    const b = button("pillbtn", t);
    b.addEventListener("click", () => ask(t));
    return b;
  }));
  cp.append(el("div", "topbar", back, el("span", "co-logo sm", icon("sparkle")), el("span", "apptitle", "Copilot")),
    scroll, chips, el("div", "composer", el("div", "cbox", el("div", "crow", input, el("div", "cicons", send)))));

  function answer(q) {
    q = q.toLowerCase();
    if (/calendar|meeting|today/.test(q)) {
      const list = T.calendar.today().map((e) => e.time + "  " + e.title);
      return "You have " + list.length + " meetings today:\n" + list.join("\n");
    }
    if (/call|phone|voicemail/.test(q)) {
      const missed = CALLS.filter((c) => c.dir === "missed").map((c) => PEOPLE[c.who].name + (c.vm ? " (voicemail)" : ""));
      return "Missed calls from " + missed.join(", ") + ".";
    }
    if (/unread|activity|summar|catch/.test(q))
      return "You have " + T.activity.unread() + " unread activity items. The most urgent: Sato, Frankie mentioned you in " +
        "Harborview Digital Launch about stale kiosk prices, and Patel, Sam is waiting on your approval for the Q4 hardware order.";
    return "I can summarize your activity, list today's meetings, or check missed calls. (Demo answers only.)";
  }
  function ask(q) {
    q = q.trim();
    if (!q) return;
    input.value = "";
    thread.append(el("div", "brow me", el("div", "stack", el("div", "bwrap", el("div", "bubble", el("div", "body", el("p", null, q)))))));
    const reply = el("div", "brow co-reply", el("span", "co-logo sm", icon("sparkle")),
      el("div", "stack", el("div", "bwrap", el("div", "bubble", el("div", "body", el("p", "co-typing", "…"))))));
    thread.append(reply);
    scroll.scrollTop = scroll.scrollHeight;
    setTimeout(() => { reply.querySelector("p").textContent = answer(q); reply.querySelector("p").className = ""; scroll.scrollTop = scroll.scrollHeight; }, 600);
  }
  send.addEventListener("click", () => ask(input.value));
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") ask(input.value); });

  /* ---------- Notes ---------- */
  const notes = listPane({
    id: "notelist", title: "Notes", search: "Search notes",
    searchText: (n) => n.title + " " + n.body, actions: [iconButton("edit", "New note")],
  });
  const page = document.getElementById("notepane");
  page.classList.add("pane", "main", "notepane");
  const nback = iconButton("back", "Back", "back");
  nback.dataset.back = "";
  const nhead = el("span", "apptitle"), nbody = el("div", "nt-body"), ndate = el("div", "nt-date");
  page.append(el("div", "topbar", nback, el("span", "nt-ic", icon("note")), nhead), el("div", "scroll", el("div", "nt-page", ndate, nbody)));
  function openNote(n, quiet) {
    nhead.textContent = n.title;
    ndate.textContent = "Edited " + (n.day ? when(n.day) : n.time);
    nbody.textContent = n.body;
    NOTES.forEach((x) => x.row.classList.toggle("sel", x === n));
    if (!quiet) T.reveal("note");
  }
  NOTES.forEach((n) => {
    n.row = el("div", "chat-it nt-it", el("span", "nt-ic", icon("note")),
      el("span", "cmain", el("span", "crow1", el("span", "cname", n.title), el("span", "ctime", when(n.day, n.time))),
        el("span", "cprev", el("span", null, n.body.split("\n")[0].replace(/^[•\d.]+\s*/, "")))));
    clickable(n.row, () => openNote(n));
    notes.add(n.row, n);
  });
  openNote(NOTES[0], true);

  /* ---------- People ---------- */
  const people = listPane({
    id: "peoplelist", title: "People", cls: "wide", search: "Search people",
    searchText: (p) => p.name + " " + p.title, actions: [iconButton("plus", "Add contact")],
    chips: [
      { key: "fav", label: "Favorites", test: (p) => !!p.fav },
      { key: "av", label: "Available", test: (p) => p.presence === "av" },
    ],
  });
  Object.entries(PEOPLE).sort((a, b) => a[1].name.localeCompare(b[1].name)).forEach(([key, p]) => {
    const acts = el("span", "call-acts");
    const chat = T.chats.forPerson(key);
    if (chat) {
      const b = iconButton("chat", "Chat with " + p.name);
      b.addEventListener("click", () => T.chats.open(chat));
      acts.append(b);
    }
    const c = iconButton("call", "Call " + p.name);
    c.addEventListener("click", () => T.call(p));
    acts.append(c);
    people.add(el("div", "chat-it pp-it", avatar(p),
      el("span", "cmain", el("span", "crow1", el("span", "cname", p.name)), el("span", "cprev", el("span", null, p.title)))), p)
      .append(acts);
  });
})();
