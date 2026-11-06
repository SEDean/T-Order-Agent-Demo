/**
 * Calls: history (#callhist) from Teams.data.CALLS, the desktop dial panel (#callpad), and the
 * in-call screen (Teams.call(target), used across the app).
 * - History rows: avatar, name (red when missed), direction icon and duration, time, plus
 *   chat (when a 1:1 chat exists) and call buttons. Chips: Missed, Incoming, Outgoing, Voicemail.
 * - Dial panel: "Type a name or number" (also filters the history), a dial pad, Make a call,
 *   and speed dial (favourite people).
 * - In-call screen: "Calling…", then a running timer; mute / video / speaker toggles; hang up
 *   logs the call at the top of the history.
 */
"use strict";
(function () {
  const T = window.Teams, { el, icon, button, iconButton, avatar, when, listPane } = T.ui;
  const { CALLS, PEOPLE } = T.data;
  const DIR = { in: ["in", "Incoming"], out: ["out", "Outgoing"], missed: ["missed", "Missed"] };

  /* ---------- history ---------- */
  const hist = listPane({
    id: "callhist", title: [el("span", "d-only", "History"), el("span", "m-only", "Calls")],
    cls: "wide", search: "Search calls", searchText: (c) => (PEOPLE[c.who] || c.person).name,
    actions: [iconButton("more", "More options")],
    chips: [
      { key: "missed", label: "Missed", test: (c) => c.dir === "missed" },
      { key: "in", label: "Incoming", test: (c) => c.dir === "in" },
      { key: "out", label: "Outgoing", test: (c) => c.dir === "out" },
      { key: "vm", label: "Voicemail", test: (c) => !!c.vm },
    ],
  });
  function row(c) {
    const p = PEOPLE[c.who] || c.person, [glyph, label] = DIR[c.dir];
    const detail = c.vm ? label + " · Voicemail " + c.vm : c.dur ? label + " · " + c.dur : label;
    const chat = T.chats.forPerson(c.who);
    const acts = el("span", "call-acts");
    if (chat) {
      const b = iconButton("chat", "Chat");
      b.addEventListener("click", () => T.chats.open(chat));
      acts.append(b);
    }
    const dial = iconButton("call", "Call " + p.name);
    dial.addEventListener("click", () => call(p));
    acts.append(dial);
    return el("div", "chat-it call-it" + (c.dir === "missed" ? " missed" : ""), avatar(p),
      el("span", "cmain",
        el("span", "crow1", el("span", "cname", p.name), el("span", "ctime", when(c.day, c.time))),
        el("span", "cprev call-dir", icon(glyph), el("span", null, detail))),
      acts);
  }
  CALLS.forEach((c) => hist.add(row(c), c));

  /* ---------- dial panel (desktop) ---------- */
  const pad = document.getElementById("callpad");
  pad.classList.add("pane", "side", "callpad");
  const q = el("input", "cp-q");
  q.placeholder = "Type a name or number";
  q.setAttribute("aria-label", "Type a name or number");
  q.addEventListener("input", () => {
    const box = hist.pane.querySelector(".cl-search"), input = box.querySelector("input");
    box.hidden = !q.value;
    input.value = q.value;
    input.dispatchEvent(new Event("input"));
  });
  const keys = el("div", "cp-keys", ["1", "2 ABC", "3 DEF", "4 GHI", "5 JKL", "6 MNO", "7 PQRS", "8 TUV", "9 WXYZ", "*", "0 +", "#"]
    .map((k) => {
      const [d, letters] = k.split(" ");
      const b = button("cp-key", el("b", null, d), el("small", null, letters || ""));
      b.addEventListener("click", () => { q.value += d; q.focus(); });
      return b;
    }));
  const make = button("btn btn-primary cp-make", icon("call"), "Make a call");
  make.addEventListener("click", () => {
    const v = q.value.trim();
    if (!v) return q.focus();
    const p = Object.values(PEOPLE).find((x) => x.name.toLowerCase().includes(v.toLowerCase()));
    call(p || { name: v, ini: "#", bg: "#4a5568" });
  });
  const speed = el("div", "cp-speed", Object.values(PEOPLE).filter((p) => p.fav).map((p) => {
    const b = button("cp-person", avatar(p), el("span", null, p.name.split(", ").reverse()[0]));
    b.title = "Call " + p.name;
    b.addEventListener("click", () => call(p));
    return b;
  }));
  pad.append(el("div", "cl-h", el("h2", null, "Calls")), el("div", "cp-body", q, keys, make,
    el("div", "cp-label", "Speed dial"), speed));

  /* ---------- in-call screen ---------- */
  const win = document.querySelector(".window");
  let screen = null, timer = 0;
  function call(p) {
    if (screen) return;
    const status = el("div", "callx-status", "Calling…");
    const toggle = (name, label) => {
      const b = iconButton(name, label, "callx-btn");
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")));
      return b;
    };
    const end = iconButton("call", "Hang up", "callx-btn callx-end");
    const big = avatar({ ...p, presence: null }, "callx-ava");
    screen = el("div", "callx", el("div", "callx-who", big, el("div", "callx-name", p.name), status),
      el("div", "callx-bar", toggle("video", "Camera"), toggle("mic", "Mute"), toggle("speaker", "Speaker"), end));
    screen.setAttribute("role", "dialog");
    screen.setAttribute("aria-label", "Call with " + p.name);
    win.append(screen);
    let secs = -1;
    const t0 = setTimeout(() => {
      big.classList.add("live");
      const tick = () => { secs++; status.textContent = Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0"); };
      tick();
      timer = setInterval(tick, 1000);
    }, 2600);
    end.addEventListener("click", () => {
      clearTimeout(t0); clearInterval(timer);
      screen.remove(); screen = null;
      const key = Object.keys(PEOPLE).find((k) => PEOPLE[k] === p);
      const c = { who: key, person: p, dir: "out", day: 0,
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        dur: secs > 0 ? Math.floor(secs / 60) + "m " + String(secs % 60).padStart(2, "0") + "s" : null };
      const r = hist.add(row(c), c);
      hist.list.prepend(r);
      hist.refresh();
    });
    end.focus();
  }

  T.call = call;
})();
