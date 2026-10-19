PERSONAL INTRANET - HOME MENU & CALENDAR POLISH
October 19, 2026 (revision based on October 18 finishing package)

RECOMMENDED INSTALLATION
1. Download a fresh full-site JSON backup from your running intranet.
2. Close all other intranet tabs on phone and computer.
3. Extract the small REPAIR ZIP. Upload all three of these files directly to your GitHub repository root, replacing existing copies:
   - Database.html
   - Finishing.js
   - Finishing.css
4. Wait for GitHub Pages to deploy, then hard-refresh the website (or close and reopen it on mobile).
5. Check the three-dot menu on a Home Notes item and Focus Now; check another page's saved note menu; close it by tapping blank space.
6. Check calendar header colors in your favorite light/dark themes. Confirm the Archive button is just to the left of Pop Out, and that a day-entry + button matches the entry field's height.
7. Test the standalone Inbox button. Cloud Login remains available as a separate button; Tools and Select are removed only on Home.

CHANGES
- Fixed floating three-dot menus jumping to top-left: popover position now retains per-trigger left/top coordinates even alongside !important styling.
- Outside tap/click and Escape close the open item menu (including Longform menu).
- Moved each calendar day's original archive action directly before that day's pop-out control (no changes to archive logic).
- Day header uses the computed plus-button background color/gradient and sets contrasting header text.
- Matching one-line height for day-entry field and + button.
- Standalone Home Inbox. Removed Home Tools/Select, but retained Cloud Login as a standalone control to protect access to cloud authentication.

DATA SAFETY
No edits to CloudSync.js, Script.js, Refresh.js, saved-date values, storage keys, or your existing notes. No data migration.
Tested floating-menu positioning and outside-click dismissal using a synthetic Chromium fixture on desktop and mobile, plus a themed day-color and archive-order fixture. Full live GitHub Pages/Supabase integration and theme-by-theme rendering were not available in this environment; please test on your own devices.
