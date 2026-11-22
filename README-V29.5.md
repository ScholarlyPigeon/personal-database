# Personal Intranet V29.5 | Colored inline dropdowns and tables

Built directly on V29.4. Only The Intranet (Home) was changed.

## New
- Open **⋮** on any inline dropdown or editable table in **This Week** or **Today** to find a **Color** palette.
- Pick **Theme default**, Violet, Teal, Blue, Pink, Green, Gold, Coral or Ice blue. The whole widget (header, body and border or table cells) receives a coordinated tint.
- Every widget can have its *own* color. All named colors use the currently selected theme's CSS variables for contrast and consistency.
- Color choices remain with the widget across reordering, edits, browser refreshes, archive/restore and the existing cloud-sync data flow. No migration or new sync keys.
- Existing dropdowns and tables retain their default appearance until changed.

## Install
Before replacing files in your GitHub Pages repository, take your usual Tools → JSON backup.
Unzip the full site and replace matching files in your site root. Test one widget and a refresh after deployment.

## Files changed
`Home.html` (cache query), `IntranetHome.js` (validated per-widget color saved in sanitized editor HTML), `IntranetHome.css` (theme-native colored surfaces and compact swatches).
