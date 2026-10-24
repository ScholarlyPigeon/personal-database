PERSONAL INTRANET — HOME V5 (OCT 24, 2026)

Use the FULL archive to upload/replace all repository-root files if unsure which
individual files were updated. It includes unchanged files as well.

Visible Home changes:
- Upcoming spans the top, is horizontally scrollable through 28 days, and can collapse.
- On My Radar is now the left column; Notes is the wide right column.
- Category note menu offers Show Details / Hide Details, without erasing details.
  The category popout also offers this option.
- Header role chips such as FOCUS are hidden across pages.
- Header/navigation is a little slimmer. Themes uses the Pages-style dropdown.
  Sync status is at the far right of the header controls.
- Home task/note text is larger with Segoe UI / Clarity-like legibility.
- Home note and Radar dates are shown without 'Added'.

All existing pi-* data keys and the original CloudSync.js remain unchanged.

IMPORTANT INSTALL NOTES
1. Download your current JSON backup in the live app first.
2. Close other tabs/devices holding the intranet open while publishing.
3. In your GitHub Pages publication folder (often repository root), upload/replace
   the updated files. Do not put them inside an extra ZIP-named folder.
4. Wait for GitHub Pages deployment to complete, then reopen Home.
5. Verify the published version: View Page Source (Ctrl+U) for Database.html
   and search for 'HomeLayoutV5.css'. It should also reference HeaderPolish.js.
   If absent, an older Database.html is still served. Check GitHub Pages Settings
   > Pages > Build and deployment > Branch and folder, and ensure these are the
   exact files in that published folder. This is separate from browser refresh.

PATCH contents:
  Database.html, Script.js, HomeLayoutV5.css, HomeLayoutV5.js,
  HeaderPolish.css, HeaderPolish.js,
  Almanac.html, Aquarium.html, Compass.html, Longform.html,
  Month.html, Patterns.html, Week.html, neopets.html,
  README-HOME-V5.txt

Tested locally using an in-memory browser fixture (not a live cloud connection)
at 1480px, 1000px, and 390px widths. Checked date scroller, collapse,
category Details control, theme menu generation, and panel popouts.
