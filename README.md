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

## Rules of thumb

- Keep paths relative (`styles.css`, `../styles.css`), never starting with `/` — the site lives in a `/portfolio/` subfolder.
- Use colours only from `palette.css`; every text colour there meets 7:1 contrast.
- `References/` is ignored by git on purpose and never goes to GitHub.
