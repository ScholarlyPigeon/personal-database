/* ===== Original module: MobilePolish.js ===== */
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
;

/* ===== Original module: Refresh.js ===== */
/* Universal live panel popouts, no localStorage keys or cloned form state. */
(() => {
  'use strict';
  const selector = [
    '.database-page .checklist-panel', '.database-page .database-notes-panel',
    '.database-page .right-date-rail', '.database-page .day-card',
    '.database-page .pi-focus-panel',
    '.pi-workspace-panel', '.pi-notes-section', '.pi-archive-column',
    '.longform-library', '.longform-composer', '.longform-saved-section',
    '.planner-notes', '.planner-calendar', '.aq-panel', '.aq-category-zone',
    '.neo-card'
  ].join(',');
  const headers = '.panel-header, .date-rail-header, .day-card-top, .pi-workspace-head, .pi-notes-section-head, .planner-heading, .longform-library-head, .longform-composer-head, .longform-saved-section-head, .aq-panel-head, .aq-category-head, .neo-panel-heading, .neo-dailies-head, .pi-focus-head';
  let opened = null;
  let backdrop = null;
  const close = () => {
    if (!opened) return;
    const panel = opened;
    opened = null;
    // Browser top layer keeps the live panel above its backdrop even when
    // page themes introduce transformed/isolated stacking contexts.
    try { if (panel.matches(':popover-open')) panel.hidePopover(); } catch {}
    // Critical: leaving `popover` on a regular panel makes the browser hide it
    // when closed. Restore the original DOM state so it occupies its grid slot.
    if (panel.dataset.piHadPopover !== 'true') panel.removeAttribute('popover');
    delete panel.dataset.piHadPopover;
    panel.classList.remove('pi-panel-popout');
    panel.querySelector('.pi-popout-button')?.setAttribute('aria-label','Pop out this panel');
    backdrop?.remove(); backdrop = null;
    document.body.classList.remove('pi-popout-open');
  };
  const toggle = (panel, control) => {
    if (opened === panel) { close(); return; }
    close();
    opened = panel;
    backdrop = document.createElement('div');
    backdrop.className = 'pi-popout-backdrop';
    backdrop.addEventListener('click', close);
    document.body.append(backdrop);
    panel.dataset.piHadPopover = String(panel.hasAttribute('popover'));
    panel.classList.add('pi-panel-popout');
    if (typeof panel.showPopover === 'function') {
      panel.setAttribute('popover', 'manual');
      panel.showPopover();
    } else {
      // Older browsers: keep panel's own stacking context above the backdrop.
      backdrop.style.zIndex = '1500';
    }
    document.body.classList.add('pi-popout-open');
    control.setAttribute('aria-label', 'Close expanded panel');
    control.title = 'Close expanded panel (Esc)';
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && opened && !document.querySelector('dialog[open]')) {
      event.preventDefault(); close();
    }
  });
  const install = () => {
    document.querySelectorAll(selector).forEach(panel => {
      const header = [...panel.children].find(child => child.matches?.(headers))
        || panel.querySelector(':scope > .pi-workspace-head, :scope > .panel-header, :scope > .day-card-top');
      if (!header || header.querySelector('.pi-popout-button')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pi-popout-button';
      button.textContent = '⤢';
      button.title = 'Expand this table';
      button.setAttribute('aria-label','Pop out this panel');
      button.addEventListener('click', event => { event.stopPropagation(); toggle(panel,button); });
      header.append(button);
    });
    if (opened && !opened.isConnected) close();
  };
  window.PICompactDate = value => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
    return match ? `${match[2]}/${match[3]}/${match[1].slice(2)}` : '';
  };
  // These are *display* wrappers. Native input listeners and ISO values stay
  // untouched; the browser's real date picker opens when the date is clicked.
  const compactDates = () => {
    document.querySelectorAll('input[type="date"].pi-item-date, input[type="date"].pi-card-date, input[type="date"].longform-card-date, input[type="date"].tracker-date-input').forEach(input => {
      if (input.dataset.piCompactDate === 'true') return;
      input.dataset.piCompactDate = 'true';
      const shell = document.createElement('span');
      shell.className = 'pi-compact-date-view';
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'pi-compact-date-button';
      const paint = () => {
        button.textContent = window.PICompactDate(input.value) || 'mm/dd/yy';
        button.title = 'Edit date';
        button.setAttribute('aria-label', `Edit date ${button.textContent}`);
      };
      paint();
      input.before(shell);
      shell.append(button, input);
      input.classList.add('pi-compact-date-native');
      input.addEventListener('change', paint);
      button.addEventListener('click', () => {
        try { input.showPicker(); }
        catch { input.focus(); input.click(); }
      });
    });
  };
  install(); compactDates();

  // Keep exactly one compact Focus menu open. Clicking outside dismisses it.
  document.addEventListener('pointerdown', event => {
    document.querySelectorAll('.database-page .pi-focus-tools[open]').forEach(menu => {
      if (!menu.contains(event.target) && !menu.querySelector('.pi-focus-tools-panel')?.contains(event.target)) {
        menu.open = false;
      }
    });
  }, true);

  // One movement affordance on desktop: drag any Home line into Focus,
  // or drag a Focus card into Notes, Radar, or a dated list.
  // The transfer APIs live in Script.js and preserve the existing safeguards.
  document.addEventListener('dragstart', event => {
    const source = event.target.closest?.('.database-page .check-drag, .database-page .pi-focus-drag');
    if (!source || !event.dataTransfer) return;
    const focusRow = source.closest('.pi-focus-item');
    if (focusRow?.dataset.focusId) {
      event.dataTransfer.setData('application/x-pi-focus', focusRow.dataset.focusId);
      event.dataTransfer.effectAllowed = 'move';
      return;
    }
    const itemRow = source.closest('.checklist-item');
    const list = itemRow?.closest('.checklist-list, .day-list');
    if (!itemRow?.dataset.itemId || !list?.dataset.storageKey) return;
    event.dataTransfer.setData('application/x-pi-home', JSON.stringify({
      sourceKey: list.dataset.storageKey, itemId: itemRow.dataset.itemId
    }));
    event.dataTransfer.effectAllowed = 'move';
  }, true);
  document.addEventListener('dragover', event => {
    const target = event.target.closest?.('.database-page .pi-focus-panel, .database-page .checklist-list, .database-page .day-list');
    if (!target) return;
    const transfer = event.dataTransfer?.types;
    const accept = target.closest('.pi-focus-panel')
      ? transfer?.includes('application/x-pi-home')
      : transfer?.includes('application/x-pi-focus');
    if (!accept) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    target.classList.add('pi-focus-drop-target');
  }, true);
  document.addEventListener('dragleave', event => {
    if (!event.target.closest?.('.pi-focus-drop-target')) return;
    if (!event.currentTarget.contains(event.relatedTarget)) {
      document.querySelectorAll('.pi-focus-drop-target').forEach(el => el.classList.remove('pi-focus-drop-target'));
    }
  }, true);
  document.addEventListener('drop', event => {
    // V6 category-to-category moves are handled by the dedicated category transfer layer.
    if (event.dataTransfer?.types?.includes('application/x-pi-home-transfer') &&
        event.target.closest?.('.database-page .pi-category-note, .database-page #databaseNotesList, .database-page #piDatabaseFocusList')) return;
    const focus = event.target.closest?.('.database-page .pi-focus-panel');
    const list = event.target.closest?.('.database-page .checklist-list, .database-page .day-list');
    if (!focus && !list) return;
    if (focus && event.dataTransfer?.types?.includes('application/x-pi-home')) {
      event.preventDefault(); event.stopImmediatePropagation();
      try {
        const {sourceKey,itemId} = JSON.parse(event.dataTransfer.getData('application/x-pi-home'));
        if (!window.PIHomeMoveToFocus?.(sourceKey,itemId)) alert('Move not completed. The original item was kept.');
      } catch { alert('Could not complete that move. Your original item was kept.'); }
    } else if (list?.dataset.storageKey && event.dataTransfer?.types?.includes('application/x-pi-focus')) {
      event.preventDefault(); event.stopImmediatePropagation();
      const focusId = event.dataTransfer.getData('application/x-pi-focus');
      if (!window.PIHomeMoveFromFocus?.(focusId,list.dataset.storageKey)) alert('Move not completed. The item remains in Focus.');
    }
    document.querySelectorAll('.pi-focus-drop-target').forEach(el => el.classList.remove('pi-focus-drop-target'));
  }, true);
  document.addEventListener('dragend', () => {
    document.querySelectorAll('.pi-focus-drop-target').forEach(el => el.classList.remove('pi-focus-drop-target'));
  }, true);

  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; install(); compactDates(); });
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
;

