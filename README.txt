PERSONAL DATABASE — POLISHED CLOUD + MOBILE PASS

Files to upload together:
- index.html
- Database.html
- Aquarium.html
- Patterns.html
- neopets.html
- Script.js
- Style.css
- CloudSync.js

What changed:
- Removed the temporary manual upload/load cloud buttons from the everyday interface.
- Kept a dated JSON backup button on Database.
- Added a proper masked cloud sign-in dialog and a quieter cloud sync status.
- Added cloud login access to every page for fresh devices / expired sessions.
- Preserved all current storage keys and data migrations.
- Consolidated duplicate auto-grow JavaScript helpers and corrected old 14-day comments to 28-day / four-week wording.
- Added responsive mobile layouts for Database, Aquarium, Archive & Patterns, and Neopets.
- Database mobile flow: Priority Shelf → Radar → swipeable Upcoming rail → Links/Main Board.
- Patterns mobile flow: Patterns & Notes → trackers → archives.
- Neopets keeps a two-column dailies grid on phones.

Important:
- Existing Supabase data is not embedded in these files.
- The Supabase publishable key remains in CloudSync.js by design; RLS remains the security boundary.
- Drag-and-drop remains desktop-first. Touch browsers vary in support for native HTML drag/drop, but adding/editing/checking content remains available on mobile.

MOBILE CHROME + HEADER REFINEMENT
- Added mobile text-size normalization for Chrome/Chromium consistency.
- Removed mobile text shadows from dense editable Database content to reduce repaint/ghosting artifacts.
- Added isolation to dense Database cards for cleaner Chromium repainting.
- Condensed the Database mobile header/control deck.
- Moved Reset Layout before the theme selector.
- Mobile utility row is now Aquarium + Archives + Select + Reset, with the theme selector directly beneath it.

