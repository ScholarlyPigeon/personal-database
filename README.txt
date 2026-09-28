PERSONAL INTRANET — STABILITY FINISH
September 28, 2026

This release repairs regressions introduced during Polish v2.

ALMANAC
- Fixed a real runtime bug from the new list-movement pass. Movement controls had been inserted into the Meals renderer by mistake and were missing from the actual list-item renderer.
- Existing Almanac data remains in the same pi-almanac-state-v1 / pi-strain-journal-v1 stores.
- Dailies / Things I Like / Restock / Wish List retain drag, up/down reorder, and destination-select movement.
- Meals remain unchanged by list movement controls.

MOBILE PAGE FLOW
- Phones and coarse-pointer devices now use normal browser/document scrolling again.
- The universal capture dock keeps bottom breathing room through page padding instead of forcing every page into a nested fixed-height viewport.
- This is intentionally simpler and removes the main source of clipped/off-screen mobile content.

DATABASE MOBILE
- Rebuilt the mobile header deck with explicit layout ownership.
- Pages is a full-width native details menu.
- On mobile, the Pages menu expands in normal document flow instead of an absolutely-positioned popover, so it cannot be clipped behind another panel.
- Theme / select / sync / backup controls receive stable mobile slots.
- Database content panels return to natural vertical flow, with long lists scrolling internally only when useful.

LONGFORM MOBILE
- Longform returns to normal document scrolling on phones.
- Composer remains first and Saved Thoughts follows beneath it.
- Saved Thoughts / sections no longer live inside a clipped nested viewport.
- Added a small storage-refresh safeguard on pageshow/focus/visibility return so a mobile page re-reads current Longform state after cloud/local changes.

CACHE
- Shared asset cache version: 20260928-stablefinish.

======================================================================

PERSONAL INTRANET — POLISH V2 ADDENDUM
September 28, 2026

HOME
- Restored the native Pages dropdown to the Home header.
- Added a low-profile top room strip for Database, Aquarium, Longform, Archive, and Almanac. Neopets remains available from the Pages menu but is intentionally omitted from the prominent room strip.
- Desktop Home is now a three-column dashboard:
    left: Focus Now + Recent
    center: Catch It + Personal Intranet Inbox
    right: Today
- Home remains a one-screen desktop dashboard with internal scroll areas; phones use natural vertical page flow.

ARCHIVE
- All view now groups Notes / Patterns / Timeline as three equal top panels.
- Day Archive / Archive sit together as two equal bottom panels.
- History view shows Day Archive and Archive side by side at equal size.
- Individual panel content scrolls internally when needed.

ALMANAC
- Desktop Almanac now uses a steady 3 x 2 equal-tile board rather than adaptive focus resizing, preventing clipped/cut-off tile bodies.
- List items in Dailies, Things I Like, Restock, and Wish List are movable:
    drag on desktop
    up/down reorder buttons
    destination dropdown for moving between compatible list sections
- Mobile retains explicit movement controls and natural-height tiles.

LONGFORM
- Saved Thoughts now has a guaranteed scrollable library rail on desktop.
- Longform section collapse now toggles in place and hidden section bodies are explicitly removed from layout, fixing the prior non-collapsing behavior.
- Mobile Saved Thoughts uses a capped scroll region rather than clipping off-screen.

MOBILE STABILITY
- Database mobile navigation now explicitly supports the current native <details> Pages menu rather than the retired select-based navigator.
- Database Pages and Theme controls are forced into visible mobile grid slots.
- Open menu popovers receive a high stacking context and mobile-safe max height.
- Home, Almanac, Longform, and shared native page menus received additional small-screen overflow/scroll safeguards.

Shared asset cache version: 20260928-polish2.

======================================================================

PERSONAL INTRANET — POLISH V1 ADDENDUM
September 28, 2026

