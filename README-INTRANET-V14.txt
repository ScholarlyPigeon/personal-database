PERSONAL INTRANET • V14 • 2026-10-26

Changes since v13:
• This Month and Next Month: Sunday–Saturday weekly columns. This Week retains its rolling weekly dashboard structure.
• Created/completed dates: New completion timestamps are saved on supported checklist item records when checked, removed when unchecked, and surfaced beside completed items / in Archive. Dates were not fabricated for already-completed legacy items. Older records will show the creation date where it is available. The Archive date is separate from the actual completion date.
• Enter submits in new-entry composers (including Home and monthly/weekly day popouts, Aquarium and Longform); Shift+Enter inserts a new line. Existing editable note content and title editing controls retain their own editing behavior.
• Category-header typography: Long titles are allowed to wrap while leaving click space for expanding/collapsing. Aquarium Brain Dump header flex sizing improved on desktop and mobile.
• Radar reorder now has a saved intra-list reorder operation. Desktop dragging and coarse-pointer tap-to-select/tap-target behaviors are supported for Home nested item moves.
• Home day categories now participate in cross-category and standalone transfers, preserving each item's existing ID, text, checkbox state, dates and nesting data. Week/Month day popouts also accept nested drag-out to day or between categories in the current visible page.
• Category checklist items now offer an Archive action from a small three-dot menu, matching standalone note organization.
• Data/cloud key names have not been changed.

INSTALL
1. Download a fresh personal JSON backup before changing GitHub files.
2. Extract the FULL package into the same website publishing directory, replacing existing filenames (and adding the two new V14 files).
3. Wait until GitHub Pages deployment completes. Confirm the page source contains IntranetRefinementV14.js?v=20261026-v14.
4. Verify your notes and cloud syncing from one browser session before opening multiple tabs.

TESTING NOTES
Static syntax checks passed for all JavaScript files.
Local in-memory browser checks verified Sunday-first monthly calendar labels, Radar reorder persistence, Home Notes → day category transfer, nested three-dot controls, and Enter-to-save on Home.
The browser test could not load the live Supabase script or navigate to localhost and a simulated native drag action timed out; test desktop drag gestures, mobile touch moves, and live multi-device syncing after publishing. The live cloud service was not accessed.
