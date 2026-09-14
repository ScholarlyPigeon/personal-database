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


MOBILE STABILITY FOLLOW-UP
- Mobile Database section subtitles are hidden so titles always have enough room.
- Dense editable rows use isolated paint layers to reduce Chromium/Brave ghost-text artifacts.
- On phones/touch devices, Enter creates a newline in content composers; use the visible Add/Submit button to save.
- Desktop keeps Enter-to-submit, with Shift+Enter for a newline.

LONGFORM + NEOPETS INTERACTION PASS
- Added Longform.html, a writing-first page with a large composer and compact saved-entry rail.
- Longform entries collapse to three lines, expand for full reading/editing, and support Important / Database / Misc. categories.
- Added editable dates, strikethrough, delete, and archive actions; Longform archive sends entries into the shared Archive & Patterns item archive.
- Added optional image URLs with optional click-through URLs. Saved-entry image/link data can also be changed later with the ◎ control.
- Longform uses the existing shared theme selector, cloud login, localStorage/cloud sync, and mobile styling.
- Added Longform navigation to Database, Aquarium, Archive & Patterns, and Neopets.
- Fixed Neopets link sections so section headers reserve their own layout space instead of being overlaid by link cards.
- Rebuilt the Neopets external reference portal as editable/addable reference cards.

Files to upload together now include:
- index.html
- Database.html
- Aquarium.html
- Patterns.html
- Longform.html
- neopets.html
- Script.js
- Style.css
- CloudSync.js


ECOSYSTEM NAV + MOBILE HEADER COMPRESSION
- Replaced the expanding row of cross-page header links with one shared page dropdown on Database, Aquarium, Archive & Patterns, Longform, and Neopets.
- The page dropdown includes Database, Aquarium, Archives, Longform, and Neopets, so the new Longform page is reachable from the top of every page.
- Condensed Aquarium, Archive & Patterns, Neopets, and Longform mobile headers to match the tighter Database treatment.
- On mobile, the theme selector is always the final full-width control at the bottom of each header deck.
- Tightened mobile title/subtitle chrome while preserving page-specific actions like Select, Archive Completed, backup, and Reset Layout.
