/**
 * Chat: the chat list (#clist) and the open conversation (#convpane), from Teams.data.CHATS.
 * - List: quick views (desktop), then chats with "Name: last message" previews; Unread /
 *   Chats / Meeting chats chips and search. The Thrive row is inert: Thrive opens from More apps.
 * - Conversation: header (avatar, name, call / video / people), day dividers, bubbles
 *   (ordering.css markup), and a composer that appends your message and moves the chat to the top.
 * - A chat is marked read once it is on screen; a "teams:chat" event tells Activity.
 * API: Teams.chats.open(id), Teams.chats.forPerson(key).
 */
"use strict";
(function () {
  const T = window.Teams, { el, icon, iconButton, avatar, when, listPane, clickable } = T.ui;
  const { CHATS, PEOPLE } = T.data;
  const byId = Object.fromEntries(CHATS.map((c) => [c.id, c]));
  const nowTime = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const last = (c) => c.msgs && c.msgs[c.msgs.length - 1];
  const plain = (t) => t.replace(/@(John Smith)/g, "$1");
  const shortName = (key) => PEOPLE[key].name;

  function preview(c) {
    if (c.preview) return c.preview;
    const m = last(c);
    if (!m) return "";
    if (m.sys) return m.sys;
    const [who, , , text] = m;
    if (!who) return "You: " + plain(text);
    return c.kind === "person" ? plain(text) : shortName(who) + ": " + plain(text);
  }
  const dayOf = (c) => (c.msgs ? (last(c).day ?? last(c)[1]) : c.day);
  const timeOf = (c) => {
    const m = last(c), day = dayOf(c);
    return when(day, m ? (m.time || m[2]) : "");
  };
  function chatAvatar(c, cls) {
    if (c.kind === "bot") return el("span", "cava bot " + (cls || ""), el("img", "avimg"), el("span", "dot av"));
    if (c.kind === "meeting") return el("span", "cava grp " + (cls || ""), icon("M4 6.5h16v13H4zM4 10h16M8.5 4v4M15.5 4v4"));
    const p = c.with ? PEOPLE[c.with] : c;
    return avatar(p, cls);
  }

  /* ---------- list ---------- */
  const chatList = listPane({
    id: "clist", title: "Chat", cls: "clist", search: "Search chats",
    searchText: (c) => c.name + " " + preview(c),
    actions: [iconButton("more", "Filter"), iconButton("edit", "New chat")],
    chips: [
      { key: "unread", label: "Unread", test: (c) => !!c.unread },
      { key: "chats", label: "Chats", test: (c) => c.kind !== "meeting" },
      { key: "meeting", label: "Meeting chats", test: (c) => c.kind === "meeting" },
    ],
  });
  const quick = (glyph, label, fn) => {
    const r = el("div", "cl-row", icon(glyph), label);
    if (fn) clickable(r, fn);
    return r;
  };
  const sec = (label, open) => el("div", "cl-sec", icon(open ? "down" : "chev"), label);
  const copilot = quick("sparkle", "Copilot");
  copilot.dataset.go = "copilot";
  chatList.list.append(copilot, sec("Quick views", true),
    quick("M12 8a4 4 0 100 8 4 4 0 000-8zM16 12v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1", "Mentions",
      () => { T.go("activity"); T.activity.filter("mention"); }),
    quick("edit", "Drafts"), sec("Favorites"), sec("Chats", true));

  const rows = {};
  CHATS.forEach((c) => {
    const img = c.kind === "bot";
    const row = el("div", "chat-it" + (c.unread ? " unread" : ""), chatAvatar(c),
      el("span", "cmain",
        el("span", "crow1", el("span", "cname", c.name), el("span", "ctime", timeOf(c))),
        el("span", "cprev", el("span", null, preview(c)), el("span", "udot"))));
    if (img) row.querySelector("img").src = "../assets/brand/thrive.png";
    else clickable(row, () => open(c.id));
    rows[c.id] = row;
    chatList.add(row, c);
  });
  const refreshRow = (c) => {
    rows[c.id].querySelector(".ctime").textContent = timeOf(c);
    rows[c.id].querySelector(".cprev span").textContent = preview(c);
  };

  /* ---------- conversation ---------- */
  const pane = document.getElementById("convpane");
  pane.classList.add("pane", "main", "convpane");
  const back = iconButton("back", "Back", "back");
  back.dataset.back = "";
  const head = el("span", "cv-head");
  const right = el("div", "right");
  const msgs = el("div", "msgs");
  const scroll = el("div", "scroll", msgs);
  const input = el("input");
  input.placeholder = "Type a message";
  input.setAttribute("aria-label", "Type a message");
  const send = iconButton("send", "Send", "send");
  pane.append(
    el("div", "topbar", back, head, right),
    el("div", "tabs cv-tabs", el("span", "cv-tab on", "Chat"), el("span", "cv-tab", "Shared"), el("span", "cv-tab", "+")),
    scroll,
    el("div", "composer", el("div", "cbox", el("div", "crow", input, el("div", "cicons", send)))));

  function bubble(c, m) {
    if (m.sys) return el("div", "cv-sys", m.sys + " · " + m.time);
    const [who, , time, text] = m, p = who && PEOPLE[who];
    const para = el("p", null, text.split(/@(John Smith)/).map((t, i) => (i % 2 ? el("span", "cv-mention", t) : t)));
    const named = p && c.kind !== "person";
    return el("div", "brow" + (p ? "" : " me"), p ? avatar(p, "av cv-av") : null,
      el("div", "stack", el("div", "meta", named ? el("span", "name", p.name) : null, el("span", "time", time)),
        el("div", "bwrap", el("div", "bubble", el("div", "body", para)))));
  }
  const dividerLabel = (day) => (day ? when(day) : "Today");

  let current = null;
  function render(c) {
    current = c;
    const sub = c.kind === "person" ? PEOPLE[c.with].title : c.kind === "meeting" ? "Meeting chat" : null;
    head.replaceChildren(chatAvatar(c, "cv-ava"), el("span", "cv-titles", el("span", "apptitle", c.name), sub ? el("span", "cv-sub", sub) : null));
    const target = c.with ? PEOPLE[c.with] : c;
    const video = iconButton("video", "Video call"), call = iconButton("call", "Audio call");
    video.addEventListener("click", () => T.call(target));
    call.addEventListener("click", () => T.call(target));
    const ppl = c.members ? el("span", "btn-ic cv-people", icon("people"), String(c.members)) : null;
    right.replaceChildren(...[video, call, ppl, iconButton("more", "More options")].filter(Boolean));
    msgs.replaceChildren();
    let day = null;
    (c.msgs || []).forEach((m) => {
      const d = m.sys ? m.day : m[1];
      if (d !== day) { day = d; msgs.append(el("div", "today", el("span", null, dividerLabel(d)))); }
      msgs.append(bubble(c, m));
    });
    Object.values(rows).forEach((r) => r.classList.toggle("sel", r === rows[c.id]));
    requestAnimationFrame(() => { scroll.scrollTop = scroll.scrollHeight; });
  }
  function read(c) {
    if (c.unread) { c.unread = false; rows[c.id].classList.remove("unread"); }
    document.dispatchEvent(new CustomEvent("teams:chat", { detail: { id: c.id } }));
  }
  function open(id) {
    const c = byId[id];
    if (!c || c.kind === "bot") return;
    render(c);
    T.reveal("conv");
    read(c);
  }

  function post() {
    const text = input.value.trim();
    if (!text || !current) return;
    input.value = "";
    const m = [null, 0, nowTime(), text];
    (current.msgs = current.msgs || []).push(m);
    delete current.preview;
    const lastDivider = [...msgs.querySelectorAll(".today")].pop();
    if (!lastDivider || lastDivider.textContent !== "Today") msgs.append(el("div", "today", el("span", null, "Today")));
    msgs.append(bubble(current, m));
    scroll.scrollTop = scroll.scrollHeight;
    refreshRow(current);
    const first = chatList.list.querySelector(".chat-it");
    if (first !== rows[current.id]) first.before(rows[current.id]);
  }
  send.addEventListener("click", post);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") post(); });

  /* Selection follows the view: Thrive's row while Thrive is open; the open chat otherwise.
     A chat on screen is read. */
  document.addEventListener("teams:view", (e) => {
    const { view, panes } = e.detail;
    rows.thrive.classList.toggle("sel", view === "thrive");
    if (current) rows[current.id].classList.toggle("sel", view !== "thrive");
    if (panes.has("convpane") && current) read(current);
  });

  render(CHATS[0]);
  T.chats = { open, forPerson: (key) => key && (CHATS.find((c) => c.with === key) || {}).id };
})();
