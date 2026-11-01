PERSONAL INTRANET — HOME / FOCUS NOW THREE-ROW REPAIR
October 17, 2026

WHAT THIS FIXES
Home accidentally had four CSS layout tracks for only three main sections.
That left a huge empty area while squeezing both Focus Now and the other
Home tables. The previous collapse preference could also start the page
in its already-collapsed state after an update.

This repair reserves exactly three desktop tracks:
  1. Header
  2. Focus Now, expanded or collapsed
  3. Radar, Notes, and Upcoming, occupying the remaining height

Focus starts expanded when upgrading from the previous broken version,
then remembers your preference using a new layout-only key.
On mobile, the independent Focus height is corrected as well.

INSTALL THE SMALL REPAIR
1. Export a fresh JSON backup from the currently live intranet.
2. Extract this ZIP.
3. Upload Database.html, Refresh.css, and Script.js to the TOP LEVEL of
   your existing GitHub repository, replacing just those three files.
4. Do not upload this README unless you want it.
5. After GitHub Pages updates, refresh Home once. If it still looks
   unchanged, use Ctrl+Shift+R (or reload the page afresh on mobile).

VERIFY
- On first load, Focus Now is expanded and its cards are visible.
- On My Radar, Notes, and Upcoming have their normal usable heights.
- Collapse Focus: just the Focus cards disappear; the other tables grow.
- Expand Focus: its cards return; the other Home panels remain visible.
- Check that movement, notes, and cloud sync behave normally across devices.

SAFETY
CloudSync.js, all task/note data formats, and all note storage keys remain
unchanged. Only the visual preference for Focus's collapsed state was reset,
from pi-focus-collapsed-v1 to pi-focus-collapsed-v2.

The repair was tested in an isolated Chromium browser with representative
notes and Focus cards on desktop and mobile. Live Supabase synchronization
cannot be tested in the offline browser.
