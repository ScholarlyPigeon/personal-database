PERSONAL INTRANET | POP-OUT + FOCUS NOW REPAIR | OCTOBER 17, 2026

Use this fix ON TOP OF the Home Refresh ZIP released October 17.

FIX 1: Expanded tables
- The dimming layer was appearing above some pop-out tables due to separate
  CSS stacking contexts. Pop-out panels now use the browser's native top layer.
- The real live panel stays connected to its original parent; content and
  editing are not copied into a second set of inputs.
- Close with the expand/close icon, Esc, or by tapping outside the panel.

FIX 2: Focus Now two-way movement
- Drag a Home checklist/category item directly into Focus Now on desktop.
- Drag the new grip on a Focus Now item into Home Notes, Radar,
  Near My Radar, or a dated day list on desktop.
- On mobile, open the 3-dot menu next to a Home item and tap "✦ Focus".
  The menu's destination selector still includes Focus Now too.
- For an item already in Focus Now, use the visible "Move ▾" selector
  to send it back to any Home table or one of the 28 calendar days.
- Archiving, item details and media links are still supported.
- Transfers use the existing Home Notes stale-data safeguards.

HOW TO INSTALL
1. Take a NEW JSON backup from the live intranet before uploading.
2. Upload the enclosed files to the ROOT of your existing GitHub Pages
   repository, REPLACING the matching files. You do not need to re-upload
   unchanged files. The HTML files are included to refresh the JS/CSS cache
   versions across all pages.
3. Make sure GitHub Pages finishes deploying, then refresh/reopen laptop
   and mobile browser tabs to load the newly versioned scripts.
4. Test moving a disposable Home note to Focus, back to Notes, then try
   dragging in both directions and opening a pop-out on two different pages.

SAFETY
- This ZIP contains NO personal data and is NOT a data backup.
- There are NO localStorage key changes or data migrations in this fix.
- CloudSync.js has NOT been touched.
- Automatic checks passed for both drag directions, moving from Focus into
  a calendar day, touch menu movement, and pop-out stacking on Home,
  Compass, Longform, and Week. These were offline browser tests and DO NOT
  replace a check on your real account/device after deploy.
