PERSONAL INTRANET V12 — CALENDAR CATEGORY NOTES + CLICKABLE HEADERS

Updated from V11.

This Week / This Month:
- Day cards remain compact previews. Click a day card or its + to open the full day editor.
- Category notes (kind: "note") created on Home display as collapsible categories in that editor.
- Expand/collapse, edit category heading and Details, Show/Hide Details from the category's three-dot menu, add/edit/complete/delete/reorder nested checklist lines.
- The add form in a day editor now chooses "Checklist line" or "Category note".
- All editing writes to the exact existing pi-calendar-day-YYYY-MM-DD key shared by Home, without maintaining a separate planner copy.
- Past days and historical monthly archives retain read-only semantics.
- Reorder-instruction text was removed from Week and Month Notes headers.

Across the intranet:
- Click blank space in a collapsible header (or focus the header and press Enter/Space) to use its existing expand/collapse control.
- Editable title areas are constrained so users have accessible blank header space.
- Inputs, text editing, drag handles, popout controls and menus do not trigger header toggling.
- The new behavior lives in ClickableHeadersV12.js / ClickableHeadersV12.css.

Files:
- Planner.js (calendar category functionality)
- PlannerCategoryV12.css (calendar category editor styling)
- ClickableHeadersV12.js, ClickableHeadersV12.css (cross-intranet header interactions)
- Updated HTML files for asset loading. No changes to CloudSync.js.

Tested in isolated Chromium fixture with real Planner.js: add category item, toggle category, create another category, preserve shared JSON data; desktop and mobile Week/Month. Header click behavior tested separately. Live cloud sync requires an ordinary post-publish check.

Before installing, export a fresh JSON backup and close other open intranet tabs. Upload all files from the FULL zip to the GitHub Pages deployment source, or replace the files in PATCH. Do not delete other repository files.
