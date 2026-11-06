/**
 * Files / OneDrive (#filelist) from Teams.data.FILES: type tile, name, location, modified,
 * a favourite star, and Shared / Favorites / Word / Excel / PDF chips plus search.
 */
"use strict";
(function () {
  const T = window.Teams, { el, iconButton, when, listPane } = T.ui;
  const TYPE = { docx: "#185abd", xlsx: "#107c41", pptx: "#c43e1c", pdf: "#d13438", zip: "#6b6b6b" };
  const ext = (f) => f.name.split(".").pop();

  const files = listPane({
    id: "filelist", title: [el("span", "d-only", "OneDrive"), el("span", "m-only", "Files")], cls: "wide",
    search: "Search files", searchText: (f) => f.name + " " + f.where,
    actions: [iconButton("more", "More options")],
    chips: [
      { key: "shared", label: "Shared", test: (f) => !!f.shared },
      { key: "fav", label: "Favorites", test: (f) => !!f.fav },
      { key: "docx", label: "Word", test: (f) => ext(f) === "docx" },
      { key: "xlsx", label: "Excel", test: (f) => ext(f) === "xlsx" },
      { key: "pdf", label: "PDF", test: (f) => ext(f) === "pdf" },
    ],
  });
  files.list.before(el("div", "fl-cols", el("span", null, "Name"), el("span", null, "Modified")));

  T.data.FILES.forEach((f) => {
    const x = ext(f), tile = el("span", "fl-tile", x.toUpperCase());
    tile.style.background = TYPE[x];
    const star = iconButton("star", "Favorite", "fl-star");
    star.setAttribute("aria-pressed", String(!!f.fav));
    star.addEventListener("click", () => { f.fav = !f.fav; star.setAttribute("aria-pressed", String(f.fav)); files.refresh(); });
    files.add(el("div", "chat-it fl-it", tile,
      el("span", "cmain",
        el("span", "crow1", el("span", "cname", f.name), el("span", "ctime", when(f.day, f.time))),
        el("span", "cprev", el("span", null, f.where))),
      star), f);
  });
})();
