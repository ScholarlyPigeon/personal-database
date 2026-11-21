# Personal Intranet V29.0 · The Intranet (new Home)

Based on V28.4 Mobile Scrolling and Icons. All existing pages, theme styles,
images, scripts, cloud configuration, and data storage remain in the bundle.

## Pages and links

- `index.html` now opens `Home.html` ("🏠 Home", title: "The Intranet").
- The original Home/Database still exists as `Database.html`, now named
  "📗 Planner". Its existing data keys, markup, and notes logic are unchanged.
- Shared Pages dropdowns now list Home, Planner, Alignment, Aquarium,
  Calendars (Week/Month/Next Month), Timeline, Archive, Neopets.
- The new page's full-width link bar uses six *groups*: a split Home/Planner
  first tab, followed by Alignment, Aquarium, Calendars, Timeline, Archive.
  Calendars opens on desktop hover and with click/keyboard on touch devices.
  Neopets remains accessible from the Pages dropdown only.
- The new page is centered and narrower on desktop to retain the Neocities
  inspiration. All themes share the existing theme system.

## Editing and data

- Click straight into Goals, this week, today, or notes to write. A minimal
  formatting toolbar appears while editing: bold, italic, underline,
  strikethrough, bulleted/numbered lists, checkbox list, and links. Existing
  Ctrl/Cmd+B/I/U shortcuts continue working. Enter makes a new line.
- Checkboxes can be clicked. Individual tables scroll when their content grows.
- The marquee scrolls when idle. Click the pencil to type in place; Enter
  finishes editing. Changes save automatically.
- Each section uses a separate safe-sync/backup key:
  `pi-intranet-home-v1-goals`, `pi-intranet-home-v1-week`,
  `pi-intranet-home-v1-today`, `pi-intranet-home-v1-notes`,
  `pi-intranet-home-v1-marquee`.
  Existing `pi-*` cloud and JSON backup workflows include them automatically.
- Each section uses the existing ⋮ options system and theme-aware color swatches.
  Archive contents sends a plain-text preview **and** a preserved rich HTML
  copy into the existing Archive's `pi-archive-v1` data. Restore latest brings
  it back, removing that archived copy after a successful save. Delete contents
  requires confirmation and does **not** delete the fixed dashboard table.

## Deployment

Unzip and upload the ZIP contents directly to the same GitHub Pages root
as your existing intranet files, including the `assets/` folder. This ZIP
contains the site files at its root (no extra `CURRENT` folder). Replace
existing matching files and add the new `Home.html`, `IntranetHome.css`, and
`IntranetHome.js`. Do not delete old files or browser data. Sync continues to
use your existing account and Supabase configuration.

For safety, export a JSON backup from the existing site before deploying.
