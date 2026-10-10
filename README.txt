PERSONAL INTRANET | WEEK + MONTH CALENDAR EDIT FIX | OCTOBER 10, 2026

WHAT CHANGED
- Week and Month share Planner.js; editing an entry keeps its Save / Cancel actions visible while typing, clicking inside the textbox, or moving the cursor.
- Opening/closing ordinary item option menus still works. The item editor is not accidentally dismissed by clicks outside its option strip.
- Both Week.html and Month.html load a cache-busted Planner.js and Planner.css so GitHub Pages does not reuse the old files.
- No Aquarium, Database, Longform, or cloud sync files changed. No pi-* storage keys changed.

INSTALL
1. Make a fresh JSON backup from Database before changing site files.
2. Upload the FOUR files in this ZIP directly to the repository root, replacing the existing matching filenames:
   Week.html, Month.html, Planner.js, Planner.css
3. Reload This Week and This Month (hard refresh if needed).
4. Edit an existing item, click inside its text field, make a change, and click Save. Reopen to confirm the text is retained. Also try Cancel.

VERIFICATION
- JavaScript syntax checked.
- Chromium DOM tests passed with local mock storage for both Week and Month: issue reproduced before fixing, then textarea focus, typing, Save, and Cancel checked after. Not a live Supabase sync test.
