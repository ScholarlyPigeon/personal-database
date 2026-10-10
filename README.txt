PERSONAL INTRANET | HOME + ARCHIVE + TIMELINE REORGANIZATION | OCTOBER 10, 2026

TEMPORARILY RETIRED FEATURES / PAGES
- Original separate landing dashboard (previous index.html). Its Recent Activity panel is now on Archive; Inbox remains in Tools; Focus Now remains on Home/Database.
- Original Almanac reference page (saved data retained in pi-almanac-state-v1 and associated stores, and HTML backup in retired-pages).
- Archive's embedded Notes / Patterns / Timeline arrangement and old view-mode bar. Timeline now has a dedicated page with a saved notes desk; old working records remain in their original key.
- Earlier Aquarium Thought/Ask/Action type selection and filtering UI. Stored values remain intact.


INSTALL
1. From your current live Home/Database page, download a fresh JSON backup BEFORE deployment. Keep this backup safe.
2. Extract this ZIP. Upload the main HTML, CSS and JS files to the GitHub Pages repository root, replacing matching files. Keep the retired-pages folder as a separate backup if you wish.
3. Wait for the GitHub Pages deployment to finish, then reload the site (hard refresh if stale).
4. Visit the site's root URL. It should now open Database.html, titled Home.
5. Check Aquarium tiles, open an existing Timeline entry, create one new note, test Monthly +more, and check Archive > Recent Activity.

WHAT CHANGED
- Home: Database.html retains its filename and storage keys, but is now the Home landing page. index.html redirects to it. Pages navigation no longer shows a second old Home. Aquarium now displays "Aquarium" rather than "Brain Aquarium". All pages keep visible Sync, Pages, Themes, Tools; Home additionally shows Backup.
- Retired original homepage: its Inbox is preserved and is available via Tools > inbox on every page, with the existing routing options. Universal dock capture and Search remain usable.
- Archive: three equally sized columns: Day Archive, Archived Items, and Recent Activity. Counts are shown in the headings. The Month Archive dialog link appears in the compact top bar, rather than consuming a separate row.
- Recent Activity: new content-based addition/edit tracking for Home lists, calendar entries, Aquarium cards/tiles, Longform entries, Timeline/notes, archived items, and Neopets. Consecutive keystrokes on one item are folded into a single activity record. It avoids logging drafts, theme changes, layout tweaks, and automatic background-only writes. It retains the latest 250 breadcrumbs under the existing pi-activity-v1 key; older events beyond 250 are not preserved by this new view. Old activity already stored remains visible.
- Timeline & Notes: Replaces visible Almanac page at Almanac.html. Timeline reads and edits existing pi-archive-workspace-v1 Timeline records. Saved Notes includes editable/collapsible categories/sections, title/date/body, rich-text editing, optional links/images, drag reorder and tap-to-move controls. Existing former Archive notes and pattern notes are COPIED into the new workspace, retaining source originals.
- Month: non-intrusive +N more tag on monthly day tiles when more than three entries exist, outside their clipped preview list. Clicking the tile still opens the day editor.

DATA SAFETY
- CloudSync.js is byte-for-byte unchanged from the uploaded version.
- Existing pi-* keys for Aquarium, old Almanac, Longform, Archive, Timeline, calendar, and former homepage have NOT been deleted, renamed, or overwritten by code migrations. Timeline edits intentionally update its EXISTING timeline storage key.
- Old Almanac records stay stored, even though that reference page is retired. Historical source HTML copies are in retired-pages for reference and rollback. The original Almanac reference page can be revisited from its archived HTML file, but it is intentionally absent from the main navigation.
- The activity trail is a lightweight usability history, NOT a forensic audit. It records meaningful local user edits going forward, not an exhaustive retrospective of previous changes. Editing another device may not appear until the synced activity key is received and the page is refreshed.
- Authenticated Supabase cross-device testing has NOT been performed. Browser DOM checks were performed with mock local storage, including archive counts, timeline preservation, saving/editing notes, a new timeline milestone, Home/inbox navigation, calendar +more, and page loads.

TROUBLESHOOTING
- If an older page is still visible after GitHub upload, hard refresh or open a private tab. Every page uses matching cache-version query strings.
- If an item is not where expected, DO NOT restore over new data automatically. Check the latest backup first; former Archive notes are also preserved under pi-archive-workspace-v1.
- If necessary, restore the prior repository files from GitHub history and use the untouched JSON backup.