- Home is now a fixed desktop dashboard designed to fill one viewport without document scrolling.
- Home order is: capture + PI Inbox, full-width Focus Now, then Recent / larger Rooms / Today as three equal-height dashboard columns.
- Home Inbox, Focus, Recent, Rooms, and Today switch to internal scrolling when their content outgrows the available panel.
- Aquarium category tiles can now be collapsed individually. Collapse state syncs through pi-aquarium-collapsed-categories-v1.
- Longform Saved Thoughts now supports independent sections in addition to categories.
- Longform sections are editable, collapsible, addable, and removable. Individual notes can be moved between sections from each note's tools menu.
- Existing Longform notes automatically appear in the default General section without changing note content or category data.
- Longform section structure/assignments sync through pi-longform-sections-v1.
- Shared asset cache version: 20260928-polish1.

======================================================================

PERSONAL INTRANET — FLOW V2 ADDENDUM
September 28, 2026

- Universal capture now lands in a dedicated pi-capture-inbox-v1 rather than automatically becoming an Aquarium card.
- Home shows the Inbox and can route captures to Database Notes, Aquarium Inbox, Longform, Archive Notes, Focus Now, Radar, or Today.
- Desktop Home supports dragging Inbox items onto Database / Aquarium / Longform / Archive room cards.
- Archive Timeline recovery now reconciles legacy/canonical workspace stores by id every load instead of trusting the old migration flag.
- If Timeline is still empty, Archive shows a "recover backup" button. Select an existing Personal Intranet JSON backup; Timeline entries are merged into the current workspace without overwriting unrelated data.
- Archive "All" is now the default view (stored under a fresh v2 view-preference key so the previous automatic Synthesis default does not stick). On wide desktop screens, Day Archive / Archive / Notes / Patterns / Timeline are five equal-height side-by-side panels inside one viewport.
- Mobile remains stacked and touch-safe.
- Shared asset cache version: 20260928-flow2.

IMPORTANT: Do not upload personal JSON backups to GitHub. Backup recovery reads the file locally in the browser.

======================================================================

PERSONAL INTRANET — CANONICAL README
Current production version: September 28, 2026
Status: GitHub Pages / Supabase production-ready · stability repair applied


======================================================================
0. SEPTEMBER 28 STABILITY REPAIR
======================================================================

This package repairs the first production cleanup build.

Root cause:
- CloudSync.js and Script.js both declared the same top-level migration-map
  constants. Each file was valid by itself, but browsers load both classic
  scripts into the same global lexical environment. The second declaration
  caused Script.js to be rejected before it could initialize the PI.
- That failure explains the characteristic symptoms: cloud status still worked,
  while shared themes, generated lists, Home controls, Focus Now, Recent, the
  universal dock, and page behaviors were missing or inconsistent.

Repair:
- CloudSync.js now runs inside its own isolated module scope, preventing any
  internal cloud helper from colliding with Script.js.
- The legacy-storage cleanup is now quota-safe. It moves one key at a time and
  verifies the new value instead of temporarily duplicating all PI data plus a
  second full recovery snapshot.
- If an old and new key both exist with different values, neither value is
  silently deleted. The legacy copy is left in place for safety and is included
  in downloadable backup metadata.
- Shared asset cache references were bumped to 20260928-stable1.

No Supabase table/schema change is required.


======================================================================
1. WHAT THIS PROJECT IS
======================================================================

The Personal Intranet (PI) is a private, browser-based personal information
environment. It is designed around a simple lifecycle:

    orient → catch → focus → think → review → reference → play

The current pages each have one primary cognitive job:

- Home / index.html — ORIENT
  See what matters, catch what appeared, see today/recent activity, and choose a room.

- Database.html — FOCUS
  Active awareness: Focus Now, On My Radar, Near My Radar, Notes, Links, and the
  next four weeks.

- Aquarium.html — CAPTURE
  Low-pressure capture and spatial/category organization. Thoughts can exist
  without immediately becoming obligations.

- Longform.html — THINK
  Deep writing with titles, editable categories, pinning, collapsible saved
  thoughts, rich text, dates, and optional image/link attachments.

