/* V25 • Shared control order and menu presentation.
   Presentation-only enhancement. Keeps existing buttons, listeners, IDs,
   movement handlers and saved records intact. */
(() => {
  'use strict';
  const HEADERS = [
    '.panel-header','.date-rail-header','.day-card-top','.tile-head',
    '.pi-workspace-head','.pi-notes-section-head','.pi-ws-section-head',
    '.pi-focus-head','.aq-panel-head','.aq-category-head','.aq-section-divider',
    '.aq-card-actions','.longform-library-head','.longform-composer-head',
    '.longform-saved-section-head','.longform-unsorted-head','.longform-entry-actions',
    '.pi-current-folder-head','.alignment-folder-controls',
    '.alignment-list-section-head','.alignment-tiles-head','.archive-v2-panel-head',
    '.neo-panel-heading','.neo-dailies-head','.planner-category-head',
    '.planner-day > h3','.planner-heading','.pi-note-card-head','.alignment-note-head'
  ].join(',');
  const MENUS = [
    'details.pi-v23-actions-menu','details.pi-color-panel-menu','details.pi-ws-menu',
    'details.pi-cross-menu','details.pi-focus-tools','details.pi-item-tools',
    'details.pi-nested-tools','details.alignment-menu','details.planner-category-menu',
    'details.longform-card-tools','details.pi-personal-aq-menu'
  ].join(',');
  const TRAYS = [
    '.pi-v23-actions-panel','.pi-color-panel-tray','.pi-ws-menu-panel',
    '.pi-cross-panel','.pi-focus-tools-panel','.pi-item-tools-panel',
    '.pi-nested-tools-menu','.alignment-menu-panel','.planner-category-menu-actions',
    '.longform-card-tool-panel','.pi-aq-menu-actions'
  ].join(',');
  const POPS = '.pi-popout-button,.pi-longform-note-popout,.aq-card-focus,.aq-tile-popout,.pi-aq-tile-focus,.aq-tile-focus';
  const FOLDS = [
    '.panel-collapse-toggle','.pi-focus-collapse','.pi-notes-section-toggle',
    '.aq-panel-collapse','.aq-category-collapse','.aq-card-collapse',
    '.aq-section-collapse-button','.longform-section-toggle',
    '.longform-expand-button','.pi-ws-note-toggle','.pi-current-tile-toggle',
    '.pi-current-folder-collapse','.pi-section-toggle'
  ].join(',');
  const belongsTo = (node, head) => node.closest(HEADERS) === head;
  const controlKind = el => {
    if(el.matches(POPS) || /pop.?out|focus (?:tile|note)|expand (?:this )?(?:table|panel)/i.test(el.getAttribute('aria-label')||'')) return 0;
    if(el.matches(FOLDS) || ((el.getAttribute('aria-expanded')!==null) && el.matches('button')) ||
       /^(collapse|expand) (note|section|category|tile|panel)/i.test(el.title||''))return 1;
    if(el.matches(MENUS))return 2;
    return -1;
  };
  const panelOf = menu => [...menu.children].find(child=>child.matches?.(TRAYS));
  function movementDropdown(tray){
    if(!tray)return;
    const moveBtns=[...tray.children].filter(el=>el.tagName==='BUTTON' &&
      /^(move to |move section to |move note to |send to )/i.test(el.textContent.trim()));
    if(!moveBtns.length)return;
    let group=[...tray.children].find(el=>el.matches?.('.pi-v25-movement-dropdown'));
    if(!group){
      group=document.createElement('details');group.className='pi-move-scope pi-v25-movement-dropdown';
      const summary=document.createElement('summary');summary.textContent='Move to…';
      summary.setAttribute('aria-label','Choose a destination');
      const options=document.createElement('div');options.className='pi-move-choices';
      group.append(summary,options);moveBtns[0].before(group);
    }
    const options=group.querySelector('.pi-move-choices');
    for(const button of moveBtns)options.append(button);
  }
  function polishMenu(menu){
    const summary=menu.querySelector(':scope > summary');
    const tray=panelOf(menu);
    if(!summary||!tray)return;
    if(summary.textContent!=='⋮')summary.textContent='⋮';
    summary.setAttribute('aria-label',summary.getAttribute('aria-label')?.replace(/color for (?:this |the )?/ig,'Options for ') || 'Options');
    menu.classList.add('pi-v25-standard-menu');
    tray.classList.add('pi-v25-menu-panel');
    movementDropdown(tray);
    const seen=new Set();
    for(const picker of tray.querySelectorAll('.pi-personal-color-picker')){
      const id=picker.dataset.piColorFor||'';
      if(!id)continue;
      if(seen.has(id))picker.hidden=true;
      else {seen.add(id);picker.hidden=false;}
    }
  }
  function arrange(head){
    if(!head.isConnected)return;
    const controls=[...head.querySelectorAll(POPS+','+FOLDS+','+MENUS+',button[title^="Collapse" i],button[title^="Expand" i]')].filter(el=>belongsTo(el,head) &&
      !el.closest('.pi-v25-menu-panel,[popover],.pi-move-choices') &&
      !el.classList.contains('pi-v23-merged') && !el.hidden);
    if(!controls.length)return;
    let rail=head.querySelector(':scope > .pi-v25-control-rail');
    if(!rail){rail=document.createElement('div');rail.className='pi-v25-control-rail';head.append(rail);}
    const buckets=[[],[],[]];
    for(const el of controls){
      const kind=controlKind(el);if(kind>=0)buckets[kind].push(el);
    }
    // Use the existing actual live controls. Merely changing DOM placement
    // preserves all listeners and avoids duplicated buttons or stale state.
    const desired=buckets.flat();
    desired.forEach((el,index)=>{
      if(rail.children[index]!==el)rail.insertBefore(el,rail.children[index]||null);
      if(el.matches(MENUS))polishMenu(el);
    });
    if(buckets[2].length>1){
      // The legacy palette can accompany a native item-options menu. V23
      // merges its picker; any remaining duplicate controls are visually hidden.
      const primary=buckets[2].find(el=>!el.classList.contains('pi-color-panel-menu'))||buckets[2][0];
      const destination=panelOf(primary);
      for(const extra of buckets[2]){
        if(extra===primary)continue;
        const source=panelOf(extra);
        if(destination&&source){
          for(const child of [...source.children]){
            if(child.classList.contains('pi-personal-color-picker') &&
               [...destination.querySelectorAll('.pi-personal-color-picker')].some(p=>p.dataset.piColorFor===child.dataset.piColorFor))continue;
            destination.append(child);
          }
        }
        if(extra.open)extra.open=false;
        extra.hidden=true;extra.classList.add('pi-v25-secondary-menu');
      }
      polishMenu(primary);
    }
    // Moving the elements out of their original flex/grid containers also
    // fixes Home's left-floating day menu and Compass's scattered icons.
  }
  let scheduled=false;
  const scan=()=>{
    scheduled=false;
    document.querySelectorAll(HEADERS).forEach(arrange);
    document.querySelectorAll(TRAYS).forEach(tray=>{
      if(tray.closest('details')){
        tray.classList.add('pi-v25-menu-panel');movementDropdown(tray);
      }
    });
  };
  const queue=()=>{
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(scan);
  };
  document.addEventListener('pointerdown',event=>{
    for(const menu of document.querySelectorAll('details.pi-v25-standard-menu[open]')){
      if(menu.contains(event.target) || panelOf(menu)?.contains(event.target))continue;
      menu.open=false;
    }
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')document.querySelectorAll('details.pi-v25-standard-menu[open]').forEach(m=>m.open=false);
  });
  document.addEventListener('toggle',event=>{
    if(!event.target.matches?.('details.pi-v25-standard-menu') || !event.target.open)return;
    document.querySelectorAll('details.pi-v25-standard-menu[open]').forEach(m=>{
      if(m!==event.target && !m.contains(event.target))m.open=false;
    });
  },true);
  window.addEventListener('resize',queue);
  const init=()=>{
    // Let the existing creators/mergers finish first, then normalize them.
    queue();new MutationObserver(queue).observe(document.body,{subtree:true,childList:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
