# Eurest Cafe: Thrive Teams Ordering Agent

The Thrive ordering agent for Eurest Cafe, running in a Microsoft Teams-style window inside the Centric OS shell. It is a static site: plain HTML, CSS, and JavaScript, with no build step and no runtime dependencies.

## Layout

```
index.html               Centric OS shell (header, Teams stage, footer)
404.html                 Not-found page
teams/
  ordering.html          Teams window (the ordering agent), loaded by index.html
  ordering.js            Conversation, cart, and pre-order logic
  ordering.css           Teams window styles
  menu.js                Eurest Cafe menu data, photo and brand-tile paths
assets/
  css/shell.css          Shell styles          css/fonts.css   Self-hosted Inter
  js/shell.js            Shell behaviour       js/theme.js     Light/dark theme
  photos/                83 menu photos (WebP)  brand/          Brand tiles, avatar
  fonts/                 Inter (woff2)         img/            Favicon
scripts/
  build-single-file.py   Builds the offline single-file version
archive/                 Reference only: original file and the Slack, WhatsApp, ChatGPT demos
```

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

The output is about 7.8 MB and inlines every stylesheet, script, image, and font. It is for offline sharing, not hosting. Its Content Security Policy is relaxed only enough to allow those inline assets.

## Security and hardening

- **Content Security Policy** on every page (set as a `<meta>` tag, since GitHub Pages cannot send HTTP headers). Scripts and styles come from the same origin only. There are no inline scripts, `connect-src` is `'none'`, `object-src` is `'none'`, `form-action` is `'none'`, and `base-uri` is locked.
- **Inline styles are allowed only in the Teams frame**, where per-chat avatar colours are set. Nothing else uses them.
- **Iframe sandbox:** `allow-scripts allow-same-origin allow-forms`. Because the frame is first-party code on the same origin, this is defense in depth, not an isolation boundary. Forms are handled in script and blocked from submitting by CSP.
- **No cross-window messaging.** Theme sync uses `localStorage` and the browser's `storage` event, so there is no `postMessage` surface.
- **No external requests, cookies, or analytics.** Fonts and images are self-hosted.
- **No HTML injection path.** Dynamic text is written with `textContent` or text nodes. The two remaining `innerHTML` writes use a constant or clear an element.
- **Search engines.** Every page carries `noindex, nofollow, noarchive`, and `robots.txt` disallows all crawling. GitHub Pages cannot send an `X-Robots-Tag` header, so this relies on crawlers honouring the tags, which the major ones do.
- **Hosting limits.** GitHub Pages cannot set `frame-ancestors`, `X-Frame-Options`, or HSTS headers, so those cannot be configured here. If you need to restrict embedding, put the site behind a proxy that sets them.

## Testing

The site was checked in headless Chromium over HTTP with the shipped CSP, and from `file://` for both the repo and the single-file build. Checks covered: page load and pickup label, theme toggle across the shell and the frame, starting an order in chat, brand tiles and photos loading, no failed requests, and no console errors.

## Archive

`archive/` holds reference copies only and is not linked from the site. See `archive/README.md`.

## Content

Menu items, brands, and photos are demo content for Eurest Cafe. Centric OS brand marks are cleared for display.
