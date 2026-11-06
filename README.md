# Eurest Cafe: Thrive Teams Ordering Agent

The Thrive ordering agent for Eurest Cafe, running in a Microsoft Teams-style window inside the Centric OS shell. It is a static site: plain HTML, CSS, and JavaScript, with no build step and no runtime dependencies.

## Layout

```
index.html               Centric OS shell (header + view controls, Teams stage, footer)
404.html                 Not-found page
teams/
  ordering.html          Teams window, loaded by index.html (opens on Calendar)
  ordering.js / .css     Thrive conversation, cart, and pre-order logic; Teams window styles
  menu.js                Eurest Cafe menu data, photo and brand-tile paths
  ui.js                  Shared builders (elements, icons, avatars, list screens with search + chips)
  data.js                Sample people, chats, activity, calls, files, teams, notes (all fictional)
  nav.js / nav.css       Views and panes, More apps flyout / sheet, mobile nav and back arrows
  calendar.js / .css     Calendar: desktop Day view with date navigation; mobile Agenda / Day
  chats.js / chats.css   Chat list and conversations; shared list-screen styles
  activity.js / .css     Activity feed, filters, unread badges
  calls.js               Call history, dial pad, in-call screen
  files.js, channels.js  Files / OneDrive; Teams and channel posts
  extras.js              Copilot, Notes, People
  screens.css            Styles for calls, files, teams, copilot, notes, people, in-call
  cues.js / cues.css     App cues overlay (runs inside the Teams frame)
assets/
  css/shell.css          Shell styles          css/fonts.css   Self-hosted Inter
  js/shell.js            Shell controls        js/theme.js     Light/dark theme
  js/prefs.js            View + cues prefs
  photos/                83 menu photos (WebP)  brand/          Brand tiles, avatar
  fonts/                 Inter (woff2)         img/            Favicon
scripts/
  build-single-file.py   Builds the offline single-file version
```

## Demo controls

The header carries three controls next to the Centric OS brand:

| Control | What it does |
|---|---|
| **Desktop / Mobile** | Desktop fills the stage with the full Teams window. Mobile shows the same frame inside a 390 × 844 phone, where the frame's responsive CSS collapses to the single-column Teams layout. Hidden on real phones (560 px and narrower), which always get the full-bleed mobile layout. |
| **Cues on / off** | Rings the next control in the ordering flow with a short tip: More apps → Thrive → Chat tab → pick a spot → choose a category → add an item (or pick an option) → check out → start a new order. The pre-order modal and "Confirm & Checkout" are covered too. If the target is scrolled out of view, the tip offers **Show me ↓**. The tip's × turns cues off. |
| **Theme** | Light (default) or dark, shared with the Teams frame. Desktop only. |

The Teams window opens on **Calendar**, as Teams does, and every nav item opens a working screen with fictional content:

| Screen | Desktop rail | Phone | What works |
|---|---|---|---|
| Activity | ✓ | bottom nav | Feed; Unread / Mentions / Replies / Reactions / Missed calls; search; items open their chat, call history, channel, files, or calendar; badges count unread |
| Chat | ✓ | bottom nav | Every chat opens; Unread / Chats / Meeting chats; search; send messages; call and video buttons |
| Teams | ✓ | More | Teams and channels (collapsible); channel posts; start a post |
| Calendar | ✓ | bottom nav | Desktop: Today, ‹ ›; phone: Agenda / Day, tap a day, swipe the week strip |
| Calls | ✓ | bottom nav | History with Missed / Incoming / Outgoing / Voicemail; dial pad and speed dial (desktop); in-call screen |
| Files (OneDrive) | ✓ | bottom nav | Shared / Favorites / Word / Excel / PDF; search; star files |
| Copilot, Notes, People | ✓ | More | Copilot answers from the demo data; notes open; people can be chatted or called |

