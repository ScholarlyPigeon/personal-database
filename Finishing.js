/* Personal Intranet · Oct 18 polish and main-notes-only cross-page moving.
   Reuses existing storage keys. Destination is committed before source removal.
   No hidden cloud keys, no schema migrations, and no background writes. */
(() => {
  'use strict';
  const dests = [
    {id:'home', label:'Home Notes', key:'pi-database-notes-v1'},
    {id:'compass', label:'Compass Notes', key:'pi-compass-v1'},
    {id:'timeline', label:'Timeline Notes', key:'pi-reflections-notes-v1'},
    {id:'longform', label:'Longform Saved Thoughts', key:'pi-longform-state-v1'},
    {id:'week', label:'This Week Notes', key:'pi-planner-week-notes-v1'},
    {id:'month', label:'This Month Notes', key:'pi-planner-month-'}
  ];
  const storage = key => localStorage.getItem(key);
  const parse = (raw, fallback) => {
    if (raw === null) return fallback;
    return JSON.parse(raw);
  };
  const localDate = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  };
  const monthKey = () => 'pi-planner-month-' + localDate().slice(0,7);
  const uid = () => globalThis.crypto?.randomUUID?.() || 'move-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const textOf = item => String(item.text || '').trim();
  const safeText = html => {
    const doc = document.createElement('div');
    doc.innerHTML = String(html || '');
    return doc.textContent || '';
  };
  const esc = str => String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\n/g,'<br>');
  const validUrl = str => /^https?:\/\//i.test(str || '') ? str : '';
  const sourceKind = () => {
    if (document.getElementById('piDatabaseFocusList')) return 'home';
    if (document.getElementById('piCompass')) return 'compass';
    if (document.getElementById('piReflections')) return 'timeline';
    if (document.getElementById('longformApp')) return 'longform';
    if (document.getElementById('plannerNotes')) return location.pathname.endsWith('Month.html') ? 'month' : 'week';
    return '';
  };
  const page = sourceKind();
  const formKey = id => id === 'month' ? monthKey() : dests.find(d=>d.id===id)?.key;
  function getData(key, fallback) {
    const value = parse(storage(key),fallback);
    if (Array.isArray(fallback) && !Array.isArray(value)) throw new Error('Unexpected saved list format in '+key);
    return value;
  }
  // Rich payload travels intact wherever the destination model can represent it.
  // Week/Month are flat by design, so their text includes the detail checklist.
  function portable(sourceId, item) {
    const title = String(item.title || item.text || 'Untitled note').trim();
    let body = String(item.details || item.text || '').trim();
    const displayTitle = item.title ? String(item.title).trim() : title;
    const contentHtml = item.html || '';
    const childLines = (Array.isArray(item.subtasks) ? item.subtasks : [])
      .map(child => `${child.done ? '☑' : '☐'} ${String(child.text || '')}`).join('\n');
    if (item.title && item.html) body = safeText(item.html).trim();
    else if (item.title && item.text) body = String(item.text).trim();
    const combined = [displayTitle, body && body !== displayTitle ? body : '', childLines].filter(Boolean).join('\n\n');
    return {
      id: uid(), title: displayTitle, text: combined || title,
      kind:item.piTransferKind || item.kind || (item.html || item.details ? 'note' : 'task'),
      body, html: contentHtml || esc(body && body !== displayTitle ? body : ''),
      details: String(item.details || ''), date: item.date || localDate(),
      done: Boolean(item.done), checkable:item.checkable !== false,
      imageUrl:validUrl(item.imageUrl), linkUrl:validUrl(item.linkUrl),
      subtasks:Array.isArray(item.subtasks) ? item.subtasks.map(child=>({...child})) : [],
      createdAt:item.createdAt || new Date().toISOString(),
      origin: sourceId
    };
  }
  function targetRecord(targetId, payload, state) {
    const common = {id:payload.id, date:payload.date, done:payload.done, createdAt:payload.createdAt,
      imageUrl:payload.imageUrl, linkUrl:payload.linkUrl};
    if (targetId === 'home') return {...common, text:payload.title,
      kind:payload.kind === 'note' || (payload.body && payload.body !== payload.title) || payload.subtasks.length || payload.imageUrl || payload.linkUrl ? 'note':'task',
      expanded:false, details:payload.body && payload.body !== payload.title ? payload.body : '', subtasks:payload.subtasks};
    if (targetId === 'compass' || targetId === 'timeline') {
      const first = state.sections?.[0]?.id;
      return {...common,title:payload.title,text:payload.body || '',
        html:payload.html || esc(payload.body), expanded:false, sectionId:first || 'general',
        piTransferKind:payload.kind, piTransferTitle:payload.title, piTransferDetails:payload.body,
        piTransferHtml:payload.html, piTransferSubtasks:payload.subtasks};
    }
    if (targetId === 'longform') return {...common,text:payload.text,html:esc(payload.text),
      category:'misc',pinned:false};
    return {...common,text:payload.text,checkable:payload.checkable,
      /* Future moves back out of Week/Month can restore nested structures. */
      piTransferKind:payload.kind,piTransferDetails:payload.body,piTransferSubtasks:payload.subtasks,
      piTransferTitle:payload.title,piTransferHtml:payload.html,
      imageUrl:payload.imageUrl,linkUrl:payload.linkUrl};
  }
  function stageDestination(targetId, rawItem, sourceId) {
    const key = formKey(targetId);
    if (!key) throw new Error('Unknown target');
    const before = storage(key);
    const root = getData(key,targetId==='compass'||targetId==='timeline'?null:targetId==='longform'?null:[]);
    let state,entries;
    if (targetId === 'compass' || targetId === 'timeline') {
      const defaultSections = targetId === 'compass'
        ? [{id:'goals-core',name:'Core Goals',side:'goals',collapsed:false}]
        : [{id:'general',name:'General',collapsed:false}];
      state = root || {sections:defaultSections,entries:[]};
      if (!Array.isArray(state.entries) || !Array.isArray(state.sections)) throw new Error('Unexpected saved note format.');
      if (!state.sections.length) state.sections = defaultSections;
      entries=state.entries;
    } else if (targetId === 'longform') {
      state = root || {entries:[]};
      if (!Array.isArray(state.entries)) throw new Error('Unexpected Longform notes format');
      entries=state.entries;
    } else {
      entries=root;
      if (!Array.isArray(entries)) throw new Error('Unexpected saved notes format');
      state=entries;
    }
    const payload = portable(sourceId, rawItem);
    if (rawItem.piTransferTitle) {
      payload.kind = rawItem.piTransferKind || payload.kind;
      payload.title = rawItem.piTransferTitle;
      payload.body = rawItem.piTransferDetails || '';
      payload.html = rawItem.piTransferHtml || '';
      payload.subtasks = Array.isArray(rawItem.piTransferSubtasks) ? rawItem.piTransferSubtasks : [];
      payload.text = [payload.title, payload.body, ...payload.subtasks.map(x => (x.done?'☑ ':'☐ ')+x.text)].filter(Boolean).join('\n\n');
    }
    const item = targetRecord(targetId, payload,state);
    entries.unshift(item);
    if (targetId === 'home' && before !== null && !window.PIHomeNotesSafety?.remember?.(before,'before-move-from-page')) {
      throw new Error('Could not protect the Home Notes snapshot. Move cancelled.');
    }
    localStorage.setItem(key,JSON.stringify(state));
    // Saved Thoughts headings use a separate title map; the main text is still
    // stored on the entry so a missing title map cannot hide content.
    let titleKey = null, oldTitles = null;
    if (targetId === 'longform') {
      titleKey = 'pi-longform-titles-v1';oldTitles=storage(titleKey);
      try {
        const titles=getData(titleKey,{});titles[item.id]=payload.title;
        localStorage.setItem(titleKey,JSON.stringify(titles));
      } catch (error) {
        if (before === null) localStorage.removeItem(key); else localStorage.setItem(key,before);
        throw error;
      }
    }
    return () => {
      if (before === null) localStorage.removeItem(key);else localStorage.setItem(key,before);
      if (titleKey) {if (oldTitles===null) localStorage.removeItem(titleKey);else localStorage.setItem(titleKey,oldTitles);}
    };
  }
  function transfer(source, targetId) {
    if (source.scope === targetId) return;
    let rollback = null;
    try {
      if (source.scope==='home' && source.key!=='pi-focus-now-v1') {
        const success=window.PIHomeMoveToPage?.(source.key,source.id, item => stageDestination(targetId,item,'home'));
        if (!success) throw new Error('Home did not confirm the source change. The original was kept.');
      } else {
        const key = source.key;
        const previous = storage(key);
        const original = getData(key, ['home','week','month'].includes(source.scope) ? [] : null);
        const arr = source.scope === 'home' ? original : (Array.isArray(original) ? original : original.entries);
        if (!Array.isArray(arr)) throw new Error('Unexpected source notes format');
        const index = arr.findIndex(entry => entry.id === source.id);
        if (index < 0) throw new Error('Source note changed; please refresh before moving.');
        const item = arr[index];
        const sourceTitles = source.scope === 'longform' ? getData('pi-longform-titles-v1',{}) : null;
        rollback = stageDestination(targetId,source.scope==='longform' ? {...item,title:sourceTitles?.[item.id]} : item,source.scope);
        arr.splice(index,1);
        try {
          localStorage.setItem(key,JSON.stringify(original));
          // Longform titles and assignments may outlive the note harmlessly.
        } catch(error) { rollback(); throw error; }
      }
      window.PIRecordActivity?.(source.scope === 'home' ? 'database' : source.scope,
        'moved note to ' + dests.find(d => d.id===targetId).label,'');
      location.reload(); // reload the current page's private in-memory renderers
    } catch(error) {
      console.error('Cross-page move cancelled:',error);
      alert('Move not completed. Your original note was kept. '+error.message);
    }
  }
  function scope(label, choices) {
    const group = document.createElement('details');group.className='pi-move-scope';
    const summary=document.createElement('summary');summary.textContent=label;
    group.append(summary);
    const list=document.createElement('div');list.className='pi-move-choices';
    for (const [name, callback] of choices) {
      const button=document.createElement('button');button.type='button';button.textContent=name;
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();callback();});
      list.append(button);
    }
    group.append(list);return group;
  }
  function findSource(row) {
    if (!row) return null;
    if (row.matches('.pi-focus-item')) return {scope:'home',key:'pi-focus-now-v1',id:row.dataset.focusId};
    if (row.matches('.checklist-item')) return {scope:'home',key:row.closest('[data-storage-key]')?.dataset.storageKey,id:row.dataset.itemId};
    if (row.matches('.pi-note-card')) return {scope:page,key:formKey(page),id:row.dataset.itemId};
    if (row.matches('.longform-entry')) return {scope:'longform',key:formKey('longform'),id:row.dataset.entryId};
    if (row.matches('.planner-item')) {
      const key=formKey(page); const rows=getData(key,[]);
      const siblings=[...document.querySelectorAll('#plannerNotes .planner-item')];
      const candidate=siblings.indexOf(row);
      // Planner displays incomplete items ahead of completed items; match by content
      // AND completion, not by DOM order, to avoid moving the wrong saved note.
      const text=row.querySelector('.planner-item-text')?.textContent || '';
      const done=row.classList.contains('is-done');
      const matches=rows.filter(entry=>entry.text===text && !!entry.done===done);
      if (matches.length!==1) return {scope:page,key,index:null,duplicate:true};
      return {scope:page,key,id:matches[0].id};
    }
    return null;
  }
  function moveWithinHome(row, key) {
    const sel=row.querySelector('.pi-item-move, .pi-focus-return');
    if (!sel) return;
    sel.value=key;sel.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function reorderPlanner(source, toTop) {
    try {
      const rows=getData(source.key,[]);
      const index=rows.findIndex(item=>item.id===source.id);
      if(index<0)throw new Error('Note changed; refresh first.');
      const [item]=rows.splice(index,1);
      if(toTop)rows.unshift(item);else rows.push(item);
      localStorage.setItem(source.key,JSON.stringify(rows));
      location.reload();
    }catch(error){alert('Could not reorder this note. '+error.message);}
  }
  // Keep ⋮ menus legible outside clipped scroll panes. No cloned controls:
  // the real live menu is temporarily placed in the browser's top layer.
  function attachFloatingMenu(details, panel) {
    if (!details || !panel || details.dataset.piFloatingReady === 'true') return;
    details.dataset.piFloatingReady = 'true';
    details.addEventListener('toggle', () => {
      if (details.open && details.isConnected) {
        if (typeof panel.showPopover !== 'function') return;
        panel.setAttribute('popover', 'manual');
        try { panel.showPopover(); } catch {return;}
        const anchor = details.querySelector(':scope > summary') || details;
        const at = anchor.getBoundingClientRect();
        const width = Math.min(254, innerWidth - 16);
        panel.style.left = Math.max(8,Math.min(innerWidth-width-8,at.right-width))+'px';
        panel.style.top = Math.max(8,Math.min(innerHeight-panel.offsetHeight-8,at.bottom+5))+'px';
      } else {
        try { if (panel.matches(':popover-open')) panel.hidePopover(); } catch {}
        panel.removeAttribute('popover');
        panel.style.removeProperty('left');panel.style.removeProperty('top');
      }
    });
  }
  function addMenus(row, host, inline = false) {
    if (host.dataset.piCrossReady==='true') return;
    const source=findSource(row);
    if (!source?.key || !source?.id || source.duplicate) return;
    host.dataset.piCrossReady='true';
    const inHome=source.scope==='home';
    const available = dests.filter(d=>d.id!==source.scope && !(d.id==='month' && location.search.includes('month=20')));
    const sections=[];
    if (inHome) {
      const options=[['Home Notes','pi-database-notes-v1'],['On My Radar','pi-database-radar-v1'],['Near My Radar','pi-database-near-radar-v1'],['✦ Focus Now','__focus__']]
        .filter(([name,key])=>key!==source.key && !(source.key==='pi-focus-now-v1' && key==='__focus__'));
      const actions=options.map(([name,key])=>[name,()=> {
        if (source.key === 'pi-focus-now-v1') {
          if (!window.PIHomeMoveFromFocus?.(source.id,key)) alert('Move not completed; item remains in Focus.');
        } else if (key === '__focus__') {
          if (!window.PIHomeMoveToFocus?.(source.key,source.id)) alert('Move not completed; item remains in its table.');
        } else moveWithinHome(row,key);
      }]);
      sections.push(scope('Within Home ▾',actions));
    } else if (source.scope==='compass' || source.scope==='timeline') {
      const selector=row.querySelector('.pi-card-section-select');
      if (selector) sections.push(scope('Within this page ▾',[...selector.options].filter(o=>o.value!==selector.value).map(o=>[o.textContent,()=>{
        selector.value=o.value;selector.dispatchEvent(new Event('change',{bubbles:true}));
      }])));
    } else if (source.scope==='longform') {
      const sectionSelect=row.querySelector('.longform-section-move select');
      const categorySelect=row.querySelector('.longform-card-category');
      const choices=[];
      for (const [selector,prefix] of [[sectionSelect,'Section: '],[categorySelect,'Category: ']]) {
        if (!selector) continue;
        [...selector.options].filter(o=>o.value!==selector.value).forEach(o=>choices.push([prefix+o.textContent,()=>{
          selector.value=o.value;selector.dispatchEvent(new Event('change',{bubbles:true}));
        }]));
      }
      if(choices.length)sections.push(scope('Within Longform ▾',choices));
    } else if (source.scope==='week' || source.scope==='month') {
      sections.push(scope('Within this page ▾', [['Move to top',()=>reorderPlanner(source,true)],
        ['Move to bottom',()=>reorderPlanner(source,false)]]));
    }
    sections.push(scope('Other pages ▾',available.map(target=>[target.label,()=>transfer(source,target.id)])));
    if (inline) {
      sections.forEach(section=>host.append(section));
    } else {
      const menu=document.createElement('details');menu.className='pi-cross-menu';
      const sum=document.createElement('summary');sum.textContent='⋮';sum.title='Move note';
      sum.setAttribute('aria-label','Move this note to another page');
      const panel=document.createElement('div');panel.className='pi-cross-panel';
      sections.forEach(section=>panel.append(section));
      menu.append(sum,panel);host.append(menu);
      attachFloatingMenu(menu,panel);
    }
  }
  function installMenus() {
    document.querySelectorAll('.database-page .checklist-item').forEach(row=>{
      const panel=row.querySelector('.pi-item-tools > .pi-item-tools-panel');
      if (panel) { addMenus(row,panel,true);attachFloatingMenu(panel.closest('.pi-item-tools'),panel); }
    });
    document.querySelectorAll('.database-page .pi-focus-item').forEach(row=>{
      const panel=row.querySelector('.pi-focus-tools-panel');
      if(panel) addMenus(row,panel,true);
    });
    document.querySelectorAll('.pi-note-card').forEach(row=>{
      const head=row.querySelector('.pi-note-card-head');if(head)addMenus(row,head);
    });
    document.querySelectorAll('.longform-entry').forEach(row=>{
      const legacySummary=row.querySelector('.longform-card-tools > summary');
      if(legacySummary && legacySummary.textContent!=='⋮') { legacySummary.textContent='⋮';legacySummary.title='Item options and move'; }
      const existing=row.querySelector('.longform-card-tool-panel');
      if (existing) addMenus(row,existing,true);
    });
    document.querySelectorAll('#plannerNotes .planner-item').forEach(row=>{
      const actions=row.querySelector('.planner-item-actions');
      if (actions) addMenus(row,actions,true);
    });
  }
  // Content-driven sizing. Main page uses a single 218px cap, while the
  // pop-out is a vertical list and is deliberately not measured here.
  window.PIFitFocusHeight = () => {
    const panel=document.getElementById('piDatabaseFocus');
    if (!panel || panel.classList.contains('pi-panel-popout')) return;
    const list=panel.querySelector('#piDatabaseFocusList');
    if (!list) return;
    let needed=0;
    [...list.querySelectorAll('.pi-focus-item')].forEach(card=>{
      const main=card.querySelector('.pi-focus-main');
      const height=Math.max(card.scrollHeight, (main?.scrollHeight||0)+24,46);
      needed=Math.max(needed,height);
    });
    const newHeight = Math.min(218, Math.max(77, (needed || 39)+50));
    const page=document.querySelector('.database-page.page');
    if(page) page.style.setProperty('--pi-focus-height',newHeight+'px');
  };
  let queued=false;
  function queue() {
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;installMenus();window.PIFitFocusHeight();});
  }
  document.addEventListener('pointerdown',event=>{
    document.querySelectorAll('.pi-cross-menu[open], .database-page .checklist-item .pi-item-tools[open]').forEach(menu=>{
      const panel=menu.querySelector('.pi-cross-panel, .pi-item-tools-panel');
      if (!menu.contains(event.target) && !panel?.contains(event.target)) menu.open=false;
    });
  },true);
  document.addEventListener('DOMContentLoaded',()=>{
    queue();
    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='childList'))queue();
    });
    observer.observe(document.body,{subtree:true,childList:true});
    window.addEventListener('resize',queue,{passive:true});
  });
})();
