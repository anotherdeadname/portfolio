# Axel McFarlane — portfolio

Live at **https://anotherdeadname.github.io/portfolio/**

Plain HTML, CSS and a little JavaScript. No build step: edit a file, save, and it's ready.

## Editing in VS Code

1. **Open the folder.** File → Open Folder… → `Portfolio`.
2. **Install the two suggested extensions** when VS Code asks (or open the Extensions panel and choose *Recommended*):
   - **Live Preview** — shows the site inside VS Code and refreshes as you save.
   - **Code Spell Checker** — underlines typos in your copy.
3. **Preview.** Open `index.html`, then click the preview icon at the top right of the editor (or Command Palette → *Live Preview: Show Preview*). Any page works the same way.
4. **Edit and save.** The preview updates on save.

## Where things live

| To change… | Edit |
| --- | --- |
| Home page copy, rows, links | `index.html` |
| A case study | `work/dropbox.html`, `work/cookunity.html`, `work/care.html` |
| A side project | `side/art.html`, `side/haikus.html`, `side/autism-blog.html` |
| A new case study | copy `work/case-study.html` (the blank template) |
| Colours (light and dark) | `palette.css` |
| Type, spacing, layout, animation | `styles.css` — sizes and spacing are tokens at the top (`--size-*`, `--space-*`, `--unit`) |
| Images | `assets/` (put a thumbnail in a row's `<span class="thumb">` as an `<img>`) |

Footer time and weather: `footer.js`. Light/dark toggle: `theme.js`. Articles over the home page: `article.js`. Case open/close animation on a standalone page: `case.js`. Case edge blur: `edges.js`.

### How case and side-project pages open

Each page in `work/` and `side/` is still a complete HTML file, and that's where you edit it. On the site, though, it opens as an **article over the home page**: clicking a row loads the page's `<article>` into a layer on top, with the home page blurred and dimmed behind it. The address bar shows the page's own URL (e.g. `work/dropbox.html`), so links can be shared. Back button, Escape, a click on the blurred background or the browser's Back closes it.

Visiting a page's URL directly sends you to the home page, which opens the article (that's the `<script src="../article.js">` line at the top of each page; keep it when copying the template). Only what's inside `<article>` is shown in the layer, plus the page's `<title>` and the back button's label.

To see a page on its own, add `?solo` to its address (e.g. `work/dropbox.html?solo`). `?edit` and `?tune` also open pages on their own.

### Spacing tuner

Add `?tune` to any page's address (e.g. `index.html?tune`) for sliders that adjust spacing live. Press **Copy** in the panel to export values, then paste them into the matching tokens at the top of `styles.css`.

## Editing in the browser

Change text and photos by clicking on the page instead of hunting through HTML.

1. In VS Code's terminal (**Ctrl+`**), start the editing server:

   ```bash
   python3 tools/edit-server.py
   ```

2. Open **http://127.0.0.1:8000/index.html?edit** (or any page with `?edit`, e.g. `work/dropbox.html?edit`). Links between pages keep `?edit`.
3. **Text**: click any heading, row title, description, year, case summary, meta item, bullet or account handle and type. Enter finishes. Pasting comes in as plain text.
4. **Photos**: drop an image onto a home-page thumbnail or a case hero, or use the **Images** folder in the panel. Heroes need alt text: fill in *Hero alt text* (you'll be asked if it's empty).
5. **Account links** (side projects): change the link text and address in the panel.
6. Press **Save to files** (or **Cmd+S**). The page's `.html` file is updated and new photos go into `assets/` (e.g. `assets/dropbox-thumb.jpg`, `assets/dropbox-hero.jpg`). Uploading again to the same slot replaces that file.
7. Check `git diff`, then commit and push as usual. Stop the server with **Ctrl+C**.

Only what you changed is written; the rest of the file stays exactly as it was. **Discard changes** reloads the page from the files. Bold, new bullets and new rows still need VS Code. The server only answers on this computer, and only writes page files in the root, `work/` and `side/` and images in `assets/`. Without `?edit`, or anywhere other than this server (Live Preview, the live site), the editor never loads.

## Saving and publishing (Source Control panel)

- **Branches**: `main` is the live site. `explore/v1`, `v2`, `v3` are for trying ideas. Switch with the branch name in the bottom-left corner of VS Code.
- **Commit**: open Source Control (the branch icon in the left bar), write a short message, click **Commit**.
- **Push**: click **Sync Changes** (or the ↑ arrow in the status bar).
- **Publishing**: anything pushed to `main` goes live automatically in about a minute. Work on an `explore/*` branch stays private to that branch until you merge it into `main`.

