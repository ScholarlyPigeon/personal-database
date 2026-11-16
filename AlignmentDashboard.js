/* V27.1: Page-local Alignment panel collapse controls and responsive allocation.
   Layout state is local UI preference; it never changes cloud-synced notes/folders. */
(() => {
  'use strict';
  const KEY = 'pi-alignment-layout-v27-1';
  const KEYS = ['goals','mindset','grounding','writing','insights'];
  function init() {
    const board = document.querySelector('.pi-alignment-board');
    if (!board) return;
    const panels = Object.fromEntries(KEYS.map(key => [key, document.querySelector(`[data-alignment-panel="${key}"]`)]));
    if (KEYS.some(key => !panels[key])) return;
    let saved = {};
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (value && typeof value === 'object' && !Array.isArray(value)) saved = value;
    } catch(_) { /* Storage may be disabled: collapse still works for this session. */ }
    const closed = Object.fromEntries(KEYS.map(key => [key, saved[key] === true]));
    function refresh() {
      for (const key of KEYS) {
        const panel = panels[key];
        const isClosed = closed[key];
        panel.classList.toggle('is-table-collapsed', isClosed);
        const control = panel.querySelector(`[data-toggle-panel="${key}"]`);
        if (control) {
          control.textContent = isClosed ? '▸' : '▾';
          control.setAttribute('aria-expanded', String(!isClosed));
          control.setAttribute('aria-label', `${isClosed ? 'Expand' : 'Collapse'} ${key === 'insights' ? 'Insight & Reflections' : key} table`);
          control.title = `${isClosed ? 'Expand' : 'Collapse'} panel`;
        }
      }
      board.dataset.topAllCollapsed = String(closed.goals && closed.mindset);
      board.dataset.bottomCollapsed = String(['grounding','writing','insights'].filter(key => closed[key]).length);
      // Collapsed table content is hidden visually and from the accessibility tree
      // by CSS display:none; never remove the content or mutate its saved data.
    }
    function setClosed(key, next) {
      closed[key] = next;
      // A fullscreen writing editor can't remain open behind a collapsed table.
      if (key === 'writing' && next) {
        const writing = panels.writing;
        if (writing.classList.contains('is-writing-expanded')) {
          const expand = document.getElementById('piWritingExpand');
          if (expand) expand.click();
        }
      }
      refresh();
      try { localStorage.setItem(KEY, JSON.stringify(closed)); } catch (_) {}
    }
    for (const key of KEYS) {
      const toggle = panels[key].querySelector(`[data-toggle-panel="${key}"]`);
      toggle?.addEventListener('click', () => setClosed(key, !closed[key]));
    }
    const expandWriting = document.getElementById('piWritingExpand');
    expandWriting?.addEventListener('click', () => {
      // The original writing pop-out event handler is kept intact.
      // Uncollapse the parent if the user opens it directly from the header.
      if (closed.writing) setClosed('writing', false);
    }, true);
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