Thrive is reached only from **More apps** (the rail's "…" or Add apps on desktop, **More** on phones). On phones, screens opened from a list or from More show a back arrow that returns to where you came from. Ordering state is kept across screens.

**Phones** (560 px and narrower) show only Teams: the demo header and footer are hidden, the theme is always light, and cues are turned off with the tip's ×. The desktop **Mobile** preview keeps the header.

Defaults are **Mobile** and **Cues on**. Choices are saved per browser in `localStorage`.

For shareable links, add query parameters. They apply to that visit only and do not overwrite a presenter's saved choice:

```
index.html?view=desktop            index.html?view=mobile&cues=off
```

Cues run inside the Teams frame and follow the header toggle through `localStorage`, the same way the theme does. So they work over HTTP(S), in the single-file build, and when `index.html` is opened straight from disk.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

The single-file build also opens directly from disk (see below).

## Publish on GitHub Pages

1. Create a **public** repository and push this folder to `main`.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, **Branch** to `main`, and **Folder** to `/ (root)`.
4. The site serves at `https://<owner>.github.io/<repo>/`. GitHub Pages enforces HTTPS.

All paths are relative, so the site works under a repository subpath.

## Single-file build

```bash
python3 scripts/build-single-file.py            # writes dist/eurest-cafe-teams-agent.html
```

The output is about 7.9 MB and inlines every stylesheet, script, image, and font. It is for offline sharing, not hosting. Its Content Security Policy is relaxed only enough to allow those inline assets.

## Security and hardening

- **Content Security Policy** on every page (set as a `<meta>` tag, since GitHub Pages cannot send HTTP headers). Scripts and styles come from the same origin only. There are no inline scripts, `connect-src` is `'none'`, `object-src` is `'none'`, `form-action` is `'none'`, and `base-uri` is locked.
- **Inline styles are allowed only in the Teams frame**, where per-chat avatar colours are set. The cue overlay builds its nodes with `createElement`/`textContent` and positions them through CSSOM.
- **Iframe sandbox:** `allow-scripts allow-same-origin allow-forms`. Because the frame is first-party code on the same origin, this is defense in depth, not an isolation boundary. Forms are handled in script and blocked from submitting by CSP.
- **No cross-window messaging.** Theme and cue sync use `localStorage` and the browser's `storage` event, so there is no `postMessage` surface.
- **No external requests, cookies, or analytics.** Fonts and images are self-hosted.
- **No HTML injection path.** Dynamic text is written with `textContent` or text nodes. The two remaining `innerHTML` writes use a constant or clear an element.
- **Search engines.** Every page carries `noindex, nofollow, noarchive`, and `robots.txt` disallows all crawling. GitHub Pages cannot send an `X-Robots-Tag` header, so this relies on crawlers honouring the tags, which the major ones do.
- **Hosting limits.** GitHub Pages cannot set `frame-ancestors`, `X-Frame-Options`, or HSTS headers, so those cannot be configured here. If you need to restrict embedding, put the site behind a proxy that sets them.

## Testing

The site was checked in headless Chromium over HTTP with the shipped CSP, and from `file://` for both the repo and the single-file build. Checks covered: page load and pickup label, theme toggle across the shell and the frame, starting an order in chat, brand tiles and photos loading, no failed requests, and no console errors. For the view and cue controls: a full order with cues on in both views and themes (tab → spot → category → options → cart → checkout → pre-order modal), cues off and back on, the scrolled-away "Show me" tip, URL parameter overrides, a 1024 px desktop, an iPhone 13 viewport, and the repo and the single-file build from `file://`.

## Archive

Earlier versions are kept out of the repo. The site before the Desktop/Mobile and App cues controls is tagged `v1` in git (`git checkout v1` to view it). Reference copies (the original single-file app and the Slack, WhatsApp and ChatGPT demos) live in a local, git-ignored `archive/` folder.

## Content

Menu items, brands, and photos are demo content for Eurest Cafe. Centric OS brand marks are cleared for display.
