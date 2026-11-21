# Personal Intranet V29.2 · Goal Marquee & Minimal Home

Based directly on V29.1. All other pages, themes, backups, navigation, shared menus, and syncing are carried over unchanged.

## Home refinements

- Removed the separate Goals panel from Home, allowing This Week and Today to use all of the available dashboard height. Their rich-text editing, per-panel font sizes, independent scrolling, collapse, and three-dot archive/restore/delete/color menus remain intact.
- Added a fixed **Goals:** label at the beginning of the moving marquee. The label stays stationary while only the goals text scrolls.
- Replaced the marquee's always-visible edit and Aa controls with one small **⋮** menu on the right containing Edit goals and Goals text size (12–20px).
- Added two **independent color palettes** to that menu: Title text color and Stars color. Choices include theme-native accents, white, dark ink, and a theme-default/reset swatch (×). Saved colors are **per theme**, so each theme can have the best contrast independently.
- The marquee is only editable after choosing **⋮ → Edit goals**. Finish editing by clicking away or pressing Enter; pressing Escape cancels that edit. It autosaves through the previous `pi-intranet-home-v1-marquee` key.
- The marquee remains readable on narrow screens; the menu is positioned to stay inside mobile viewport width.

## Data preservation and sync

- Existing marquee contents are retained exactly. If the marquee has never been edited, the default hint now reads “✦ Add your current north stars here ✦”.
- **Existing content from the old Goals panel is NOT deleted.** Its original `pi-intranet-home-v1-goals` key remains in storage/backups. This release does not silently overwrite existing marquee text with old Goals content. Copy goals you want to keep into the marquee manually via the menu.
- Previously hidden Notes content also remains stored and recoverable from a backup.
- Color preferences use a new `pi-intranet-home-v1-header-colors-by-theme` key, saved through the same `pi-*` backup/cloud sync system as the other pages.

## Install

Make a fresh JSON backup first, unzip this file, and upload **the contents** to your GitHub Pages site, replacing matching files. Keep other site assets in place. `index.html` still sends visitors to the new `Home.html`.

Tested with a browser-rendered offline page (HTML/CSS/JS, action menus, mobile layout, marquee edit and saving, font-size and header-color controls). A live cloud-sync round trip must be checked after deployment.
