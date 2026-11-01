PERSONAL INTRANET — HOME + FOCUS REFINEMENT
October 17, 2026

Recommended: Before deploying, use the intranet's Backup action to create
and save a new JSON backup. Close other intranet tabs/devices while deploying.

TARGETED INSTALL
1. Unzip PI_Home_Focus_Refinement_Repair_2026-10-17.zip.
2. Upload all files at the top level of your GitHub Pages repository,
   replacing existing files with matching names. Keep the filenames and case.
3. Wait for GitHub Pages to deploy; reload the intranet in a fresh tab.
4. Confirm a category note, nested checklist, Focus menu, date, and pop-out.

CHANGES
- A Category Note is now BOTH a parent checklist item and a collapsible group.
- Each expanded category supports its own internal sub-checklist. Subtasks are
  stored inside the same parent record; moving/archiving retains the group.
- Category notes remain collapsible after moving between Home's tables.
- Focus Now has a collapsible table header, large readable horizontally
  scrollable cards, a visible scrollbar, and each card's actions in a ⋮ menu.
- Each Focus card has its compact date under the ⋮ and native date edit
  inside the menu; move, type conversion, archive and remove are inside it.
- Home dates and other saved-card dates use mm/dd/yy as the visible label.
  Storage remains ISO yyyy-mm-dd. Older undated items remain undated.
- Pop-out panels now remove temporary browser popover status on closing;
  they should return to their original panel/grid positions.
- CSS and JS URLs on all HTML pages have a new cache version.

SAFETY
- No changes to CloudSync.js or storage namespace/migration keys.
- pi-focus-now-v1 and pi-database-notes-v1 remain in use.
- Nested checklist data is additive as an optional `subtasks` array on
  category-note records. Existing records are not rewritten in bulk.
- A small new UI-only key `pi-focus-collapsed-v1` remembers panel collapse.
- Existing Home Notes pre-change recovery and stale-write safeguards remain.

CHECK AFTER DEPLOY
1. Add a Category Note in Home Notes, then add and check an internal item.
2. Check off the category itself, then uncheck it.
3. Collapse/expand it and move it to Focus; verify the internal items remain.
4. Open Focus's ⋮, edit date, then move the category to Radar and back.
5. Collapse/expand the Focus table and horizontally scroll several Focus cards.
6. Pop out a Home panel, then close with the same button or Esc; confirm
   the panel reappears where it belongs.
7. Spot-check dates in saved notes, Longform, and the other pages.

NOTES
This release was tested in an isolated Chromium browser environment. The
live Supabase sync account and cross-device concurrent editing were NOT
exercised, so keep the backup until the live installation is verified.
