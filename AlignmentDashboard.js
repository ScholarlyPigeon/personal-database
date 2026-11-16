/* V27.2: Page-local Alignment panel controls and responsive multi-row folder shelves.
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
    // A shelf stays exactly three cards wide (two on narrow phones). The
    // available HEIGHT determines how many equal-size rows can fit. Each
    // additional group of folders continues to the right, not down the page.
    const SHELF_CARD_HEIGHT = 140;
    const SHELF_GAP = 9;
    const shelfRails = ['piCompassGoalsShelf', 'piCompassMindsetShelf']
      .map(id => document.getElementById(id)).filter(Boolean);
    let shelfUpdateQueued = false;
    function sizeShelf(rail) {
      if (!rail.clientHeight) return; // Collapsed/hidden; measure when reopened.
      const style = getComputedStyle(rail);
      const pad = (parseFloat(style.paddingTop) || 0) +
        (parseFloat(style.paddingBottom) || 0);
      const usableHeight = Math.max(0, rail.clientHeight - pad);
      const rows = Math.max(1, Math.floor((usableHeight + SHELF_GAP) /
        (SHELF_CARD_HEIGHT + SHELF_GAP)));
      const cols = matchMedia('(max-width: 670px)').matches ? 2 : 3;
      rail.style.setProperty('--pi-shelf-visible-rows', String(rows));
      // Explicit visual placement keeps reading order LEFT -> RIGHT, then down,
      // then across horizontally to the next group, even with multiple rows.
      // No reparenting/reordering: existing drag/drop and folder IDs are safe.
      const cards = rail.querySelectorAll(':scope > .pi-alignment-folder');
      cards.forEach((card, i) => {
        const page = Math.floor(i / (cols * rows));
        card.style.gridColumn = String(page * cols + (i % cols) + 1);
        card.style.gridRow = String(Math.floor(i / cols) % rows + 1);
      });
    }
    function queueShelfSizing() {
      if (shelfUpdateQueued) return;
      shelfUpdateQueued = true;
      requestAnimationFrame(() => {
        shelfUpdateQueued = false;
        shelfRails.forEach(sizeShelf);
      });
    }
    if (typeof ResizeObserver !== 'undefined') {
      const resize = new ResizeObserver(queueShelfSizing);
      shelfRails.forEach(rail => resize.observe(rail));
    }
    if (typeof MutationObserver !== 'undefined') {
      const mutations = new MutationObserver(queueShelfSizing);
      shelfRails.forEach(rail => mutations.observe(rail, {childList:true}));
    }
    window.addEventListener('resize', queueShelfSizing, {passive:true});
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
      queueShelfSizing();
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
