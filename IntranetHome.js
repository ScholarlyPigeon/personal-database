/* V29.4: The Intranet. Direct rich editing, section-specific cloud storage,
   native shared colors/menus, and Archive integration. No Planner migrations. */
(() => {
  'use strict';
  const app = document.getElementById('piLandingApp');
  if (!app) return;
  const PREFIX = 'pi-intranet-home-v1-';
  const MARQUEE_KEY = PREFIX + 'marquee';
  const DEFAULT_MARQUEE = '✦ Add your current north stars here ✦';
  const FONT_SIZES = [12,13,14,15,16,18,20];
  const DEFAULT_FONT_SIZE = 15;
  const validFontSize = value => FONT_SIZES.includes(Number(value)) ? Number(value) : DEFAULT_FONT_SIZE;
  const labels = {week:'this week',today:'today'};
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
    const allowed = new Set(['B','STRONG','I','EM','U','S','STRIKE','DEL','P','DIV','BR','UL','OL','LI','BLOCKQUOTE','SPAN','A','H3','DETAILS','SUMMARY','TABLE','THEAD','TBODY','TR','TD','TH']);
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
        if (drop.has(tag) || node.classList?.contains('pi-intranet-inline-actions') || node.classList?.contains('pi-intranet-table-header')) {node.remove();continue;}
        if (!allowed.has(tag)) {
          while (node.firstChild) parent.insertBefore(node.firstChild,node);
          node.remove();
          clean(parent);
          continue;
        }
        const href = tag==='A' ? node.getAttribute('href') : null;
        const checklist = tag==='UL' && node.classList.contains('pi-intranet-checklist');
        const dropdown = tag==='DETAILS' && node.classList.contains('pi-intranet-dropdown');
        const title = tag==='SPAN' && node.classList.contains('pi-intranet-dropdown-title') && !!node.closest('details.pi-intranet-dropdown');
        const body = tag==='DIV' && node.classList.contains('pi-intranet-dropdown-body') && !!node.closest('details.pi-intranet-dropdown');
        const summary = tag==='SUMMARY' && !!node.closest('details.pi-intranet-dropdown');
        const tableWidget = tag==='DIV' && node.classList.contains('pi-intranet-table-widget');
        const tableCell = (tag==='TD'||tag==='TH') && !!node.closest('.pi-intranet-table-widget');
        const opened = dropdown && node.hasAttribute('open');
        [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
        if (tag==='A' && href && /^(https?:\/\/|mailto:)/i.test(href.trim())) {
          node.setAttribute('href',href.trim());node.setAttribute('target','_blank');node.setAttribute('rel','noopener noreferrer');
        }
        if (checklist)node.className='pi-intranet-checklist';
        if (dropdown) {
          node.className='pi-intranet-dropdown';node.contentEditable='false';
          if(opened)node.setAttribute('open','');
        }
        if(summary)node.className='pi-intranet-dropdown-summary';
        if(title){node.className='pi-intranet-dropdown-title';node.contentEditable='true';}
        if(body){node.className='pi-intranet-dropdown-body';node.contentEditable='true';}
        if(tableWidget){node.className='pi-intranet-table-widget';node.contentEditable='false';}
        if(tableCell)node.contentEditable='true';
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
  /* Our small dropdowns are native <details> with separately editable title
     and body. The outer element is not editable so the caret cannot dissolve
     its structure. Only the allowed structure is persisted and synced. */
  /* Inline widget controls are recreated from saved HTML. Their buttons and
     menus NEVER become part of synced text, so only actual content is stored. */
  function addInlineActions(host,widget,kind) {
    if(host.querySelector(':scope > .pi-intranet-inline-actions'))return;
    const actions=document.createElement('span');
    actions.className='pi-intranet-inline-actions';
    actions.contentEditable='false';
    const trigger=document.createElement('button');
    trigger.type='button';trigger.className='pi-intranet-inline-trigger';
    trigger.textContent='⋮';trigger.title=`${kind==='table'?'Table':'Dropdown'} options`;
    trigger.setAttribute('aria-label',trigger.title);
    trigger.setAttribute('aria-expanded','false');
    const popover=document.createElement('span');
    popover.className='pi-intranet-inline-popover';
    const entries=[
      ['up','↑ Move up'],['down','↓ Move down'],
      ...(kind==='table' ? [['row-add','+ Row'],['col-add','+ Column'],['row-remove','− Row'],['col-remove','− Column']] : []),
      ['delete','✕ Delete']
    ];
    for(const [action,label] of entries){
      const button=document.createElement('button');button.type='button';
      button.dataset.piBlockAction=action;button.textContent=label;
      if(action==='delete')button.classList.add('pi-intranet-danger-action');
      popover.append(button);
    }
    // Bind to the action buttons themselves rather than relying on delegated
    // editor clicks. Contenteditable hosts can retarget bubbled clicks.
    // Prevent focus loss during mouse down: otherwise the formatting bar
    // collapses and shifts this button between down/up, swallowing clicks.
    trigger.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse')event.preventDefault();
    });
    popover.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse')event.preventDefault();
    });
    trigger.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      const open=!actions.classList.contains('is-open');
      closeInlineMenus();actions.classList.toggle('is-open',open);
      trigger.setAttribute('aria-expanded',String(open));
    });
    for(const button of popover.querySelectorAll('button[data-pi-block-action]')){
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        const editor=widget.closest('.pi-intranet-rich-editor');
        if(!editor)return;
        const action=button.dataset.piBlockAction;
        closeInlineMenus();
        if(action==='up'||action==='down')moveWidget(widget,action,editor);
        else if(action==='delete'){
          if(confirm(`Delete this ${kind==='table'?'table':'dropdown'} and all of its contents?`)){
            widget.remove();editor.dispatchEvent(new Event('input',{bubbles:true}));
            tell('Item deleted');
          }
        }else changeTableDimensions(widget,action,editor);
      });
    }
    actions.append(trigger,popover);host.append(actions);
  }
  function normalizeTables(editor){
    editor.querySelectorAll('.pi-intranet-table-widget').forEach(widget=>{
      widget.contentEditable='false';
      let table=widget.querySelector(':scope > table');
      if(!table){table=document.createElement('table');widget.append(table);}
      let header=widget.querySelector(':scope > .pi-intranet-table-header');
      if(!header){
        header=document.createElement('div');header.className='pi-intranet-table-header';
        header.textContent='▦ Table';widget.prepend(header);
      }
      addInlineActions(header,widget,'table');
      table.querySelectorAll('td,th').forEach(cell=>{
        cell.contentEditable='true';cell.spellcheck=true;
        cell.setAttribute('aria-label','Editable table cell');
      });
    });
  }
  function normalizeWidgets(editor){
    normalizeChecklists(editor);
    normalizeDropdowns(editor);
    normalizeTables(editor);
  }
  function createStarterTable(){
    const widget=document.createElement('div');
    widget.className='pi-intranet-table-widget';widget.contentEditable='false';
    const table=document.createElement('table');
    const tbody=document.createElement('tbody');
    for(let r=0;r<2;r++){
      const tr=document.createElement('tr');
      for(let c=0;c<2;c++){
        const cell=document.createElement('td');cell.contentEditable='true';
        if(r===0)cell.textContent=c===0?'Item':'Details';
        tr.append(cell);
      }
      tbody.append(tr);
    }
    table.append(tbody);widget.append(table);
    return widget;
  }
  function insertInlineWidget(editor,widget){
    // Keep widgets at the top editing level even if the caret is inside a
    // list, table, or accordion. This prevents broken nested block markup.
    useSelection(editor);
    const range=window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0) : null;
    let anchor=range?.startContainer || editor;
    if(anchor.nodeType===3)anchor=anchor.parentNode;
    let top=anchor;
    while(top && top!==editor && top.parentNode!==editor)top=top.parentNode;
    const following=document.createElement('p');following.append(document.createElement('br'));
    if(top && top!==editor && top.parentNode===editor)top.after(widget,following);
    else editor.append(widget,following);
    normalizeWidgets(editor);
    editor.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function insertTable(editor){
    const widget=createStarterTable();
    insertInlineWidget(editor,widget);
    widget.querySelector('td')?.focus();
    tell('Table added · edit cells or use ⋮ to change its layout');
  }
  function nearestMeaningfulSibling(widget,direction){
    let sibling=direction==='up'?widget.previousSibling:widget.nextSibling;
    while(sibling){
      const emptyText=sibling.nodeType===3 && !sibling.textContent.trim();
      const emptyElement=sibling.nodeType===1 && /^(P|DIV)$/i.test(sibling.tagName)
        && !sibling.textContent.trim() && !sibling.querySelector('input,details,table');
      if(!emptyText && !emptyElement)return sibling;
      sibling=direction==='up'?sibling.previousSibling:sibling.nextSibling;
    }
    return null;
  }
  function moveWidget(widget,direction,editor){
    if(widget.parentNode!==editor){tell('Move controls work for top-level items');return;}
    const next=nearestMeaningfulSibling(widget,direction);
    if(!next){tell(`Already at the ${direction==='up'?'top':'bottom'}`);return;}
    if(direction==='up')editor.insertBefore(widget,next);
    else next.after(widget);
    editor.dispatchEvent(new Event('input',{bubbles:true}));
    tell(`${widget.matches('details')?'Dropdown':'Table'} moved ${direction}`);
  }
  function changeTableDimensions(widget,action,editor){
    const table=widget.querySelector('table');
    if(!table)return;
    const rows=[...table.rows];
    if(action==='row-add'){
      const cols=Math.max(1,rows[0]?.cells.length||2);
      const tr=table.insertRow(-1);
      for(let col=0;col<cols;col++)tr.insertCell(-1).contentEditable='true';
    }else if(action==='col-add'){
      rows.forEach(row=>row.insertCell(-1).contentEditable='true');
    }else if(action==='row-remove'){
      if(rows.length<=1){tell('Keep at least one row');return;}
      if(!confirm('Remove the bottom row and its contents?'))return;
      table.deleteRow(-1);
    }else if(action==='col-remove'){
      if(!rows[0] || rows[0].cells.length<=1){tell('Keep at least one column');return;}
      if(!confirm('Remove the last column and its contents?'))return;
      rows.forEach(row=>row.deleteCell(-1));
    }
    normalizeTables(editor);
    editor.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function closeInlineMenus(except){
    app.querySelectorAll('.pi-intranet-inline-actions.is-open').forEach(menu=>{
      if(menu!==except){menu.classList.remove('is-open');menu.querySelector('.pi-intranet-inline-trigger')?.setAttribute('aria-expanded','false');}
    });
  }
  function normalizeDropdowns(editor) {
    editor.querySelectorAll('details.pi-intranet-dropdown').forEach(details=>{
      details.contentEditable='false';
      let summary=details.querySelector(':scope > summary');
      if(!summary){summary=document.createElement('summary');details.prepend(summary);}
      summary.className='pi-intranet-dropdown-summary';
      let title=summary.querySelector(':scope > .pi-intranet-dropdown-title');
      if(!title){
        title=document.createElement('span');
        title.textContent=summary.textContent?.trim()||'Dropdown';
        summary.replaceChildren(title);
      }
      title.className='pi-intranet-dropdown-title';title.contentEditable='true';
      title.spellcheck=true;title.setAttribute('role','textbox');
      title.setAttribute('aria-label','Dropdown title; edit here');
      let body=details.querySelector(':scope > .pi-intranet-dropdown-body');
      if(!body){body=document.createElement('div');summary.after(body);}
      body.className='pi-intranet-dropdown-body';body.contentEditable='true';
      body.spellcheck=true;body.setAttribute('role','textbox');
      body.setAttribute('aria-multiline','true');
      body.setAttribute('aria-label','Dropdown contents; edit here');
      addInlineActions(summary,details,'dropdown');
    });
  }
  function insertDropdown(editor){
    useSelection(editor);
    const dropdown=document.createElement('details');
    dropdown.className='pi-intranet-dropdown';dropdown.contentEditable='false';
    dropdown.open=true;
    const summary=document.createElement('summary');
    summary.className='pi-intranet-dropdown-summary';
    const title=document.createElement('span');
    title.className='pi-intranet-dropdown-title';title.textContent='Dropdown';
    summary.append(title);
    const body=document.createElement('div');body.className='pi-intranet-dropdown-body';
    dropdown.append(summary,body);
    insertInlineWidget(editor,dropdown);
    title.focus();
    const selection=window.getSelection();const titleRange=document.createRange();
    titleRange.selectNodeContents(title);
    selection.removeAllRanges();selection.addRange(titleRange);
    editor.dispatchEvent(new Event('input',{bubbles:true}));
    tell('Dropdown added · rename its title, then write inside');
  }

  function storageKey(section) {return PREFIX + section;}
  function persistedHTML(editor) {
    normalizeWidgets(editor);
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
    return !!editor.innerText?.replace(/[\u200b\u00a0]/g,' ').trim() || !!editor.querySelector('input[type=checkbox],.pi-intranet-table-widget,details.pi-intranet-dropdown');
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
    ['checklist','☑ Task','Insert a clickable checklist'],['dropdown','▸ Fold','Insert collapsible dropdown'],['table','▦ Table','Insert editable table'],['createLink','🔗','Add a link']
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
    if(command==='dropdown'){insertDropdown(editor);return;}
    if(command==='table'){insertTable(editor);return;}
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
  function applyEditorFontSize(section,editor,size) {
    const px=validFontSize(size);
    editor.style.setProperty('--pi-intranet-editor-size',`${px}px`);
    const selector=editor.closest('.pi-intranet-card')?.querySelector('.pi-intranet-font-select');
    if(selector)selector.value=String(px);
  }
  function buildToolbar(card,editor,section) {
    const toolbar=card.querySelector('.pi-intranet-formatbar');
    if(!toolbar)return;
    const sizeKey=storageKey(section)+'-size';
    const fontLabel=document.createElement('label');
    fontLabel.className='pi-intranet-font-control';
    fontLabel.title=`Text size for ${labels[section]}`;
    const fontLabelText=document.createElement('span');
    fontLabelText.textContent='Aa';fontLabelText.setAttribute('aria-hidden','true');
    const fontSelect=document.createElement('select');
    fontSelect.className='pi-intranet-font-select';
    fontSelect.setAttribute('aria-label',`Text size for ${labels[section]}`);
    FONT_SIZES.forEach(size=>{
      const option=document.createElement('option');option.value=String(size);
      option.textContent=`${size}px`;fontSelect.append(option);
    });
    const initial=safeRead(sizeKey);
    applyEditorFontSize(section,editor,initial);
    fontSelect.value=String(validFontSize(initial));
    baselines.set(sizeKey,initial);
    fontSelect.addEventListener('change',()=>{
      const size=validFontSize(fontSelect.value);
      applyEditorFontSize(section,editor,size);
      if(safeWrite(sizeKey,String(size)))baselines.set(sizeKey,String(size));
    });
    fontLabel.append(fontLabelText,fontSelect);
    toolbar.append(fontLabel);
    const divider=document.createElement('span');divider.className='pi-intranet-format-spacer';
    divider.setAttribute('aria-hidden','true');toolbar.append(divider);
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
    normalizeWidgets(editor);
    buildToolbar(card,editor,section);
    const collapseKey=storageKey(section)+'-collapsed';
    const collapseButton=card.querySelector('.pi-intranet-collapse');
    const sectionContent=card.querySelector('.pi-intranet-card-content');
    function renderCollapse(collapsed) {
      card.classList.toggle('is-collapsed',collapsed);
      sectionContent.hidden=collapsed;
      collapseButton.setAttribute('aria-expanded',String(!collapsed));
      collapseButton.setAttribute('aria-label',`${collapsed?'Expand':'Collapse'} ${labels[section]}`);
      collapseButton.title=`${collapsed?'Expand':'Collapse'} ${labels[section]}`;
      collapseButton.textContent=collapsed?'▸':'▾';
      const middle=app.querySelector('.pi-intranet-middle');
      middle?.classList.toggle('week-collapsed',
        !!app.querySelector('[data-intranet-section="week"].is-collapsed'));
      middle?.classList.toggle('today-collapsed',
        !!app.querySelector('[data-intranet-section="today"].is-collapsed'));
    }
    const collapseRaw=safeRead(collapseKey);
    baselines.set(collapseKey,collapseRaw);
    renderCollapse(collapseRaw==='1');
    card.piRenderCollapse=renderCollapse;
    collapseButton?.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      saveEditor(section); // Never lose edits if the focused editor is hidden.
      const collapsed=!card.classList.contains('is-collapsed');
      renderCollapse(collapsed);
      if(safeWrite(collapseKey,collapsed?'1':'0'))baselines.set(collapseKey,collapsed?'1':'0');
    });
    card.querySelector('.pi-intranet-card-heading h2')?.addEventListener('click',()=>collapseButton.click());
    editor.addEventListener('focus',()=>card.classList.add('is-editing'));
    editor.addEventListener('blur',()=>{
      saveEditor(section);
      // A cloud check may have updated this key while the editor was focused.
      // Adopt it only once local edits have been flushed.
      card.classList.remove('is-editing');
    });
    editor.addEventListener('input',()=>{captureSelection(editor);scheduleSave(section);});
    editor.addEventListener('keyup',()=>captureSelection(editor));
    editor.addEventListener('toggle',event=>{
      if(event.target.matches('details.pi-intranet-dropdown'))scheduleSave(section);
    },true);
    editor.addEventListener('mouseup',()=>captureSelection(editor));
    editor.addEventListener('keydown',event=>{
      if(event.target.closest('.pi-intranet-dropdown-title') && event.key==='Enter'){
        event.preventDefault();event.target.closest('details')?.querySelector('.pi-intranet-dropdown-body')?.focus();
        return;
      }
      handleChecklistEnter(event,editor);
    });
    editor.addEventListener('paste',event=>{
      event.preventDefault();
      const transfer=event.clipboardData;
      const html=transfer?.getData('text/html');
      const text=transfer?.getData('text/plain')||'';
      const safe=html?sanitizeHTML(html):escapeText(text).replace(/\r?\n/g,'<br>');
      document.execCommand('insertHTML',false,safe);
      normalizeWidgets(editor);
      editor.dispatchEvent(new Event('input',{bubbles:true}));
    });
    editor.addEventListener('change',event=>{
      if(!event.target.matches('input[type="checkbox"]'))return;
      event.target.toggleAttribute('checked',event.target.checked);
      saveEditor(section);
    });
    editor.addEventListener('keydown',event=>{
      if(event.key==='Escape')closeInlineMenus();
    });
    editor.addEventListener('click',event=>{
      const title=event.target.closest('.pi-intranet-dropdown-title');
      if(title && editor.contains(title)){
        // Editing a heading must not also toggle its parent <details>.
        event.preventDefault();event.stopPropagation();return;
      }
      const link=event.target.closest('a[href]');
      if(link && !event.ctrlKey && !event.metaKey)event.preventDefault();
    });
    card.querySelector('.pi-intranet-action-archive')?.addEventListener('click',()=>archiveSection(section));
    card.querySelector('.pi-intranet-action-delete')?.addEventListener('click',()=>deleteSection(section));
    card.querySelector('.pi-intranet-action-restore')?.addEventListener('click',()=>restoreSection(section));
  }
  app.querySelectorAll('[data-intranet-section]').forEach(bindSection);
  document.addEventListener('pointerdown',event=>{
    if(!event.target.closest('.pi-intranet-inline-actions'))closeInlineMenus();
  });

  /* Seamless ticker with directly editable, plain-text content. */
  const marquee=document.getElementById('piIntranetMarquee');
  const repeat=app.querySelector('.pi-intranet-marquee-repeat');
  const marqueeContainer=app.querySelector('.pi-intranet-marquee');
  const marqueeEdit= document.getElementById('piIntranetEditMarquee');
  const marqueeMenu=document.getElementById('piIntranetMarqueeMenu');
  const marqueeSize=document.getElementById('piIntranetMarqueeSize');
  const marqueeSizeKey=PREFIX+'marquee-size';
  const applyMarqueeSize=size=>{
    const px=validFontSize(size);
    marqueeContainer.style.setProperty('--pi-intranet-marquee-size',`${px}px`);
    if(marqueeSize)marqueeSize.value=String(px);
  };
  const initialMarqueeSize=safeRead(marqueeSizeKey);
  applyMarqueeSize(initialMarqueeSize);
  baselines.set(marqueeSizeKey,initialMarqueeSize);
  marqueeSize?.addEventListener('change',()=>{
    const px=validFontSize(marqueeSize.value);
    applyMarqueeSize(px);
    if(safeWrite(marqueeSizeKey,String(px)))baselines.set(marqueeSizeKey,String(px));
  });
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
  function finishMarqueeEditing(){
    saveMarquee();
    marquee.contentEditable='false';
    marqueeContainer.classList.remove('is-editing');
  }
  marquee.addEventListener('focus',()=>{if(marquee.isContentEditable)marqueeContainer.classList.add('is-editing');});
  marquee.addEventListener('input',()=>{
    repeat.textContent=marquee.textContent;
    clearTimeout(timeouts.get('marquee'));
    timeouts.set('marquee',setTimeout(saveMarquee,350));
  });
  marquee.addEventListener('blur',finishMarqueeEditing);
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
    if(marqueeMenu)marqueeMenu.open=false;
    marquee.contentEditable='true';
    marqueeContainer.classList.add('is-editing');
    marquee.focus();
    const selection=window.getSelection();const range=document.createRange();range.selectNodeContents(marquee);
    selection.removeAllRanges();selection.addRange(range);
  });

  /* The marquee's single ⋮ menu controls writing, sizing, and title/stars
     contrast. Colors are saved PER THEME, so a Windows adjustment does not
     unexpectedly change Aurora, Candy Jurassic, or any other theme. */
  const HEADER_COLOR_KEY=PREFIX+'header-colors-by-theme';
  const HEADER_COLORS=[
    {key:'auto',label:'Theme default',value:null},
    {key:'text',label:'Theme text',value:'var(--text)'},
    {key:'teal',label:'Teal',value:'var(--teal,#2f8f9d)'},
    {key:'plum',label:'Violet',value:'var(--plum,#7b5ea7)'},
    {key:'blue',label:'Blue',value:'var(--blue,#4689c7)'},
    {key:'rose',label:'Pink',value:'var(--rose,#b45e9a)'},
    {key:'green',label:'Green',value:'var(--green,#5fbf9a)'},
    {key:'gold',label:'Gold',value:'var(--orange,#dda35b)'},
    {key:'white',label:'White',value:'#ffffff'},
    {key:'dark',label:'Dark ink',value:'#162735'}
  ];
  const colorValues=new Map(HEADER_COLORS.map(entry=>[entry.key,entry.value]));
  const currentTheme=()=>document.body.dataset.theme||'dark';
  let headerColors={};
  function readHeaderColors(){
    try {
      const parsed=JSON.parse(safeRead(HEADER_COLOR_KEY)||'{}');
      if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {};
      return parsed;
    }catch{return {};}
  }
  function applyHeaderColors(){
    const saved=headerColors[currentTheme()]||{};
    const heading=app.querySelector('.pi-intranet-heading');
    for(const target of ['title','stars']) {
      const choice=colorValues.has(saved[target])?saved[target]:'auto';
      const property=target==='title'?'--pi-intranet-title-ink':'--pi-intranet-stars-ink';
      if(choice==='auto')heading.style.removeProperty(property);
      else heading.style.setProperty(property,colorValues.get(choice));
      app.querySelectorAll(`[data-pi-header-target="${target}"] button[data-pi-color-choice]`).forEach(button=>{
        button.setAttribute('aria-pressed',String(button.dataset.piColorChoice===choice));
      });
    }
  }
  headerColors=readHeaderColors();
  baselines.set(HEADER_COLOR_KEY,safeRead(HEADER_COLOR_KEY));
  for(const container of app.querySelectorAll('.pi-intranet-header-color-picker')){
    const target=container.dataset.piHeaderTarget;
    const row=container.querySelector('.pi-intranet-header-swatches');
    for(const entry of HEADER_COLORS){
      const button=document.createElement('button');button.type='button';
      button.className='pi-intranet-header-swatch';button.dataset.piColorChoice=entry.key;
      button.title=`${target==='title'?'Title text':'Stars'}: ${entry.label}`;
      button.setAttribute('aria-label',button.title);
      if(entry.value)button.style.setProperty('--pi-header-swatch-color',entry.value);
      else button.textContent='×';
      button.addEventListener('click',()=>{
        const theme=currentTheme();
        headerColors={...headerColors,[theme]:{...(headerColors[theme]||{}),[target]:entry.key}};
        const payload=JSON.stringify(headerColors);
        applyHeaderColors();
        if(safeWrite(HEADER_COLOR_KEY,payload))baselines.set(HEADER_COLOR_KEY,payload);
      });
      row.append(button);
    }
  }
  applyHeaderColors();
  // Apply the right per-theme choices immediately on theme switches.
  new MutationObserver(mutations=>{
    if(mutations.some(m=>m.attributeName==='data-theme'))applyHeaderColors();
  }).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
  document.addEventListener('pointerdown',event=>{
    if(marqueeMenu?.open && !marqueeMenu.contains(event.target))marqueeMenu.open=false;
  });
  marqueeMenu?.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      event.stopPropagation();marqueeMenu.open=false;
      marqueeMenu.querySelector('summary')?.focus();
    }
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
      const fontKey=storageKey(section)+'-size';
      const fontRaw=safeRead(fontKey);
      if(fontRaw!==baselines.get(fontKey)){
        applyEditorFontSize(section,editor,fontRaw);
        baselines.set(fontKey,fontRaw);
      }
      const collapseKey=storageKey(section)+'-collapsed';
      const collapseRaw=safeRead(collapseKey);
      if(collapseRaw!==baselines.get(collapseKey)){
        editor.closest('.pi-intranet-card')?.piRenderCollapse?.(collapseRaw==='1');
        baselines.set(collapseKey,collapseRaw);
      }
      if(document.activeElement===editor || editor.contains(document.activeElement))continue;
      if(timeouts.has(section)) { // A scheduled input save is still pending.
        const timer=timeouts.get(section);
        if(timer)continue;
      }
      const raw=safeRead(storageKey(section))??'';
      if(raw===baselines.get(section))continue;
      editor.innerHTML=sanitizeHTML(raw);normalizeWidgets(editor);baselines.set(section,raw);
    }
    const remoteHeaderColors=safeRead(HEADER_COLOR_KEY);
    if(remoteHeaderColors!==baselines.get(HEADER_COLOR_KEY)){
      headerColors=readHeaderColors();
      baselines.set(HEADER_COLOR_KEY,remoteHeaderColors);
      applyHeaderColors();
    }
    const remoteMarqueeSize=safeRead(marqueeSizeKey);
    if(remoteMarqueeSize!==baselines.get(marqueeSizeKey)){
      applyMarqueeSize(remoteMarqueeSize);baselines.set(marqueeSizeKey,remoteMarqueeSize);
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