/* ===== Original module: Finishing.js ===== */
/* Personal Intranet · Oct 18 polish and main-notes-only cross-page moving.
   Reuses existing storage keys. Destination is committed before source removal.
   No hidden cloud keys, no schema migrations, and no background writes. */
(() => {
  'use strict';
  const dests = [
    {id:'home', label:'Home Notes', key:'pi-database-notes-v1'},
    {id:'aquarium', label:'Aquarium Notes', key:'pi-aquarium-state-v3'},
    {id:'alignment', label:'Alignment Notes', key:'pi-alignment-v1'},
    {id:'compass', label:'Compass Notes', key:'pi-compass-v1'},
    {id:'timeline', label:'Timeline Notes', key:'pi-reflections-notes-v1'},
    {id:'longform', label:'Longform Saved Thoughts', key:'pi-longform-state-v1'},
    {id:'week', label:'This Week Notes', key:'pi-planner-week-notes-v1'},
    {id:'month', label:'This Month Notes', key:'pi-planner-month-'},
    {id:'next-month', label:'Next Month Notes', key:'pi-planner-month-'}
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
  const nextMonthKey = () => {
    const [year,month] = localDate().slice(0,7).split('-').map(Number);
    const target = new Date(year,month,1,12);
    return 'pi-planner-month-' + `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}`;
  };
  const uid = () => globalThis.crypto?.randomUUID?.() || 'move-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const textOf = item => String(item.text || '').trim();
  const safeText = html => {
    const doc = document.createElement('div');
    doc.innerHTML = String(html || '').replace(/<br\s*\/?>/gi,'\n')
      .replace(/<\/(?:p|div|li)>/gi,'\n');
    return doc.textContent || '';
  };
  const esc = str => String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\n/g,'<br>');
  const validUrl = str => /^https?:\/\//i.test(str || '') ? str : '';
  const sourceKind = () => {
    if (document.getElementById('piDatabaseFocusList')) return 'home';
    if (document.getElementById('aquariumApp')) return 'aquarium';
    if (document.getElementById('piCompass')) return 'compass';
    if (document.getElementById('alignmentApp')) return 'alignment';
    if (document.getElementById('piReflections')) return 'timeline';
    if (document.getElementById('longformApp')) return 'longform';
    if (document.getElementById('plannerNotes')) return document.body.dataset.planner==='next-month' ? 'next-month' : document.body.dataset.planner==='month' ? 'month' : 'week';
    return '';
  };
  const page = sourceKind();
  const formKey = id => id === 'month' ? monthKey() : id === 'next-month' ? nextMonthKey() : dests.find(d=>d.id===id)?.key;
  function getData(key, fallback) {
    const value = parse(storage(key),fallback);
    if (Array.isArray(fallback) && !Array.isArray(value)) throw new Error('Unexpected saved list format in '+key);
    return value;
  }
  // V21.5: One portable note shape for all cross-page moves. Nothing here
  // rewrites existing records. We separate short, editable headings from the
  // full text BEFORE a destination with a title field can truncate it.
  const summaryTitle = input => {
    const all=String(input||'').replace(/\s+/g,' ').trim();
    if(all.length<=76)return all || 'Untitled note';
    const first=all.slice(0,76);
    const ending=first.search(/[.!?](?: |$)/);
    const nearStop=ending>=25 ? first.slice(0,ending+1) : first.slice(0,72).replace(/\s+\S*$/,'');
    return (nearStop||first.slice(0,72)).trim()+'…';
  };
  function portable(sourceId, item) {
    const originalText=String(item.text||'').trim();
    const explicitTitle=String(item.title||'').trim();
    const details=String(item.details||'').trim();
    const restorableHtml=!item.html && item.piTransferHtml &&
      String(item.piTransferDetails||'').trim()===details ? item.piTransferHtml : '';
    const rawHtml=window.PIInlineRich?.cleanHTML(item.html||restorableHtml||'')||'';
    const htmlText=rawHtml?safeText(rawHtml).trim():'';
    const freeform=!explicitTitle && (originalText.length>86 || originalText.includes('\n'));
    const title=summaryTitle(explicitTitle || originalText || htmlText);
    let body=explicitTitle ? (details||originalText||htmlText) :
      freeform ? (originalText||htmlText) : (details||'');
    // Cards from older releases sometimes hold their original body only in
    // the transfer fields. Use that solely if no visible body remains.
    if(!body && item.piTransferDetails && (item.title || item.kind==='note'))
      body=String(item.piTransferDetails).trim();
    const html=(rawHtml && (explicitTitle || freeform || !details)) ? rawHtml : esc(body);
    const subtasks=Array.isArray(item.subtasks) && item.subtasks.length ?
      item.subtasks.map(child=>({...child})) :
      Array.isArray(item.piTransferSubtasks) ? item.piTransferSubtasks.map(child=>({...child})) : [];
    const childLines=subtasks.map(child=>`${child.done?'☑':'☐'} ${String(child.text||'')}`).join('\n');
    // For an un-titled block, keep the entire original text as the body;
    // do not duplicate the preview heading inside full-text destinations.
    const fullText=explicitTitle ? [title,body && body!==title?body:'',childLines].filter(Boolean).join('\n\n') :
      [originalText||body||title,childLines].filter(Boolean).join('\n\n');
    return {
      id:uid(),title,text:fullText,body,html,
      kind:item.kind==='note' || freeform || body || rawHtml ? 'note' :
        (item.piTransferKind || item.kind || 'task'),
      details:body,date:item.date || (item.createdAt && /^\d{4}-\d{2}-\d{2}/.test(item.createdAt) ? item.createdAt.slice(0,10) : localDate()),
      done:Boolean(item.done),checkable:item.checkable!==false,
      imageUrl:validUrl(item.imageUrl),linkUrl:validUrl(item.linkUrl),
      subtasks,createdAt:item.createdAt||new Date().toISOString(),origin:sourceId
    };
  }
  function targetRecord(targetId,payload,state) {
    const common={id:payload.id,date:payload.date,done:payload.done,createdAt:payload.createdAt,
      imageUrl:payload.imageUrl,linkUrl:payload.linkUrl};
    const transfer={piTransferKind:payload.kind,piTransferTitle:payload.title,
      piTransferDetails:payload.body,piTransferHtml:payload.html,piTransferSubtasks:payload.subtasks};
    if(targetId==='aquarium') {
      const extras=payload.subtasks.map(x=>(x.done?'☑ ':'☐ ')+String(x.text||'')).join('\n');
      const body=[payload.body&&payload.body!==payload.title?payload.body:'',extras].filter(Boolean).join('\n\n');
      return {...common,...transfer,title:payload.title,text:body,
        html:payload.html||esc(body),zone:'inbox',
        kind:payload.kind==='task'?'action':'thought',collapsed:!body};
    }
    if(targetId==='home')return {...common,...transfer,text:payload.title,
      kind:payload.kind==='note'||payload.body||payload.subtasks.length||payload.imageUrl||payload.linkUrl?'note':'task',
      expanded:!!payload.body,showDetails:true,
      details:payload.body&&payload.body!==payload.title?payload.body:'',
      subtasks:payload.subtasks};
    if(targetId==='alignment')return {...common,...transfer,title:payload.title,
      text:payload.body||'',html:payload.html||esc(payload.body),
      place:'readings',pinned:false,expanded:!!payload.body};
    if(targetId==='compass'||targetId==='timeline'){
      const first=state.sections?.[0]?.id;
      return {...common,...transfer,title:payload.title,text:payload.body||'',
        html:payload.html||esc(payload.body),expanded:!!payload.body,sectionId:first||'general'};
    }
    if(targetId==='longform')return {...common,...transfer,text:payload.text,
      html:payload.html||esc(payload.text),category:'misc',pinned:false};
    return {...common,...transfer,
      text:payload.kind==='note'&&payload.body?payload.title:payload.text,
      html:payload.html||esc(payload.text),
      kind:payload.kind==='note'&&payload.body?'note':undefined,
      // Calendar note rows support an expandable details area.
      details:payload.body||'',expanded:true,subtasks:payload.subtasks,
      checkable:payload.checkable};
  }
  function stageDestination(targetId, rawItem, sourceId) {
    const key = formKey(targetId);
    if (!key) throw new Error('Unknown target');
    const before = storage(key);
    // Do not manufacture a partial Aquarium database: require its real initialized board.
    if (targetId === 'aquarium' && before === null) throw new Error('Open Aquarium once before moving notes into it.');
    const root = getData(key,['compass','timeline','longform','aquarium','alignment'].includes(targetId)?null:[]);
    let state,entries;
    if (targetId === 'compass' || targetId === 'timeline') {
      const defaultSections = targetId === 'compass'
        ? [{id:'goals-core',name:'Core Goals',side:'goals',collapsed:false}]
        : [{id:'general',name:'General',collapsed:false}];
      state = root || {sections:defaultSections,entries:[]};
      if (!Array.isArray(state.entries) || !Array.isArray(state.sections)) throw new Error('Unexpected saved note format.');
      if (!state.sections.length) state.sections = defaultSections;
      entries=state.entries;
    } else if (targetId === 'alignment') {
      state=root||{version:1,entries:[],folders:[],sections:[]};
      if(!Array.isArray(state.entries)||!Array.isArray(state.folders)||!Array.isArray(state.sections))
        throw new Error('Unexpected Alignment notes format. Original note preserved.');
      entries=state.entries;
    } else if (targetId === 'aquarium') {
      state = root;
      if (!state || !Array.isArray(state.cards) || !Array.isArray(state.categories) || !Array.isArray(state.kinds))
        throw new Error('Unexpected Aquarium notes format. Original note preserved.');
      entries=state.cards;
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
    // Preserve the CURRENT editor text rather than overwriting recent edits
    // with stale transfer metadata from an earlier move.
    const item = targetRecord(targetId, payload,state);
    entries.unshift(item);
    if (targetId === 'home' && before !== null && !window.PIHomeNotesSafety?.remember?.(before,'before-move-from-page')) {
      throw new Error('Could not protect the Home Notes snapshot. Move cancelled.');
    }
    localStorage.setItem(key,JSON.stringify(state));
    // Color selections follow the note into its new page. If the source or
    // destination write fails, the corresponding color snapshot is restored.
    const colorStorage='pi-personal-item-colors-v1';
    const priorColors=storage(colorStorage);
    let colorChanged=false;
    try {
      const map=JSON.parse(priorColors||'{}');
      if(map && typeof map==='object' && !Array.isArray(map)){
        const originalColor=map[(sourceId==='aquarium'?'aquarium:':'item:')+rawItem.id];
        if(originalColor && ['plum','teal','blue','rose','green','gold','coral','cyan'].includes(originalColor)){
          map[(targetId==='aquarium'?'aquarium:':'item:')+payload.id]=originalColor;
          localStorage.setItem(colorStorage,JSON.stringify(map));colorChanged=true;
        }
      }
    } catch(e) { // A failed accent write must not cause any loss of notes.
      console.warn('The moved note kept its content, but its color could not be copied',e);
    }
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
        if(colorChanged){if(priorColors===null)localStorage.removeItem(colorStorage);else localStorage.setItem(colorStorage,priorColors);}
        throw error;
      }
    }
    return () => {
      if (before === null) localStorage.removeItem(key);else localStorage.setItem(key,before);
      if(colorChanged){if(priorColors===null)localStorage.removeItem(colorStorage);else localStorage.setItem(colorStorage,priorColors);}
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
        const original = getData(key, ['home','week','month','next-month'].includes(source.scope) ? [] : null);
        const arr = source.scope === 'home' ? original :
          (source.scope === 'aquarium' ? original?.cards : (Array.isArray(original) ? original : original?.entries));
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
  // Reuse the transaction-safe move implementation in the existing Alignment
  // menu; no new destination writer or synchronization path is introduced.
  window.PICrossPageMoves={
    destinations:row=>{
      const source=findSource(row);
      return source?.id && !source.duplicate ? dests.filter(d=>d.id!==source.scope) .map(d=>({id:d.id,label:d.label})) : [];
    },
    move:(row,targetId)=>{
      const source=findSource(row);
      if(!source?.id || source.duplicate)return alert('Could not identify the note to move. The original was kept.');
      if(!dests.some(d=>d.id===targetId&&d.id!==source.scope))return;
      transfer(source,targetId);
    }
  };
  function scope(label, choices) {
    const group = document.createElement('details');group.className='pi-move-scope';
    const summary=document.createElement('summary');summary.textContent=label;
    group.append(summary);
    const list=document.createElement('div');list.className='pi-move-choices';
    for (const [name, callback] of choices) {
      const button=document.createElement('button');button.type='button';button.textContent=name;
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        const container=button.closest('.pi-cross-menu, .pi-item-tools, .longform-card-tools');
        if(container)container.open=false;
        callback();
      });
      list.append(button);
    }
    group.append(list);return group;
  }
  function findSource(row) {
    if (!row) return null;
    if (row.matches('.pi-focus-item')) return {scope:'home',key:'pi-focus-now-v1',id:row.dataset.focusId};
    if (row.matches('.aq-card')) return {scope:'aquarium',key:formKey('aquarium'),id:row.dataset.cardId};
    if (row.matches('.checklist-item')) return {scope:'home',key:row.closest('[data-storage-key]')?.dataset.storageKey,id:row.dataset.itemId};
    if (row.matches('.pi-note-card')) return {scope:page,key:formKey(page),id:row.dataset.itemId};
    if (row.matches('.alignment-note')) return {scope:'alignment',key:formKey('alignment'),id:row.dataset.entryId};
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
        const width = Math.min(panel.getBoundingClientRect().width || 254, innerWidth - 16);
        // The top-layer stylesheet uses !important positioning. Set the
        // coordinates at the same priority, or the browser falls back to 0,0.
        const left = Math.max(8,Math.min(innerWidth-width-8,at.right-width));
        const above = at.top-panel.offsetHeight-5;
        const below = at.bottom+5;
        const top = Math.max(8,Math.min(innerHeight-panel.offsetHeight-8,
          below+panel.offsetHeight+8<=innerHeight ? below : (above>=8 ? above : below)));
        panel.style.setProperty('left',left+'px','important');
        panel.style.setProperty('top',top+'px','important');
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
      const options=[['Home Notes','pi-database-notes-v1'],['✦ On My Radar','__focus__']]
        .filter(([name,key])=>key!==source.key && !(source.key==='pi-focus-now-v1' && key==='__focus__'));
      const actions=options.map(([name,key])=>[name,()=> {
        if (source.key === 'pi-focus-now-v1') {
          if (!window.PIHomeMoveFromFocus?.(source.id,key)) alert('Move not completed; item remains in Focus.');
        } else if (key === '__focus__') {
          if (!window.PIHomeMoveToFocus?.(source.key,source.id)) alert('Move not completed; item remains in its table.');
        } else moveWithinHome(row,key);
      }]);
      sections.push(scope('Within Home ▾',actions));
    } else if (source.scope==='aquarium') {
      const state=getData(formKey('aquarium'),null);
      const card=state?.cards?.find(x=>x.id===source.id);
      const zones=[['Inbox','inbox'],...(state?.categories||[]).map(c=>[c.name,c.id])];
      sections.push(scope('Within Aquarium ▾',zones.filter(([,id])=>id!==card?.zone).map(([name,id])=>
        [name,()=> {
          try {
            const current=getData(formKey('aquarium'),null);
            const entry=current?.cards?.find(x=>x.id===source.id);
            if (!entry) throw new Error('Card changed; refresh first.');
            entry.zone=id;
            localStorage.setItem(formKey('aquarium'),JSON.stringify(current));
            location.reload();
          }catch(error){alert('Move not completed: '+error.message);}
        }] )));
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
    } else if (source.scope==='week' || source.scope==='month' || source.scope==='next-month') {
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
    document.querySelectorAll('.aq-card').forEach(row=>{
      const actions=row.querySelector('.aq-card-actions');
      if (!actions) return;
      addMenus(row,actions);
      // The Aquarium already has a cross-page ⋮ menu. Put the *real*,
      // working Archive/Delete buttons inside it instead of leaving two
      // duplicates in each card header. Nothing about the save code changes.
      const panel=actions.querySelector(':scope > .pi-cross-menu > .pi-cross-panel');
      const archive=actions.querySelector(':scope > .aq-card-archive');
      const remove=actions.querySelector(':scope > .aq-card-delete');
      const focus=actions.querySelector(':scope > .aq-card-focus');
      if(panel && archive && remove){
        const group=document.createElement('div');
        group.className='pi-aq-menu-actions';
        if(focus){ focus.textContent='Pop out note'; focus.classList.add('aq-menu-button'); group.append(focus); }
        archive.textContent='Archive';remove.textContent='Delete';
        archive.classList.add('aq-menu-button');remove.classList.add('aq-menu-button');
        group.append(archive,remove);
        panel.prepend(group);
      }
    });
    document.querySelectorAll('.pi-note-card').forEach(row=>{
      const head=row.querySelector('.pi-note-card-head');if(head)addMenus(row,head);
    });
    // Alignment V21.7: its existing ⋮ now includes the same cross-page
    // destinations, rather than injecting a duplicate ⋮ beside it.
    document.querySelectorAll('.longform-entry').forEach(row=>{
      const legacySummary=row.querySelector('.longform-card-tools > summary');
      if(legacySummary && legacySummary.textContent!=='⋮') { legacySummary.textContent='⋮';legacySummary.title='Item options and move'; }
      const existing=row.querySelector('.longform-card-tool-panel');
      if (existing) { addMenus(row,existing,true); attachFloatingMenu(existing.closest('.longform-card-tools'),existing); }
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
    document.querySelectorAll('.pi-cross-menu[open], .database-page .pi-item-tools[open], .longform-card-tools[open]').forEach(menu=>{
      const panel=menu.querySelector('.pi-cross-panel, .pi-item-tools-panel, .longform-card-tool-panel');
      if (!menu.contains(event.target) && !panel?.contains(event.target)) menu.open=false;
    });
  },true);
  // Keep day actions in the requested order; leave all header color
  // and date label styling to the original theme rules in Style.css.
  function polishHomeDays(){
    if(page !== 'home')return;
    document.querySelectorAll('.database-page .day-card').forEach(card=>{
      const head=card.querySelector(':scope > .day-card-top');
      const archive=head?.querySelector('.day-archive-button');
      const pop=head?.querySelector('.pi-popout-button');
      if(!head || !archive)return;
      if(archive.nextElementSibling!==pop){
        if(pop)head.insertBefore(archive,pop);
        else head.append(archive);
      }
    });
  }
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    document.querySelectorAll('.pi-cross-menu[open], .database-page .pi-item-tools[open], .longform-card-tools[open]').forEach(menu=>{menu.open=false;});
  });
  document.addEventListener('DOMContentLoaded',()=>{
    const syncBadge=document.getElementById('saveStatus');
    if (syncBadge) {
      const simplifySynced=()=>{
        if (syncBadge.dataset.syncState === 'connected' && /(?:synced safely|saved safely)/i.test(syncBadge.textContent || ''))
          syncBadge.textContent='synced ☁️';
      };
      new MutationObserver(simplifySynced).observe(syncBadge,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['data-sync-state']});
      simplifySynced();
    }
    queue();polishHomeDays();
    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='childList')){queue();polishHomeDays();}
    });
    observer.observe(document.body,{subtree:true,childList:true});
    window.addEventListener('resize',()=>{queue();polishHomeDays();},{passive:true});
  });
})();
;

/* ===== Original module: HeaderPolish.js ===== */
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
;
