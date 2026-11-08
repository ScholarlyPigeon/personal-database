/* V23 · One quiet three-dot action rail across the intranet.
   Keeps all existing button nodes, event handlers, and color storage intact.
   The two intentional exceptions are pop-out and expand/collapse controls. */
(()=>{
 'use strict';
 const HEADERS=[
  '.panel-header','.planner-heading','.planner-day > h3','.day-card-top','.tile-head',
  '.pi-workspace-head','.pi-ws-section-head','.pi-notes-section-head','.pi-focus-head',
  '.aq-panel-head','.aq-category-head','.aq-section-divider','.aq-card-actions',
  '.longform-library-head','.longform-composer-head','.longform-saved-section-head',
  '.longform-unsorted-head','.longform-entry-actions','.pi-current-folder-head',
  '.alignment-folder-controls','.alignment-list-section-head','.alignment-tiles-head',
  '.archive-v2-panel-head','.neo-panel-heading','.neo-dailies-head',
  '.planner-category-head','.date-rail-header'
 ].join(',');
 const menuSelector='details.pi-ws-menu,details.pi-cross-menu,details.pi-focus-tools,details.pi-item-tools,details.alignment-menu,details.pi-v23-actions-menu';
 const panelSelector='.pi-ws-menu-panel,.pi-cross-panel,.pi-focus-tools-panel,.pi-item-tools-panel,.alignment-menu-panel,.pi-v23-actions-panel,.pi-color-panel-tray';
 const own = (element,selector)=>[...element.querySelectorAll(selector)].find(node=>node.closest(HEADERS)===element);
 const isOpen=panel=>{try{return panel.matches(':popover-open');}catch{return false;}};
 const place=(tray,anchor)=>{
  const rect=anchor.getBoundingClientRect();const width=Math.min(298,innerWidth-16);
  const height=Math.min(tray.getBoundingClientRect().height,innerHeight-16);
  tray.style.setProperty('left',Math.max(8,Math.min(innerWidth-width-8,rect.right-width))+'px','important');
  tray.style.setProperty('top',(rect.bottom+height+8<=innerHeight?rect.bottom+5:Math.max(8,rect.top-height-5))+'px','important');
  tray.style.setProperty('width',width+'px','important');
 };
 const createMenu=(host)=>{
  const menu=document.createElement('details');menu.className='pi-v23-actions-menu';
  const summary=document.createElement('summary');summary.textContent='⋮';summary.title='Options';
  summary.setAttribute('aria-label','Options for this section');
  const tray=document.createElement('div');tray.className='pi-v23-actions-panel';
  menu.append(summary,tray);host.append(menu);
  // Some headers (Aquarium section bars) toggle the section when clicked;
  // menu clicks must never leak into that handler.
  menu.addEventListener('click',event=>event.stopPropagation());
  menu.addEventListener('keydown',event=>event.stopPropagation());
  menu.addEventListener('toggle',()=>{
   if(!menu.open || !menu.isConnected){if(isOpen(tray))try{tray.hidePopover();}catch{}tray.removeAttribute('popover');return;}
   if(typeof tray.showPopover==='function'){
    tray.setAttribute('popover','manual');if(!isOpen(tray))try{tray.showPopover();}catch{}
   }
   place(tray,summary);
  });
  return menu;
 };
 const exempt=button=>button.matches([
  '.pi-popout-button','.panel-collapse-toggle','.pi-focus-collapse','.pi-notes-section-toggle',
  '.aq-panel-collapse','.aq-category-collapse','.aq-section-toggle',
  '.aq-card-focus','.aq-card-collapse','.aq-tile-popout','.pi-ws-note-toggle',
  '.longform-section-toggle','.longform-expand-button','.pi-longform-note-popout',
  '.pi-tap-move-handle','.pi-move-handle','.alignment-tile-handle',
  '.pi-mini-icon.pi-move-handle','.pi-mini-icon.pi-tap-move-handle',
  '[data-pi-v23-stay]'
 ].join(',')) || /^(expand|collapse|pop out|close expanded|drag|select note to move)/i.test(button.getAttribute('aria-label')||'');
 const actionsFor=head=>{
  const candidates=[];
  const parents=[head,...head.querySelectorAll(':scope > .day-card-actions,:scope > .pi-workspace-actions,:scope > .longform-section-head-actions,:scope > .pi-v17-header-actions,:scope > .aq-section-actions,:scope > .aq-panel-actions')];
  for(const parent of parents)for(const button of parent.querySelectorAll(':scope > button')){
   if(exempt(button)||button.closest('details,[popover]')||button.hidden)continue;
   candidates.push(button);
  }
  return candidates;
 };
 const labelButton=button=>{
  const text=button.textContent.trim();
  if(!text || text.length<=2 || ['×','+','↘','✕','✎','🎨','⋮'].includes(text)){
   const label=button.getAttribute('aria-label')||button.title|| (text==='×'?'Remove':text==='+'?'Add':'Action');
   const span=document.createElement('span');span.className='pi-v23-action-text';span.textContent=label;
   button.append(span);
  }
  button.classList.add('pi-v23-menu-action');
 };
 function arrange(head){
  if(!head.isConnected)return;
  const menus=[...head.querySelectorAll('details.pi-color-panel-menu')].filter(menu=>menu.closest(HEADERS)===head && !menu.classList.contains('pi-v23-merged'));
  let native=own(head,menuSelector);
  // Standardize palette-only controls: ⋮ is the visible action and color
  // is inside it, even on calendar days with no other possible actions.
  if(!native && menus.length){
   native=menus[0];
   const summary=native.querySelector(':scope > summary');
   if(summary && summary.textContent!=='⋮'){
    summary.textContent='⋮';summary.title='Options · Color';summary.setAttribute('aria-label','Options, including color');
   }
   native.classList.add('pi-v23-primary-options');
  }
  const actions=actionsFor(head);
  if(!native && actions.length)native=createMenu(head.querySelector(':scope > .aq-section-actions') || head);
  if(!native)return;
  const tray=native.querySelector(':scope > '+panelSelector.split(',').join(',:scope > '));
  if(!tray)return;
  // Existing item menus are the authoritative control. Merge the palette
  // swatches into that menu rather than introducing a second competing one.
  for(const menu of menus){
   if(menu===native)continue;
   const picker=menu.querySelector('.pi-personal-color-picker');
   if(picker && picker.parentElement!==tray){
    const exists=[...tray.querySelectorAll('.pi-personal-color-picker')].some(
      existing=>existing.dataset.piColorFor===picker.dataset.piColorFor);
    if(!exists){picker.classList.add('pi-v23-merged-picker');tray.append(picker);}
   }
   menu.classList.add('pi-v23-merged');menu.open=false;menu.hidden=true;
  }
  for(const button of actions){
   if(button.closest('.pi-v23-actions-panel,.pi-color-panel-tray'))continue;
   labelButton(button);
   // Keep listeners and IDs intact: move the actual live control.
   const picker=tray.querySelector('.pi-personal-color-picker');
   if(picker)tray.insertBefore(button,picker);else tray.append(button);
  }
 }
 let queued=false;
 function scan(){
  document.querySelectorAll(HEADERS).forEach(arrange);
 }
 const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan();});};
 document.addEventListener('pointerdown',event=>{
  document.querySelectorAll('details.pi-v23-actions-menu[open]').forEach(menu=>{
   if(menu.contains(event.target))return;
   if(menu.querySelector('.pi-v23-actions-panel')?.contains(event.target))return;
   menu.open=false;
  });
 },true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('details.pi-v23-actions-menu[open]').forEach(menu=>menu.open=false);});
 window.addEventListener('resize',queue);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
  scan();new MutationObserver(queue).observe(document.body,{subtree:true,childList:true});
 },{once:true});else{scan();new MutationObserver(queue).observe(document.body,{subtree:true,childList:true});}
})();
