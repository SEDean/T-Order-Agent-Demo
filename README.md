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

## One-time setup: create the branch

These commands work the same in Git Bash and PowerShell. Use the full path in forward slashes, as shown. A relative path like `..\eurest-placeholder` can end up as a folder called `..eurest-placeholder` inside the repo. You need Git 2.42 or later for `--orphan`; `git --version` shows yours.

The placeholder goes in a sibling folder, `C:/Users/FujioD01/Claude/Projects/eurest-placeholder`, so your `main` working copy is never touched.

```sh
cd "C:/Users/FujioD01/Claude/Projects/eurest-cafe-teams-agent"
git fetch origin
git worktree add --orphan -b placeholder "C:/Users/FujioD01/Claude/Projects/eurest-placeholder"
```

1. Unzip `placeholder.zip` into `C:/Users/FujioD01/Claude/Projects/eurest-placeholder`. Include the hidden `.nojekyll` file.
2. Commit and push:

```sh
cd "C:/Users/FujioD01/Claude/Projects/eurest-placeholder"
git add -A
git commit -m "Add coming-soon placeholder page"
git push -u origin placeholder
```

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
