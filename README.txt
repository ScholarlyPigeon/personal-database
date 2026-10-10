PERSONAL INTRANET | MOBILE POLISH PASS | OCTOBER 10, 2026

BASELINE
This complete build combines the previous Month/Menu/Archive/Recent release with the
subsequent Monthly Count Cleanup. All prior functions from those versions remain.
The old site homepage still redirects to the Home page at Database.html.

MOBILE REPAIRS
1. THIS WEEK + THIS MONTH
   - Calendar page, navigation and date grid are constrained to the phone's viewport.
   - Weekly tiles stay in two equal, shrinkable columns; Monthly remains a seven-day grid.
   - No sitewide horizontal panning is needed to find navigation or calendar content.
   - Existing pop-outs, saved calendar items, and monthly item counts are preserved.
   - Small text cleanup: "Shared with Database" now displays "Shared with Home".

2. AQUARIUM
   - The Pages dropdown is restored as a separate control; order is Sync, Pages,
     Themes, Tools, with wrapping when needed.
   - Links now have a compact disclosure arrow on mobile, collapsed by default.
     It retains the open/closed choice using pi-aquarium-mobile-links-collapsed-v1.
     On desktop, Links remain expanded as before.
   - No link, Aquarium tile, category, or stored note is removed.

3. ALL MOBILE PAGE MENUS
   - Popovers are placed inside the visible viewport even when launched near its
     right edge. The original native Pages and Tools menus still function.
   - The Themes selector remains visible outside Tools on all pages.
   - Archive, Timeline, Longform, Home and Neopets inherit the same containment.

4. PANEL CHROME + CAPTURE BAR
   - Rounded Archive and Timeline panel shells clip their former square header
     overhangs while keeping the interior content accessible.
   - Mobile universal capture now says "Quick capture…" and stays compact.

FILES
All main .html files plus Style.css, Planner.css/Planner.js,
Workspace.css/Workspace.js, Script.js, Activity.js, CloudSync.js and new
MobilePolish.css/MobilePolish.js are in this package root.
Existing data is NOT embedded in this ZIP; your live information stays in
browser/cloud storage. Retired source files remain in retired-pages/.

DEPLOY TO GITHUB PAGES
1. From Home, download a fresh JSON backup before changing code.
2. Extract the ZIP. Upload the files at the ZIP root into your GitHub Pages
   repository root, replacing matching names. Do not upload the parent folder
   as a nested site directory. Include both new MobilePolish files.
3. The retired-pages/ folder is for reference only and does not need to be
   deployed. README is informational.
4. Wait for GitHub Pages to show the deployment and refresh the phone tab.
   If the old CSS persists, fully close and reopen the tab or hard refresh.

SUGGESTED SMOKE TEST
- This Week/This Month: no page-level horizontal scroll; open a day pop-out.
- Aquarium: Pages dropdown visible; expand Links, use one, collapse them again.
- Timeline: open Pages from near the right side; see all eight destinations.
- Archive: rounded panels, Month Archive button, Recent Activity retained.
- Universal capture: open and use the Quick capture input.
- Home: make sure the sync badge and Backup button are still visible.

TESTING AND SAFETY
- Automated isolated Chromium checks used mock browser storage and a Field Notes
  theme at widths 320, 345, 390 and 430px for eight pages: no overflow, clipped
  page menus, or JavaScript exceptions were detected in those checks.
- Desktop 1365px checks confirm Links remain normally visible; JavaScript syntax
  checked for Script.js, Planner.js, Workspace.js, Activity.js, MobilePolish.js.
- CloudSync.js is byte-for-byte identical to the preceding full ZIP.
- No authenticated Supabase session or actual Android/Brave browser interaction
  could be tested here. User verification on the live site is still important.

RETIRED / ARCHIVED FEATURES (REFERENCE)
- Separate homepage: retired; index.html goes directly to Home (Database.html).
- Former Almanac layout: retired, old storage retained. Timeline & Notes now
  uses Almanac.html; the old HTML source is in retired-pages/.
- Aquarium Thought/Ask/Action visible category layer: retired from the visual
  interface; prior assignments are not deleted.
- Redundant bottom "+N more" indicators on monthly tiles: retired in favor of
  the quiet total count near the date.
