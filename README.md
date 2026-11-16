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

Footer time and weather: `footer.js`. Light/dark toggle: `theme.js`. Case open/close animation: `case.js`. Case edge blur: `edges.js`.

### Spacing tuner

Add `?tune` to any page's address (e.g. `index.html?tune`) for sliders that adjust spacing live. Press **Copy** in the panel to export values, then paste them into the matching tokens at the top of `styles.css`.

## Saving and publishing (Source Control panel)

- **Branches**: `main` is the live site. `explore/v1`, `v2`, `v3` are for trying ideas. Switch with the branch name in the bottom-left corner of VS Code.
- **Commit**: open Source Control (the branch icon in the left bar), write a short message, click **Commit**.
- **Push**: click **Sync Changes** (or the ↑ arrow in the status bar).
- **Publishing**: anything pushed to `main` goes live automatically in about a minute. Work on an `explore/*` branch stays private to that branch until you merge it into `main`.

To publish an exploration: switch to `main`, Command Palette → *Git: Merge Branch…* → pick the branch → **Sync Changes**.

If the live site looks old after publishing, hard-refresh with **Cmd+Shift+R**.

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

- New or changed animation and motion (open/close build-in, hover blur and tilt, peeks, back-button pop, edge blur).
- Anything in `case.js`, `edges.js`, `tune.js`, `footer.js` or `theme.js`.
- The `@keyframes` and animation blocks at the end of `styles.css`.
- Layout changes (grid columns, the pinned back button, mobile breakpoints).
- New colours that need contrast checks, or accessibility reviews.

## Rules of thumb

- Keep paths relative (`styles.css`, `../styles.css`), never starting with `/` — the site lives in a `/portfolio/` subfolder.
- Use colours only from `palette.css`; every text colour there meets 7:1 contrast.
- `References/` is ignored by git on purpose and never goes to GitHub.
