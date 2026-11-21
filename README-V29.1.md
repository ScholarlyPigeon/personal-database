# Personal Intranet V29.1 · The Intranet refinements

Built on V29.0. Existing pages, themes, assets, cloud sync, storage, backups and Planner remain intact.

## Changes to The Intranet (Home.html)

- Home is removed from the on-page navigation bar (the global Pages menu still lists Home). Planner, Alignment, Aquarium, Calendars (flyout), Timeline and Archive each have an equal-width navigation button.
- Removed the Notes panel from the Home dashboard. **This does not delete any existing saved Notes contents.** If it held content in V29.0, that storage key (`pi-intranet-home-v1-notes`) is left untouched and remains available in backups.
- Reduced the default height of the Goals table. This Week and Today now occupy the rest of the dashboard.
- Goals, This Week and Today can each collapse/expand using the arrow in their header or by clicking the header title. The state is saved in per-table `pi-*` keys and will sync with existing backup/cloud support.
- When Goals collapses, This Week and Today grow vertically to fill the space. When one of those two tables collapses on desktop, the other expands horizontally.
- A text-size selector appears in each rich-text table's formatting toolbar when you click into it. Each field retains its own size. Choices: 12, 13, 14, 15, 16, 18, 20px.
- The marquee has a dedicated Aa selector beside its edit pencil with the same choices.
- Default rich-text and marquee sizes are 15px to blend with the existing Planner text sizing. Font sizes are saved separately per panel and for the marquee, without modifying any rich text.
- Archive, Restore, Delete, colors, other existing page functionality and themes remain available.
- Mobile keeps all panels full-width, stacked, and scrollable, including while collapsed.

## Installation

Back up your current site's JSON via Tools > Backup before updating. Extract this ZIP and copy its **contents** into your existing GitHub Pages repository, replacing matching files. The entry page is still index.html redirecting to Home.html.

No data migration needed. This release reuses the V29.0 content keys and adds only settings keys for font size and collapse state.