To publish an exploration: switch to `main`, Command Palette → *Git: Merge Branch…* → pick the branch → **Sync Changes**.

If the live site looks old after publishing, hard-refresh with **Cmd+Shift+R**.

## Saving and publishing from the terminal

Open VS Code's built-in terminal with **Ctrl+`** (backtick). It starts in the project folder.

```bash
git status                       # what changed, and which branch you're on
git add -A                       # stage every change
git commit -m "Short message"    # save a snapshot, credited to you
git push                         # send it to GitHub
```

- **Switch branch**: `git switch main` or `git switch explore/v1`.
- **Publish an exploration**: `git switch main`, then `git merge explore/v1`, then `git push`. Live in about a minute.
- **Get the latest from GitHub** (e.g. after Claude pushed something): `git pull`.
- **Check you're credited**: `git log -3 --format='%h %an <%ae> %s'` should show `Axel McFarlane <333994804+anotherdeadname@users.noreply.github.com>`.

## Common edits

Tip: **Cmd+P** jumps to any file by name, **Cmd+F** finds text in a file, **Cmd+Shift+F** finds it across the whole site. Search for the exact words you see on the page to find where they live.

### Change any text
Search for the words (Cmd+Shift+F), edit them, save. Keep `&amp;` for "&" inside HTML.

### Add a thumbnail or hero image
1. Drag the image into `assets/` in the VS Code sidebar (e.g. `assets/dropbox-thumb.jpg`).
2. Home row thumbnail: in `index.html`, find the row's empty `<span class="thumb" aria-hidden="true"></span>` and put the image inside it:
   `<span class="thumb" aria-hidden="true"><img src="assets/dropbox-thumb.jpg" alt=""></span>`
   It shows in black and white and turns to colour on hover automatically.
3. Case hero: in the case page, replace the `<div class="placeholder" …></div>` line with
   `<img src="../assets/dropbox-hero.jpg" alt="Describe what the screen shows">`
   (case pages are one folder down, so paths start with `../`).

### Add a work or side-project row
In `index.html`, copy a whole `<li> … </li>` block from the section you want, paste it below, then change the `href`, `row-title`, `row-desc` and `row-year`.

### Add a new case study or side project page
1. Right-click `work/case-study.html` → Copy, then paste into `work/` (or `side/`) and rename it, e.g. `work/new-project.html`.
2. Edit the `<title>`, the `description` meta, `case-title`, `case-summary`, the `case-meta` items and the bullets.
3. For a side project, change the back link to `../index.html#side-heading`.
4. Add a row on the home page that links to it (above).

### Change colours
Edit the tokens in `palette.css`. Light values are at the top, dark values are in the two dark blocks below (keep those two identical). Text colours must stay at 7:1 contrast; checking a new one is a good thing to ask Claude.

### Adjust spacing
1. Open any page with `?tune` (e.g. `index.html?tune` in Live Preview's address bar).
2. Drag sliders until it looks right, then press the panel's **Copy** button.
3. Paste the numbers into the matching tokens near the top of `styles.css` (`--section-gap`, `--row-pad`, `--back-top`, …). Each token has a comment saying what it controls.

### Change font sizes
Change `--size-base` near the top of `styles.css`; every size is calculated from it.

### Undo something
Source Control panel → hover the changed file → the ↶ (Discard Changes) arrow. Already committed? Command Palette → *Git: Undo Last Commit*.

## Worth asking Claude for

These are where a small change can break something subtle, so they're a better use of credits:

- New or changed animation and motion (article open/close and background blur, build-in, hover blur and tilt, peeks, back-button pop, edge blur).
- Anything in `article.js`, `case.js`, `edges.js`, `tune.js`, `footer.js` or `theme.js`.
- The `@keyframes` and animation blocks at the end of `styles.css`.
- Layout changes (grid columns, the pinned back button, mobile breakpoints).
- New colours that need contrast checks, or accessibility reviews.

## Rules of thumb

- Keep paths relative (`styles.css`, `../styles.css`), never starting with `/` — the site lives in a `/portfolio/` subfolder.
- Use colours only from `palette.css`; every text colour there meets 7:1 contrast.
- `References/` is ignored by git on purpose and never goes to GitHub.
