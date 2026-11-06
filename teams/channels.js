/**
 * Teams: the team list with channels (#teamlist) and the open channel's posts (#chanpane),
 * from Teams.data.TEAMS. Team headers collapse; search matches team and channel names.
 * The composer ("Start a post") adds your post to the channel.
 * API: Teams.channels.open("team/channel").
 */
"use strict";
(function () {
  const T = window.Teams, { el, icon, iconButton, avatar, when, listPane, clickable } = T.ui;
  const { TEAMS, PEOPLE, ME } = T.data;
  const tile = (t, cls) => { const s = el("span", "tm-tile " + (cls || ""), t.ini); s.style.background = t.bg; return s; };

  const list = listPane({
    id: "teamlist", title: "Teams", search: "Search teams and channels",
    searchText: (x) => x.text, actions: [iconButton("more", "More options")],
  });
  const rows = {};
  TEAMS.forEach((t) => {
    const chev = icon("down", "tm-chev");
    const head = el("div", "tm-head", chev, tile(t), el("span", "cname", t.name));
    const kids = t.channels.map((c) => {
      const r = el("div", "tm-chan", icon("hash"), el("span", null, c.name));
      clickable(r, () => open(t.id + "/" + c.id));
      rows[t.id + "/" + c.id] = r;
      return list.add(r, { text: t.name + " " + c.name });
    });
    clickable(head, () => {
      const shut = head.classList.toggle("shut");
      kids.forEach((k) => k.classList.toggle("folded", shut));
    });
    list.list.insertBefore(head, kids[0]);
  });

  /* ---------- channel ---------- */
  const pane = document.getElementById("chanpane");
  pane.classList.add("pane", "main", "chanpane");
  const back = iconButton("back", "Back", "back");
  back.dataset.back = "";
  const head = el("span", "cv-head");
  const posts = el("div", "msgs ch-posts");
  const scroll = el("div", "scroll", posts);
  const input = el("input");
  input.placeholder = "Start a post";
  input.setAttribute("aria-label", "Start a post");
  const send = iconButton("send", "Post", "send");
  pane.append(el("div", "topbar", back, head, el("div", "right", iconButton("video", "Meet"), iconButton("more", "More options"))),
    el("div", "tabs cv-tabs", el("span", "cv-tab on", "Posts"), el("span", "cv-tab", "Files"), el("span", "cv-tab", "+")),
    scroll, el("div", "composer", el("div", "cbox", el("div", "crow", input, el("div", "cicons", send)))));

  function card([who, day, time, text, replies]) {
    const p = who ? PEOPLE[who] : ME;
    return el("article", "ch-post", avatar({ ...p, presence: null }, "ch-ava"),
      el("div", "ch-body",
        el("div", "meta", el("span", "name", who ? p.name : "You"), el("span", "time", when(day, time) + (day ? " " + time : ""))),
        el("p", null, text),
        replies ? el("div", "ch-replies", replies + (replies === 1 ? " reply" : " replies")) : null));
  }
  let current = null;
  function open(key, quiet) {
    const [tid, cid] = key.split("/"), t = TEAMS.find((x) => x.id === tid), c = t.channels.find((x) => x.id === cid);
    current = c;
    head.replaceChildren(tile(t, "cv-ava"), el("span", "cv-titles", el("span", "apptitle", c.name), el("span", "cv-sub", t.name)));
    posts.replaceChildren(...(c.posts.length ? c.posts.map(card)
      : [el("div", "ch-empty", "No posts yet. Start the conversation.")]));
    Object.entries(rows).forEach(([k, r]) => r.classList.toggle("sel", k === key));
    if (!quiet) T.reveal("channel");
    requestAnimationFrame(() => { scroll.scrollTop = 0; });
  }
  function post() {
    const text = input.value.trim();
    if (!text || !current) return;
    input.value = "";
    const p = [null, 0, new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), text, 0];
    current.posts.unshift(p);
    posts.querySelector(".ch-empty")?.remove();
    posts.prepend(card(p));
    scroll.scrollTop = 0;
  }
  send.addEventListener("click", post);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") post(); });

  open(TEAMS[0].id + "/" + TEAMS[0].channels[0].id, true);   // desktop shows it beside the list
  T.channels = { open };
})();
