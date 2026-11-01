October 24, 2026 — Home grid repair (v4)

This builds on the FULL_v3 release.

Replace the following three files in your GitHub repository root:
- Database.html (cache-busting query strings)
- HomeTuning.css (desktop grid's panels now stretch to the shared row and retain their internal scroll)
- Script.js (On My Radar now displays just the date, without "Added")

The data model, all note keys, and CloudSync.js are unchanged.

IMPORTANT: Back up your current JSON before publishing. Close other tabs and reopen after publishing.

Browser layout inspection: compared the previous layout and the repair at 1480x860 and 1480x2400, with many example category notes; the previous layout overflowed, and the repaired columns stay aligned. Also inspected a 390px mobile width.
