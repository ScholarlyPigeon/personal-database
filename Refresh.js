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
    // Browser top layer keeps the live panel above its backdrop even when
    // page themes introduce transformed/isolated stacking contexts.
    try { if (panel.matches(':popover-open')) panel.hidePopover(); } catch {}
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
    if (typeof panel.showPopover === 'function') {
      panel.setAttribute('popover', 'manual');
      panel.showPopover();
    } else {
      // Older browsers: keep panel's own stacking context above the backdrop.
      backdrop.style.zIndex = '1500';
    }
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

  // One movement affordance on desktop: drag any Home line into Focus,
  // or drag a Focus card into Notes, Radar, or a dated list.
  // The transfer APIs live in Script.js and preserve the existing safeguards.
  document.addEventListener('dragstart', event => {
    const source = event.target.closest?.('.database-page .check-drag, .database-page .pi-focus-drag');
    if (!source || !event.dataTransfer) return;
    const focusRow = source.closest('.pi-focus-item');
    if (focusRow?.dataset.focusId) {
      event.dataTransfer.setData('application/x-pi-focus', focusRow.dataset.focusId);
      event.dataTransfer.effectAllowed = 'move';
      return;
    }
    const itemRow = source.closest('.checklist-item');
    const list = itemRow?.closest('.checklist-list, .day-list');
    if (!itemRow?.dataset.itemId || !list?.dataset.storageKey) return;
    event.dataTransfer.setData('application/x-pi-home', JSON.stringify({
      sourceKey: list.dataset.storageKey, itemId: itemRow.dataset.itemId
    }));
    event.dataTransfer.effectAllowed = 'move';
  }, true);
  document.addEventListener('dragover', event => {
    const target = event.target.closest?.('.database-page .pi-focus-panel, .database-page .checklist-list, .database-page .day-list');
    if (!target) return;
    const transfer = event.dataTransfer?.types;
    const accept = target.closest('.pi-focus-panel')
      ? transfer?.includes('application/x-pi-home')
      : transfer?.includes('application/x-pi-focus');
    if (!accept) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    target.classList.add('pi-focus-drop-target');
  }, true);
  document.addEventListener('dragleave', event => {
    if (!event.target.closest?.('.pi-focus-drop-target')) return;
    if (!event.currentTarget.contains(event.relatedTarget)) {
      document.querySelectorAll('.pi-focus-drop-target').forEach(el => el.classList.remove('pi-focus-drop-target'));
    }
  }, true);
  document.addEventListener('drop', event => {
    const focus = event.target.closest?.('.database-page .pi-focus-panel');
    const list = event.target.closest?.('.database-page .checklist-list, .database-page .day-list');
    if (!focus && !list) return;
    if (focus && event.dataTransfer?.types?.includes('application/x-pi-home')) {
      event.preventDefault(); event.stopImmediatePropagation();
      try {
        const {sourceKey,itemId} = JSON.parse(event.dataTransfer.getData('application/x-pi-home'));
        if (!window.PIHomeMoveToFocus?.(sourceKey,itemId)) alert('Move not completed. The original item was kept.');
      } catch { alert('Could not complete that move. Your original item was kept.'); }
    } else if (list?.dataset.storageKey && event.dataTransfer?.types?.includes('application/x-pi-focus')) {
      event.preventDefault(); event.stopImmediatePropagation();
      const focusId = event.dataTransfer.getData('application/x-pi-focus');
      if (!window.PIHomeMoveFromFocus?.(focusId,list.dataset.storageKey)) alert('Move not completed. The item remains in Focus.');
    }
    document.querySelectorAll('.pi-focus-drop-target').forEach(el => el.classList.remove('pi-focus-drop-target'));
  }, true);
  document.addEventListener('dragend', () => {
    document.querySelectorAll('.pi-focus-drop-target').forEach(el => el.classList.remove('pi-focus-drop-target'));
  }, true);

  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; install(); });
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
