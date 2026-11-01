# V20.9 Shared Notes and Compass Priority Views

- **Compass:** ``Currently...`` remains a horizontal rail of lightly accented tiles on the page, but becomes a vertically stacked list **only when popped out**. The existing separate panel collapse toggle and per-note details toggles are supported. Closed notes show their header only; date, optional details and nested checklists appear when opened.
- **Compass and Timeline:** Shared category notes (editable details plus nested checklist lines) and standalone checklist notes, with completion timestamps and creation dates, drag/tap movement, column main-list destinations, sections and action menus.
- **Timeline:** no Currently panel. Timeline and Saved Notes retain their two outside columns around the editor; existing legacy milestone records are read from their original key. Moving a legacy milestone into a destination creates a compatible copied record then removes the old record, with rollback on write failure.
- **Compatibility:** existing ``pi-compass-v1``, ``pi-reflections-notes-v1`` and ``pi-archive-workspace-v1`` storage keys are retained. Legacy note fields are preserved; optional ``noteType``, ``subtasks``, ``done``, ``completedAt``, ``currentExpanded`` and ``showDetails`` fields are added only when users modify/create notes. Older notes without a note type are treated as category notes.
- **Deployment safety:** download a fresh JSON backup and close other intranet tabs before deploying. Upload the **contents** of ``CURRENT/`` to the existing GitHub Pages repository, replacing matching files. Hard refresh and test a harmless note first, then verify cloud sync across devices before resuming normal editing. Do not clear localStorage or restore JSON just because a page fails to render.
- **Testing:** browser tests of Compass and Timeline used isolated mock storage rather than your live Supabase; tested existing note rendering, panel collapse, pop-out layout, moving category notes with children intact, detaching completed checklist items with dates, creating lines, moving a legacy milestone, and mobile layout. This is not a full deployed sync test.

---

# V20.2 Theme retirement

Removed four unused themes: **Night Ledger**, **Midnight Observatory**, **Clarity Light**, and **Study**. Their menu catalog entries and their dedicated CSS rules have been deleted, including the optional Study botanical override. Shared Clarity Dark styles were retained, and cross-theme rules were narrowed to kept themes only.

**Retained themes (10):** Dark Original, Teal celestial aquarium, Night Garden, Universal Field Notes, Y2K Web Portal, Fall 2, Clarity Dark, Cozy 2000s, Full Green, Fall.

**New default appearances:** Compass uses Universal Field Notes; Timeline, Longform, and Archive use Full Green. When an old theme choice is still stored on a device, it is safely replaced by Dark Original at the next load. Notes, history, saved content, backup keys, and cloud records are not changed.

**Deployment:** Download a JSON backup first, upload the contents of `CURRENT/` to the existing GitHub repository, wait for GitHub Pages to deploy, then hard-refresh (`Ctrl+Shift+R`). Test the theme selector and all pages. This update keeps V20.1's corrected `defer` loading order and code structure.

---

# V20.1 Loading-order repair (recommended over V20)

V20 accidentally removed the `defer` attribute from all local application scripts while consolidating HTML file imports. The Supabase CDN script was still deferred, so the local cloud-sync script could run before the Supabase library was available; the other scripts also ran before the page body existed. This prevented dynamic Home notes, calendars, theme selectors and other page content from appearing. **V20.1 restores `defer` on every application page** and uses new URL version tags to refresh browser caches. No user-data keys, stored records, Supabase code, layout markup, or code bundles are changed relative to V20.

## Deploy the repair

1. Close all intranet tabs and **do not use Archive All Completed or reset stored data** in the faulty V20 deployment.
2. In the existing GitHub repository, upload the files *inside* this ZIP's `CURRENT/` folder, replacing same-named files. You do not need to delete/recreate the repository or remove files again.
3. After GitHub Pages deploys, open a fresh page (or hard-refresh with Ctrl+Shift+R), confirm that notes and calendars render, and check cloud login/synced status. Existing content should appear once the scripts and cloud sync initialize. If not, keep your backups and do not force a cloud restore or clear storage.
4. Only after loading successfully, test a nonessential edit and syncing on another device.

The underlying JavaScript and CSS are exactly the same as the previous V20 release. This is a focused boot-order hotfix, not a redesign. Static checks are done; full interactive browser testing was not available in this environment.

---

# Personal Intranet | Clean release (V20)

A focused file/maintenance cleanup of V19, **not a data migration or feature redesign**.

## Safest deployment

