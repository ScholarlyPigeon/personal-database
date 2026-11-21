/* V29: The Intranet. Direct rich editing, section-specific cloud storage,
   native shared colors/menus, and Archive integration. No Planner migrations. */
(() => {
  'use strict';
  const app = document.getElementById('piLandingApp');
  if (!app) return;
  const PREFIX = 'pi-intranet-home-v1-';
  const MARQUEE_KEY = PREFIX + 'marquee';
  const DEFAULT_MARQUEE = '✦ welcome to my corner of the internet ✦';
  const labels = {goals:'Goals',week:'this week',today:'today',notes:'notes'};
  const editors = new Map();
  const timeouts = new Map();
  const baselines = new Map();
  const notification = document.getElementById('piIntranetMessage');
  const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const escapeText = text => {const span=document.createElement('span');span.textContent=String(text ?? '');return span.innerHTML;};
  const defaultFootnote = notification?.textContent || '';
  let noteTimeout;
  const tell = text => {
    if (!notification) return;
    clearTimeout(noteTimeout);
    notification.textContent = `✦ ${text} ✦`;
    noteTimeout = setTimeout(() => {notification.textContent=defaultFootnote;}, 4800);
  };
  const announceSave = () => {if (typeof window.showSaved==='function')window.showSaved();};
  const safeRead = key => {try{return localStorage.getItem(key);}catch{return null;}};
  const safeWrite = (key,value) => {
    try{localStorage.setItem(key,value);announceSave();return true;}
    catch(error){console.error('Intranet save failed',error);tell('Could not save; use Tools → backup and check browser storage');return false;}
  };

  /* Keep rich markup but remove scripts, styles, event attributes, embeds and
     unsafe links. Only checkbox inputs survive, never arbitrary form fields. */
  function sanitizeHTML(markup) {
    const template = document.createElement('template');
    template.innerHTML = String(markup || '');
    const allowed = new Set(['B','STRONG','I','EM','U','S','STRIKE','DEL','P','DIV','BR','UL','OL','LI','BLOCKQUOTE','SPAN','A','H3']);
    const drop = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','IMG','VIDEO','AUDIO','FORM','BUTTON','SELECT','TEXTAREA','LINK','META']);
    function clean(parent) {
      for (const node of [...parent.childNodes]) {
        if (node.nodeType === 8) {node.remove();continue;}
        if (node.nodeType !== 1) continue;
        const tag = node.tagName;
        if (tag === 'INPUT') {
          if (node.getAttribute('type') !== 'checkbox') {node.remove();continue;}
          const checked = node.hasAttribute('checked');
          [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
          node.type = 'checkbox';node.contentEditable = 'false';
          if (checked) node.setAttribute('checked','');
          continue;
        }
        if (drop.has(tag)) {node.remove();continue;}
        if (!allowed.has(tag)) {
          while (node.firstChild) parent.insertBefore(node.firstChild,node);
          node.remove();
          clean(parent);
          continue;
        }
        const href = tag==='A' ? node.getAttribute('href') : null;
        const checklist = tag==='UL' && node.classList.contains('pi-intranet-checklist');
        [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
        if (tag==='A' && href && /^(https?:\/\/|mailto:)/i.test(href.trim())) {
          node.setAttribute('href',href.trim());node.setAttribute('target','_blank');node.setAttribute('rel','noopener noreferrer');
        }
        if (checklist)node.className='pi-intranet-checklist';
        clean(node);
      }
    }
    clean(template.content);
    // Any accidental pasted checkbox outside a checklist becomes plain text.
    template.content.querySelectorAll('input[type=checkbox]').forEach(box=>{
      if (!box.closest('ul.pi-intranet-checklist'))box.replaceWith(document.createTextNode(box.hasAttribute('checked')?'☑ ':'☐ '));
    });
    return template.innerHTML;
  }

  function normalizeChecklists(editor) {
    editor.querySelectorAll('ul.pi-intranet-checklist').forEach(list=>{
      for (const child of [...list.children]) {
        if(child.tagName!=='LI') continue;
        const boxes=[...child.querySelectorAll('input[type=checkbox]')];
        if(!boxes.length){const box=document.createElement('input');box.type='checkbox';box.contentEditable='false';child.prepend(box);}
        else {
          boxes.slice(1).forEach(box=>box.remove());
          const box=boxes[0];box.contentEditable='false';
          if(child.firstElementChild!==box) child.prepend(box);
          box.toggleAttribute('checked',box.checked);
        }
      }
    });
  }
  function storageKey(section) {return PREFIX + section;}
  function persistedHTML(editor) {
    normalizeChecklists(editor);
    return sanitizeHTML(editor.innerHTML);
  }
  function saveEditor(section) {
    clearTimeout(timeouts.get(section));
    timeouts.delete(section);
    const editor=editors.get(section);
    if(!editor)return;
    const html=persistedHTML(editor);
    if(html===baselines.get(section))return;
    if(safeWrite(storageKey(section),html))baselines.set(section,html);
  }
  function scheduleSave(section) {
    clearTimeout(timeouts.get(section));
    timeouts.set(section,setTimeout(()=>saveEditor(section),350));
  }
  function editorHasContent(editor) {
    return !!editor.innerText?.replace(/[\u200b\u00a0]/g,' ').trim() || !!editor.querySelector('input[type=checkbox]');
  }
  function getArchive() {
    try {const items=JSON.parse(safeRead('pi-archive-v1')||'[]');return Array.isArray(items)?items:[];}
    catch{return [];}
  }
  function latestArchived(section) {
    return getArchive().find(entry=>entry?.recordType==='item' && entry?.source==='The Intranet' && entry?.metadata?.intranetSection===section);
  }
  function archiveSection(section) {
    const editor=editors.get(section);
    if(!editor || !editorHasContent(editor)) {tell(`Nothing to archive in ${labels[section]}`);return;}
    if(!confirm(`Archive everything in “${labels[section]}” and empty this table?\n\nIt will remain under Archive → Archived Items, and you can restore it from this table's ⋮ menu.`))return;
    saveEditor(section);
    const html=persistedHTML(editor);
    const text=editor.innerText.trim() || '[Checklist]';
    const metadata={intranetSection:section,html,originalPage:'Home.html',createdAt:new Date().toISOString()};
    const done=typeof window.archiveManualItem==='function'
      ? window.archiveManualItem({text,source:'The Intranet',context:labels[section],kind:'rich-text dashboard',metadata})
      : (()=>{
        const items=getArchive();
        items.unshift({id:'intranet-'+uid(),recordType:'item',text,source:'The Intranet',context:labels[section],kind:'rich-text dashboard',metadata,archivedAt:new Date().toISOString()});
        return safeWrite('pi-archive-v1',JSON.stringify(items));
      })();
    if(!done) {tell('Archive was not saved; the table has been left intact');return;}
    editor.innerHTML='';saveEditor(section);
    tell(`${labels[section]} archived · restore from its ⋮ menu`);
  }
  function deleteSection(section) {
    const editor=editors.get(section);
    if(!editor || !editorHasContent(editor)) {tell(`${labels[section]} is already empty`);return;}
    if(!confirm(`Permanently delete the contents of “${labels[section]}”?\n\nTo keep a copy, choose Archive contents instead.`))return;
    editor.innerHTML='';saveEditor(section);tell(`${labels[section]} cleared`);
  }
  function restoreSection(section) {
    const record=latestArchived(section);
    if(!record){tell(`No archived ${labels[section]} contents to restore`);return;}
    const editor=editors.get(section);
    if(!editor)return;
    if(editorHasContent(editor) && !confirm(`Replace the current “${labels[section]}” contents with the most recently archived version?\n\nYou can archive the current contents first if you want to keep them.`))return;
    const restored=sanitizeHTML(record.metadata?.html || `<p>${escapeText(record.text)}</p>`);
    // Retain the archive record unless both saving the editor and removing the
    // archive entry succeed. The archive is the recovery copy.
    const previous=editor.innerHTML;
    editor.innerHTML=restored;
    saveEditor(section);
    if(safeRead(storageKey(section))!==persistedHTML(editor)){
      editor.innerHTML=previous;return;
    }
    const remaining=getArchive().filter(item=>item.id!==record.id);
    if(safeWrite('pi-archive-v1',JSON.stringify(remaining)))tell(`Restored ${labels[section]} from Archive`);
    else tell('Restored your table; archive copy remains as a safeguard');
  }

  /* Rich formatting stays on the same editable surface, with no separate
     composer. The existing global Ctrl/Cmd+B/I/U shortcuts also work. */
  const controls = [
    ['bold','B','Bold (Ctrl/Cmd+B)'],['italic','I','Italic (Ctrl/Cmd+I)'],
    ['underline','U','Underline (Ctrl/Cmd+U)'],['strikeThrough','S','Strikethrough'],
    ['sep','',''],
    ['insertUnorderedList','• List','Bulleted list'],['insertOrderedList','1. List','Numbered list'],
    ['checklist','☑ Task','Insert a clickable checklist'],['createLink','🔗','Add a link']
  ];
  const selectionByEditor = new WeakMap();
  function captureSelection(editor) {
    const sel=window.getSelection();
    if(sel?.rangeCount && editor.contains(sel.anchorNode))selectionByEditor.set(editor,sel.getRangeAt(0).cloneRange());
  }
  function useSelection(editor) {
    editor.focus();
    const range=selectionByEditor.get(editor);
    if(range && editor.contains(range.commonAncestorContainer)){
      const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
    }
  }
  function insertTask(editor) {
    const snippet='<ul class="pi-intranet-checklist"><li><input type="checkbox" contenteditable="false"> New task</li></ul><p><br></p>';
    document.execCommand('insertHTML',false,snippet);
    normalizeChecklists(editor);
  }
  function applyFormat(editor,command) {
    useSelection(editor);
    if(command==='checklist')insertTask(editor);
    else if(command==='createLink'){
      const url=prompt('Link URL (https://… or mailto:…):');
      if(!url)return;
      if(!/^(https?:\/\/|mailto:)/i.test(url.trim())){tell('Links must begin with https://, http:// or mailto:');return;}
      document.execCommand('createLink',false,url.trim());
    } else document.execCommand(command,false,null);
    captureSelection(editor);
    editor.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function buildToolbar(card,editor) {
    const toolbar=card.querySelector('.pi-intranet-formatbar');
    if(!toolbar)return;
    controls.forEach(([action,label,title])=>{
      if(action==='sep'){
        const divider=document.createElement('span');divider.className='pi-intranet-format-spacer';divider.setAttribute('aria-hidden','true');toolbar.append(divider);return;
      }
      const button=document.createElement('button');button.type='button';button.dataset.format=action;
      button.textContent=label;button.setAttribute('aria-label',title);button.title=title;
      button.addEventListener('pointerdown',event=>{
        // Preserve browser text selection while clicking a format button.
        if(event.pointerType==='mouse')event.preventDefault();
      });
      button.addEventListener('click',event=>{event.preventDefault();applyFormat(editor,action);});
      toolbar.append(button);
    });
  }
  function handleChecklistEnter(event,editor) {
    if(event.key!=='Enter' || event.shiftKey || event.isComposing)return;
    const sel=window.getSelection();if(!sel || !sel.rangeCount)return;
    const li=sel.anchorNode?.nodeType===1?sel.anchorNode.closest('li'):sel.anchorNode?.parentElement?.closest('li');
    if(!li || !editor.contains(li) || !li.parentElement?.classList.contains('pi-intranet-checklist'))return;
    event.preventDefault();
    const list=li.parentElement;
    const content=li.textContent?.replace(/\u00a0/g,' ').trim();
    const range=sel.getRangeAt(0);
    if(!content) {
      const paragraph=document.createElement('p');paragraph.append(document.createElement('br'));
      list.after(paragraph);li.remove();if(!list.children.length)list.remove();
      range.selectNodeContents(paragraph);range.collapse(true);
    }else{
      const tail=document.createRange();tail.setStart(range.startContainer,range.startOffset);tail.setEndAfter(li.lastChild);
      const frag=tail.extractContents();
      const next=document.createElement('li');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.contentEditable='false';
      next.append(checkbox,document.createTextNode(' '));next.append(frag);
      li.after(next);
      range.setStartAfter(checkbox);range.collapse(true);
    }
    sel.removeAllRanges();sel.addRange(range);
    editor.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function bindSection(card) {
    const section=card.dataset.intranetSection;
    const editor=card.querySelector('.pi-intranet-rich-editor');
    if(!section || !editor)return;
    editors.set(section,editor);
    const initial=safeRead(storageKey(section));
    if(initial!==null)editor.innerHTML=sanitizeHTML(initial);
    baselines.set(section,initial===null?'':sanitizeHTML(initial));
    normalizeChecklists(editor);
    buildToolbar(card,editor);
    editor.addEventListener('focus',()=>card.classList.add('is-editing'));
    editor.addEventListener('blur',()=>{
      saveEditor(section);
      // A cloud check may have updated this key while the editor was focused.
      // Adopt it only once local edits have been flushed.
      card.classList.remove('is-editing');
    });
    editor.addEventListener('input',()=>{captureSelection(editor);scheduleSave(section);});
    editor.addEventListener('keyup',()=>captureSelection(editor));
    editor.addEventListener('mouseup',()=>captureSelection(editor));
    editor.addEventListener('keydown',event=>handleChecklistEnter(event,editor));
    editor.addEventListener('paste',event=>{
      event.preventDefault();
      const transfer=event.clipboardData;
      const html=transfer?.getData('text/html');
      const text=transfer?.getData('text/plain')||'';
      const safe=html?sanitizeHTML(html):escapeText(text).replace(/\r?\n/g,'<br>');
      document.execCommand('insertHTML',false,safe);
      editor.dispatchEvent(new Event('input',{bubbles:true}));
    });
    editor.addEventListener('change',event=>{
      if(!event.target.matches('input[type="checkbox"]'))return;
      event.target.toggleAttribute('checked',event.target.checked);
      saveEditor(section);
    });
    editor.addEventListener('click',event=>{
      const link=event.target.closest('a[href]');
      if(link && !event.ctrlKey && !event.metaKey)event.preventDefault();
    });
    card.querySelector('.pi-intranet-action-archive')?.addEventListener('click',()=>archiveSection(section));
    card.querySelector('.pi-intranet-action-delete')?.addEventListener('click',()=>deleteSection(section));
    card.querySelector('.pi-intranet-action-restore')?.addEventListener('click',()=>restoreSection(section));
  }
  app.querySelectorAll('[data-intranet-section]').forEach(bindSection);

  /* Seamless ticker with directly editable, plain-text content. */
  const marquee=document.getElementById('piIntranetMarquee');
  const repeat=app.querySelector('.pi-intranet-marquee-repeat');
  const marqueeContainer=app.querySelector('.pi-intranet-marquee');
  const marqueeEdit= document.getElementById('piIntranetEditMarquee');
  let marqueeOriginal=safeRead(MARQUEE_KEY) ?? DEFAULT_MARQUEE;
  marquee.textContent=marqueeOriginal;
  repeat.textContent=marqueeOriginal;
  baselines.set('marquee',marqueeOriginal);
  function saveMarquee(){
    clearTimeout(timeouts.get('marquee'));
    timeouts.delete('marquee');
    const value=marquee.textContent.replace(/[\r\n]+/g,' ').replace(/\s+/g,' ').trim().slice(0,600);
    if(document.activeElement!==marquee)marquee.textContent=value;
    repeat.textContent=value||DEFAULT_MARQUEE;
    if(value!==baselines.get('marquee') && safeWrite(MARQUEE_KEY,value))baselines.set('marquee',value);
    marqueeOriginal=value;
  }
  marquee.addEventListener('focus',()=>marqueeContainer.classList.add('is-editing'));
  marquee.addEventListener('input',()=>{
    repeat.textContent=marquee.textContent;
    clearTimeout(timeouts.get('marquee'));
    timeouts.set('marquee',setTimeout(saveMarquee,350));
  });
  marquee.addEventListener('blur',()=>{
    saveMarquee();marqueeContainer.classList.remove('is-editing');
  });
  marquee.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();marquee.blur();}
    if(event.key==='Escape'){
      event.preventDefault();marquee.textContent=marqueeOriginal;repeat.textContent=marqueeOriginal;marquee.blur();
    }
  });
  marquee.addEventListener('paste',event=>{
    event.preventDefault();
    document.execCommand('insertText',false,event.clipboardData?.getData('text/plain').replace(/[\r\n]+/g,' ')||'');
  });
  marqueeEdit?.addEventListener('click',()=>{
    marquee.focus();
    const selection=window.getSelection();const range=document.createRange();range.selectNodeContents(marquee);
    selection.removeAllRanges();selection.addRange(range);
  });

  /* Calendars: hover on desktop; click/keyboard on touch and small screens. */
  const calendar=app.querySelector('.pi-intranet-calendars');
  const toggle=calendar?.querySelector('.pi-intranet-calendars-toggle');
  function closeCalendars(){calendar?.classList.remove('is-open');toggle?.setAttribute('aria-expanded','false');}
  toggle?.addEventListener('click',event=>{
    event.stopPropagation();const open=calendar.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded',String(open));
  });
  toggle?.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){
      event.preventDefault();calendar.classList.add('is-open');toggle.setAttribute('aria-expanded','true');
      calendar.querySelector('.pi-intranet-calendar-popover a')?.focus();
    }
  });
  calendar?.addEventListener('keydown',event=>{if(event.key==='Escape'){closeCalendars();toggle.focus();}});
  document.addEventListener('pointerdown',event=>{if(!calendar?.contains(event.target))closeCalendars();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeCalendars();});

  /* CloudSync writes localStorage from the same page, which doesn't trigger a
     storage event. Poll only these tiny fields to reflect remote changes while
     not replacing a field currently in use. */
  function refreshFromStorage() {
    for(const [section,editor] of editors) {
      if(document.activeElement===editor || editor.contains(document.activeElement))continue;
      if(timeouts.has(section)) { // A scheduled input save is still pending.
        const timer=timeouts.get(section);
        if(timer)continue;
      }
      const raw=safeRead(storageKey(section))??'';
      if(raw===baselines.get(section))continue;
      editor.innerHTML=sanitizeHTML(raw);normalizeChecklists(editor);baselines.set(section,raw);
    }
    if(document.activeElement!==marquee){
      const next=safeRead(MARQUEE_KEY)??DEFAULT_MARQUEE;
      if(next!==baselines.get('marquee')){
        marquee.textContent=next;repeat.textContent=next;
        baselines.set('marquee',next);marqueeOriginal=next;
      }
    }
  }
  window.addEventListener('storage',event=>{
    if(event.key?.startsWith(PREFIX) || event.key===null)refreshFromStorage();
  });
  setInterval(refreshFromStorage,2700);
  window.addEventListener('pagehide',()=>{
    for(const section of editors.keys())saveEditor(section);
    if(document.activeElement===marquee)saveMarquee();
  });
})();
