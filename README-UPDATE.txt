PERSONAL INTRANET: CALENDAR REPAIR | October 2026

Before installing: download your current Personal Intranet JSON backup.
Extract this ZIP and upload the files to the ROOT of your existing GitHub Pages repository, replacing matching files. No Supabase changes are needed.

FIXED
- Both This Week and This Month: click/tap any day tile to open an independent day editor.
- Each editable day has a small + on the desktop tile; the popup always contains a writing field and a + save button.
- Item checkboxes and three-dot Edit / Up / Down / Delete controls are in the popup only. Tiles show plain entries, with completed entries struck through.
- Month tiles show up to three entries and a +N more indicator. Day content does not scroll independently in month tiles.
- Unchecked items display before checked items, including in the Notes panel, without modifying their saved order.
- Week remains an eight-day, four-column/two-row equal-height desktop grid.
- Distinct Week and Month navigation icons and click-away/Escape closing for top menus are retained.
- Existing calendar storage keys, archive behavior, themes and cloud-sync integration remain unchanged.

VERIFICATION
JavaScript syntax checked. Automated browser interaction testing could not be run in this environment. Please verify popup add/edit/check and cloud sync on your deployed site before relying on this build.
