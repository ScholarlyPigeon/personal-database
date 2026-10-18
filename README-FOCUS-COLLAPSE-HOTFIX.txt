PERSONAL INTRANET — FOCUS NOW COLLAPSE HOTFIX
October 17, 2026

WHAT CHANGED
- Fixed conflicting Home grid CSS selectors so Focus Now cannot trigger the older three-row layout when opened or collapsed.
- Expanded Focus Now retains its dedicated 164px row; collapsed Focus Now uses a compact 37px row; Notes, Radar, and Upcoming keep their independent space and controls.
- The fix is scoped to Home layout rules only. CloudSync.js, saved data, date formatting, and movement logic are unchanged.

INSTALL THE SMALL REPAIR
1. Download a current JSON backup from your live intranet as a precaution.
2. Unzip this repair folder.
3. Upload the two files to the ROOT of your existing GitHub repository, replacing the matching filenames:
   - Database.html
   - Refresh.css
4. Wait until your GitHub Pages deployment finishes. Refresh the Home page. A cache-busting version in Database.html forces the updated CSS to load.
5. Test collapse / expand of Focus Now, then make sure Notes, On My Radar, Near My Radar, and Upcoming still display and accept input.

The collapse state preference remains saved in the same existing localStorage key.

TESTED
- Browser layout regression, 1520px desktop viewport: four explicit Home tracks in both Focus states; the main grid remains visible and grows when Focus is collapsed.
- Browser layout regression, 390px mobile viewport using Universal Field Notes theme: other Home sections stay visible and in place when Focus collapses.
- Live data/cloud-account synchronization not tested (no changes made to CloudSync.js).