1. While the current site is working, open **Tools → Download backup** and store the JSON in a safe place.
2. Close other intranet tabs/devices. Extract this ZIP and upload the files **inside `CURRENT/`** to your GitHub Pages repository root, preserving exact spelling and capitalization.
3. **Important:** GitHub's Upload Files action does not remove old files. Once the updated pages load correctly, delete the **old** CSS, JavaScript, and individual README files named in the Legacy files list below; don't delete `CloudSync.js`, `Activity.js`, `Script.js`, `Planner.js`, `Workspace.js`, or any HTML page.
4. Open a fresh tab and test each page, create/edit/archive/drag one harmless test item, the page/theme menus, mobile layout, backup download, cloud synced status, and another device after closing the first one.
5. If something looks wrong, keep the JSON backup and restore the previous ZIP. Do not restore JSON unless actual data has been lost.

**No changes** to localStorage key names, Supabase config, cloud synchronization code, existing saved notes, original page body markup, or the older record formats. The original code has been copied into named bundles in its prior execution order. Only duplicate resource imports and one identical shadowed CSS rule were removed, plus a very small shared keyboard-focus/control-consistency CSS rule set.

## Active file map

| Filename | Purpose |
| --- | --- |
| `Database.html`, `Aquarium.html`, `Longform.html`, `Compass.html`, `Week.html`, `Month.html`, `NextMonth.html`, `Almanac.html`, `Patterns.html`, `neopets.html`, `index.html` | Original pages and Home redirect |
| `CloudSync.js` | Cloud sync and migration compatibility (preserved) |
| `Activity.js` | Activity history (preserved) |
| `Script.js` | Core intranet, storage and rendering (preserved) |
| `Planner.js` | Calendar and planner (preserved) |
| `Workspace.js` | Archive and timeline (preserved) |
| `UI.js` | Mobile usability, pop-out UI, action finishing and theme/navigation polish |
| `Home.js` | Home panel behavior and category-note movement |
| `Features.js` | Clickable headers, shared navigation, writing tools and backup actions |
| `AquariumNotes.js` | Aquarium note heading behavior |
| `Core.css` | Main theme and base UI, planner/workspace/mobile, refresh and finishing rules |
| `HomeGrid.css` | Home grids and panel sizing |
| `Navigation.css` | Header/navigation styling |
| `HomeCards.css` | Home calendar-card styles |
| `Panels.css` | Shared panels and clickable-header styles |
| `CalendarNotes.css` | Week/Month category notes |
| `Interface.css` | Shared selector and editor refinements |
| `HomeMobile.css` | Home-specific responsive repairs |
| `Polish.css` | Recent tools, V18/V19 visual fixes, and shared keyboard-focus treatment |
| `README.md` | This guide and condensed release notes |

### Why there are still multiple CSS/JS files

To avoid CSS override bugs and JavaScript dependency changes, the bundles preserve the **original load order of every distinct resource** on each page. The explicit Home and calendar CSS still sits in its old relative position. Joining everything into one giant stylesheet or one engine script would create significant regression risk for little practical benefit. In-page data storage and cloud behavior remain unchanged.

### Shared design conventions

- Page headers keep their own title and theme, with a consistent Pages / Themes / Tools pattern.
- Header titles are primary; collapse, expand/pop-out, add, and three-dot actions should be secondary and consistent.
- Clicking empty expandable heading space should open or close the section without intercepting edit and drag controls.
- Active notes and calendar entries should retain direct editing, item movement, consistent prompts, and archive/menu behavior.
- Interactive controls now share minimum menu-target height, rounded corners and visible keyboard-focus outlines while inheriting each theme's colors.
- This is a baseline for future UI refinements, **not** a claim that every legacy UI component is now identical. The untested mobile/hosted behavior still needs checking.

## Architecture and safety notes

- Core record keys use the original `pi-*` conventions. Calendar date records share the original `pi-calendar-day-YYYY-MM-DD` keys across Home / Week / Month / Next Month; **do not** split them into page-specific keys.
- Next Month is a view onto the appropriate calendar month, not a second database.
- Old / retired features can still hold archived or prior-generation user content. Don't remove storage readers, save handlers, or migrations just because a control is hidden.
- Cloud sync must not be rebuilt or mixed with rendering code merely to reduce file count. Keep its conflict and migration protections.
- Cloud status and JSON backup must remain usable on every page. Test a deploy in a single tab before opening additional devices.
- Theme styling for the four retired options was removed in V20.2; the other ten themes remain available.
- On Aquarium, hidden action menus still use the original save/archive/delete handlers and must remain non-destructive until the user chooses an action.

