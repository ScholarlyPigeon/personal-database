# Personal Intranet V29.3 · Right-Aligned Utilities and Inline Dropdowns

Built from V29.2. Only `Home.html`, `IntranetHome.css`, and `IntranetHome.js` were changed; the other application pages, themes, navigation, backup and cloud-sync files are carried over as-is.

## What's new

- **Top utility alignment:** Themes, Pages, and Tools now sit together directly before the Sync badge on the right edge of the centered Home page. The Sync badge remains the rightmost element. On phones the controls wrap into two right-aligned rows to prevent overflow.
- **Collapsible sections inside writing areas:** Click in **This Week** or **Today** to reveal the formatting bar, then use **▸ Dropdown**. A dropdown is inserted in the text area. Its title is selected immediately so you can rename it by typing. Press Enter from the title to focus its body. Type inside the dropdown body using the same rich-text toolbar as the rest of the editor. Click the arrow on the dropdown's left to collapse or reopen it.
- **Persistent dropdown state:** The title, rich-text body, open/closed state, and any checked task boxes are saved with the existing `pi-intranet-home-v1-week` and `pi-intranet-home-v1-today` keys, so cloud sync and JSON backup automatically include them.
- **Archive and restore:** When archiving a whole table, the dropdown markup and checkbox states are included and restored with the table contents. No data migration is necessary.
- **Theme-aware styling:** Dropdowns use the existing `--panel`, `--panel-light`, `--border`, `--text`, and `--teal` variables rather than hard-coded theme colors.

## Using your new dropdowns

1. Click inside **This Week** or **Today**.
2. In the inline formatting toolbar, click **▸ Dropdown**.
3. Type over the selected `Dropdown` title. Press **Enter** to start writing inside it.
4. Click the small caret at the beginning of its heading to hide or show its contents.

As with the existing checklists, dropdowns are inserted at the end of the currently active top-level writing block rather than transforming selected text. The outer dropdown is a noneditable container so its structure isn't accidentally destroyed by normal typing; the title and body are separately editable.

## Installation

1. Export a fresh JSON backup from the current intranet.
2. Unzip the package and upload its contents to your GitHub Pages site, replacing matching files.
3. Hard-refresh the page if your browser still shows the old JavaScript/CSS. The `Home.html` asset version strings have been updated.

## Tests performed

- Browser-rendered desktop and mobile views.
- Insertion, inline rename, content editing, opening/closing, independent autosaving, and reload persistence.
- Rich-text formatting, checkbox state persistence, and table archive/restore with nested dropdown content.
- Right-aligned responsive utility controls with no mobile horizontal overflow.

The locally simulated browser cannot complete a live cloud sync without the site's external service and login; verify cloud syncing once deployed.
