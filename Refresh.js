/* Universal live panel popouts, no localStorage keys or cloned form state. */
(() => {
  'use strict';
  const selector = [
    '.database-page .checklist-panel', '.database-page .database-notes-panel',
    '.database-page .right-date-rail', '.database-page .day-card',
    '.database-page .pi-focus-panel',
    '.pi-workspace-panel', '.pi-notes-section', '.pi-archive-column',
    '.longform-library', '.longform-composer', '.longform-saved-section',
    '.planner-notes', '.planner-calendar', '.aq-panel', '.aq-category-zone',
    '.neo-card'
  ].join(',');
  const headers = '.panel-header, .date-rail-header, .day-card-top, .pi-workspace-head, .pi-notes-section-head, .planner-heading, .longform-library-head, .longform-composer-head, .longform-saved-section-head, .aq-panel-head, .aq-category-head, .neo-panel-heading, .neo-dailies-head, .pi-focus-head';
  let opened = null;
  let backdrop = null;
  const close = () => {
    if (!opened) return;
    const panel = opened;
    opened = null;
    panel.classList.remove('pi-panel-popout');
    panel.querySelector(':scope > .panel-header > .pi-popout-button, :scope > .pi-workspace-head > .pi-popout-button, :scope > .day-card-top > .pi-popout-button, :scope > .pi-notes-section-head > .pi-popout-button, :scope > .longform-saved-section-head > .pi-popout-button')?.setAttribute('aria-label','Pop out this panel');
    backdrop?.remove(); backdrop = null;
    document.body.classList.remove('pi-popout-open');
  };
  const toggle = (panel, control) => {
    if (opened === panel) { close(); return; }
    close();
    opened = panel;
    backdrop = document.createElement('div');
    backdrop.className = 'pi-popout-backdrop';
    backdrop.addEventListener('click', close);
    document.body.append(backdrop);
    panel.classList.add('pi-panel-popout');
    document.body.classList.add('pi-popout-open');
    control.setAttribute('aria-label', 'Close expanded panel');
    control.title = 'Close expanded panel (Esc)';
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && opened && !document.querySelector('dialog[open]')) {
      event.preventDefault(); close();
    }
  });
  const install = () => {
    document.querySelectorAll(selector).forEach(panel => {
      const header = [...panel.children].find(child => child.matches?.(headers))
        || panel.querySelector(':scope > .pi-workspace-head, :scope > .panel-header, :scope > .day-card-top');
      if (!header || header.querySelector(':scope > .pi-popout-button')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pi-popout-button';
      button.textContent = '⤢';
      button.title = 'Expand this table';
      button.setAttribute('aria-label','Pop out this panel');
      button.addEventListener('click', event => { event.stopPropagation(); toggle(panel,button); });
      header.append(button);
    });
    if (opened && !opened.isConnected) close();
  };
  install();
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; install(); });
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
