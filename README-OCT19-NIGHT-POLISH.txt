PERSONAL INTRANET — OCT 18 EVENING POLISH
========================================
This patch builds on PI_Home_Original_Day_Headers_Full_2026-10-18.zip.

WHAT CHANGED
- Theme dropdown now matches the adjacent Pages menu's shape, background,
  border, font, and control height. Theme ordering/selection logic unchanged.
- Home Inbox and Backup buttons get rounded corners matching Pages.
- Successful cloud sync indicator now shows "synced ☁️". The underlying
  CloudSync.js is unchanged; warning, conflict, saving, offline, and error
  messages are not abbreviated.
- Other pages -> Aquarium Notes appears in the cross-page Move menu.
  Incoming saved notes land as editable Aquarium cards in the existing
  Inbox area of Aquarium. From there, cards can be moved into any Aquarium
  board category (tile) using its usual controls.
- Aquarium cards get their own three-dot move menu, allowing a note to
  move to the MAIN Notes area on other pages or among Aquarium categories.

INSTALL
1) Make a fresh JSON backup inside the intranet. Close other intranet tabs.
2) Extract the REPAIR zip to your GitHub Pages repository root, overwriting
   matching files. Upload ALL files in the repair zip: the two Finishing
   assets and all ten HTML files. HTML updates are cache-busting only.
3) After GitHub Pages redeploys, refresh browser pages. Check both desktop
   and mobile, and verify the sync indicator is healthy.
4) Open Aquarium once on each fresh/empty installation so its board exists
   before sending a note there. Your existing Aquarium data needs no setup.
5) Try one throwaway note Home -> Aquarium (Inbox) -> Home or Compass.
   Check both places and a second device before moving important notes.

SAFETY
- No storage key changes, database migrations, or CloudSync.js edits.
- The destination is written before the source is removed. The existing
  Home stale-data and recovery checks remain in place.
- Existing note category cards are unchanged. The Aquarium Inbox is used
  as the general holding area; the patch does NOT create a new category.
- For cross-page moves, content is preserved where supported; Aquarium
  cards have rich text, but nested Home sub-checklists become readable
  lines in Aquarium. Transfer metadata is retained for a move back.
- If Aquarium has never been opened (no board state), the move is refused
  and the originating note remains in place.

TESTING
- JavaScript syntax and static file checks passed.
- Isolated Chromium DOM tests: Compass -> Aquarium, Aquarium -> Home,
  and successful cloud-status labeling passed.
- Header CSS computed-style checks passed.
- Full-site browser navigation is blocked by the test environment, so a
  live GitHub Pages + Supabase round trip still needs device verification.
