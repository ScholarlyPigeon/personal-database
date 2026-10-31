PERSONAL INTRANET · OCTOBER 31, 2026 · V17

Deploy: Upload/extract the contents of CURRENT to the same folder in GitHub as your existing site.
No cloud database configuration or manual JSON migration is required. Keep a fresh backup
before deploying and test in one browser/tab before opening the app on other devices.

CHANGES
- Home / On My Radar checkbox matches the other Home checklist circles.
- Home category headers use consistent typographic weight and visible hierarchy.
- Neopets panel headings emphasize the title, while add / pop-out / collapse controls remain quiet.
- Every page's Tools dropdown offers Search all pages, Download backup, and Archive all completed.
  The search uses existing internal indexing, expanded to find note details and nested checklist text.
- Old Select / Delete selected controls are hidden from Tools.
- Routine text entry prompts use "Write here…" in standard writing fields.
- A floating B I U formatting control while editing opens an opt-in format composer.
  The composer uses **bold**, *italic*, ++underline++, and ~~strike~~ notation inside
  existing plain-text storage strings. Some existing plain text views may still show
  literal notation rather than formatted text; this is a compatibility-first beta,
  not a complete rich-text renderer. This avoids changing the cloud schema.
- NEW V17: Nested category checklist Archive and Delete actions now both sit behind
  the row's ⋮ menu on Home, This Week, This Month, and Next Month.

SAFETY
- 'Archive all completed' only processes checked entries on supported pages; it
  previews a count and requires confirmation. It writes an archive record before
  removing the source entry. The page reloads to refresh native per-page caches.
- On pages that do not support completed checklists, the Tools action leaves data intact.
- Category notes themselves are not meant to be deleted by archive-all unless they
  have actually been marked completed in legacy data.
- Delete requires confirmation; Archive keeps the previously established confirmation.
- Browser search tests and syntax checks passed. Browser navigation to local files
  is restricted in this test environment, so please spot-check after deployment.
