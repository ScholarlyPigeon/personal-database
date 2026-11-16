# Personal Intranet V28.4 · Aquarium mobile scroll and icon presets

## Deploy

Export a fresh in-app JSON backup and upload the contents of `CURRENT/` to the GitHub Pages root, preserving `assets/`. Hard-refresh mobile browsers after publishing.

## Aquarium mobile scrolling

A new final stylesheet (`V28_4AquariumMobile.css`) overrides the legacy viewport locking inherited from the older Aquarium Folders page. On phones/touch tablets up to 1100 CSS pixels, the merged Aquarium has a single vertically scrolling document, allowing access to the entire writing panel and saved folder board. Desktop retains its original fixed-height, independently scrolling columns. The existing folder storage and note/sync keys are untouched.

## Folder presets

Across Aquarium and Alignment, the folder appearance picker now uses 🌲 instead of 🦋, 🏡 instead of 🐚, 📔 instead of 📚, and 🐈‍⬛ instead of ☘. Any folder already using a retired preset keeps its selected icon until changed. The custom icon field remains available.

## Page menu

The Calendars group now displays 📅, Timeline 📜, Archive 🗄️, and Neopets 💻. The shared navigation is used on all active pages, and their HTML fallback labels were updated.
