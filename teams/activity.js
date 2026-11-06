/**
 * Activity feed (#actlist) from Teams.data.ACTIVITY.
 * - Chips: Unread, Mentions, Replies, Reactions, Missed calls; search over the whole item.
 * - Clicking an item marks it read and opens what it points at: its chat (beside the feed on
 *   desktop), Calls, Files, a channel, or the calendar.
 * - Items about a chat are marked read when that chat is opened anywhere ("teams:chat").
 * - The Activity badges (rail and mobile nav) equal the unread count.
 * API: Teams.activity.filter(key), Teams.activity.unread().
 */
"use strict";
(function () {
  const T = window.Teams, { el, icon, iconButton, avatar, when, listPane, clickable } = T.ui;
  const { ACTIVITY, PEOPLE } = T.data;
  /* Type badge on the avatar: colour + icon path, or an emoji. */
  const TYPE = {
    mention: { bg: "#5b5fc7", d: "M12 8a4 4 0 100 8 4 4 0 000-8zM16 12v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1" },
    reply: { bg: "#5b5fc7", d: "M10 7.5L5 12l5 4.5M5.5 12H14a5 5 0 015 5v1" },
    heart: { bg: "#c4314b", emoji: "❤️" },
    like: { bg: "#b3740f", emoji: "👍" },
    call: { bg: "#c50f1f", d: "call" },
    voicemail: { bg: "#8a5a2b", d: "voicemail" },
    meeting: { bg: "#0e7a8f", d: "M4 6.5h16v13H4zM4 10h16M8.5 4v4M15.5 4v4" },
    approval: { bg: "#2f7d5b", d: "M6 12.5l4 4 8-9" },
    task: { bg: "#3f7c3a", d: "M5 7h2M10 7h9M5 12h2M10 12h9M5 17h2M10 17h9" },
    file: { bg: "#1f6aa5", d: "file" },
    channel: { bg: "#4f52b2", d: "people" },
  };
  const badge = (t) => {
    const b = el("span", "act-type", t.emoji || icon(t.d));
    b.style.background = t.bg;
    return b;
  };

  const feed = listPane({
    id: "actlist", title: "Activity", search: "Search activity",
    searchText: (f) => [PEOPLE[f.who].name, f.act, f.where, f.text].join(" "),
    actions: [iconButton("more", "More options")],
    chips: [
      { key: "unread", label: "Unread", test: (f) => !!f.unread },
      { key: "mention", label: "Mentions", test: (f) => f.type === "mention" },
      { key: "reply", label: "Replies", test: (f) => f.type === "reply" },
      { key: "reaction", label: "Reactions", test: (f) => f.type === "heart" || f.type === "like" },
      { key: "missed", label: "Missed calls", test: (f) => f.type === "call" || f.type === "voicemail" },
    ],
  });

  ACTIVITY.forEach((f) => {
    const p = PEOPLE[f.who];
    const ava = avatar({ ...p, presence: null }, "act-ava");
    ava.append(badge(TYPE[f.type]));
    f.row = el("div", "act-it" + (f.unread ? " unread" : ""), ava,
      el("span", "act-main",
        el("span", "act-l1", el("span", "act-who", p.name + " " + f.act), el("span", "ctime", when(f.day, f.time))),
        el("span", "act-where", f.where),
        el("span", "act-text", el("span", null, f.text), el("span", "udot"))));
    clickable(f.row, () => select(f));
    feed.add(f.row, f);
  });

  function badges() {
    const n = ACTIVITY.filter((f) => f.unread).length;
    document.querySelectorAll('[data-go="activity"] .rbadge').forEach((b) => { b.textContent = n; b.hidden = !n; });
  }
  function read(f) {
    if (!f.unread) return;
    f.unread = false;
    f.row.classList.remove("unread");
    badges();
  }
  function select(f) {
    read(f);
    const o = f.open || {};
    if (o.chat) {
      ACTIVITY.forEach((x) => x.row.classList.toggle("sel", x === f));
      T.chats.open(o.chat);
    } else if (o.channel) T.channels.open(o.channel);
    else if (o.view) T.go(o.view);
  }

  /* Opening a chat reads its mentions, reactions, and replies. On desktop, Activity shows the
     chat of its selected item (the top one at first). */
  document.addEventListener("teams:chat", (e) => ACTIVITY.forEach((f) => f.open && f.open.chat === e.detail.id && read(f)));
  document.addEventListener("teams:view", (e) => {
    if (e.detail.view === "activity" && !T.narrow.matches)
      select(ACTIVITY.find((f) => f.row.classList.contains("sel")) || ACTIVITY[0]);
  });

  badges();
  T.activity = { filter: feed.filter, unread: () => ACTIVITY.filter((f) => f.unread).length };
})();
