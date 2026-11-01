PERSONAL INTRANET v15 — MOBILE HOME REPAIR

Based on v14. This pass changes styling only; no saved note schema, storage keys,
CloudSync.js, or JavaScript behavior is modified.

Mobile fixes (up to 900px):
- Home Notes lines grow with wrapped content instead of shrinking/clipping.
- Category headings keep their full text; on narrow screens, category controls
  move to a separate row so headings remain readable.
- Notes popouts keep their list scrollable and their composer accessible.
- Upcoming day cards have a taller mobile viewport and independent inner scrolling.
- Expanded day categories and nested notes stay within their day-card list rather
  than painting over the Add row.
- No desktop styles were intentionally changed.

Changed: Database.html (loads new stylesheet) and MobileLayoutRepairV15.css.

Installation: back up your current JSON data. Copy both changed files to the
GitHub Pages publishing directory, replacing Database.html and adding the CSS.
Ensure CSS filename capitalization matches. Wait for deployment before testing.
Check a long standalone note, a collapsed/expanded category, the Notes popout,
and a busy Upcoming day. Verify live cloud sync separately.
