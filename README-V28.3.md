# Personal Intranet V28.3 · Aquarium keyboard + folder appearance

## Deploy
Export a fresh in-app JSON backup first. Upload the **contents of `CURRENT/`** to the GitHub Pages repository root, including the two new `FolderAppearance.*` files. Preserve `assets/`. Close other intranet tabs during deployment and hard-refresh after uploading.

## Aquarium writing: Enter corrected
The old sitewide Enter-to-save shortcut was catching Enter in the new Longform-style Aquarium editor. `Features.js` now excludes only the merged Aquarium's rich-text writing area and title field from that legacy shortcut. In Aquarium, **Enter inserts a line** in the editor, **Ctrl/Cmd + Enter saves**, and the Save Thought button continues to work. Enter in the title moves focus to the writing area. Other pages retain their former shortcuts.

## Folder symbols and colors
Every *active* folder table, in **Aquarium** and **Alignment**, now offers **Icon & color…** from the folder's own `⋮` menu. Choose a preset symbol or enter any emoji/text symbol; choose a preset icon color, use the native custom color picker, or select Theme default. Color affects monochrome symbols directly and produces a subtle color halo for native full-color emoji. The folder pop-out in Aquarium also shows the selected symbol.

Appearance is stored as optional `icon` and `iconColor` properties **within the existing folder objects** in the existing synced keys (`pi-aquarium-state-v3`, `pi-compass-v1`). Existing folder IDs, names, descriptions, background tints, card destinations, and notes are left untouched. The previous folder background palettes continue to work separately.

## Checks
All modified JS and new JS passed `node --check`; the new CSS and the HTML imports were checked. An isolated browser harness confirmed that plain Enter inserts a paragraph into the rich Aquarium editor. The harness cannot reliably navigate the full local site here; verify Ctrl/Cmd+Enter and saving an icon change on your deployed site, as well as syncing to another device.
