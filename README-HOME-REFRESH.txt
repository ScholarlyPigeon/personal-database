PERSONAL INTRANET | HOME + SAVED NOTES REFRESH | OCTOBER 17, 2026

WHAT'S NEW

HOME (Database.html)
- Notes can be added either as a checklist line or an expandable category note.
- Category notes have the same compact heading-row style as checklist lines,
  with an optional body, image URL, and clickable link.
- New entries are dated automatically, and dates can be edited discreetly in
  each row. Older items without a recorded date remain undated until you set one.
- Home Notes, On My Radar, Near My Radar, and all 28 calendar-day lists retain
  cross-table drag-and-drop movement on desktop and dropdown-based moves on
  mobile. Each item has a compact three-dot menu for Move / Archive / Delete.
- Items can move into Focus Now from all Home lists. Focus Now is no longer a
  separate place to type. Its entries can be moved back to any Home list or
  calendar day, archived, or deleted. Expanded category note details and media
  stay with the item and are viewable in Focus Now.
- The 28-day rail remains on the right on desktop, with the existing mobile
  horizontal-scrolling treatment. The Home Notes safety mechanism is retained.

COMPASS / TIMELINE & NOTES / LONGFORM
- Saved note metadata and editable dates are arranged in slimmer headers.
- Drag section/note handles on desktop to order or move them.
- On touch/mobile, tap a move handle on a note or section, then tap the
  destination note/section. No directional up/down buttons clutter headers.
- Longform saved note titles appear inside their compact metadata header.

PANEL POPOUTS
- Each major Home table, including Focus Now, Notes, Radar, the 28-day rail,
  and individual day cards, has a small expand/popup button.
- Similar live-table popouts are added across other pages where their panel
  structure supports it (Compass, Timeline & Notes, Longform, Almanac,
  Aquarium, Neopets, Week/Month calendar areas and Archive).
- Popouts reuse the actual live table (no duplicate copy of unsaved text),
  and can be closed by clicking the icon, backdrop or pressing Esc.

DEPLOY TO GITHUB PAGES
1. On your CURRENT live Home page, download a fresh full JSON backup first.
2. Unzip this entire package. Replace matching files in the ROOT of the
   GitHub Pages repository. Do not upload a folder containing the files.
3. Include both NEW files: Refresh.js and Refresh.css. The new stylesheet
   and script are referenced by the updated HTML pages.
4. Wait until GitHub finishes deploying, then hard-refresh/reopen your tabs
   on laptop and mobile after the deployment is complete.
5. Test one new checklist item, one category note, a note moved to Focus Now
   and then back, archiving from Focus, a day move, Compass and Longform
   ordering, and a couple of popouts before trusting the new build fully.

SAFETY NOTES
- This is a COMPLETE STATIC SITE package, not a JSON data backup.
  Your personal data is NOT included inside it.
- Existing localStorage/cloud-sync keys and CloudSync.js are unchanged.
- The specific Home Notes pre-change snapshot and stale-data checks from the
  previous safety release remain in place.
- Moving from one table to another preserves the item's saved content.
- No real live Supabase login, cross-device syncing or GitHub deployment was
  available for automated tests. Please verify with your actual laptop/phone.
- Offline Chromium testing was run against simulated browser storage with
  legacy notes, Longform saved titles/sections, Home cross-table movements,
  Focus Now and archive actions, popouts, and mobile layout at 390px.

FILES
The original 21 site files, plus Refresh.css, Refresh.js and this README.
