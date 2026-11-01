PERSONAL INTRANET — HOME FINISHING PASS (OCTOBER 18, 2026)
===========================================================

INSTALLATION
------------
1. Take a fresh complete JSON backup in the current intranet and save it OFF the site.
2. Close other open intranet browser tabs or devices during this deployment.
3. Unzip the smaller repair package. Upload every file in it to the ROOT of your GitHub Pages repository, replacing matches. Keep the new Finishing.js and Finishing.css files; the nine HTML pages load them.
4. Wait for Pages to publish; hard-refresh Home and another page, then verify the simple tests below before entering important new notes.
5. Keep the old Oct 17 full ZIP and your JSON backup as your rollback option.

CHANGES
-------
- Home Focus Now: compact natural height from one-line items through expanded category notes, capped at 218px on desktop and mobile; original Focus overall collapse still independent. Expanded Focus pop-out is a vertical list.
- On My Radar and Near My Radar: no separate bottom entry composer, but existing records and move destinations still work.
- Day rail: single-line add fields with narrow + buttons. Day headers use a muted tint of the related accent color to maintain readable text.
- Across themes: no text-shadow glow/blur; larger page/theme menus; reduced neon in Focus and sync labels; clearer native date controls.
- Y2K Web Portal: darker smoother blue-purple background, decorative square removed.
- Item handles and checkbox circles get separate mobile grid columns.
- Cross-page movement: one ⋮ menu, groups for Within this page and Other pages. Only primary notes destinations: Home Notes, Compass Notes, Timeline Notes, Longform Saved Thoughts, This Week Notes, This Month Notes. Home's local destinations still include Focus, Radar, and Near Radar, but no per-day options in the move menu. Existing drag-and-drop within Home is unchanged.
- Date storage, existing keys, CloudSync.js, and original recovery snapshots untouched.

IMPORTANT LIMITATIONS
---------------------
- These pages have different note formats. Converting a nested checklist into Week/Month or Longform produces a readable text checklist instead of editable child checkboxes. Where possible, structured children are also carried as metadata (Home, Compass, Timeline, Week/Month); a Longform conversion deliberately retains visible text but cannot currently restore its child checkboxes automatically.
- A successful cross-page move refreshes the CURRENT page so legacy in-memory note renderers display the source change correctly. The destination is written first, then the source is removed; if storage validation or the source update fails, the move is cancelled or rolled back to avoid losing the original.
- Older planner notes with no unique ID, or duplicates that are indistinguishable by the original UI, may not expose the cross-page movement menu; this is preferable to moving an unrelated item accidentally.
- Movement across tabs/devices relies on the existing Safe Sync pipeline. This update was validated with JavaScript syntax, CSS parsing, mock localStorage transfer/rollback tests, and file reference checks. A fresh browser screenshot test could not run in this environment because Chromium navigation is blocked by administrator policy. Please check live GitHub Pages behavior carefully, especially mobile and real Supabase sync.

SMOKE TEST AFTER DEPLOYMENT
---------------------------
1. Toggle Focus Now collapse and expand; Radar/Notes/Upcoming must remain in place.
2. Move a throwaway Home checklist item to Focus and back through the ⋮ menu.
3. Add a category note with two checklist children; move it Home Notes -> Compass -> Home Notes and check the children are still present.
4. Open Focus pop-out, see a VERTICAL list, then close and verify it returns to Home.
5. Open a theme other than Y2K and confirm readable dates, theme menus, and sync status.
6. On a phone: check separate drag handle and checkbox, then test the move menu.

FILES MODIFIED
--------------
Script.js, all nine actual page HTML files
FILES NEW: Finishing.js, Finishing.css
UNTOUCHED: CloudSync.js, Workspace.js, Refresh.js, Refresh.css, Planner.js, Planner.css, MobilePolish.js, Style.css, original data storage keys
