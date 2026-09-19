PERSONAL INTRANET — V10 FINAL POLISH
September 18, 2026

THIS PASS
- Database Radar collapse stability fix: when On My Radar or Near My Radar is collapsed, the open sibling now correctly owns the remaining height without its contents visually blanking.
- No Database storage keys or content were changed by this fix.
- Almanac Strain Journal now mirrors the Meals entry pattern:
  - + strain button lives in the tile header
  - clicking it creates a new expanded editable card immediately
  - strain name is the editable card title
  - notes are a rich-text expandable body
  - saved date remains visible under the strain name
  - archive/delete/collapse behavior remains
- The Strain Journal continues to use the existing pigeonhole-v15-strain-journal storage key, so existing entries remain in place and simply render in the new card format.
- CloudSync.js is unchanged from v9.

CACHE VERSION
- Shared page asset references bumped to 20260918j.

INSTALL
Replace the current Personal Intranet files with this complete set together, then refresh the page/browser cache if needed.
