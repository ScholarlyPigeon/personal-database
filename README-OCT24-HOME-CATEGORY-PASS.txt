PERSONAL INTRANET  |  OCTOBER 24, 2026  |  HOME CATEGORY-NOTE PASS
==================================================================

WHAT CHANGED
- Home is now a two-column Notes + Next 4 Weeks layout.
- Removed both old, empty Radar panels from Home. Their old storage keys
  are deliberately preserved (not deleted or migrated).
- Renamed the original Focus Now shelf to On My Radar, keeping its existing
  storage key, collapse controls, popout, and item transfers.
- Category notes: a collapsible Details section independent of the checklist,
  including when Details are blank. Image/link fields collapse with Details.
- Category notes: a new per-note full-screen popout, with the same live data.
- Nested checklists: multiline text areas that grow to the contents, drag
  handles, and up/down reorder arrows for touch and keyboard use.
- Every new nested checklist item captures its own createdAt and local date;
  an added date appears beneath each item. Individual standalone Home notes
  show their original added date; category parent headings show no date.
- Existing records use previously saved createdAt or date fields where
  available; unknown legacy dates are never fabricated.
- Removed the existing-note Checklist/Category conversion control. You still
  choose which kind of note to create using the New item dropdown.
- More visible category expand/collapse arrows.

INSTALL
1. Create a new JSON backup from your live intranet FIRST.
2. Close other intranet tabs on every device, to avoid stale writes.
3. Extract the ZIP. Upload the files INSIDE the ZIP directly to the GitHub
   Pages repository root, overwriting files with the same names.
4. Let the published site update; then hard-refresh the Home page and check
   it on desktop and mobile. The HTML has fresh JS/CSS cache versions.
5. Try adding a disposable category note with a long checklist item, then
   fold Details, pop it out, reorder its checklist, and check it after sync.

SAFETY / LIMITATIONS
- CloudSync.js, Activity.js, and the storage namespace are unchanged.
- Existing category notes and subtasks keep their original record identities.
- The former Radar data keys remain in backups, though they are no longer
  visible as independent Home panels. There is NO deletion or migration.
- Older nested tasks that had no createdAt or date will correctly display
  "Date added not recorded". Date/time cannot be reconstructed reliably.
- JavaScript syntax and isolated browser UI tests passed at desktop and
  mobile widths. A real live GitHub Pages/Supabase cross-device sync test
  cannot be completed here; confirm that after publishing.

ASSETS CHANGED
- Script.js, Finishing.js, HomeTuning.css (new)
- Database.html plus eight other pages (to bust caches for shared JS)

To use the SMALL PATCH ZIP instead of the complete ZIP, simply overwrite
those included files in the existing repo root. The FULL ZIP has all current
project files and the new HomeTuning stylesheet.
