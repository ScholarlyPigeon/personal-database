/* V6: reversible moves between standalone Home/Radar notes and nested categories.
   The live list writer lives in Script.js so sync and safety snapshots are respected. */
(() => {
  if (!document.querySelector('.database-page')) return;
  const FOCUS='pi-focus-now-v1';
  const NOTES='pi-database-notes-v1';
  const mime='application/x-pi-home-transfer';
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
    return {where:'notes',parentId:category.dataset.itemId,itemId:line.dataset.subtaskId};
  };
  const standaloneOrigin = row => {
    if(row?.classList.contains('pi-category-note')) return null;
    if(row?.matches('.pi-focus-item') && row.dataset.focusId)return {where:'radar',itemId:row.dataset.focusId};
    if(row?.matches('.checklist-item') && row.closest('#databaseNotesList') && row.dataset.itemId)return {where:'notes',itemId:row.dataset.itemId};
    return null;
  };
  const move = (from,to) => {
    if (!from || !to) return;
    const ok=window.PIHomeTransferItem?.(from,to);
    if(!ok) { alert('Move not completed. Your original item was kept in its place.'); return; }
    // Popup uses a live category record, but its checklist was rendered before the move.
    // Close rather than leave a stale editable copy on screen.
    document.querySelector('dialog.pi-category-dialog[open]')?.close();
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
      ...document.querySelectorAll('#databaseNotesList .pi-nested-line, #piDatabaseFocusList .pi-nested-line, dialog.pi-category-dialog[open] .pi-nested-line'),
      ...document.querySelectorAll('#databaseNotesList > .checklist-item:not(.pi-category-note), #piDatabaseFocusList > .pi-focus-item:not(.pi-category-note)')
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
    const category=target.closest?.('#databaseNotesList .pi-category-note, #piDatabaseFocusList .pi-category-note');
    if(category) return category.matches('.pi-focus-item')
      ? {where:'radar',parentId:category.dataset.focusId}
      : {where:'notes',parentId:category.dataset.itemId};
    const notes=target.closest?.('#databaseNotesList');
    const radar=target.closest?.('#piDatabaseFocusList');
    if(notes)return {where:'notes'};
    if(radar)return {where:'radar'};
    return null;
  };
  document.addEventListener('dragover',event=>{
    if(!event.dataTransfer?.types.includes(mime))return;
    if(!dropDestination(event.target))return;
    const target=event.target.closest('.pi-category-note, #databaseNotesList, #piDatabaseFocusList');
    // Let ordinary same-category reorder continue unchanged.
    if(event.target.closest('.pi-nested-line')) {
      const src=JSON.parse(event.dataTransfer.getData(mime)||'null');
      const dst=dropDestination(event.target);
      if(src?.parentId===dst?.parentId && src?.where===dst?.where)return;
    }
    event.preventDefault();event.dataTransfer.dropEffect='move';
    target?.classList.add('pi-category-drop-target');
  },true);
  document.addEventListener('drop',event=>{
    if(!event.dataTransfer?.types.includes(mime))return;
    const to=dropDestination(event.target);
    if(!to)return;
    let from;try{from=JSON.parse(event.dataTransfer.getData(mime));}catch{return;}
    // Native drag/drop handles reordering within the same list or category.
    if(from?.parentId===to.parentId && from?.where===to.where)return;
    event.preventDefault();event.stopImmediatePropagation();
    move(from,to);
    document.querySelectorAll('.pi-category-drop-target').forEach(el=>el.classList.remove('pi-category-drop-target'));
  },true);
  document.addEventListener('dragend',()=>document.querySelectorAll('.pi-category-drop-target').forEach(el=>el.classList.remove('pi-category-drop-target')),true);
  paint();
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;queued=true;
    queueMicrotask(()=>{queued=false;paint();});
  }).observe(document.body,{childList:true,subtree:true});
})();
