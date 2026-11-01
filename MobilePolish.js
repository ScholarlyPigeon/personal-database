/* October 10, 2026: UI-only mobile polish.
   No cloud, note, archive, or calendar storage formats are modified. */
(() => {
  'use strict';
  const mobile = () => window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;

  function setupLinks() {
    const strip = document.querySelector('html.aquarium-page .aq-page > .link-strip');
    if (!strip || strip.querySelector('.pi-links-toggle')) return;
    const label = strip.querySelector('.link-strip-label');
    const list = strip.querySelector('#linksContainer');
    if (!label || !list) return;
    const key = 'pi-aquarium-mobile-links-collapsed-v1';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'pi-links-toggle';
    toggle.setAttribute('aria-label', 'Expand Aquarium links');
    toggle.setAttribute('aria-controls', 'linksContainer');
    label.insertAdjacentElement('afterend', toggle);
    let collapsed = true;
    try { collapsed = localStorage.getItem(key) !== 'false'; } catch {}
    function render() {
      const closed = mobile() && collapsed;
      strip.classList.toggle('pi-links-collapsed', closed);
      toggle.textContent = closed ? '▸' : '▾';
      toggle.setAttribute('aria-expanded', String(!closed));
      toggle.setAttribute('aria-label', closed ? 'Expand Aquarium links' : 'Collapse Aquarium links');
      toggle.title = closed ? 'Show links' : 'Hide links';
    }
    toggle.addEventListener('click', () => {
      collapsed = !collapsed;
      try { localStorage.setItem(key, String(collapsed)); } catch {}
      render();
    });
    window.addEventListener('resize', render, { passive: true });
    render();
  }

  // Keep each native Details dropdown, but position its panel in the viewport,
  // so headers near the right edge never hide half the destinations.
  function setupMenus() {
    const menus = [...document.querySelectorAll('header .ecosystem-menu')];
    function place(menu) {
      if (!mobile() || !menu.open) return;
      const panel = menu.querySelector(':scope > .ecosystem-menu-popover, :scope > .pi-tools-popover');
      if (!panel) return;
      const trigger = menu.querySelector(':scope > summary');
      if (!trigger) return;
      const r = trigger.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const gap = 8;
      const width = Math.min(302, vw - gap * 2);
      const left = Math.max(gap, Math.min(r.left, vw - width - gap));
      const maxHeight = Math.min(Math.floor(vh * .62), 470);
      const below = vh - r.bottom - gap * 2;
      const above = r.top - gap * 2;
      const openAbove = below < 200 && above > below;
      const available = Math.max(125, openAbove ? above : below);
      const height = Math.min(maxHeight, available);
      const top = openAbove ? Math.max(gap, r.top - height - gap) : Math.min(r.bottom + gap, vh - height - gap);
      panel.style.setProperty('width', `${width}px`, 'important');
      panel.style.setProperty('left', `${left}px`, 'important');
      panel.style.setProperty('top', `${Math.max(gap, top)}px`, 'important');
      panel.style.setProperty('max-height', `${height}px`, 'important');
    }
    const reposition = () => menus.forEach(place);
    menus.forEach(menu => {
      menu.addEventListener('toggle', () => { if (menu.open) requestAnimationFrame(() => place(menu)); });
      menu.querySelector(':scope > summary')?.addEventListener('click', () => {
        requestAnimationFrame(() => place(menu));
      });
    });
    window.addEventListener('resize', reposition, { passive: true });
    window.addEventListener('scroll', reposition, { passive: true });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') menus.forEach(menu => { menu.open = false; });
    });
  }

  function simplifyDock() {
    const field = document.getElementById('piDockCapture');
    if (field) field.placeholder = 'Quick capture…';
    else {
      const observer = new MutationObserver(() => {
        const next = document.getElementById('piDockCapture');
        if (!next) return;
        next.placeholder = 'Quick capture…';
        observer.disconnect();
      });
      observer.observe(document.body, { childList: true });
    }
  }

  function tidyLabels() {
    const hint = document.getElementById('plannerHint');
    if (hint?.textContent.trim() === 'Shared with Database') hint.textContent = 'Shared with Home';
  }

  function init() {
    tidyLabels();
    setupLinks();
    setupMenus();
    simplifyDock();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
