Personal Intranet v13: Next Month + Navigation and Home Cleanup

What's new:
- NextMonth.html shows the calendar for the month after the current month (including December -> January), advancing automatically on a month change.
- Uses existing pi-calendar-day-YYYY-MM-DD entries and pi-planner-month-YYYY-MM notes for the target month. No duplicate day storage or cloud schema change.
- Pages dropdown includes Next Month across the intranet. Both Themes and Pages show the current choice and share one auto-measured menu width.
- Theme aquarium's visible label is exactly "Teal celestial aquarium" (the icon remains). The stored theme key stays "aquarium".
- Main page and Home panel headings are fixed text again. Saved category/note titles remain editable.
- On My Radar hides item counts and "shelf getting noisy" messaging.
- Drag/drop visual highlights now clear after completed or cancelled moves.
- Home item menus place Show/Hide Details, Archive, and Delete in one matching-height row. Nested notes and other menu options remain intact.

Files added: NextMonth.html, IntranetFixV13.css, IntranetFixV13.js
Key code updates: Planner.js, Finishing.js, Script.js, HomeCategoryMovesV6.js, all nine existing page HTML files.

Install:
1. Download a new JSON backup from the existing live intranet.
2. Close other intranet tabs before deploying.
3. Upload the extracted file contents to the GitHub Pages publishing root (same folder as Database.html).
4. Wait for deployment, open Home, and inspect Pages -> Next Month and Theme -> Teal celestial aquarium.
5. Confirm normal cloud sync on your live intranet; this cannot be fully verified in local browser tests.

The ZIP contains only application source, not saved personal note data. Existing storage keys and CloudSync.js are unchanged.
