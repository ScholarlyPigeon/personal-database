/* V26.4 | Repair menu positions for Aquarium Folders only.
   Existing menu markup, click handlers, color pickers and notes are retained. */
(() => {
  'use strict';
  if (!document.documentElement.classList.contains('aquarium-folders-page')) return;

  const menus = [
    'details.aq-folder-options', 'details.pi-cross-menu',
    'details.pi-v23-actions-menu', 'details.pi-color-panel-menu',
    'details.pi-ws-menu', 'details.pi-v25-standard-menu',
    'details.pi-personal-aq-menu'
  ].join(',');
  const panels = [
    '.aq-folder-options-panel', '.pi-cross-panel',
    '.pi-v23-actions-panel', '.pi-color-panel-tray',
    '.pi-ws-menu-panel', '.pi-item-tools-panel',
    '.pi-v25-menu-panel'
  ].join(',');
  let queued = false;

  function placeAll() {
    queued = false;
    document.querySelectorAll(menus).forEach(menu => {
      if (!menu.open) return;
      const anchor = menu.querySelector(':scope > summary');
      const panel = [...menu.children].find(child =>
        child.matches?.(panels) && child.matches(':popover-open'));
      if (!anchor || !panel || !anchor.isConnected) return;
      const a = anchor.getBoundingClientRect();
      // If an opened menu's tile has been recycled during a render, its
      // anchor no longer belongs to the viewport; close rather than float it.
      if (a.width <= 0 || a.height <= 0 || a.bottom < 0 || a.top > innerHeight) {
        menu.open = false;
        return;
      }
      const rect = panel.getBoundingClientRect();
      const width = Math.min(rect.width || panel.offsetWidth || 230, innerWidth - 16);
      const height = Math.min(rect.height || panel.offsetHeight || 250, innerHeight - 16);
      const left = Math.max(8, Math.min(innerWidth - width - 8, a.right - width));
      const below = a.bottom + 5;
      const above = a.top - height - 5;
      const top = below + height <= innerHeight - 8
        ? below : above >= 8 ? above : Math.max(8, Math.min(below, innerHeight - height - 8));
      panel.style.setProperty('position', 'fixed', 'important');
      panel.style.setProperty('inset', 'auto', 'important');
      panel.style.setProperty('left', left + 'px', 'important');
      panel.style.setProperty('top', top + 'px', 'important');
      panel.style.setProperty('right', 'auto', 'important');
      panel.style.setProperty('bottom', 'auto', 'important');
      panel.style.setProperty('margin', '0', 'important');
    });
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(placeAll);
  }
  function afterOpen() {
    schedule();
    // The shared script promotes some panels to top-layer popovers inside
    // the details toggle handler. Check once more after that promotion.
    requestAnimationFrame(schedule);
  }
  function start() {
    document.addEventListener('toggle', event => {
      if (event.target.matches?.(menus) || event.target.matches?.(panels)) afterOpen();
    }, true);
    document.addEventListener('pointerup', afterOpen, true);
    document.addEventListener('click', afterOpen, true);
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule, {passive:true});
    // A note pop-out is rebuilt when its contents change. Ensure the older
    // Move to selector cannot reappear underneath the new note cards.
    const noteList = document.getElementById('aqFolderDialogNotes');
    if (noteList) {
      const clean = () => noteList.querySelectorAll('.aq-folder-note-move-row')
        .forEach(row => row.remove());
      clean();
      new MutationObserver(clean).observe(noteList, {childList:true,subtree:true});
    }
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
