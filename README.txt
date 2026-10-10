PERSONAL INTRANET | MONTHLY COUNT CLEANUP | OCTOBER 10, 2026

CHANGED
- Removed the redundant bottom "+N more" label and its reserved footer from monthly day tiles.
- Kept the compact total item count in the day heading.
- Kept click-to-expand, the full day pop-out, existing previews, and mobile count behavior.
- Did not change saved data, cloud sync, or any other page behavior.

INSTALL
1. Make a current JSON backup from Home.
2. Upload Month.html, Planner.js, and Planner.css to your GitHub Pages repository root, replacing only those three existing files.
3. Refresh This Month after deployment. A day with 3+ items should show its total at the top, no "+N more" footer, and the complete item list in its pop-out.

VERIFICATION
- JavaScript syntax checked and redundant footer-rendering code removed.
- No authenticated Supabase browser test was performed.
