PERSONAL INTRANET — POLISHED CLOUD + MOBILE PASS

Files to upload together:
- index.html
- Database.html
- Aquarium.html
- Patterns.html
- Almanac.html
- Longform.html
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


V3 NAVIGATION FIX
- Replaced the JS-populated ecosystem select with a native pages dropdown made from real links.
- Longform is now present in the top pages menu on Database, Aquarium, Archives, Longform, and Neopets.
- Added cache-busting query strings to Style.css, CloudSync.js, and Script.js so browsers do not reuse the stale JS that could leave the old dropdown empty.
- Theme selector remains the bottom control in the compact mobile header deck.


LONGFORM IMAGE + EDITABILITY FOLLOW-UP
- Widened the desktop Saved Thoughts column while preserving the writing-first composer.
- Saved-note images now render substantially larger and use contain-fit so charts/schedules are visible without cropping.
- On narrow phones, attached images stack full-width above the note preview for easier reading.
- Added an explicit edit-pencil control to every saved Longform thought; it expands the note and focuses the editable text.
- Longform page title, subtitle, Saved Thoughts heading/note, and Write It Out heading/note are now editable and synced.
- Bumped the shared asset cache version so updated CSS/JS refreshes cleanly in Chromium/Brave.

V5 — FINAL NIGHT POLISH
- Enlarged Neopets Dreamies portraits on desktop and mobile, and switched them to contain so the full pet image remains visible.
- Added rich-text keyboard handling on contenteditable writing surfaces: Ctrl/Cmd+B = bold, Ctrl/Cmd+I = italic, Ctrl/Cmd+U = underline, Ctrl/Cmd+Shift+X = strikethrough.
- Longform composer is now a rich contenteditable writing surface, and Longform formatting persists when saved and edited.
- Longform saved-note images now keep their natural aspect ratio with no forced crop box, use the full saved-card width, and the saved-thought rail is wider on desktop.
- Increased the size/prominence of the Longform optional image / clickable link control.
- Hardened mobile document scrolling for Longform and Neopets so the full page remains reachable on touch browsers despite the desktop overflow lock.
- Bumped cache versions to 20260913e.

LONGFORM V6 — FULLY COLLAPSIBLE SAVED THOUGHTS
- Saved Longform cards now fully collapse: text, image, and link content all fold away.
- A compact card header always remains visible with category/date plus a one-line text preview.
- Clicking the one-line preview opens the card and places the cursor directly in the saved thought for editing.
- Removed the redundant pencil edit button.
- Consolidated secondary actions into a clearer Tools menu: strikethrough, image/link, archive, and delete.
- The collapse arrow remains visible beside Tools for quick open/close control.


PERSONAL INTRANET — 2026-09-18 USABILITY PASS
- Added touch-friendly tap-to-move on the Database: tap a ⋮⋮ handle, then tap a destination tile/row/list. Desktop drag/drop remains available.
- Added confirmation before destructive delete/remove controls across the intranet.
- Mobile lists now favor taller cards/page scrolling over cramped nested scroll boxes, with more room for selectable long notes.
- Added copy handling that preserves paragraph/newline spacing when moving text out of intranet content.
- Longform collapsed Saved Thoughts now show the title only; the composer body once again fills the available panel beneath the title field.
- Archived day snapshots now retain live completion checkboxes, so forgotten items can be marked complete later.
- Archive & Patterns panel titles/helper text stay on one line with ellipsis instead of wrapping into tall headers.
- Brain Aquarium section separators are now persistent collapse/expand bars.
- Shared asset cache version bumped to 20260918a.
- Safe Sync V2 / Supabase structure unchanged.


SEPTEMBER 18 — PIN / COLLAPSE / TIMELINE FOLLOW-UP
- Longform Saved Thoughts now support Pin to Top from the Tools menu. Pinned thoughts sort above unpinned thoughts while the rest retain their normal order.
- Aquarium section collapse now explicitly suppresses the section grid in CSS, fixing category tiles that remained visible after the arrow changed.
- Archive & Patterns headings shortened to Archive, Patterns, Timeline, and Strains (Day Archive remains unchanged).
- Timeline markers now have editable date inputs. Existing markers inherit their original local date, new markers default to today, and the list sorts newest date to oldest.
- Shared cache version bumped to 20260918b.


V18 — FALL 2 + RADAR / ARCHIVE REFINEMENT (2026-09-18)
- Added 🍁 Fall 2: a darker candlelit jewel-tone autumn theme with turquoise/teal accents.
- Clipboard HTML is sanitized so copied text keeps semantic formatting without carrying PI card/background styling.
- Database Priority Shelf retired; any remaining Priority items migrate once into On My Radar.
- Links moved to a calmer full-width strip beneath the Database header.
- Added Near My Radar as a second synced checklist beneath On My Radar.
- Calendar items automatically move below unfinished items when checked; unchecking returns them above completed items.
- Database headers are constrained to one aligned line.
- Archive Patterns column stretches to the page bottom.
- Strain capture stacks name above notes; saved strain bodies are collapsed/revealable while names stay visible.
- Removed the Strains header helper copy to protect header fit.


