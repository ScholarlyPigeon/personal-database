/* Personal Intranet · theme-aware personal color choices · v21.4.
   A tiny, independent enhancement: the color names are synced in one pi-* key;
   their actual shades follow whichever theme is active. No record rewrites. */
(() => {
  'use strict';
  const STORAGE = 'pi-personal-item-colors-v1';
  const NAMES = ['plum', 'teal', 'blue', 'rose', 'green'];
  const LABELS = {plum:'Violet', teal:'Teal', blue:'Blue', rose:'Pink', green:'Green'};
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
    ['[data-card-id]', 'cardId', 'aquarium'],
    ['[data-category-id]', 'categoryId', 'aquarium-category'],
    ['[data-ws-section]', 'wsSection', 'workspace-section']
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
  function scan(){
    addAquariumCardMenus();
    document.querySelectorAll(MENU_PANELS).forEach(decorate);
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
