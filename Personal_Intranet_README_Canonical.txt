OCTOBER 4, 2026 — THIS WEEK + THIS MONTH

INSTALL
1. Download your usual JSON backup from your current intranet.
2. Extract Personal-Intranet-Week-Month.zip.
3. Upload all files inside it to the ROOT of your existing GitHub Pages repository,
   replacing the matching files. Keep the exact filenames in this package.
4. Refresh after GitHub Pages publishes. Open This Week / This Month in pages,
   or use the new Home links. Shared files have a fresh cache version.

NEW FILES
Week.html, Month.html, Planner.js, Planner.css.
The ZIP also contains all existing pages and shared files so installation is one pass.
No Supabase setup changes. CloudSync.js is unchanged.

THIS WEEK
Eight equal-sized day cards: TODAY and the next seven days (a rolling window).
Day items share pi-calendar-day-YYYY-MM-DD with Database and This Month.
Right-side notes: large bottom composer; newest saved notes at the top.
Optional checklist items, editing, check/uncheck, drag reorder, and move-up/down.
Weekly notes persist as the eight-day window advances, until you remove them.

THIS MONTH
Current calendar month, with Monday-first calendar columns.
Today/future days share editable entries with Database. Past days show retained
Day Archive items read-only. Click a date for a larger day panel.
Month-specific notes and unfinished note drafts are preserved.
At month change, the current month updates while a dashboard is open (within
30 seconds, or when the tab becomes visible). When closed, updates happen on
next opening. Historical months with saved data appear in Archives > Month Archive.
Completed months include their days, notes, and unfinished month-note draft.
An archived month can be opened as a read-only calendar.

MOBILE
Week: two columns of equal day cards. Notes below; Calendar/Notes jump links.
Month: compact seven-column calendar; tap a date to open a roomy day editor.
Notes below; touch controls support reordering without dragging.
The composer retains multiline writing; use the visible save buttons.

SHARED FEATURES
All existing themes, tools menu, backup, universal capture, and Find.
Week/month notes are included in Find and in the existing pi-* backup/sync rules.
New data uses pi-planner-* keys. No new sync protocol or data migration is needed.

VALIDATION
Browser checks: day saved in Week appears in Database; notes save/reorder;
8-day range; current-month date count; 390px phone layouts without horizontal
overflow; desktop and Clarity Dark previews; mobile date editor saves correctly.
Simulated Oct 31 -> Nov 1: calendar advances; October calendar entry, saved note,
and unfinished note draft preserved; no duplicate snapshot after reload;
Archive dialog and archived-calendar link work; historical controls read-only.
Live authenticated Supabase synchronization was not exercised in the isolated preview.

--- PREVIOUS RELEASE DOCUMENTATION ---

SEPTEMBER 29, 2026 — MOBILE + CLARITY UPDATE

Included changes
- Removed page/header subtext and compacted phone navigation.
- Moved the editable Links strip from Database to Aquarium, using the same saved links.
- Database on phones: Focus Now, calendar, Radar/Near Radar, then Notes.
- Enlarged the Home text composer.
- Aquarium: + section, editable section names, and remove section. Removing a section
  moves its categories into the first remaining section and keeps all cards.
  At least one section remains. Custom sections persist on reload.
- Almanac: add named Checklist or Notes tiles; change a custom tile's type; edit
  entries; remove/restore tiles without losing their saved contents.
  Existing specialist Meals and Strain Journal tiles keep their original features.
- Almanac open tiles expand as others collapse on desktop. Mobile stays stacked.
- Clarity · Dark and Clarity · Light: solid surfaces, clear borders, larger writing
  text, system sans-serif font, and no gradients. Choose in the theme menu in tools.

INSTALL
1. Download your usual JSON backup from the current intranet.
2. Extract this ZIP and replace the files in the ROOT of the existing GitHub Pages
   repository. Keep the filenames exactly as packaged.
3. Refresh the page after publication. If an old layout persists, close/reopen it
   or hard-refresh on desktop. Shared asset URLs have a fresh cache version.

No Supabase changes are needed. CloudSync.js is byte-for-byte unchanged.
Existing storage keys are retained. New Almanac tile data uses pi-almanac-tiles-v1,
which is covered by the existing pi-* backup and cloud-sync rules.

VALIDATION
All seven pages checked at 390px for horizontal overflow; desktop previews checked.
Tested Aquarium sections across reload, section removal with category preservation,
link saving after the move, custom Almanac items across reload, tile removal/restore,
and adaptive Almanac sizing. Both new themes visually inspected.
Live authenticated cloud sync was not exercised in the isolated local preview.


--- PREVIOUS RELEASE DOCUMENTATION ---

PERSONAL INTRANET — CANONICAL README
Current production version: September 27, 2026
Status: GitHub Pages / Supabase production-ready

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
- Legacy browser data is preserved in a recovery snapshot during migration.
- Recovery snapshot key:
      personal-intranet-legacy-recovery-v1
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
