/**
 * Sample content for the Teams screens (window.Teams.data). Everything here is fictional.
 * People are referenced by key so every screen (chats, activity, calls, people) agrees.
 * Times: `day` = days ago (0 = today, which shows `time`); "@John Smith" renders as a mention.
 */
"use strict";
(function () {
  const PEOPLE = {
    JO: { name: "Okafor, Jordan", ini: "JO", bg: "#8e562e", title: "Program Manager", presence: "av", fav: true },
    PL: { name: "Lee, Priya", ini: "PL", bg: "#116149", title: "Pricing Analyst", presence: "av", fav: true },
    FS: { name: "Sato, Frankie", ini: "FS", bg: "#a33f6e", title: "Field Technician", presence: "bsy" },
    CM: { name: "Marks, Cal", ini: "CM", bg: "#2f7d5b", title: "Operations Lead", presence: "av" },
    JG: { name: "Gutierrez, Jon", ini: "JG", bg: "#3b3a39", title: "Vendor Manager", presence: "aw" },
    SP: { name: "Patel, Sam", ini: "SP", bg: "#1f6aa5", title: "Procurement", presence: "av" },
    MC: { name: "Chen, Morgan", ini: "MC", bg: "#5c4a8f", title: "Director, Digital", presence: "bsy", fav: true },
    SB: { name: "Bianchi, Serena", ini: "SB", bg: "#635a83", title: "Release Manager", presence: "aw" },
    IC: { name: "Chang, Ian", ini: "IC", bg: "#2b6c80", title: "Integration Engineer", presence: "av" },
    VK: { name: "Kapoor, Vinit", ini: "VK", bg: "#8e562e", title: "Site Manager", presence: "av" },
    CC: { name: "Calder, Charlie", ini: "CC", bg: "#4a5568", title: "Regional Lead", presence: "off" },
    AR: { name: "Rivera, Alex", ini: "AR", bg: "#b3740f", title: "Engineering Manager", presence: "av", fav: true },
  };
  const ME = { name: "Smith, John", ini: "JS", bg: "#7a3b8f", presence: "bsy" };

  /* Chats, most recent first. kind: person | group | meeting | bot | self. with = 1:1 person.
     msgs: [who|null(you), day, time, text] or { sys: text, day, time }. preview overrides the
     generated "Name: last message" line. The bot (Thrive) opens only from More apps. */
  const CHATS = [
    { id: "harbor", name: "Harborview Digital Launch", ini: "HD", bg: "#0f6cbd", kind: "group", members: 4, unread: true, msgs: [
      ["JO", 0, "9:12 AM", "Morning all. The menu sync for the Harborview kiosks is booked for 11:00 today."],
      ["PL", 0, "9:20 AM", "The updated price file is in the shared folder: 42 items changed, mostly beverages."],
      [null, 0, "9:31 AM", "Thanks, Priya. I'll push it to the test kiosk first and confirm before we go live."],
      ["JO", 0, "9:38 AM", "Sounds good. Can we also check that the new combo images load on the small screens?"],
      [null, 0, "9:44 AM", "Pushed. The test kiosk should pick it up within a few minutes."],
      ["FS", 0, "9:52 AM", "Still not seeing the updated prices on the test kiosk. @John Smith, can you check the sync log?"]] },
    { id: "acme", name: "ACME Central Ops", ini: "AC", bg: "#116149", kind: "group", members: 6, unread: true, msgs: [
      ["CM", 0, "8:12 AM", "Morning report is out. Two new stores went live overnight."],
      [null, 0, "8:30 AM", "Nice. Will the new stores show up in tomorrow's sales report?"],
      ["CM", 0, "8:45 AM", "It will. It just needs the new store IDs mapped first."]] },
    { id: "thrive", name: "Thrive", kind: "bot", day: 2, preview: "Thrive: Pick a spot to order from" },
    { id: "self", name: "Smith, John (You)", ini: "JS", bg: "#7a3b8f", kind: "self", presence: "bsy", preview: "You: Sent a file", msgs: [
      [null, 3, "4:02 PM", "📎 Kiosk rollout plan.docx"]] },
    { id: "kapoor", name: "Kapoor, Vinit, +2", ini: "VK", bg: "#8e562e", kind: "group", members: 3, presence: "av", msgs: [
      [null, 3, "2:15 PM", "Uploaded the rollout checklist to Launch › Checklists."],
      ["VK", 3, "2:21 PM", "Hi John, you're a lifesaver. Thanks!"]] },
    { id: "gutierrez", name: "Gutierrez, Jon", with: "JG", kind: "person", msgs: [
      [null, 3, "11:05 AM", "Are you joining the vendor demo on Thursday?"],
      ["JG", 3, "11:40 AM", "Possibly"]] },
    { id: "nexbridge", name: "Nexbridge Integration Sync", kind: "meeting", msgs: [
      { sys: "Meeting ended · 45m", day: 3, time: "3:45 PM" },
      ["IC", 3, "3:47 PM", "gtg, thank you everyone. @John Smith, the meeting notes are in the wiki."]] },
    { id: "apptrouble", name: "App Troubleshooting", kind: "meeting", msgs: [
      ["SP", 4, "10:02 AM", "Joining in two minutes."],
      { sys: "Meeting ended · 32m", day: 4, time: "10:40 AM" }] },
    { id: "solano", name: "Solano Launch Opening", kind: "meeting", preview: "Sent a file", msgs: [
      ["MC", 4, "1:30 PM", "📎 Solano opening run of show.pdf"]] },
    { id: "bianchi", name: "Bianchi, Serena", with: "SB", kind: "person", msgs: [
      ["SB", 5, "9:10 AM", "Can you send me the freeze calendar?"],
      [null, 5, "9:14 AM", "↪ Forwarded a message: Change freeze dates for Q4"]] },
    { id: "calder", name: "Calder, Charlie", with: "CC", kind: "person", msgs: [
      [null, 5, "4:48 PM", "Is it possible to get a copy of the rollout deck before Monday?"]] },
    { id: "wellness", name: "Wellness Center Review", kind: "meeting", msgs: [
      { sys: "Meeting ended · 58m", day: 5, time: "12:00 PM" },
      { sys: "Recording is ready", day: 5, time: "12:20 PM" }] },
  ];

  /* Activity, newest first. open: what clicking it shows (a chat id, or a screen). */
  const ACTIVITY = [
    { who: "FS", act: "mentioned you", type: "mention", where: "Harborview Digital Launch", open: { chat: "harbor" }, unread: true,
      text: "Still not seeing the updated prices on the test kiosk. John Smith, can you check the sync log?", time: "9:52 AM" },
    { who: "PL", act: "reacted to your message", type: "heart", where: "Harborview Digital Launch", open: { chat: "harbor" }, unread: true,
      text: "Thanks, Priya. I'll push it to the test kiosk first and confirm before we go live.", time: "9:33 AM" },
    { who: "CM", act: "replied to your message", type: "reply", where: "ACME Central Ops", open: { chat: "acme" }, unread: true,
      text: "It will. It just needs the new store IDs mapped first.", time: "8:45 AM" },
    { who: "JG", act: "missed call", type: "call", where: "Calls", open: { view: "calls" }, unread: true, text: "Call back", time: "8:20 AM" },
    { who: "SP", act: "requested your approval", type: "approval", where: "Approvals", unread: true,
      text: "Q4 kiosk hardware order · 12 units", time: "7:58 AM" },
    { who: "MC", act: "updated the agenda", type: "meeting", where: "Quarterly planning week", open: { view: "calendar" }, unread: true,
      text: "Added a 30-minute session on the menu rollout timeline.", time: "7:40 AM" },
    { who: "JO", act: "assigned you a task", type: "task", where: "Planner · Harborview launch",
      text: "Verify combo images on small kiosk screens", day: 1 },
    { who: "PL", act: "shared a file with you", type: "file", where: "OneDrive", open: { view: "files" },
      text: "Harborview price update.xlsx", day: 1 },
    { who: "SB", act: "posted in General", type: "channel", where: "Digital Ops", open: { channel: "ops/general" },
      text: "Reminder: the change freeze starts Friday at 5 PM. Ship anything urgent before then.", day: 1 },
    { who: "IC", act: "mentioned you", type: "mention", where: "Nexbridge Integration Sync", open: { chat: "nexbridge" },
      text: "gtg, thank you everyone. John Smith, the meeting notes are in the wiki.", day: 3 },
    { who: "VK", act: "liked your message", type: "like", where: "Kapoor, Vinit, +2", open: { chat: "kapoor" },
      text: "Uploaded the rollout checklist to Launch › Checklists.", day: 3 },
    { who: "CC", act: "left a voicemail", type: "voicemail", where: "Calls · 0:42", open: { view: "calls" },
      text: "Hi John, quick question about the store rollout. Call me when you get a minute.", day: 3 },
  ];

  /* Call history, newest first. dir: in | out | missed; vm = left a voicemail. */
  const CALLS = [
    { who: "JG", dir: "missed", day: 0, time: "8:20 AM" },
    { who: "AR", dir: "out", day: 0, time: "7:52 AM", dur: "12m 40s" },
    { who: "PL", dir: "in", day: 1, time: "4:31 PM", dur: "6m 05s" },
    { who: "MC", dir: "out", day: 1, time: "1:10 PM", dur: "22m 18s" },
    { who: "SP", dir: "missed", day: 2, time: "3:02 PM" },
    { who: "CC", dir: "missed", day: 3, time: "5:15 PM", vm: "0:42" },
    { who: "JO", dir: "in", day: 3, time: "9:45 AM", dur: "3m 51s" },
    { who: "IC", dir: "out", day: 4, time: "2:20 PM", dur: "18m 02s" },
    { who: "CM", dir: "in", day: 5, time: "11:00 AM", dur: "9m 47s" },
    { who: "SB", dir: "out", day: 6, time: "10:30 AM", dur: "1m 12s" },
    { who: "VK", dir: "missed", day: 8, time: "8:05 AM", vm: "0:18" },
  ];

  /* Files. ext picks the tile colour; shared = shared with you; fav = starred. */
  const FILES = [
    { name: "Harborview price update.xlsx", where: "Shared with you · Lee, Priya", day: 1, shared: true, fav: true },
    { name: "Kiosk rollout plan.docx", where: "OneDrive › Harborview Launch", day: 0, time: "8:55 AM", fav: true },
    { name: "Solano opening run of show.pdf", where: "Solano Launch Opening", day: 4, shared: true },
    { name: "Q4 hardware order.xlsx", where: "Shared with you · Patel, Sam", day: 0, time: "7:58 AM", shared: true },
    { name: "Menu combo images.zip", where: "Harborview Launch › Menu & Pricing", day: 2 },
    { name: "Quarterly planning agenda.docx", where: "Shared with you · Chen, Morgan", day: 0, time: "7:40 AM", shared: true, fav: true },
    { name: "Rollout checklist.docx", where: "OneDrive › Launch › Checklists", day: 3 },
    { name: "Store rollout deck.pptx", where: "OneDrive › Presentations", day: 5 },
    { name: "Vendor demo notes.docx", where: "OneDrive › Vendors", day: 6 },
    { name: "Change freeze calendar.pdf", where: "Digital Ops › General", day: 7, shared: true },
  ];

  /* Teams and channels. A post: [who, day, time, text, replies]. */
  const TEAMS = [
    { id: "ops", name: "Digital Ops", ini: "DO", bg: "#4f52b2", channels: [
      { id: "general", name: "General", posts: [
        ["SB", 1, "4:10 PM", "Reminder: the change freeze starts Friday at 5 PM. Ship anything urgent before then.", 3],
        ["IC", 2, "11:25 AM", "Release notes for 4.2 are up in the wiki. Shout if anything looks off.", 1]] },
      { id: "releases", name: "Releases", posts: [["SB", 2, "9:00 AM", "4.2 is live in all regions. Rollback plan is attached to the release ticket.", 0]] },
      { id: "kiosk", name: "Kiosk Support", posts: [["FS", 0, "9:58 AM", "Seeing stale prices on one test kiosk at Harborview. Investigating.", 2]] }] },
    { id: "harbor", name: "Harborview Launch", ini: "HL", bg: "#0f6cbd", channels: [
      { id: "general", name: "General", posts: [["JO", 1, "3:30 PM", "The launch checklist is pinned to this channel. Please tick off your items by Friday.", 4]] },
      { id: "menu", name: "Menu & Pricing", posts: [["PL", 1, "5:12 PM", "Price file v3 uploaded: 42 changes, mostly beverages.", 2]] },
      { id: "hardware", name: "Hardware", posts: [["SP", 2, "1:45 PM", "Twelve kiosks arrive Monday. Install crew is booked for Tuesday.", 1]] }] },
    { id: "cafe", name: "Cafe Operations", ini: "CO", bg: "#116149", channels: [
      { id: "general", name: "General", posts: [["CM", 3, "8:00 AM", "Holiday hours are posted. Thanks for getting them in early.", 5]] },
      { id: "schedules", name: "Schedules", posts: [] }] },
    { id: "design", name: "Design Guild", ini: "DG", bg: "#a33f6e", channels: [
      { id: "general", name: "General", posts: [["JO", 4, "2:00 PM", "Critique sessions move to Thursdays starting next week.", 0]] },
      { id: "critiques", name: "Critiques", posts: [["AR", 2, "10:15 AM", "Kiosk combo screen v2 is ready for feedback. Link in the thread.", 6]] }] },
  ];

  const NOTES = [
    { title: "Kiosk rollout checklist", day: 0, time: "9:05 AM",
      body: "• Confirm price file v3 on the test kiosk\n• Check combo images on small screens\n• Sign off with Jordan before 11:00 sync\n• Schedule install crew for Tuesday" },
    { title: "1:1 with Alex: talking points", day: 1,
      body: "• Q4 hiring plan\n• On-call rotation for the change freeze\n• Feedback on the vendor demo" },
    { title: "Vendor demo questions", day: 3,
      body: "• Offline mode for kiosks?\n• Support hours and escalation path\n• Pricing for 20+ sites" },
    { title: "Q4 planning ideas", day: 5,
      body: "• Mobile pre-order for all cafes\n• Combo pricing experiments\n• Kiosk accessibility review" },
    { title: "Menu sync runbook", day: 9,
      body: "1. Export prices from the menu tool\n2. Upload to the shared folder\n3. Push to test kiosk and verify\n4. Publish to all sites" },
  ];

  window.Teams = Object.assign(window.Teams || {}, {
    data: { PEOPLE, ME, CHATS, ACTIVITY, CALLS, FILES, TEAMS, NOTES },
  });
})();
