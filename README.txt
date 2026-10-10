PERSONAL INTRANET | AQUARIUM TILE POP-OUT FIX | OCTOBER 10, 2026

FIX
- Aquarium tile focus view now renders a live, separate copy of the tile rather than moving its DOM element away from the board.
- Expanding/collapsing existing notes, adding blank notes, checking off notes, and collapsing/expanding the tile refresh the focused view immediately.
- A blank note added while its parent tile is collapsed automatically opens that tile, so the new note is visible and its title receives focus within the popup.
- Closing a focused tile refreshes the underlying board, including changes made to editable text.
- Clean, centered Aquarium section bars remain unchanged.
- No user-data storage keys are changed or removed, and CloudSync.js and styling are carried forward unchanged.
- All HTML Script.js references use a new cache version to avoid stale JS after publishing.

INSTALL
1. Download a current JSON backup via Database before deploying.
2. Extract this ZIP and upload the files at its root to the ROOT of the GitHub Pages repository, replacing matching filenames.
3. Refresh your Aquarium browser tab. Open a tile's focus view, expand a note, add a note, then close and confirm the main view matches.

VERIFICATION
- JavaScript syntax checked.
- Local automated Chromium DOM interaction checks passed with mocked localStorage: existing note expand/collapse, whole-tile expand/collapse, add blank note inside popup with focus on its title, and closing/re-synchronizing the main board. This is not a live Supabase/cloud-sync test.

FEATURES TEMPORARILY RETIRED
- Aquarium Thought/Ask/Action type controls remain hidden. Saved types remain intact for possible future restoration.
