PERSONAL INTRANET — HOME V10 LAYOUT REPAIR
October 24, 2026

This release updates Home after the V9 stylesheet did not reliably produce the requested layout.

Changes
- Category note checklist items in On My Radar now render in their own full-width row BELOW the category title. This is a DOM structure fix in Script.js, not a CSS attempt to reposition content nested inside the title cell.
- Category toggles use the checkbox's header slot so category titles and standalone titles line up.
- Notes category titles have an invisible alignment slot that matches standalone checklist text.
- The On My Radar header now uses the same shared panel-header class as Notes and Upcoming, so existing themes provide its colors and gradients directly.
- Expanded/collapsed Home panels have a consistent visible 8px bottom buffer under the header buttons (48px collapsed height = 40px header + 8px ledge).
- Category subheadings now say “Checklist” rather than “Checklist · drag to reorder”; dragging remains enabled.

Data and compatibility
- Home Notes storage: pi-database-notes-v1 (unchanged)
- On My Radar storage: pi-focus-now-v1 (unchanged)
- CloudSync.js and data serialization are unchanged.
- Checklist contents, dates, and completion state are not migrated or deleted.
- All changes are local layout/markup and cache-busting strings.

Install
- Download a fresh JSON backup BEFORE publishing.
- For a patch, replace these exact files in the published GitHub Pages folder: Database.html, Script.js, IntranetPolishV6.css. Optionally add this README.
- The full package contains the same changes plus the unchanged intranet files.
- Wait for GitHub Pages deployment and then reopen Home.
- To verify the updated HTML is live, use View Page Source and find Script.js?v=20261025-v10 and IntranetPolishV6.css?v=20261025-v10.

Testing
- Local in-memory browser fixture checked nested Radar category display, same theme header backgrounds for Full Green and Y2K Web Portal, expansion, and all three panel collapsed heights at desktop and mobile widths.
- GitHub Pages and live Supabase sync were not exercised.