- Patterns.html — REVIEW
  Historical archive plus the movable Notes / Patterns / Timeline thinking
  ecosystem. Current view modes reduce visual pileup.

- Almanac.html — REFERENCE
  Repeatable life knowledge: Meals, Dailies, Things I Like, Restock, Wish List,
  and Strain Journal.

- neopets.html — PLAY
  A themed Neopets utility room with Dailies prioritized first, followed by
  Streaks, Dreamies, Treasure List, and reference links.

The PI uses a shared theme system, shared navigation, shared cloud sync,
shared archive behavior, and shared mobile/touch conventions.


======================================================================
2. CURRENT PRODUCTION FILES
======================================================================

Upload these files together to the ROOT of the existing GitHub Pages repository:

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
- README.txt

Main entry point:
    index.html

Shared application files:
    Script.js
    Style.css
    CloudSync.js

Do not rename these files without also updating their internal references.


======================================================================
3. CURRENT SEPTEMBER 27, 2026 UPDATE
======================================================================

This release turns the September 27 reconfiguration into the canonical PI.

Major additions:

HOME / FRONT DOOR
- index.html is now a real Home page rather than an automatic redirect to Database.
- Home shows:
  - universal capture
  - Focus Now
  - today's calendar items
  - Recent activity
  - doorway cards for each PI room
- Page roles make the purpose of each room explicit:
  ORIENT / FOCUS / CAPTURE / THINK / REVIEW / REFERENCE / PLAY.

UNIVERSAL CAPTURE
- A persistent capture dock is available across the PI.
- Captured material is immediately safe in the Aquarium Inbox.
- Classification is optional after capture rather than required before capture.
- Optional routes can send a newly-caught item toward:
  - Focus Now
  - Radar
  - Today
  - Longform
- The principle is: never navigate before remembering.

FOCUS NOW
- A separate shared Focus Now shelf exists on Home and Database.
- It is intentionally distinct from Radar:
  - Focus Now = genuinely front-row attention.
  - Radar = awareness / do not lose sight of this.
- A soft warning appears when the shelf becomes crowded rather than enforcing a hard limit.

GLOBAL FIND
- The whole intranet can be searched from the universal dock.
- Ctrl/Cmd + K opens Find.
- Search covers the major active and historical stores, including Database,
  calendar items, Aquarium, Longform, Archive workspace/history, Almanac,
  and Neopets.

RECENT / BREADCRUMBS
- Recent activity records important create/save actions across the PI.
- Home shows recent activity, and the universal dock can open the larger trail.
- This is intended to answer: "Where did I just put that?"

LONGFORM DRAFT SAFETY
- The current unfinished Longform composition is autosaved separately.
- Leaving the page no longer requires trusting working memory to remember an
  unsaved thought.

ARCHIVE VIEW MODES
- Archive & Patterns can be viewed in quieter modes rather than showing every
  function with equal visual weight.
- Synthesis is the default orientation, with History and Timeline available.

NEOPETS PRIORITY
- The page order now prioritizes Dailies before Dreamies because repeated use
  takes precedence over taxonomy.

BOTTOM-DOCK / VIEWPORT FIX
- Pages reserve real layout space for the universal capture dock.
- The reserved amount responds to the dock's actual height, including expanded
  routing controls.
- The dock should no longer cover content at the bottom of the page.
- Mobile page scrolling is structured around the remaining usable viewport.

MOBILE PASS
- Current production layouts were checked and adjusted for phone/touch use.
- Text entry remains touch-friendly.
- Major pages use natural-height mobile stacking rather than desktop-only height
  assumptions.
- Native drag-and-drop remains desktop-first where browser support varies;
  touch-safe tap/move/edit/check alternatives remain the important mobile path.


======================================================================
4. DATA STORAGE — CURRENT STANDARD
======================================================================

The live code now uses readable pi-* localStorage keys.

