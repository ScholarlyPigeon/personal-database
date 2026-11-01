/* Ensure popping out a collapsed Home panel opens its full contents. */
(() => {
  document.addEventListener('click', event => {
    const trigger = event.target?.closest?.('.database-page .pi-popout-button');
    if (!trigger) return;
    const panel = trigger.closest('.home-upcoming-panel, .database-notes-panel, #piDatabaseFocus');
    if (!panel || panel.classList.contains('pi-panel-popout')) return;
    if (panel.classList.contains('is-collapsed') || panel.classList.contains('pi-focus-collapsed')) {
      panel.querySelector('.panel-collapse-toggle, .pi-focus-collapse')?.click();
    }
  }, true);
})();
