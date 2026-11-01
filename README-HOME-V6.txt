PERSONAL INTRANET | HOME V6 POLISH + CATEGORY TRANSFERS
October 24, 2026

VISUAL / LAYOUT
- Taller horizontal Upcoming / 28-day calendar rail, still collapsible and pop-out capable.
- Removed the small "Scroll to browse the next 28 days" guidance in the header.
- Day cards have roomier, independently scrolling contents and improved checklist/category grids.
- Right aligned and standardized the On My Radar popout (first) and collapse (second), matching Notes and Upcoming.
- Tightened category checklist row spacing; multiline textareas still expand as needed.
- Sync indicator has a fixed width, so status messages no longer shift header buttons.

QUICK CAPTURE RETIRED, DATA PRESERVED
- Removed visible universal capture dock and all header Inbox buttons across all pages.
- Freed dock-reserved vertical space.
- Kept existing capture Inbox data, scripts and possible restoration instructions. See README-RETIRED-QUICK-CAPTURE.txt.
- The Aquarium's own Brain Dump Inbox is not the same feature and remains intact.

CATEGORY ITEM ROUTING
- Every nested checklist row has a Move selector beside the date/delete control.
- Move to standalone Home Notes or On My Radar; or into any category note from either column.
- Every standalone Notes or Radar item has "Into category..." within its ⋮ menu.
- Drag a nested item onto a different category to move it there; drag into either list to make it standalone.
- Drag a standalone item onto a category to nest it. Same-category drag still reorders.
- All transfers preserve the original item object (text, completion, date/createdAt, ID).
- Home Notes transfers use the existing live manager safety guard and keep the source unless both writes work.
- Existing category item storage keys and cloud sync files are unchanged.

INSTALL
Prefer the FULL zip for this pass because shared CSS and HTML pages changed.
Back up a fresh JSON snapshot before uploading. Extract ZIP into your GitHub Pages project root, overwrite the matching paths, publish, then verify Home and sync.
For patch installs, copy ALL files from the patch ZIP (not just Database.html).

TEST LIMITATION
Local in-memory browser fixtures passed on desktop and mobile with representative stored items, multiple category transfers, drag/drop, and collapsing Upcoming. Live cloud sync was not exercised.