## Condensed version history

- **Oct 10–11:** Mobile polish, Compass, themes, navigation, archive activity and cloud integration refinements.
- **Oct 17–19:** Home calendar/notes refresh, pop-out stacking fixes, Focus/On My Radar layout repair, day header styling, cross-page moving and menu improvements.
- **Oct 24:** Home restructuring, category details, date labels, collapsible calendars, theme/page navigation, removal of the old quick-capture dock (saved Inbox values preserved).
- **Oct 25–26:** Calendar category notes, Next Month, navigation sizing, completion timestamps, keyboard entry behavior, mobile fixes.
- **Oct 31 / V17:** Shared Tools search, download backup and archive completed; richer editing and note/action menus.
- **Nov 1 / V18:** Calendar click-to-edit and drag handles; Aquarium action menus; Neopets status restoration; Timeline central composer.
- **Nov 1 / V19:** Neopets layout corrections, Aquarium click-to-collapse, higher contrast section headings and Study styling (retired in V20.2).
- **V20:** Documentation merge, logical CSS/JS bundles, removal of repeated imports, one redundant CSS declaration, and a small shared focus/control styling pass. No data migration.

## Legacy files to remove **after successful deployment**

These are replaced by the new bundle names. This list is for cleaning up the GitHub repository; keeping them during the initial smoke test is harmless because no new page links to them.


**Old CSS**: `ClickableHeadersV12.css`, `Finishing.css`, `HeaderPolish.css`, `HomeLayoutV5.css`, `HomeTuning.css`, `IntranetFixV13.css`, `IntranetPolishV19.css`, `IntranetPolishV6.css`, `IntranetRefinementV14.css`, `IntranetRepairV18.css`, `IntranetToolsV16.css`, `MobileLayoutRepairV15.css`, `MobilePolish.css`, `Planner.css`, `PlannerCategoryV12.css`, `Refresh.css`, `Style.css`, `Workspace.css`.

**Old JS**: `AquariumHeaderV19.js`, `ClickableHeadersV12.js`, `Finishing.js`, `HeaderPolish.js`, `HomeCategoryMovesV6.js`, `HomeLayoutV5.js`, `HomePolishV6.js`, `IntranetFixV13.js`, `IntranetRefinementV14.js`, `IntranetToolsV16.js`, `MobilePolish.js`, `Refresh.js`.

**Old documentation**: `README-DAY-HEADER-REVERT.txt`, `README-FOCUS-COLLAPSE-HOTFIX.txt`, `README-FOCUS-POPOUT-FIX.txt`, `README-FOCUS-THREE-ROW-REPAIR.txt`, `README-HOME-REFRESH.txt`, `README-HOME-V10.txt`, `README-HOME-V11.txt`, `README-HOME-V12.txt`, `README-HOME-V13.txt`, `README-HOME-V5.txt`, `README-HOME-V6.txt`, `README-INTRANET-V14.txt`, `README-MOBILE-V15.txt`, `README-NESTED-FOCUS-REFINEMENT.txt`, `README-NOV01-V18.txt`, `README-NOV01-V19.txt`, `README-OCT18-FINISHING.txt`, `README-OCT19-HOME-MENU-HOTFIX.txt`, `README-OCT19-NIGHT-POLISH.txt`, `README-OCT24-HOME-CATEGORY-PASS.txt`, `README-OCT24-HOME-GRID-REPAIR.txt`, `README-OCT31-V17.txt`, `README-RETIRED-QUICK-CAPTURE.txt`, `README.txt`.

All old release-specific `README-*.txt` files and `README.txt` have been summarized here. Prior one-off patch installation instructions are intentionally not repeated because this ZIP replaces the whole site asset set.


## V20.5 — Timeline / Compass distinction