Examples:
- pi-theme
- pi-focus-now-v1
- pi-activity-v1
- pi-database-radar-v1
- pi-database-near-radar-v1
- pi-database-notes-v1
- pi-calendar-day-YYYY-MM-DD
- pi-aquarium-state-v3
- pi-longform-state-v1
- pi-longform-titles-v1
- pi-longform-categories-v1
- pi-longform-draft-v1
- pi-archive-v1
- pi-archive-workspace-v1
- pi-almanac-state-v1
- pi-strain-journal-v1
- pi-neopets-state-v3
- pi-ui-panel-collapse-v1

This replaces the old mixture of pigeonhole-* and brain-aquarium-* names as the
active vocabulary of the project.

IMPORTANT:
Legacy names are NOT simply ignored or deleted. The current code contains a
compatibility/migration bridge so existing browser and cloud data can move into
the pi-* namespace safely.


======================================================================
5. LEGACY DATA MIGRATION / CLEANUP PASS
======================================================================

This release is also the code-standardization pass.

The active application uses pi-* names, but CloudSync.js contains explicit
mappings from important old keys to their current equivalents.

Examples include:
- pigeonhole-database-theme            → pi-theme
- pigeonhole-tight-radar               → pi-database-radar-v1
- pigeonhole-near-radar                → pi-database-near-radar-v1
- brain-aquarium-celestial-color-v3    → pi-aquarium-state-v3
- pigeonhole-longform-v1               → pi-longform-state-v1
- pigeonhole-longform-titles-v1        → pi-longform-titles-v1
- pigeonhole-longform-categories-v1    → pi-longform-categories-v1
- pigeonhole-v10-archive               → pi-archive-v1
- pigeonhole-archive-workspace-v1      → pi-archive-workspace-v1
- pigeonhole-almanac-v1                → pi-almanac-state-v1
- pigeonhole-v15-strain-journal        → pi-strain-journal-v1
- pigeonhole-neopets-field-notes-v3    → pi-neopets-state-v3
- pigeonhole-day-list-*                → pi-calendar-day-*

Legacy prefix families are also translated where needed for editable labels,
calendar days, old tile data, Longform UI labels, Almanac section titles, and
Neopets UI labels.

Migration safety:
- Existing pi-* values win if both old and new names are present.
- Legacy values are moved one-at-a-time into the pi-* namespace without a temporary 2x storage spike.
- Equal old/new duplicates are collapsed.
- If old and new values differ, both are left in place rather than guessing which to destroy.
- A small metadata-only migration report is stored at:
      personal-intranet-storage-migration-v1
- Any remaining legacy values are included in downloaded backup metadata.
- Old cloud data is canonicalized before comparison/merge.
- The cleanup does not require manually re-entering existing PI content.


======================================================================
6. CLOUD SYNC — SAFE SYNC V3
======================================================================

Supabase infrastructure remains the same:
- Same Supabase project.
- Same database_state table.
- No new Supabase SQL/table setup is required for this release.

The Supabase publishable key remains in CloudSync.js by design.
Row Level Security (RLS) remains the real data-access security boundary.

Safe Sync V3 retains the important behavior introduced by Safe Sync V2:

- Fetch the newest cloud row before writing.
- Compare data key-by-key rather than blindly replacing the entire blob.
- Merge locally changed keys into the newest cloud state.
- Use updated_at as an optimistic lock.
- Retry when another device wins a write race.
- Check remote changes while a visible page remains open.
- Check local changes frequently without making a network request unless needed.
- Preserve a conflict recovery record instead of silently destroying a
  displaced local value.
- Avoid reloading while the user is actively typing.
- Include recovery/conflict information in normal backup output.

V3 adds the namespace migration layer:
- Incoming legacy cloud keys are translated into canonical pi-* keys before
  normal sync comparison.
- Legacy V2 sync metadata/conflicts can be read forward by V3.
- The existing cloud remains the same Personal Intranet cloud rather than
  becoming a separate new system.


