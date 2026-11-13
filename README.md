# Placeholder: Eurest Cafe Teams Agent

This branch (`placeholder`) holds a single coming-soon page. The real site stays on `main`, unchanged. You switch between them by changing which branch GitHub Pages serves.

## What's on this branch

| File | Purpose |
|---|---|
| `index.html` | The page. It's one self-contained file with no JavaScript and no external requests. DM Sans and the logo are embedded. |
| `404.html` | A byte-for-byte copy of `index.html`, so old deep links (for example `/teams/ordering.html`) show the placeholder too. |
| `assets/logo/` | The official Compass Digital files, unchanged: Primary Reverse (the page logo) and Mark Full-Color (the favicon). |
| `robots.txt`, `.nojekyll` | The same as on `main`. |

There is no `CNAME` on `main`, so none is added here. If a custom domain is ever added, put the same `CNAME` file on both branches.

## Editing the page

- **Copy:** all per-site copy sits in two marked `SITE CONFIG` blocks in `index.html`. The `(head)` block holds the title and description, and the `(content)` block is the first thing in `<body>`. HTML only allows `<style>` inside `<head>`, which is why there are two blocks.
- **Theme:** set by `data-brand` on `<html>`. The tokens live in the `[data-brand="compass-digital"]` rule.
- **After any edit**, copy `index.html` over `404.html` again.

## Where this branch lives

The `placeholder` branch is checked out as its own worktree in `C:/Users/FujioD01/Claude/Projects/eurest-placeholder`, next to the main repo folder. Edit the files in this folder directly. `main` is never touched.

## Updating the page

Edit the files here, then commit and push from this folder:

```sh
cd "C:/Users/FujioD01/Claude/Projects/eurest-placeholder"
git add -A
git commit -m "Update placeholder page"
git push
```

While Pages is serving `placeholder`, each push redeploys the page in about a minute.

## Flip on (show the placeholder)

1. On GitHub, open **SEDean/T-Order-Agent-Demo → Settings → Pages**.
2. Under **Build and deployment → Branch**, choose `placeholder` and `/ (root)`, then **Save**.
3. Wait about a minute. The deployment shows under **Actions → pages build and deployment**.

## Flip off (restore the real site)

1. Go to **Settings → Pages → Branch**, choose `main` and `/ (root)`, then **Save**.

Nothing on `main` changes in either direction. GitHub Pages lets browsers cache pages for up to 10 minutes, so a hard refresh may be needed right after a flip.

## Removing the placeholder later (optional)

```sh
git worktree remove "C:/Users/FujioD01/Claude/Projects/eurest-placeholder"
git push origin --delete placeholder
```
