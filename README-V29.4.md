# Personal Intranet V29.4 — Inline Tables & Movable Dropdowns

Built on V29.3. No data migration or storage-key changes.

## On The Intranet (Home.html)
- The rich text formatting toolbar for **This Week** and **Today** stays on one horizontal line. It fits on typical desktop panels; on narrow screens swipe horizontally along the toolbar to reach every tool.
- The **▸ Fold** toolbar button still inserts editable dropdowns. Each dropdown now has a small **⋮** menu with **Move up**, **Move down**, and **Delete**.
- The new **▦ Table** toolbar button inserts a 2-column by 2-row editable table. Click any cell to type. Its **⋮** menu has **Move up**, **Move down**, **Add row**, **Add column**, **Remove row**, **Remove column**, and **Delete**. Row and column removal always target the last row/column and ask for confirmation.
- Move up/down reorders items within the same **This Week** or **Today** writing area. It does not move an item between the two writing areas.
- Deleting a dropdown or table asks for confirmation and removes that item and its contents. Use your full backup if you might need to recover deleted material.
- Dropdowns and tables are saved as part of the existing corresponding rich text content. Their individual editing menus are regenerated after reloading or restoring. Existing colors, themes, marquee, page navigation, Archive and cloud storage remain unchanged.

## Install
1. In the current site, use **Tools → backup** to save a JSON backup.
2. Unzip this complete site distribution and upload the contents over your current GitHub Pages site, replacing matching files.
3. Refresh the deployed page and test a sample dropdown/table before using the updated page extensively.

## Changes to source
- `Home.html`: cache-busting for V29.4 CSS/JS.
- `IntranetHome.css`: single-row formatting tools, inline widget action menus and table styling.
- `IntranetHome.js`: saved HTML allow-list extended to tables; inline widget creation, editing, moving and deletion.

## Tests
Browser-interaction tests (in an isolated DOM with mocked localStorage) covered dropdown insert/move/delete, table insert/edit/resize/delete, reload persistence, sanitized storage content, and toolbar dimensions at desktop/mobile widths. Live GitHub Pages deployment, cloud sync and every theme permutation have not been directly tested.
