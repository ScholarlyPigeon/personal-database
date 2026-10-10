PERSONAL INTRANET | MONTH, MENU, ARCHIVE & RECENT ACTIVITY REFINEMENTS | OCTOBER 10, 2026

WHAT CHANGED
- This Month: every day with items shows a discreet total count in the heading. When there are more than two entries, a small +N more label is always visible at the bottom; click the day to see everything in the pop-out. The tile itself does not need a scrollbar.
- Page menu order, sitewide: Home, Aquarium, Longform, This Week, This Month, Timeline, Archive, Neopets. Timeline still uses Almanac.html (no saved data moves).
- Archive > Archived Items: each item starts collapsed with its source and a short preview, and expands/collapses with ▸ / ▾ to show the entire text and archived date. The delete control remains separate.
- Archive > Recent Activity: new notes are labeled as "added a note" for note collections throughout Home, Aquarium, Longform, Timeline, Weekly/Monthly Notes, and other supported saved notes; edits continue to be tracked. Other tasks/links can still show "added an item". The trail is based on committed local changes, not individual keystrokes.

INSTALL
1. Download a fresh JSON backup via Home > backup before replacing any files.
2. Upload every file at this package root (except README and retired-pages) into the GitHub Pages repository root, overwriting matching filenames. In particular, include Activity.js, Workspace.js, Workspace.css, Planner.js, Planner.css, and ALL the .html pages. Keep the new filenames unchanged.
3. Hard-refresh after GitHub Pages deploys. Check Archive: open/close a long archived item, create a note in another page and return to Archive to verify it appears in Recent, and check a Month day with 3+ entries. Check page menus on two pages.

DATA & SAFETY
- CloudSync.js is byte-for-byte identical to the previous reorganization package; no storage keys renamed or deleted. Archived records were NOT rewritten: collapse/expand is a view-only control.
- Existing activity is retained, capped to the latest 250 records by the established activity system. New tracking is forward-looking, not a retrospective history, and does not capture edits made outside the intranet.
- Activity is a helpful, local audit trail, not a transactional cross-device audit. Cloud synchronization has not been authenticated in this local build.
- Retired old Home/Almanac source files are included in retired-pages for reference.
