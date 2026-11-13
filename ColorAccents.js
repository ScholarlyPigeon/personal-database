/* Personal Intranet · theme-aware personal color choices · v21.4.
   A tiny, independent enhancement: the color names are synced in one pi-* key;
   their actual shades follow whichever theme is active. No record rewrites. */
(() => {
  'use strict';
  const STORAGE = 'pi-personal-item-colors-v1';
  const NAMES = ['plum', 'teal', 'blue', 'rose', 'green', 'gold', 'coral', 'cyan'];
  const LABELS = {plum:'Violet', teal:'Teal', blue:'Blue', rose:'Pink', green:'Green',gold:'Gold',coral:'Coral',cyan:'Ice blue'};
  const MENU_PANELS = [
    '.pi-item-tools-panel', '.pi-nested-tools-menu',
    '.planner-category-menu-actions', '.planner-item-actions', '.planner-nested-options',
    '.pi-ws-menu-panel', '.pi-aq-menu-actions'
  ].join(',');
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      if (!raw || Array.isArray(raw) || typeof raw !== 'object') return {};
      return Object.fromEntries(Object.entries(raw).filter(([k,v]) =>
        typeof k === 'string' && k.length < 180 && NAMES.includes(v)));
    } catch (error) { console.warn('Personal item colors could not be read',error);return {}; }
  }
  let colors = load();
  const selectors = [
    ['[data-subtask-id]', 'subtaskId', 'subtask'],
    ['[data-pi-subtask-id]', 'piSubtaskId', 'subtask'],
    ['[data-focus-id]', 'focusId', 'item'],
    ['[data-item-id]', 'itemId', 'item'],
    ['[data-pi-item-id]', 'piItemId', 'item'],
    ['[data-pi-category-id]', 'piCategoryId', 'item'],
    ['[data-entry-id]', 'entryId', 'item'],
    ['.pi-current-folder[data-ws-folder]', 'wsFolder', 'compass-folder'],
    ['.alignment-folder[data-folder-id]', 'folderId', 'alignment-folder'],
    ['.alignment-list-zone[data-place]', 'place', 'alignment-list'],
    ['.board-tile[data-id]', 'id', 'board-tile'],
    ['.day-card[data-pi-color-day]', 'piColorDay', 'calendar-day'],
    ['.planner-day[data-date]', 'date', 'calendar-day'],
    ['[data-card-id]', 'cardId', 'aquarium'],
    ['[data-category-id]', 'categoryId', 'aquarium-category'],
    ['[data-ws-section]', 'wsSection', 'workspace-section'],
    ['[data-pi-color-panel-id]', 'piColorPanelId', 'panel']
  ];
  function identity(from) {
    let ancestor = from;
    while (ancestor && ancestor !== document.body) {
      for(const [selector,field,prefix] of selectors){
        if(ancestor.matches?.(selector) && ancestor.dataset[field]){
          const id=ancestor.dataset[field];
          if(id && id.length < 160) return {node:ancestor,key:prefix+':'+id};
        }
      }
      ancestor=ancestor.parentElement;
    }
    return null;
  }
  function apply(node,key) {
    const value=colors[key];
    if(value){
      if(node.dataset.piPersonalColor!==value)node.dataset.piPersonalColor=value;
      node.classList.add('pi-personal-colored');
    } else {
      if(node.hasAttribute('data-pi-personal-color'))node.removeAttribute('data-pi-personal-color');
      node.classList.remove('pi-personal-colored');
    }
  }
  function updateColor(key,value) {
    if(!key || key.length>180 || (value && !NAMES.includes(value)))return;
    const next={...colors};
    if(value)next[key]=value;else delete next[key];
    try{localStorage.setItem(STORAGE,JSON.stringify(next));colors=next;}
    catch(error){alert('Could not save the color change. Storage may be full.');console.error(error);return;}
    document.querySelectorAll('[data-pi-color-key]').forEach(node=>{
      if(node.dataset.piColorKey===key)apply(node,key);
    });
    refreshPickers();
    window.showSaved?.();
  }
  function pickersFor(key){return [...document.querySelectorAll('.pi-personal-color-picker')].filter(el=>el.dataset.piColorFor===key);}
  function refreshPickers(){
    document.querySelectorAll('.pi-personal-color-picker').forEach(panel=>{
      const current=colors[panel.dataset.piColorFor]||'';
      panel.querySelectorAll('button[data-pi-color-choice]').forEach(button=>{
        button.setAttribute('aria-pressed',String(button.dataset.piColorChoice===current));
      });
    });
  }
  function picker(key) {
    const region=document.createElement('div');region.className='pi-personal-color-picker';region.dataset.piColorFor=key;
    region.setAttribute('role','group');region.setAttribute('aria-label','Color for this item');
    const label=document.createElement('span');label.className='pi-personal-color-label';label.textContent='Color';region.append(label);
    const choices=document.createElement('div');choices.className='pi-personal-color-swatches';
    for(const [value,name] of [['','Default'],...NAMES.map(n=>[n,LABELS[n]])]){
      const b=document.createElement('button');b.type='button';b.className='pi-personal-color-swatch';
      b.dataset.piColorChoice=value;b.title=name+' (theme colors)';b.setAttribute('aria-label',name+' color');
      if(!value){b.classList.add('is-default');b.textContent='×';}else b.dataset.color=value;
      b.setAttribute('aria-pressed',String((colors[key]||'')===value));
      b.addEventListener('click',event=>{
        event.stopPropagation();event.preventDefault();updateColor(key,value);
      });
      choices.append(b);
    }
    region.append(choices);return region;
  }
  function decorate(panel){
    if(panel.querySelector(':scope > .pi-personal-color-picker'))return;
    const entry=identity(panel);
    if(!entry)return;
    entry.node.dataset.piColorKey=entry.key;
    apply(entry.node,entry.key);
    panel.append(picker(entry.key));
  }
  function addAquariumCardMenus(){
    // Aquarium cards have icon actions rather than a ⋮. Give them the same
    // compact color menu without moving their existing actions.
    document.querySelectorAll('.aq-card[data-card-id] .aq-card-actions').forEach(actions=>{
      if(actions.querySelector('.pi-personal-aq-menu'))return;
      const card=actions.closest('.aq-card');if(!card)return;
      const details=document.createElement('details');details.className='pi-ws-menu pi-personal-aq-menu';
      const summary=document.createElement('summary');summary.textContent='⋮';summary.title='Color options';
      summary.setAttribute('aria-label','Color options for this card');
      const tray=document.createElement('div');tray.className='pi-ws-menu-panel';
      details.append(summary,tray);actions.append(details);
    });
  }
  // Panel palettes are separate from item palettes. We don't rename any
  // user sections or alter layout/storage to support tint choices.
  function addPanelMenus(){
    const surfaces=[
      '.database-page .database-notes-panel',
      '.database-page .home-upcoming-panel',
      '.database-page .pi-focus-panel',
      '.pi-workspace-panel',
      '.planner-notes','.planner-calendar',
      '.aq-panel','.alignment-library','.alignment-tiles','.alignment-composer',
      '.longform-library','.longform-composer',
      '.longform-saved-section','.archive-v2-panel'
    ].join(',');
    document.querySelectorAll(surfaces).forEach((panel,i)=>{
      const header=panel.querySelector(':scope > .panel-header, :scope > .pi-focus-head, :scope > .pi-workspace-head, :scope > .pi-notes-section-head, :scope > .planner-heading, :scope > .aq-panel-head, :scope > .longform-library-head, :scope > .longform-composer-head, :scope > .longform-saved-section-head, :scope > .archive-v2-panel-head');
      if(!header)return;
      const page=location.pathname.split('/').pop() || 'home';
      const workspaceId=panel.matches('.pi-compass-capture-panel')?'compass-capture':
        panel.matches('.pi-current-panel')?'compass-current':
        panel.matches('.pi-compass-column-panel')?
          (panel.parentElement?.firstElementChild===panel?'compass-goals':'compass-grounding'):
        panel.matches('.pi-workspace-panel')?
          ((panel.closest('.pi-reflections-page')?'timeline':'workspace')+'-'+
            [...panel.parentElement.children].indexOf(panel)) : '';
      const id=panel.id || panel.dataset.collapsiblePanel || panel.dataset.collapsePanel ||
        workspaceId || 'section-'+i;
      const key='panel:'+page+':'+id;
      panel.dataset.piColorPanelId=page+':'+id;
      const sectionKey=panel.dataset.wsSection?'workspace-section:'+panel.dataset.wsSection:null;
      const activeKey=sectionKey&&colors[sectionKey]?sectionKey:key;
      panel.dataset.piColorKey=activeKey;
      apply(panel,activeKey);
      if(header.querySelector('.pi-color-panel-menu'))return;
      const menu=document.createElement('details');menu.className='pi-color-panel-menu';
      const summary=document.createElement('summary');summary.textContent='🎨';
      summary.title='Change the whole panel color';summary.setAttribute('aria-label','Color for this panel');
      const tray=document.createElement('div');tray.className='pi-color-panel-tray';
      tray.append(picker(key));menu.append(summary,tray);header.append(menu);
      // Top-layer placement avoids clipping by scrolling/rounded panels.
      menu.addEventListener('toggle',()=>{
        if(typeof tray.showPopover!=='function')return;
        if(!menu.open){
          try{if(tray.matches(':popover-open'))tray.hidePopover();}catch{}
          tray.removeAttribute('popover');return;
        }
        tray.setAttribute('popover','manual');
        try{tray.showPopover();}catch{return;}
        const at=summary.getBoundingClientRect();
        const w=Math.min(282,innerWidth-16),h=tray.offsetHeight;
        const left=Math.max(8,Math.min(innerWidth-w-8,at.right-w));
        const top=at.bottom+h+8<=innerHeight?at.bottom+5:Math.max(8,at.top-h-5);
        tray.style.setProperty('left',left+'px','important');
        tray.style.setProperty('top',top+'px','important');
        tray.style.setProperty('width',w+'px','important');
      });
    });
  }
  // Whole-surface palettes (in addition to note/row palettes) use the
  // existing synced color map, so folders and tables keep their own colors
  // even when a UI component is re-rendered or the theme changes.
  function attachSurfacePalette(target, header, key, purpose){
    if(!target || !header || !key || key.length > 180)return;
    target.dataset.piColorKey = key;
    apply(target,key);
    // V25 moves the existing live picker into a right-aligned control rail,
    // which can be a *sibling* of the original section-actions host. Search
    // the target surface by its actual color key to prevent duplicate palettes.
    if([...target.querySelectorAll('.pi-personal-color-picker')].some(
         region => region.dataset.piColorFor === key) ||
       header.querySelector('.pi-full-surface-menu,.pi-color-panel-menu'))return;
    const menu=document.createElement('details');
    menu.className='pi-color-panel-menu pi-full-surface-menu';
    const summary=document.createElement('summary');
    summary.textContent='🎨';
    summary.title='Color the entire '+purpose;
    summary.setAttribute('aria-label','Color the entire '+purpose);
    const tray=document.createElement('div');
    tray.className='pi-color-panel-tray';
    tray.append(picker(key));menu.append(summary,tray);
    menu.addEventListener('click',event=>event.stopPropagation());
    header.append(menu);
    // Menus in tables and narrow folder cards float in the top layer to
    // avoid clipping by rounded/scrolling ancestors. Outside-click/Escape
    // handling remains provided by the existing shared menu policy.
    menu.addEventListener('toggle',()=>{
      if(typeof tray.showPopover!=='function')return;
      if(!menu.open || !menu.isConnected){
        try{if(tray.matches(':popover-open'))tray.hidePopover();}catch{}
        tray.removeAttribute('popover');return;
      }
      tray.setAttribute('popover','manual');
      try{if(!tray.matches(':popover-open'))tray.showPopover();}catch{return;}
      const at=summary.getBoundingClientRect();
      const w=Math.min(282,innerWidth-16),h=tray.offsetHeight;
      const left=Math.max(8,Math.min(innerWidth-w-8,at.right-w));
      const top=at.bottom+h+8<=innerHeight?at.bottom+5:Math.max(8,at.top-h-5);
      tray.style.setProperty('left',left+'px','important');
      tray.style.setProperty('top',top+'px','important');
      tray.style.setProperty('width',w+'px','important');
    });
  }
  function addWholeSurfaceMenus(){
    const configs=[
      ['.board-tile[data-id]', '.tile-head', node=>'board-tile:'+node.dataset.id,'table'],
      ['.aq-board-section[data-section-id]', '.aq-section-divider > .aq-section-actions', node=>'aquarium-section:'+node.dataset.sectionId,'Aquarium section'],
      ['.day-card[data-pi-color-day]', '.day-card-top', node=>'calendar-day:'+node.dataset.piColorDay,'day table'],
      ['.planner-day[data-date]', 'h3', node=>'calendar-day:'+node.dataset.date,'calendar day'],
      ['.pi-current-folder[data-ws-folder]', '.pi-current-folder-head', node=>'compass-folder:'+node.dataset.wsFolder,'folder'],
      ['.alignment-folder[data-folder-id]', '.alignment-folder-controls', node=>'alignment-folder:'+node.dataset.folderId,'folder'],
      ['.alignment-list-zone[data-place]', '.alignment-list-section-head', node=>'alignment-list:'+node.dataset.place,'section table']
    ];
    configs.forEach(([selector,headerSelector,keyFor,purpose])=>{
      document.querySelectorAll(selector).forEach(node=>{
        const header=node.querySelector(':scope > '+headerSelector);
        if(header)attachSurfacePalette(node,header,keyFor(node),purpose);
      });
    });
    // Workspace section colors are already in their ⋮ menu. Apply their
    // saved choice to the entire section, not only its heading.
    document.querySelectorAll('.pi-ws-section[data-ws-section]').forEach(node=>{
      const key='workspace-section:'+node.dataset.wsSection;
      if(colors[key]){node.dataset.piColorKey=key;apply(node,key);}
    });
  }
  function scan(){
    addWholeSurfaceMenus();
    // V21.7: Aquarium color controls live in the existing combined action/move menu.
    addPanelMenus();
    document.querySelectorAll(MENU_PANELS).forEach(decorate);
    // V26.3: folder Aquarium notes have one consolidated ⋮ menu.
    // Include the existing Aquarium note palette in that same menu so
    // movement and color no longer require competing controls.
    if(document.documentElement.classList.contains('aquarium-folders-page')){
      document.querySelectorAll('.aq-card[data-card-id] .pi-v23-actions-panel').forEach(decorate);
    }
    // Keep colors visible on the noneditable preview rows, too.
    document.querySelectorAll('.planner-preview-item[data-pi-item-id],.alignment-note[data-entry-id]').forEach(node=>{
      const entry=identity(node);if(!entry)return;node.dataset.piColorKey=entry.key;apply(node,entry.key);
    });
  }
  let queued=false;
  function schedule(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;scan();});
  }
  window.PIItemColors={get:key=>colors[key]||'',set:updateColor,refresh:schedule,choices:[...NAMES]};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
    scan();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  },{once:true});else {scan();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});}
  window.addEventListener('storage',event=>{if(event.key===STORAGE){colors=load();schedule();}});
  window.addEventListener('focus',()=>{const latest=load();if(JSON.stringify(colors)!==JSON.stringify(latest)){colors=latest;schedule();}});
})();
