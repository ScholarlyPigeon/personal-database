/* ===== Original module: ClickableHeadersV12.js ===== */
/* V12: tap empty space on a collapsible header to toggle its existing button.
   Editing titles, popouts, menus, and drag handles remain independent. */
(() => {
  const headerSelector = [
    '.panel-header', '.pi-focus-head', '.aq-category-head', '.aq-panel-head',
    '.longform-saved-section-head','.pi-notes-section-head',
    '.longform-library-head','.longform-composer-head',
    '.neo-panel-heading','.neo-dailies-head','.almanac-panel-head',
    '.archive-v2-panel-head','.pi-category-note', '.planner-category-head'
  ].join(',');
  const exclude = 'button,input,textarea,select,a,summary,details,[contenteditable="true"],[contenteditable=""],[role="textbox"],[draggable="true"],label,.pi-category-note-content,.pi-focus-detail,.planner-category-content,.item-row-actions,.pi-focus-actions';
  const targetToggle = (head, from) => {
    if (head.matches('.planner-category-head')) return head.querySelector('.planner-category-toggle');
    if (head.matches('.pi-category-note')) {
      if(from.closest('.pi-category-note-content,.pi-focus-detail'))return null;
      return head.querySelector(':scope > .item-row-actions > .pi-note-open, :scope > .pi-focus-actions > .pi-focus-expand');
    }
    if(head.matches('.aq-category-head'))return head.querySelector('.aq-category-collapse');
    if(head.matches('.longform-saved-section-head'))return head.querySelector('.longform-section-toggle');
    return head.querySelector(':scope > .panel-collapse-toggle, :scope > .pi-focus-collapse, :scope > .aq-panel-collapse, :scope > .pi-notes-section-toggle, :scope > .longform-section-toggle');
  };
  function resolve(event){
    const head=event.target.closest?.(headerSelector);
    if(!head)return null;
    const toggle=targetToggle(head,event.target);
    if(!toggle)return null;
    if(event.target!==head && event.target.closest(exclude))return null;
    return {head,toggle};
  }
  document.addEventListener('click',event=>{
    const hit=resolve(event);
    if(!hit)return;
    event.preventDefault();hit.toggle.click();
  });
  document.addEventListener('keydown',event=>{
    if(!['Enter',' '].includes(event.key)||event.target!==event.target.closest?.(headerSelector))return;
    const hit=resolve(event);
    if(!hit)return;
    event.preventDefault();hit.toggle.click();
  });
  // Dynamically generated headers also get keyboard access. Never replace
  // existing click listeners or turn a container with embedded buttons into a button.
  function bind(){
    document.querySelectorAll(headerSelector).forEach(head=>{
      if(!head.dataset.piHeaderClickBound && targetToggle(head,head)){
        head.dataset.piHeaderClickBound='1';
        if(!head.hasAttribute('tabindex'))head.tabIndex=0;
        head.title ||= 'Click empty header space to expand or collapse';
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;bind();});}).observe(document.documentElement,{subtree:true,childList:true});
})();
;

/* ===== Original module: IntranetFixV13.js ===== */
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
;

