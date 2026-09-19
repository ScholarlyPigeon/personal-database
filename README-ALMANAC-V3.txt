PERSONAL ALMANAC V3 — six-tile focus board
September 18, 2026

WHAT CHANGED
- Reduced Almanac to six core tiles: Meals, Dailies, Things I Like, Restock, Wish List, Strain Journal.
- Removed the Quotes & Understandings tile from the interface. Existing quotes data remains preserved inside pigeonhole-almanac-v1 rather than being deleted.
- All six section headers are editable and sync through pigeonhole-almanac-section-title-* keys.
- Almanac tile colors now use the same accent family as Brain Aquarium, including the richer Fall 2 jewel palette.
- Adaptive focus layout on desktop:
  * 3+ open tiles = normal equal 3-column board
  * 2 open tiles = collapsed headers stack in a left rail; each open tile gets a full remaining column
  * 1 open tile = collapsed headers stack in a left rail; the open tile spans both remaining columns
  * Focus tiles max out around the height of two normal stacked tiles.
- Meals now use a note-style composer: title + rich-text body + optional recipe/reference link + Add Meal.
- Saved Meals collapse to their title and retain editable rich text + editable/openable link when expanded.
- Existing Almanac archive routing, tile movement, and Safe Sync behavior remain intact.

CACHE VERSION
20260918f