======================================================================
7. BACKUP BEHAVIOR
======================================================================

The Database backup is an ecosystem backup, not a Database-page-only backup.

Current backup behavior captures synced PI localStorage data across the pages,
plus relevant recovery/conflict information.

It backs up SAVED PI DATA.

It does NOT act as a source-code backup:
- HTML files are not embedded.
- Script.js / Style.css / CloudSync.js are not embedded.
- Externally hosted images are not downloaded; their saved URLs remain data.

The GitHub repository itself is the source-code/version backup.

Before a major deployment or storage migration:
1. Download one current JSON backup.
2. Keep it outside the browser.
3. Then deploy the new source files.


======================================================================
8. IMPORTANT HISTORICAL EVOLUTION
======================================================================

This section keeps only historical decisions that still explain the current
architecture.

DATABASE
- The old Main Board / tile-based Database role was retired.
- Aquarium became the primary spatial/category organization room.
- Database evolved toward active focus:
    Radar / Near Radar / Notes / Upcoming.
- A one-time migration recovered meaningful old Main Board line items into
  Database Notes while leaving old storage available as a safety copy.
- The September 27 release adds Focus Now above that awareness layer.
- Calendar remains a 28-day / four-week rail.

AQUARIUM
- Aquarium evolved from a simple Thought / Action / Ask brain dump into a richer
  writing-and-organization room.
- Cards gained titles, rich-text bodies, editable types, editable categories,
  collapse behavior, movement, and touch-friendly movement.
- Existing Aquarium records were migrated forward rather than discarded.
- The current universal capture system uses the Aquarium Inbox as the safest
  default landing zone.

ARCHIVE & PATTERNS
- Archive originally combined historical records, pattern notes, timeline
  markers, and Strain Journal.
- Strain Journal moved to Almanac while keeping its data.
- Notes / Patterns / Timeline became one movable workspace:
  write once, then change destination as meaning changes.
- Historical Day Archive and deliberately Archived Items remain evidence.
- The September 27 view modes reduce visual competition between history and
  synthesis.

LONGFORM
- Longform grew into the dedicated deep-writing room.
- Real editable note titles were added without destroying existing entries.
- Collapsed cards became title-first.
- Saved thoughts gained Pin to Top.
- Categories became user-manageable rather than fixed.
- Rich text, editable dates, image/link attachments, archiving, and mobile image
  containment were retained.
- The September 27 release adds unfinished-draft autosave.

ALMANAC
- Almanac was created as a low-pressure reference room for repeating life
  knowledge rather than active project management.
- Earlier versions contained more sections, including Quotes & Understandings.
- The visible board was intentionally reduced to six core tiles:
    Meals
    Dailies
    Things I Like
    Restock
    Wish List
    Strain Journal
- Removed quote data was preserved rather than deleted.
- Tiles are movable/collapsible and use adaptive focus sizing.
- Meals and Strain Journal use collapsible rich cards.
- Almanac items can archive into the shared Archive history.

NEOPETS
- Neopets became a full member of the shared PI ecosystem:
  themes, cloud state, editable sections, navigation, mobile support.
- Dreamies were enlarged and protected from image cropping.
- External references became editable/addable cards.
- The September 27 layout places the frequently-used Dailies before Dreamies.

SHARED USABILITY
- Shared themes eventually included:
  Dark Original
  Dark Teal Celestial Aquarium
  Midnight Observatory
  Night Garden
  Universal Field Notes
  Y2K Web Portal
  Cozy 2000s
  Full Green
  Fall
  Fall 2
  Study
- Fall 2 became a darker jewel-tone autumn theme with teal/turquoise accents.
- Major panels can collapse to quieter header-only states.
- Destructive delete/remove actions ask for confirmation.
- Copy handling preserves useful paragraph formatting without exporting the PI's
  visual paint/classes/backgrounds.
- Mobile/touch composition treats normal Enter as part of the text; visible
  save/add controls are the reliable submission path for larger composers.