/* ===== Original module: IntranetRefinementV14.js ===== */
/* V14: consistent compose shortcuts and safe, nonintrusive editor behavior. */
(() => {
  'use strict';
  const newEntrySelector = [
    '#databaseNotesInput','.day-entry-row .day-input',
    '.pi-nested-compose textarea','.planner-category-add textarea',
    '.planner-day-form textarea','#plannerNoteInput',
    '#captureInput','#aqCaptureTitle','#longformInput','#longformTitleInput',
    '#piTimelineTitle','#piTimelineBody','#patternInput','#timelineMarkerInput',
    '.pi-timeline-add textarea'
  ].join(',');
  const submit = node => {
    if(node.closest('form')) {
      const form=node.closest('form');
      if(form.querySelector('[type="submit"]')) {form.requestSubmit();return true;}
    }
    let btn;
    if(node.matches('#databaseNotesInput'))btn=document.getElementById('addDatabaseNote');
    else if(node.matches('.day-entry-row .day-input'))btn=node.closest('.day-entry-row')?.querySelector('button');
    else if(node.matches('#captureInput,#aqCaptureTitle'))btn=document.getElementById('captureBtn');
    else if(node.matches('#longformInput,#longformTitleInput'))btn=document.getElementById('saveLongformEntry');
    else if(node.matches('#piTimelineTitle,#piTimelineBody,.pi-timeline-add textarea'))btn=document.getElementById('piAddTimeline');
    else if(node.matches('#patternInput'))btn=document.getElementById('addPattern');
    else if(node.matches('#timelineMarkerInput'))btn=document.getElementById('addTimelineMarker');
    if(btn){btn.click();return true;}return false;
  };
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||event.shiftKey||event.isComposing||event.altKey)return;
    const node=event.target.closest?.(newEntrySelector);
    if(!node)return;
    if(submit(node)){
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);
  // These save hints describe the same keyboard behavior across all editors.
  const labelChanges={
    '.aq-shortcut':'Enter saves · Shift+Enter adds a line',
    '.longform-submit-note':'Enter saves · Shift+Enter adds a line'
  };
  const repaint=()=>Object.entries(labelChanges).forEach(([selector,value])=>{
    const el=document.querySelector(selector);if(el&&el.textContent!==value)el.textContent=value;
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',repaint,{once:true});else repaint();
})();
;

/* ===== Original module: IntranetToolsV16.js ===== */
/* V16: common Tools actions, conservative bulk archive, consistent entry hints,
   and opt-in formatted text editing. Existing storage and cloud sync are reused. */
(() => {
  'use strict';
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const pageName = () => location.pathname.split('/').pop().toLowerCase();
  const page = pageName();
  const archiveKey = 'pi-archive-v1';

  function initTools() {
    const host = document.querySelector('header .header-right, header .aq-header-actions, header .almanac-header-actions, header .longform-header-actions, header .patterns-header-actions, header .neo-header-tools, header .pi-home-header-actions');
    if (!host) return;
    let menu = host.querySelector('.pi-tools-menu');
    if (!menu) {
      menu = document.createElement('details'); menu.className = 'ecosystem-menu pi-tools-menu';
      const summary = document.createElement('summary'); summary.textContent = 'tools';
      const tray = document.createElement('div'); tray.className = 'pi-tools-popover';
      menu.append(summary, tray); host.append(menu);
    }
    const tray = menu.querySelector('.pi-tools-popover') || (() => {
      const el = document.createElement('div'); el.className = 'pi-tools-popover'; menu.append(el); return el;
    })();
    // Hide selection-only actions, without modifying the underlying selection logic.
    $$('.selection-mode-button, .selection-action-button', tray).forEach(button => {
      button.hidden = true; button.classList.add('pi-v16-retired-select');
    });
    const action = (label, id, onclick) => {
      let button = tray.querySelector('#' + id);
      if (!button) {
        button = document.createElement('button'); button.type = 'button';
        button.id = id; button.className = 'small-button pi-v16-tool-action';
        button.textContent = label; tray.append(button);
      }
      if (onclick && !button.dataset.piV16Bound) {button.dataset.piV16Bound = '1';button.addEventListener('click', () => {menu.open = false; onclick();});}
      return button;
    };
    action('🔎 Search all pages', 'piV16Search', () => {
      if (typeof window.PIOpenSearch === 'function') window.PIOpenSearch();
      else alert('Search is still loading. Please try again.');
    });
    // Home already has a backup button with its original CloudSync listener.
    let backup = document.getElementById('localBackupButton');
    if (backup) {
      tray.append(backup);
      backup.textContent = '↓ Download backup';
    } else {
      backup = action('↓ Download backup', 'piV16Backup', () => {
        if (typeof window.PICloud?.backup === 'function') window.PICloud.backup();
        else alert('Backup is not ready. Please reload and try again.');
      });
    }
    action('↧ Archive all completed', 'piV16ArchiveCompleted', archivePageCompleted);
    $$('.pi-v16-tool-action, .backup-button', tray).forEach(button => button.title ||= button.textContent.trim());
  }

  const parseArray = key => {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const value = JSON.parse(raw); // Never silently overwrite corrupted/unknown data.
    if (!Array.isArray(value)) throw Error(`Unexpected data format in ${key}. No changes made.`);
    return value;
  };
  function archivePageCompleted() {
    if (page === 'aquarium.html') {
      const native = document.getElementById('archiveDone');
      if (!native) {alert('Aquarium archive action is unavailable.');return;}
      const raw = localStorage.getItem('pi-aquarium-state-v3');
      let total = 0;
      try {total = JSON.parse(raw || '{}').cards?.filter(x => x.done).length || 0;}catch(e){alert('Cannot read Aquarium cards. Nothing was changed.');return;}
      if (!total) {alert('There are no completed Aquarium cards to archive.');return;}
      if (confirm(`Archive ${total} completed Aquarium card${total === 1 ? '' : 's'}?`)) native.click();
      return;
    }
    const entries = [];
    const updates = new Map();
    const take = (item, source, context) => {
      const text = [item.text || item.title || item.label || '',item.details || item.body || ''].filter(Boolean).join('\n\n').trim();
      if (!text) return false;
      entries.push({
        id:'item-'+(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        recordType:'item',text,source,context,kind:item.kind || '',
        originalDate:item.date || (context.match(/\d{4}-\d{2}-\d{2}/)?.[0] || null),
        createdAt:item.createdAt || null, completedAt:item.completedAt || null,
        archivedAt:new Date().toISOString(),metadata:JSON.parse(JSON.stringify(item))
      });
      return true;
    };
    const collect = (key, source, context) => {
      const records = parseArray(key);
      if (!records) return;
      let touched = false;
      const kept = [];
      records.forEach(item => {
        if (!item || typeof item !== 'object') {kept.push(item);return;}
        if (item.done && item.checkable !== false && take(item, source, context)) {touched = true;return;}
        if (Array.isArray(item.subtasks)) {
          const remain = [];
          item.subtasks.forEach(sub => {
            if (sub?.done && take(sub,source+' · checklist',`${context}${context?' · ':''}${item.text || item.title || 'Category'}`)) {touched = true;}
            else remain.push(sub);
          });
          if (remain.length !== item.subtasks.length) {kept.push({...item, subtasks:remain});return;}
        }
        kept.push(item);
      });
      if (touched) updates.set(key,JSON.stringify(kept));
    };
    try {
      if (page === 'database.html') {
        collect('pi-focus-now-v1','On My Radar','Home');
        collect('pi-database-notes-v1','Home Notes','Home');
        $$('#dayRail .day-list[data-storage-key]').forEach(list => collect(list.dataset.storageKey,'Calendar',list.dataset.storageKey.slice('pi-calendar-day-'.length)));
      } else if (['week.html','month.html','nextmonth.html'].includes(page)) {
        if (location.search.includes('month=')) {alert('Historical month views are read-only. Nothing was changed.');return;}
        const descriptor = page === 'week.html' ? 'This Week' : page === 'month.html' ? 'This Month' : 'Next Month';
        const keys = new Set($$('#plannerGrid .planner-day[data-date]').map(day => 'pi-calendar-day-' + day.dataset.date));
        keys.forEach(key => collect(key,'Calendar',key.slice('pi-calendar-day-'.length)));
        const month = $$('#plannerGrid .planner-day[data-date]')[0]?.dataset.date?.slice(0,7);
        collect(page === 'week.html' ? 'pi-planner-week-notes-v1' : 'pi-planner-month-'+month,descriptor+' Notes',descriptor);
      } else if (page === 'neopets.html') {
        const key='pi-neopets-state-v3';
        const raw=localStorage.getItem(key);
        if (raw) {
          const state=JSON.parse(raw);
          if (!state || typeof state!=='object' || !Array.isArray(state.streaks)) throw Error('Unexpected Neopets data format. Nothing changed.');
          const completed=state.streaks.filter(item=>item?.done);
          const archivedIds = new Set();
          completed.forEach(item=>{if(take(item,'Neopets','Streaks'))archivedIds.add(item.id);});
          if (archivedIds.size) {state.streaks=state.streaks.filter(item=>!archivedIds.has(item?.id));updates.set(key,JSON.stringify(state));}
        }
      } else {
        alert('No completed checklists to archive on this page. Your notes are untouched.');return;
      }
      if (!entries.length) {alert('Nothing is marked completed on this page. Your notes are untouched.');return;}
      if (!confirm(`Archive ${entries.length} completed item${entries.length===1?'':'s'} from this page?\n\nOnly checked-off entries will move to Archive. Unfinished notes stay put.`)) return;
      const previous = new Map();
      const originalArchive = localStorage.getItem(archiveKey);
      const existing = originalArchive === null ? [] : JSON.parse(originalArchive);
      if (!Array.isArray(existing)) throw Error('Archive format is unexpected. Nothing changed.');
      try {
        localStorage.setItem(archiveKey,JSON.stringify([...entries,...existing]));
        for(const [key,value] of updates){previous.set(key,localStorage.getItem(key));localStorage.setItem(key,value);}
      } catch (error) {
        // Best effort rollback before exposing an incomplete move.
        for (const [key,raw] of previous) {try {raw===null?localStorage.removeItem(key):localStorage.setItem(key,raw);}catch(e){console.error('Rollback failed',key,e);}}
        try {originalArchive===null?localStorage.removeItem(archiveKey):localStorage.setItem(archiveKey,originalArchive);}catch(e){console.error('Archive rollback failed',e);}
        throw error;
      }
      // Script closures cache their own lists: reload to re-read the actual saved records.
      location.reload();
    } catch(e) {
      console.error('Archive completed failed; preserved original data where possible:',e);
      alert(`Archive stopped for safety: ${e.message}\nNo further changes were attempted. Download a backup before retrying.`);
    }
  }

  // Consistent entry prompts; identifiers and URL-oriented inputs retain their
  // dedicated guidance, rather than becoming ambiguous.
  function tuneHints(root = document) {
    $$('textarea, input[type="text"], [contenteditable="true"][data-placeholder]',root).forEach(el => {
      if (el.closest('.pi-v16-rich-dialog, .pi-overlay, .link-editor, .neo-link-editor')) return;
      const label = `${el.id} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('placeholder') || ''}`;
      if (/url|link|https|icon|date|filter|search|name of|category|title of new|\bsection\b|hex|\bid\b/i.test(label) && el.tagName==='INPUT') return;
      if(el.matches('input')) {
        if (el.hasAttribute('placeholder')) el.placeholder='. . .';
      } else if (el.matches('textarea')) el.placeholder='. . .';
      else el.dataset.placeholder='. . .';
    });
  }

  // Lightweight rich-text composer: the app's existing synced plain-string fields
  // store basic inline markup. A separate editor avoids invasive schema changes.
  let lastField=null, richDialog=null;
  const escapeHtml = text => String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function toMarkupHtml(value) {
    let text = escapeHtml(value || '');
    // Strip only the formatting delimiters this editor creates; no user HTML executes.
    text=text.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g,'<em>$1</em>')
      .replace(/\+\+([^+\n]+)\+\+/g,'<u>$1</u>')
      .replace(/~~([^~\n]+)~~/g,'<s>$1</s>');
    return text.replace(/\n/g,'<br>');
  }
  function fromRichHtml(root) {
    function travel(node) {
      if(node.nodeType===Node.TEXT_NODE)return node.nodeValue || '';
      if(node.nodeType!==Node.ELEMENT_NODE)return '';
      const tag=node.tagName.toLowerCase();
      if(tag==='br')return '\n';
      const inner=[...node.childNodes].map(travel).join('');
      if(['strong','b'].includes(tag)) return `**${inner}**`;
      if(['em','i'].includes(tag)) return `*${inner}*`;
      if(tag==='u')return `++${inner}++`;
      if(['s','strike','del'].includes(tag))return `~~${inner}~~`;
      if(tag==='li')return '• '+inner+'\n';
      if(['div','p'].includes(tag))return inner+'\n';
      return inner;
    }
    return [...root.childNodes].map(travel).join('').replace(/\u00a0/g,' ').replace(/\n{3,}/g,'\n\n').replace(/\n$/,'');
  }
  function isTextField(el) {
    if(!el || el.closest('.pi-v16-rich-dialog, .pi-overlay, header, .link-editor, .neo-link-editor'))return false;
    if(el.matches('textarea')) return true;
    if(el.matches('input[type="text"]')) return !/url|link|icon|search|filter|id|date|color/i.test(`${el.id} ${el.getAttribute('aria-label')||''}`);
    if(el.matches('[contenteditable="true"], [contenteditable=""]')) return true;
    return false;
  }
  function getText(el){return el.matches('input,textarea')?el.value:el.innerText;}
  function openRichEditor(el) {
    if (!el?.isConnected || !isTextField(el))return;
    if (!richDialog) {
      richDialog=document.createElement('dialog');richDialog.className='pi-v16-rich-dialog';
      richDialog.innerHTML=`<div class="pi-v16-rich-head"><strong>Format text</strong><button type="button" data-dismiss aria-label="Close">×</button></div>
        <div class="pi-v16-rich-toolbar" role="toolbar" aria-label="Text formatting">
          <button type="button" data-command="bold" title="Bold (Ctrl+B)"><b>B</b></button>
          <button type="button" data-command="italic" title="Italic (Ctrl+I)"><i>I</i></button>
          <button type="button" data-command="underline" title="Underline (Ctrl+U)"><u>U</u></button>
          <button type="button" data-command="strikeThrough" title="Strikethrough"><s>S</s></button>
          <button type="button" data-command="insertUnorderedList" title="Bulleted list">☷</button>
        </div>
        <div class="pi-v16-rich-input" contenteditable="true" spellcheck="true" role="textbox" aria-label="Formatted text editor"></div>
        <div class="pi-v16-rich-foot"><span>Formatting is stored with your existing notes.</span><button type="button" data-dismiss>Cancel</button><button type="button" data-save>Apply text</button></div>`;
      document.body.append(richDialog);
      richDialog.addEventListener('click', e => {if(e.target===richDialog || e.target.closest('[data-dismiss]'))richDialog.close();});
      $$('[data-command]',richDialog).forEach(button=>{
        button.addEventListener('pointerdown',e=>e.preventDefault());
        button.addEventListener('click',()=>{
          const editor=richDialog.querySelector('.pi-v16-rich-input');editor.focus();
          document.execCommand(button.dataset.command,false,null);
        });
      });
      richDialog.querySelector('[data-save]').addEventListener('click',()=>{
        const target=richDialog.piSource;
        if (!target?.isConnected) {richDialog.close();return;}
        const result=fromRichHtml(richDialog.querySelector('.pi-v16-rich-input'));
        richDialog.close();
        if(target.matches('input,textarea'))target.value=result;
        else target.textContent=result;
        target.dispatchEvent(new Event('input',{bubbles:true}));
        target.dispatchEvent(new Event('change',{bubbles:true}));
        // The field remains normal and independently editable afterward.
        target.blur();
      });
    }
    richDialog.piSource=el;
    richDialog.querySelector('.pi-v16-rich-input').innerHTML=toMarkupHtml(getText(el));
    richDialog.showModal();
    richDialog.querySelector('.pi-v16-rich-input').focus();
  }
  function enableFormatting() {
    const trigger=document.createElement('button');
    trigger.className='pi-v16-format-trigger';trigger.type='button';
    trigger.textContent='B I U';trigger.title='Format this text (bold, italic, underline, strikethrough or list)';
    trigger.hidden=true;document.body.append(trigger);
    trigger.addEventListener('pointerdown',e=>e.preventDefault());
    trigger.addEventListener('click',()=>{if(lastField)openRichEditor(lastField);});
    document.addEventListener('focusin',event=>{
      if(isTextField(event.target)){lastField=event.target;trigger.hidden=false;}
      else if(!event.target.closest('.pi-v16-format-trigger,.pi-v16-rich-dialog')){trigger.hidden=true;}
    });
    document.addEventListener('pointerdown',event=>{
      if(!event.target.closest('.pi-v16-format-trigger,.pi-v16-rich-dialog')&&!isTextField(event.target))trigger.hidden=true;
    });
    document.addEventListener('keydown',event=>{
      if(!event.ctrlKey&&!event.metaKey)return;
      if(!['b','i','u'].includes(event.key.toLowerCase()))return;
      if(isTextField(event.target)) {event.preventDefault();openRichEditor(event.target);}
    },true);
    // Inline style preview for read-only output only. Editing text still uses
    // the native textarea/contenteditable storage, never unsafe persisted HTML.
    let queued=false;
    const applyPreviews=()=>{
      queued=false;
      const selectors='.pi-focus-note-body, .planner-item-text:not([contenteditable]), .pi-search-text, .planner-preview-item, .pi-recent-item-text';
      $$(selectors).forEach(el=>{
        if(el.closest('[contenteditable="true"],.pi-v16-rich-dialog'))return;
        const text=el.textContent;
        if(!/(\*\*.+\*\*|\+\+.+\+\+|~~.+~~|\*[^*]+\*)/s.test(text))return;
        if(el.dataset.piV16Rendered==='1')return;
        el.dataset.piV16Rendered='1';
        el.innerHTML=toMarkupHtml(text);
      });
    };
    new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(applyPreviews);}}).observe(document.body,{childList:true,subtree:true});
    applyPreviews();
  }
  function init() {
    initTools();tuneHints();enableFormatting();
    let queued=false;
    new MutationObserver(mutations=>{
      if(queued || !mutations.some(m=>m.addedNodes.length))return;
      queued=true;requestAnimationFrame(()=>{queued=false;tuneHints();});
    }).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
;