V19 — QUIETER ROOMS + ARCHIVE DESK + PERSONAL ALMANAC (2026-09-18)
- Fall 2 now uses stronger jewel-tone panel/tile differentiation across Database, Aquarium, Longform, Archive, and the new Almanac, while retaining teal/turquoise accents.
- Added a shared synced header-only collapse system for sensible major sections. Radar/Near Radar, Aquarium capture, Longform panes, Neopets major cards, Archive panels, and Almanac panels can now be folded down.
- Added clean category managers to Aquarium and Longform. Aquarium categories can be added, renamed, recolored, moved between sections, or removed. Longform categories can be added, renamed, recolored, or removed; entries safely fall back to another category when one is deleted.
- Rebuilt Archive & Patterns into three working areas: historical archives on the left, a rich-text Notes desk in the middle, and Patterns over Timeline on the right.
- Notes, Patterns, and Timeline now share one movable ecosystem. Every saved card has a title, editable date, foldable rich body, and destination selector so items can move between the three without being recreated.
- Existing Pattern and Timeline records migrate once into the new workspace key; legacy keys are left untouched as a safety copy.
- Removed Strain Journal from Archive & Patterns. Its original pigeonhole-v15-strain-journal storage key is now read by Almanac, so existing strain entries move pages without data re-entry.
- Added Almanac.html: Meals I Make, Dailies, Quotes & Understandings, Current Rotation, Restock, Wish List, and Strain Journal.
- Almanac rich cards and strain entries collapse to headers; Dailies and Restock include reset-check controls.
- Added Almanac to the shared page navigation on every page.
- Shared cache version bumped to 20260918d.
- Safe Sync V2 / Supabase structure unchanged.


V5 — FOCUS / MOVEMENT REFINEMENT
- Archive Timeline moved from orange/yellow into a quieter blue/teal color family across themes.
- Archive Notes / Patterns / Timeline cards now move by ⋮⋮ handle: drag on desktop, or tap handle then tap a destination list on touch. The persistent per-card destination dropdown was removed.
- Almanac items can now archive into the shared Archive item history using the same ↘ archive route as the rest of the Personal Intranet.
- Almanac sections are equal-sized tiles and their order is saved; move them with ⋮⋮ by drag or tap-to-move. Collapsed tiles still shrink to header-only rows.
- Secondary helper text in section headers is hidden ecosystem-wide to reduce crowding; page-level subtitles remain.
- Database Upcoming header icon/title alignment was tightened.
- Longform Saved Thoughts category filters are now one compact dropdown instead of a row of buttons.
- Shared asset cache version bumped to 20260918e.

V6 — FOCUS BOARD + CLEAN CLIPBOARD PASS
- Personal Almanac reduced to six core movable/collapsible tiles: Meals, Dailies, Things I Like, Restock, Wish List, Strain Journal.
- Removed Quotes & Understandings from the visible Almanac while preserving any existing quote data in storage.
- Added editable/synced headers for all six Almanac sections.
- Almanac tile colors now mirror Brain Aquarium's teal/plum/rose/blue/green/orange accent language, including richer Fall 2 variants.
- Added adaptive Almanac focus sizing: when only one or two tiles remain expanded, collapsed headers stack in a left rail and the expanded tile(s) grow into the freed space up to roughly two normal tile heights.
- Rebuilt Meal entry as title + rich-text note + optional recipe/reference link; saved Meal cards remain collapsible and editable.
- Longform section metadata controls and saved-thought category/date controls are pushed farther right for cleaner headers.
- Rebuilt shared clipboard handling: plain-text copy explicitly preserves block/paragraph spacing, while rich HTML copy is sanitized to semantic formatting and links only. PI classes, ids, inline styles, colors, backgrounds, and layout paint are removed. Almanac is now included in the clean-copy scope.
- Bumped shared asset cache version to 20260918f.
- Safe Sync / CloudSync.js unchanged.

V7 — DATABASE NOTES + AQUARIUM WRITING DESK (2026-09-18)
- Database Main Board tiles retired so Aquarium can own spatial/category organization without duplicating that role.
- Database center column is now a plain Notes workspace: entry stays at the bottom, saved notes collect above it, and notes use the same move system as Radar and calendar items.
- Database left and right rails are equal-width and slightly wider while the Notes column is intentionally less dominant.
- Almanac tile bodies use anchored composers and corrected overflow so saved items no longer overlap each other or the entry controls.
- Almanac focus layout expands open tiles into available space across more collapse states while preserving the six-tile overview when most tiles are open.
- Meals returned to the lighter + meal interaction: create an editable meal card directly, with an optional link editor available from the saved card.
- Longform composer and saved-card category/date metadata are aligned fully to the right edge of their header areas.
- Aquarium Thought / Action / Ask types are now managed data with dropdowns; types can be added, renamed, recolored, or removed.
- Aquarium capture was rebuilt as a wider right-side writing desk with title + rich-text body + type selector.
- Aquarium saved items now keep a visible title/header and collapsible rich-text body while retaining category/section movement and mobile tap-to-move.
- Existing Aquarium records migrate in place to the richer card shape without requiring re-entry.
- Shared asset cache version bumped to 20260918g.
- Safe Sync / CloudSync.js unchanged.