======================================================================
9. DEPLOYMENT — CURRENT VERSION
======================================================================

Recommended deployment sequence:

1. From the CURRENT LIVE PI, click Backup and save the JSON file.
2. Avoid editing the PI on another device during the actual replacement.
3. Upload/replace the complete current production file set together.
4. Publish through the existing GitHub Pages repository.
5. Open the normal PI URL on the laptop/desktop first.
6. Sign in to cloud if the session is not already authenticated.
7. Confirm familiar data appears in several places:
   - Database
   - Aquarium
   - Longform
   - Archive
   - Almanac
8. Confirm the cloud status reaches a healthy synced/ready state.
9. Open the same PI on the phone and allow it to sync.
10. Make one tiny test entry on one device and confirm it arrives on the other.
11. Delete the test after confirming two-way behavior.

No Supabase table migration is expected for this release.


======================================================================
10. MOBILE / TOUCH EXPECTATIONS
======================================================================

Mobile is a first-class use case, but not every interaction is identical to
desktop.

Expected mobile behavior:
- Full document/page remains reachable by normal touch scrolling.
- Universal capture dock reserves its own space instead of hiding bottom content.
- Database Radar stack uses natural-height mobile flow.
- Aquarium categories stack appropriately on narrow screens.
- Longform cards/content/images stay within the viewport.
- Neopets uses a vertical phone-friendly layout.
- Collapsible panels remain usable.
- Add/edit/check/archive actions remain available.
- Tap-based movement is preferred where implemented.

Desktop-only / browser-variable behavior:
- Native HTML drag-and-drop is more reliable on desktop.
- Touch browsers vary, so drag gestures should never be the only route to an
  important action.


======================================================================
11. MAINTENANCE RULES FOR FUTURE US
======================================================================

When modifying the PI:

1. Preserve storage compatibility unless intentionally writing a migration.
2. Prefer pi-* for every new saved-data key.
3. Do not reintroduce pigeonhole-* or brain-aquarium-* for new features.
4. Keep legacy mappings only as compatibility code until intentionally retired.
5. Keep all page filenames and navigation references consistent.
6. Upload shared HTML/CSS/JS changes together when one depends on another.
7. Before risky data/storage work, make a JSON backup.
8. Do not silently delete old user data during migrations.
9. Prefer copy → verify → switch → retain recovery over destructive renaming.
10. Test both desktop and mobile after layout changes.
11. Test both devices after CloudSync changes.
12. A visual redesign should not require a data migration unless the underlying
    information model truly changed.

The goal is boring infrastructure and interesting content.


======================================================================
12. SUPERSEDED README FILES
======================================================================

This README intentionally supersedes the scattered historical notes such as:

- README-ALMANAC-V1 / V2 / V3
- README-LONGFORM-V7 / V8 / V9
- README-V7-FINAL
- README-V8-REPAIR
- README-V9-AQUARIUM-POLISH
- README-V10-FINAL-POLISH
- README-V11-RADAR-FIX
- SAFE-SYNC-V2-INSTALL
- earlier general README files

Those documents were valuable during iterative development, but their current
useful information has been folded into this canonical file.

They do NOT need to be uploaded to GitHub with the current production PI.


======================================================================
13. CURRENT NORTH STAR
======================================================================

The Personal Intranet should make four promises:

1. INPUT IS EASY
   Capturing something should take less effort than holding it in working memory.

2. IMPORTANT THINGS HAVE VISUAL GRAVITY
   Focus Now and page-specific hierarchy should direct attention without making
   every stored item look urgent.

3. THINGS DO NOT DISAPPEAR
   Search, Recent, Archive, autosave, migration safety, cloud sync, and backups
   should make the system trustworthy.

4. EACH ROOM HAS A JOB
   The PI should feel like one coherent environment rather than several unrelated
   pages that happen to share CSS.

Once the intranet is given something, the user should not have to keep holding
it in RAM.
