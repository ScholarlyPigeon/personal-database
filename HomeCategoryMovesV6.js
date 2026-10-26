/* V6: reversible moves between standalone Home/Radar notes and nested categories.
   The live list writer lives in Script.js so sync and safety snapshots are respected. */
(() => {
  if (!document.querySelector('.database-page')) return;
  const FOCUS='pi-focus-now-v1';
  const NOTES='pi-database-notes-v1';
  const mime='application/x-pi-home-transfer';
  const clearDragHighlights=()=>{
    document.querySelectorAll('.pi-category-drop-target,.pi-focus-drop-target,.task-drop-target,.pi-nested-drop-target,.pi-nested-dragging').forEach(el=>
      el.classList.remove('pi-category-drop-target','pi-focus-drop-target','task-drop-target','pi-nested-drop-target','pi-nested-dragging'));
  };
  const parse = key => { try { const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]; }catch{return [];} };
  const categories = () => [
    ...parse(NOTES).filter(x=>x?.kind==='note').map(x=>({where:'notes',id:x.id,label:'Notes: '+String(x.text||'Untitled').trim()})),
    ...parse(FOCUS).filter(x=>x?.kind==='note').map(x=>({where:'radar',id:x.id,label:'Radar: '+String(x.text||'Untitled').trim()}))
  ];
  const nestedOrigin = line => {
    const dialog=line.closest('.pi-category-dialog');
    if (dialog?.dataset.piCategoryId) return {where:'notes',parentId:dialog.dataset.piCategoryId,itemId:line.dataset.subtaskId};
    const category=line.closest('.pi-category-note');
    if (!category) return null;
    if (category.matches('.pi-focus-item')) return {where:'radar',parentId:category.dataset.focusId,itemId:line.dataset.subtaskId};
    const day=line.closest('.day-list');
    if(day?.dataset.storageKey?.startsWith('pi-calendar-day-'))return {where:'day',date:day.dataset.storageKey.slice('pi-calendar-day-'.length),parentId:category.dataset.itemId,itemId:line.dataset.subtaskId};
    return {where:'notes',parentId:category.dataset.itemId,itemId:line.dataset.subtaskId};
  };
  const standaloneOrigin = row => {
    if(row?.classList.contains('pi-category-note')) return null;
    if(row?.matches('.pi-focus-item') && row.dataset.focusId)return {where:'radar',itemId:row.dataset.focusId};
    if(row?.matches('.checklist-item') && row.closest('#databaseNotesList') && row.dataset.itemId)return {where:'notes',itemId:row.dataset.itemId};
    const day=row?.closest('.day-list');if(row?.dataset.itemId&&day?.dataset.storageKey?.startsWith('pi-calendar-day-'))return {where:'day',date:day.dataset.storageKey.slice('pi-calendar-day-'.length),itemId:row.dataset.itemId};
    return null;
  };
  const move = (from,to) => {
    if (!from || !to) return;
    const ok=window.PIHomeTransferItem?.(from,to);
    if(!ok) { clearDragHighlights(); alert('Move not completed. Your original item was kept in its place.'); return; }
    // Popup uses a live category record, but its checklist was rendered before the move.
    // Close rather than leave a stale editable copy on screen.
    document.querySelector('dialog.pi-category-dialog[open]')?.close();
    clearDragHighlights();
    paint();
  };
  const option = (select,label,value) => select.append(new Option(label,value));
  const destination = value => {
    if (value==='standalone-notes') return {where:'notes'};
    if (value==='standalone-radar') return {where:'radar'};
    const hit=categories().find(c=>`${c.where}:${c.id}`===value);
    return hit ? {where:hit.where,parentId:hit.id} : null;
  };
  const fill = (select,source,nested) => {
    const signature=JSON.stringify({source,nested,categories:categories().map(c=>[c.where,c.id,c.label])});
    if(select.dataset.piMoveSignature===signature)return;
    select.dataset.piMoveSignature=signature;
    const current = select.value;
    select.replaceChildren();
    option(select,nested?'↪ Move…':'Into category…','');
    if(nested) {
      option(select,'Standalone in Notes','standalone-notes');
      option(select,'Standalone in Radar','standalone-radar');
    }
    categories().forEach(c=>{
      if(c.where===source.where && c.id===source.parentId) return;
      option(select,c.label,`${c.where}:${c.id}`);
    });
    if([...select.options].some(opt=>opt.value===current)) select.value=current;
  };
  function paint() {
    const nodes=[
      ...document.querySelectorAll('#databaseNotesList .pi-nested-line, #piDatabaseFocusList .pi-nested-line, .day-list .pi-nested-line, dialog.pi-category-dialog[open] .pi-nested-line'),
      ...document.querySelectorAll('#databaseNotesList > .checklist-item:not(.pi-category-note), #piDatabaseFocusList > .pi-focus-item:not(.pi-category-note), .day-list > .checklist-item:not(.pi-category-note)')
    ];
    for(const node of nodes) {
      const nested=node.classList.contains('pi-nested-line');
      const source=nested ? nestedOrigin(node) : standaloneOrigin(node);
      if(!source) continue;
      const host=nested ? node.querySelector('.pi-nested-actions') : node.querySelector('.pi-item-tools-panel, .pi-focus-tools-panel');
      if(!host)continue;
      let select=host.querySelector(nested?'.pi-nested-move-select':'.pi-category-route-select');
      if(!select) {
        select=document.createElement('select');
        select.className=nested?'pi-nested-move-select':'pi-category-route-select';
        select.setAttribute('aria-label','Move this item to another category or as a standalone item');
        select.title='Move item';
        host.prepend(select);
        select.addEventListener('change',()=>{
          const from=nested?nestedOrigin(node):standaloneOrigin(node);
          const to=destination(select.value);
          select.value='';
          if(from&&to)move(from,to);
        });
      }
      fill(select,source,nested);
      // The drag handle still reorders within its current category by default.
      // Add cross-category metadata for dropping onto a different category header.
      const handle=nested?node.querySelector('.pi-nested-drag'):node.querySelector('.check-drag, .pi-focus-drag');
      if(handle && !handle.dataset.piTransferBound) {
        handle.dataset.piTransferBound='1';
        handle.addEventListener('dragstart',event=>{
          const from=nested?nestedOrigin(node):standaloneOrigin(node);
          if(!from||!event.dataTransfer)return;
          event.dataTransfer.setData(mime,JSON.stringify(from));
          event.dataTransfer.effectAllowed='move';
        });
      }
    }
  }
  const dropDestination=target=>{
    const category=target.closest?.('#databaseNotesList .pi-category-note, #piDatabaseFocusList .pi-category-note, .day-list .pi-category-note');
    if(category){
      if(category.matches('.pi-focus-item'))return {where:'radar',parentId:category.dataset.focusId};
      const day=category.closest('.day-list');
      if(day?.dataset.storageKey?.startsWith('pi-calendar-day-'))return {where:'day',date:day.dataset.storageKey.slice('pi-calendar-day-'.length),parentId:category.dataset.itemId};
      return {where:'notes',parentId:category.dataset.itemId};
    }
    const notes=target.closest?.('#databaseNotesList');
    const radar=target.closest?.('#piDatabaseFocusList');
    if(notes)return {where:'notes'};
    const day=target.closest?.('.day-list');
    if(day?.dataset.storageKey?.startsWith('pi-calendar-day-'))return {where:'day',date:day.dataset.storageKey.slice('pi-calendar-day-'.length)};
    if(radar)return {where:'radar'};
    return null;
  };
  document.addEventListener('dragover',event=>{
    if(!event.dataTransfer?.types.includes(mime))return;
    if(!dropDestination(event.target))return;
    const target=event.target.closest('.pi-category-note, #databaseNotesList, #piDatabaseFocusList, .day-list');
    // Let ordinary same-category reorder continue unchanged.
    if(event.target.closest('.pi-nested-line')) {
      const dst=dropDestination(event.target);
      if(!dst)return;
    }
    event.preventDefault();event.dataTransfer.dropEffect='move';
    target?.classList.add('pi-category-drop-target');
  },true);
  document.addEventListener('drop',event=>{
    if(!event.dataTransfer?.types.includes(mime))return;
    // Clear even when this drop is delegated to the native same-category reorder.
    const to=dropDestination(event.target);
    let from=null;try{from=JSON.parse(event.dataTransfer.getData(mime));}catch{clearDragHighlights();return;}
    if(!to || (from?.parentId===to.parentId && from?.where===to.where && from?.date===to.date)){
      clearDragHighlights();return;
    }
    event.preventDefault();event.stopImmediatePropagation();
    try { move(from,to); } finally { clearDragHighlights(); }
  },true);
  document.addEventListener('dragend',clearDragHighlights,true);
  // A drop can be consumed by an older capture handler before our drop listener.
  // The default source node may also be removed before dragend fires.
  document.addEventListener('drop',()=>requestAnimationFrame(clearDragHighlights),true);
  // Reorder Radar cards in their own column. Previously this handle only
  // supported cross-panel moves, making in-column drops snap back.
  let draggedRadarId=null;
  document.addEventListener('dragstart',event=>{
    const handle=event.target.closest?.('#piDatabaseFocusList .pi-focus-drag');
    const card=handle?.closest('.pi-focus-item');
    if(card?.dataset.focusId)draggedRadarId=card.dataset.focusId;
  },true);
  document.addEventListener('dragover',event=>{
    if(!draggedRadarId)return;
    if(!event.target.closest?.('#piDatabaseFocusList .pi-focus-item'))return;
    event.preventDefault();event.dataTransfer.dropEffect='move';
  },true);
  document.addEventListener('drop',event=>{
    if(!draggedRadarId)return;
    const target=event.target.closest?.('#piDatabaseFocusList .pi-focus-item');
    const id=draggedRadarId;draggedRadarId=null;
    if(!target?.dataset.focusId || target.dataset.focusId===id)return;
    event.preventDefault();event.stopImmediatePropagation();
    window.PIReorderRadarV14?.(id,target.dataset.focusId);
    clearDragHighlights();
  },true);
  document.addEventListener('dragend',()=>{draggedRadarId=null;},true);
  // Mobile: tap a drag handle, then tap its destination. No tiny menus required.
  let tapSource=null;
  const coarse=()=>matchMedia('(pointer:coarse)').matches;
  document.addEventListener('click',event=>{
    if(!coarse())return;
    const nested=event.target.closest?.('.database-page .pi-nested-drag');
    const radar=event.target.closest?.('#piDatabaseFocusList .pi-focus-drag');
    if(nested||radar){
      if(nested){
        const line=nested.closest('.pi-nested-line');
        tapSource=line?{kind:'nested',origin:nestedOrigin(line)}:null;
      }else{
        const card=radar.closest('.pi-focus-item');
        tapSource=card?.dataset.focusId?{kind:'radar',id:card.dataset.focusId}:null;
      }
      document.querySelectorAll('.pi-v14-tap-source').forEach(n=>n.classList.remove('pi-v14-tap-source'));
      (nested||radar).closest('.pi-nested-line,.pi-focus-item')?.classList.add('pi-v14-tap-source');
      event.preventDefault();event.stopPropagation();return;
    }
    if(!tapSource)return;
    if(event.target.closest('button,input,textarea,select,summary,details,a,[contenteditable]'))return;
    const end=()=>{tapSource=null;document.querySelectorAll('.pi-v14-tap-source').forEach(n=>n.classList.remove('pi-v14-tap-source'));};
    if(tapSource.kind==='radar'){
      const target=event.target.closest?.('#piDatabaseFocusList .pi-focus-item');
      if(!target?.dataset.focusId)return;
      window.PIReorderRadarV14?.(tapSource.id,target.dataset.focusId);end();
      event.preventDefault();event.stopPropagation();return;
    }
    const to=dropDestination(event.target);
    if(!to)return;
    if(tapSource.origin && (to.where!==tapSource.origin.where||to.date!==tapSource.origin.date||to.parentId!==tapSource.origin.parentId))
      move(tapSource.origin,to);
    end();event.preventDefault();event.stopPropagation();
  },true);
  paint();
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;queued=true;
    queueMicrotask(()=>{queued=false;paint();});
  }).observe(document.body,{childList:true,subtree:true});
})();
