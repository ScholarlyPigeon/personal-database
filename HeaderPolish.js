/* Same dropdown presentation as Pages, with existing select and sync state left intact. */
(() => {
  const makeMenu = () => {
    const select = document.getElementById('themeSelect');
    if (!select || document.querySelector('header .pi-theme-menu')) return;
    const menu = document.createElement('details');
    menu.className = 'ecosystem-menu pi-theme-menu';
    const summary = document.createElement('summary');
    summary.setAttribute('aria-label','Choose theme');
    summary.title = 'Choose a theme';
    const choices = document.createElement('div');
    choices.className = 'ecosystem-menu-popover pi-theme-options';
    choices.setAttribute('role','group');
    choices.setAttribute('aria-label','Themes');
    menu.append(summary,choices);
    select.classList.add('pi-nav-source-select');
    select.insertAdjacentElement('afterend',menu);

    function redraw() {
      const selected = select.selectedOptions?.[0];
      summary.textContent = selected?.textContent?.trim() || 'themes';
      choices.replaceChildren();
      const groups = Array.from(select.children);
      groups.forEach(group => {
        if (group.tagName === 'OPTGROUP') {
          const heading = document.createElement('div');
          heading.className='pi-theme-group-heading';
          heading.textContent=group.label;
          choices.append(heading);
        }
        const options = group.tagName === 'OPTGROUP' ? Array.from(group.children) : group.tagName === 'OPTION' ? [group] : [];
        options.forEach(option => {
          const button = document.createElement('button');
          button.type='button'; button.className='pi-theme-choice';
          button.textContent=option.textContent;
          button.dataset.theme=option.value;
          if (option.value === select.value) button.setAttribute('aria-current','true');
          button.addEventListener('click', () => {
            select.value=option.value;
            select.dispatchEvent(new Event('change',{bubbles:true}));
            menu.open=false;
            redraw();
          });
          choices.append(button);
        });
      });
    }
    let queued=false;
    const schedule=()=>{
      if (queued) return;
      queued=true;
      queueMicrotask(()=>{queued=false;redraw();});
    };
    new MutationObserver(schedule).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['selected']});
    select.addEventListener('change',schedule);
    window.addEventListener('storage', event => {if(event.key==='pi-theme')schedule();});
    document.addEventListener('pointerdown', event => {
      if(menu.open && !menu.contains(event.target))menu.open=false;
    },true);
    redraw();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',makeMenu);
  else makeMenu();
})();