Compass retains the full-width collapsible **Currently...** panel. Timeline is
back to a straight three-column grid (Timeline / Write it Out / Saved Notes).
Notes saved to **Saved Notes (main column)** appear at the beginning of the
Saved Notes column, outside any named section. They can be dragged into a
section, or dragged back to the main-column drop area. Existing notes with
`sectionId: "__current__" remain visible. No local-storage or cloud-sync keys
were changed. V20.4 fixes otherwise remain in place.


## V20.6 alignment pass
- Aquarium section + and × actions share one centered control rail. Section names and records are unchanged.
- Longform Write it out and Saved thoughts headers match in desktop height. Category management is labeled “Edit categories,” positioned before the category and date inputs; visible category/date captions removed, accessible labels retained.
- Changes are presentation/markup-only; data keys and cloud-sync behavior are unchanged.


## V20.8 Compass priority rail polish (November 1, 2026)

- Compass **Currently...** uses the existing `pi-ui-panel-collapse-v1` key for its panel collapse state, and explicitly hides the horizontally laid-out rail when collapsed. The header's empty space also toggles it.
- Its notes remain in the original `pi-compass-v1` records. Each highlighted tile now has its own disclosure for editable details, with expansion saved as an optional `currentExpanded` property. No existing note data is migrated or removed.
- The horizontal rail now has a distinct framed background, similar to Home's day cards, with restrained theme-aware color variation.
- Reload after deployment (Ctrl+Shift+R). Always make a JSON backup before testing editing, moving, or deleting.


## V21.0 · Direct inline text formatting (November 2026)

- Removed the separate rich-text dialog and its Apply/Cancel workflow.
- Real-time formatting controls (B, I, U, strikethrough, bullet lists) appear beside the active rich-note body; changes appear directly in the writing area. Keyboard shortcuts remain Ctrl/Cmd+B, I, U and Ctrl/Cmd+Shift+X.
- Home category details and calendar day category details now store their safe formatted HTML as optional `detailsHtml` **beside** the original plain `details` field. Existing records without `detailsHtml` still display and edit normally.
- This Week, This Month and Next Month's **Room to think** note composer now supports native formatted HTML; freeform planner notes retain their plain `text` for search and compatibility and optional `html` for visual formatting.
- The earlier `**bold**`, `++underline++` and `~~strike~~` text can be displayed as inline formatting on supported note bodies without altering the original stored text.
- Single-line titles, URLs and checklist labels remain intentionally plain text. Their existing keyboard, drag-and-drop and editing behavior is unchanged.
- Existing localStorage and cloud-sync record keys are unchanged. As always, back up your JSON before replacing deployed code.


## V21.1 Longform writing/organization refinements (2026-11-01)
- Longform editor saves only on explicit Save thought/Update thought clicks; Enter inserts paragraphs/bullets.
- Paste formatted bold/italic/underline/strikethrough and lists into the editor; unsafe HTML and unsupported styles are stripped.
- Composer destination is now a section picker, including **Unsorted**.
- Existing category metadata and category keys remain for backward compatibility, but category controls are hidden.
- New unsorted notes stay directly in Saved thoughts; notes can be moved to/from sections with the normal move controls. Existing notes without a section assignment still appear in their legacy default section.
- Saved thought menus are positioned in the top layer to avoid being clipped by scroll panes.
- Drag handles live on the left; expand/tools controls live on the right.
- Saved thoughts offer **Edit in composer**, which updates the existing entry ID and its title rather than creating a duplicate.
- Draft HTML is retained in `pi-longform-draft-v1` and safely restored on return.


## V21.2 — Archive month notes, Longform color, Timeline ordering (November 1, 2026)

- Archived monthly calendars keep their day snapshots read-only. The Notes panel now reads and saves the normal `pi-planner-month-YYYY-MM` key and retains its draft key, allowing retrospective notes. The original snapshots remain preserved.
- Each saved Longform thought now has Theme default plus five theme-relative color choices in its ⋮ menu. Its optional `accentOverride` is stored inside the existing `pi-longform-state-v1` entry; category/section metadata remains available for compatibility.
- Compass and Timeline pop-out icons are positioned beside their header actions, with section controls grouped on the right.
- Timeline note headers show milestone dates; Timeline notes are automatically ordered newest to oldest within their column/section. Manual drag handles are hidden for Timeline notes and sections, but menu movement to other columns remains available.
- This is a targeted change; no existing storage keys were renamed.


## V21.3 · Alignment page (first draft)
- New `Alignment.html`, `Alignment.js`, and `Alignment.css`. Added immediately after Compass in all page menus.
- `pi-alignment-v1` contains notes, folders, and Readings & Rituals sections; `pi-alignment-draft-v1` stores the editable draft. These `pi-*` keys use the existing backup and Safe Sync conventions.
- Left: Readings & Rituals list, unsorted notes and optional sections. Right: collapsible Affirmations & Scripts tiles (including folders) over a 60%-width Longform-style rich-text composer.
- Notes can be dragged between lists, shelf, folders; folders can be reordered on the shelf and clicked to open a modal list. Three-dot menus provide folder creation and note actions; destination selects provide keyboard-accessible moving.
- **First-draft boundary:** Folders stay on the tile shelf; notes move between folders/sections. No automatic import from Longform or other pages, to protect their existing records.
