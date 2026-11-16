# V28.2 — Aquarium Unsorted Notes & Checklist Styling

Based directly on the uploaded V28.1 site ZIP (`currentzip(2).zip`).

## Changes
- Aquarium.html: loads V28_2AquariumRefinements.css after existing styles.
- V28_2AquariumRefinements.css:
  - Fixes the expanded Unsorted notes drawer's grid sizing. The drawer now fills its allocated space and scrolls through notes correctly.
  - Makes the category-note checklist entry textarea and Add button coordinated, rounded, and theme-colored.
  - Adds a mobile-friendly version of the drawer and checklist composer sizing.

No storage keys, note data, folder organization, cloud sync, or existing JavaScript logic was changed.

## Deployment
1. Export a fresh JSON backup from the live intranet.
2. Replace your site's files with the *contents* of `CURRENT/`.
3. Hard refresh if the browser keeps an older cached CSS file.

## Local checks
- Desktop Unsorted drawer opens, shows saved notes, and scrolls long notes.
- Mobile Unsorted drawer opens and shows notes.
- Cozy 2000s theme styles apply to the checklist field and Add button.
- Adding a checklist entry still saves the entry into the note's `subtasks` array.

Browser checks were performed using a local, isolated page harness; remote cloud synchronization was not tested.
