/* V13: equal-sized theme/page selectors and current-page labels.
   Leave native theme select and persisted theme values untouched. */
(() => {
  'use strict';
  const ready = () => {
    const theme = document.querySelector('header .pi-theme-menu');
    const pages = document.querySelector('header .ecosystem-menu:not(.pi-theme-menu):not(.pi-tools-menu)');
    if (!theme || !pages) return;
    const themeSummary = theme.querySelector(':scope > summary');
    const pagesSummary = pages.querySelector(':scope > summary');
    const choices = theme.querySelector('.pi-theme-options');
    const links = [...pages.querySelectorAll('.ecosystem-menu-popover a')];
    const selected = links.find(a => a.getAttribute('aria-current') === 'page') ||
      links.find(a => a.getAttribute('href') === location.pathname.split('/').pop());
    if (selected && pagesSummary) {
      pagesSummary.textContent = selected.textContent.trim();
      pagesSummary.setAttribute('aria-label','Current page: ' + selected.textContent.trim());
    }
    [theme, pages].forEach(menu => menu.classList.add('pi-balanced-nav'));

    function sizeMenus() {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      const font = getComputedStyle(themeSummary);
      context.font = `650 ${font.fontSize || '13px'} ${font.fontFamily || 'Arial'}`;
      const labels = [
        ...[...choices?.querySelectorAll('.pi-theme-choice') || []].map(node=>node.textContent.trim()),
        ...links.map(node=>node.textContent.trim())
      ];
      const width = Math.min(285, Math.max(186, Math.ceil(Math.max(0,...labels.map(label=>context.measureText(label).width)) + 51)));
      document.documentElement.style.setProperty('--pi-balanced-nav-width', width + 'px');
    }
    sizeMenus();
    if (choices) {
      let scheduled=false;
      new MutationObserver(()=>{
        if (scheduled) return;
        scheduled=true;
        queueMicrotask(()=>{scheduled=false;sizeMenus();});
      }).observe(choices,{childList:true,subtree:true,characterData:true});
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();
