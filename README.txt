PERSONAL INTRANET | PASS ONE | OCTOBER 10, 2026

INSTALL
1. Download a fresh JSON backup from the live Database page BEFORE uploading.
2. Extract the ZIP. Upload all files inside the PI_Pass_One folder to the ROOT of the GitHub Pages repository, retaining their exact filenames.
3. Refresh desktop and mobile pages after publishing. Existing pi-* storage keys are retained.
4. Verify one save on each page and cross-device cloud synchronization before depending on new features.

FEATURES TEMPORARILY RETIRED (FOR POSSIBLE RETURN)
- Aquarium category tiles / category-management UI. Existing category assignments, names, and cards remain in pi-aquarium-state-v3. The current view groups cards directly under their sections. Card TYPES remain supported and editable. No category data has been deleted.

PASS ONE CHANGES
- Aquarium section Remove button becomes a compact × between section title and right divider; section expand/collapse is unchanged.
- Aquarium each thought has a small focus/expand button opening a larger editable modal. Edits are saved through existing state storage.
- Longform sections get reorder controls and desktop drag, and notes get move controls plus desktop drag. On mobile, use the selectors for tap-and-move.
- Shared page headers now have tools menu to contain auxiliary actions; core page/theme/sync remain visible, with backup at the top on Database.
- Database mobile day rail gets horizontal swipe restored despite global mobile overflow rules.

SAFETY AND TESTS
CloudSync.js has not been modified. No Supabase schema changes. Browser interaction and authenticated cloud syncing have NOT been verified in a live browser. Make a backup before deployment.
