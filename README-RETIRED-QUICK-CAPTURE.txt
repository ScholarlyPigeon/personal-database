RETIRED FEATURE: UNIVERSAL QUICK CAPTURE + INBOX
October 24, 2026 (Home v6)

Why: the universal fixed-bottom quick-capture dock and header Inbox shortcut were not being used and occupied valuable navigation/content space.

What was retired
- The fixed bottom capture dock (catch/find buttons and textarea) on all pages.
- Header Inbox buttons across the intranet and quick-capture popup entrypoints.
- Dock-only reserved vertical space.

What was intentionally preserved
- Existing saved Inbox entries at localStorage/cloud key: pi-capture-inbox-v1. No entries were deleted or moved.
- Universal capture/Inbox implementation in Script.js (injectDock now returns without inserting the UI).
- The Aquarium page's distinct Brain Dump Inbox, categories, notes and their normal composer. These are not the retired universal-capture system.
- Global search implementation and other tool code, for potential future UI reintroduction.

To restore in a future release
1. Re-enable injectDock() in Script.js by removing the early return.
2. Restore the header [data-pi-open-inbox] shortcuts (or another deliberate entrypoint).
3. Remove the V6 display:none rules and reconsider --pi-dock-space before enabling the fixed dock.
4. Test on desktop/mobile and cloud sync, including previously saved Inbox notes.

Do not delete pi-capture-inbox-v1. It may hold unprocessed thoughts.
