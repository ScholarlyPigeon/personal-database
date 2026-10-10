/* Personal Intranet · clean Archive and Timeline + Notes.
   Existing archive, timeline and retired Almanac keys are never deleted. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v===null?fallback:v;}catch{return fallback;}};
const save=(key,value)=>{localStorage.setItem(key,JSON.stringify(value));window.showSaved?.();};
const uid=(prefix='note')=>globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const iso=(date=new Date())=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const el=(tag,cls='',txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
const btn=(txt,title,callback,cls='')=>{const b=el('button',cls,txt);b.type='button';b.title=title;b.setAttribute('aria-label',title);b.addEventListener('click',callback);return b;};
const summary=text=>String(text||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const dateLabel=value=>{const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(value||'')?value+'T12:00:00':value||0);return Number.isNaN(d.getTime())?'date unknown':d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});};
const when=ts=>{const d=new Date(ts||0);return Number.isNaN(d.getTime())?'recently':d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});};
const escHtml=s=>{const e=el('div');e.textContent=s||'';return e.innerHTML.replace(/\n/g,'<br>');};
function safeHtml(html){
 const tpl=document.createElement('template');tpl.innerHTML=html||'';
 const allowed=new Set(['B','STRONG','EM','I','U','S','P','DIV','BR','UL','OL','LI','BLOCKQUOTE','H2','H3','H4','SPAN','A']);
 const walk=node=>{[...node.childNodes].forEach(child=>{
  if(child.nodeType===8){child.remove();return;}
  if(child.nodeType!==1)return;
  if(!allowed.has(child.tagName)){const text=document.createTextNode(child.textContent||'');child.replaceWith(text);return;}
  [...child.attributes].forEach(a=>child.removeAttribute(a.name));
  walk(child);
 });};
 // Preserve sanitized hyperlinks explicitly.
 const links=[...tpl.content.querySelectorAll('a')].map(a=>({node:a,href:a.getAttribute('href')||''}));
 walk(tpl.content);
 links.forEach(({node,href})=>{if(node.isConnected||tpl.content.contains(node)){if(/^(https?:\/\/|mailto:)/i.test(href))node.setAttribute('href',href);}});
 return tpl.innerHTML;
}
const ACT_KEY='pi-activity-v1',ARCHIVE_KEY='pi-archive-v1',LEGACY_KEY='pi-archive-workspace-v1',NOTES_KEY='pi-reflections-notes-v1';
const routes={home:'Database.html',database:'Database.html',aquarium:'Aquarium.html',week:'Week.html',month:'Month.html',archive:'Patterns.html',almanac:'Almanac.html',longform:'Longform.html',neopets:'neopets.html'};
function initArchive(){
 if(!$('archiveApp'))return;
 const dayList=$('dayArchiveList'), itemList=$('itemArchiveList'), recentList=$('piRecentActivityList');
 function renderArchive(){
  const records=read(ARCHIVE_KEY,[]);const all=Array.isArray(records)?records:[];
  const days=all.filter(r=>r?.recordType==='day').sort((a,b)=>String(b.originalDate||'').localeCompare(String(a.originalDate||'')));
  const items=all.filter(r=>r?.recordType!=='day').sort((a,b)=>String(b.archivedAt||'').localeCompare(String(a.archivedAt||'')));
  $('archiveDayCount').textContent=String(days.length);$('archiveItemCount').textContent=String(items.length);
  dayList.replaceChildren();itemList.replaceChildren();
  if(!days.length)dayList.append(el('p','pi-muted','Your past days will collect here automatically.'));
  days.forEach(record=>{
   const card=el('article','pi-history-record');
   const top=el('div','pi-history-head');
   const toggle=btn('▸','Show archived day',()=>{const open=card.classList.toggle('expanded');toggle.textContent=open?'▾':'▸';},'pi-mini-icon');
   const title=el('strong','',record.displayLabel||dateLabel(record.originalDate));
   const count=el('small','',`${(record.items||[]).length} items`);
   const del=btn('×','Delete archived day permanently',()=>{
    if(!confirm('Permanently delete this archived day?'))return;
    save(ARCHIVE_KEY,read(ARCHIVE_KEY,[]).filter(x=>x.id!==record.id));renderArchive();
   },'pi-mini-icon');
   top.append(toggle,title,count,del);
   const body=el('div','pi-history-body');
   (Array.isArray(record.items)?record.items:[]).forEach((entry,i)=>{
    const row=el('label','pi-history-entry');const checkbox=el('input');checkbox.type='checkbox';checkbox.checked=!!entry.done;
    checkbox.addEventListener('change',()=>{const all=read(ARCHIVE_KEY,[]);const match=all.find(x=>x.id===record.id);if(match?.items?.[i]){match.items[i].done=checkbox.checked;save(ARCHIVE_KEY,all);row.classList.toggle('done',checkbox.checked);}});
    row.classList.toggle('done',checkbox.checked);row.append(checkbox,el('span','',entry.text||''));body.append(row);
   });card.append(top,body);dayList.append(card);
  });
  if(!items.length)itemList.append(el('p','pi-muted','Archived thoughts and completed items will appear here.'));
  items.forEach((record, itemIndex)=>{
   // Like Day Archive, Archived Items open on demand. Keep a short preview
   // for identification so dozens of long entries remain easy to scan.
   const card=el('article','pi-history-record pi-archived-item');
   const head=el('div','pi-history-head pi-archived-item-head');
   const detailsId=`pi-archived-item-details-${itemIndex}`;
   const toggle=btn('▸','Expand archived item',()=>{
     const expanded=card.classList.toggle('expanded');
     toggle.textContent=expanded?'▾':'▸';
     toggle.title=expanded?'Collapse archived item':'Expand archived item';
     toggle.setAttribute('aria-label',toggle.title);
     toggle.setAttribute('aria-expanded',String(expanded));
   },'pi-mini-icon');
   toggle.setAttribute('aria-expanded','false');
   toggle.setAttribute('aria-controls',detailsId);
   const heading=el('div','pi-archived-item-heading');
   const source=summary([record.source,record.context].filter(Boolean).join(' · '))||'Archived item';
   heading.append(el('strong','',source));
   const preview=String(record.text||'').replace(/\s+/g,' ').trim();
   if(preview)heading.append(el('span','pi-archived-item-preview',preview));
   const del=btn('×','Delete archived item permanently',()=>{
    if(!confirm('Permanently delete this archived item?'))return;
    save(ARCHIVE_KEY,read(ARCHIVE_KEY,[]).filter(x=>x.id!==record.id));renderArchive();
   },'pi-mini-icon');
   head.append(toggle,heading,del);
   const body=el('div','pi-history-body');body.id=detailsId;
   body.append(el('div','pi-history-text',record.text||''));
   const meta=el('small','pi-muted','archived '+dateLabel(record.archivedAt));
   body.append(meta);
   card.append(head,body);itemList.append(card);
  });
  const a=$('archiveSummary');if(a)a.textContent=`${days.length} day snapshots · ${items.length} archived items`;
 }
 function renderActivity(){
  const entries=read(ACT_KEY,[]);const list=Array.isArray(entries)?entries:[];
  recentList.replaceChildren();$('piActivityCount').textContent=String(list.length);
  if(!list.length){recentList.append(el('p','pi-muted','New notes from across your intranet will appear here, alongside other item changes.'));return;}
  list.forEach(item=>{
   const a=el('a','pi-activity-entry');a.href=routes[item.page]||'Database.html';
   a.append(el('span','pi-activity-action',item.action||'Updated item'),el('span','pi-activity-text',item.text||''),el('small','pi-muted',`${item.page==='database'?'Home':item.page==='almanac'?'Timeline & Notes':item.page||'Intranet'} · ${when(item.timestamp)}`));recentList.append(a);
  });
 }
 window.addEventListener('storage',e=>{if(e.key===ARCHIVE_KEY)renderArchive();if(e.key===ACT_KEY)renderActivity();});
 window.addEventListener('pi-activity-updated',renderActivity);
 renderArchive();renderActivity();
}
function initReflections(){
 if(!$('piReflections'))return;
 const timelineEl=$('piTimelineList'),notesEl=$('piSavedNoteList'),name=$('piNoteTitle'),editor=$('piNoteEditor'),date=$('piNoteDate'),sectionSelect=$('piNoteSection');
 const blank=()=>({sections:[{id:'general',name:'General',collapsed:false},{id:'patterns',name:'Patterns',collapsed:false}],entries:[]});
 function normalizeState(data){
  if(!data || !Array.isArray(data.sections)||!Array.isArray(data.entries))data=blank();
  if(!data.sections.length)data.sections=blank().sections;
  return data;
 }
 let state=normalizeState(read(NOTES_KEY,null));
 let selectedItem=null, selectedSection=null, dragItem=null,dragSection=null;
 function store(){save(NOTES_KEY,state);}
 function importLegacy(){
  const old=read(LEGACY_KEY,[]);if(!Array.isArray(old))return;
  let changed=false;
  for(const item of old){
   if(!item || !['notes','patterns'].includes(item.zone)||!item.id)continue;
   if(state.entries.some(entry=>entry.legacyId===item.id))continue;
   const id=uid('import');
   state.entries.push({id,legacyId:item.id,title:item.title||'Untitled',html:item.html||escHtml(item.text||''),text:item.text||'',date:item.date||iso(),sectionId:item.zone==='patterns'?'patterns':'general',expanded:!!item.expanded,createdAt:item.createdAt||new Date().toISOString()});changed=true;
  }
  if(changed)store();
 }
 function legacyTimeline(){const rows=read(LEGACY_KEY,[]);return Array.isArray(rows)?rows.filter(x=>x && x.zone==='timeline'):[];}
 function updateTimeline(itemId,mutator){const rows=read(LEGACY_KEY,[]);if(!Array.isArray(rows))return;const entry=rows.find(x=>x.id===itemId&&x.zone==='timeline');if(!entry)return;mutator(entry);save(LEGACY_KEY,rows);}
 function makeEditable(initial,saveFn,cls,placeholder,multiline=false){
  const edit=el('div',cls);edit.contentEditable='true';edit.spellcheck=true;edit.dataset.placeholder=placeholder;
  if(multiline)edit.innerHTML=safeHtml(initial||'');else edit.textContent=initial||'';
  edit.addEventListener('input',()=>saveFn(multiline?{html:safeHtml(edit.innerHTML),text:edit.innerText}:{title:edit.innerText.trim()}));
  if(!multiline)edit.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();edit.blur();}});
  return edit;
 }
 function renderTimeline(){
  timelineEl.replaceChildren();const rows=legacyTimeline().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  $('piTimelineCount').textContent=String(rows.length);
  if(!rows.length)timelineEl.append(el('p','pi-muted','Your milestones and turning points will appear here.'));
  rows.forEach(item=>{
   const card=el('article','pi-note-card pi-timeline-card');
   const head=el('div','pi-note-card-head');
   const title=makeEditable(item.title||'Untitled',value=>updateTimeline(item.id,x=>Object.assign(x,value)),'pi-card-title','Title');
   const toggle=btn(item.expanded?'▾':'▸',item.expanded?'Collapse milestone':'Expand milestone',()=>{updateTimeline(item.id,x=>{x.expanded=!x.expanded;});renderTimeline();},'pi-mini-icon');
   const d=el('input','pi-card-date');d.type='date';d.value=item.date||iso();d.title='Milestone date';d.addEventListener('change',()=>{updateTimeline(item.id,x=>{x.date=d.value;});renderTimeline();});
   const del=btn('×','Delete timeline entry',()=>{if(!confirm('Delete this timeline entry?'))return;save(LEGACY_KEY,read(LEGACY_KEY,[]).filter(x=>x.id!==item.id));renderTimeline();},'pi-mini-icon');
   head.append(toggle,title,d,del);card.append(head);
   if(item.expanded){card.append(makeEditable(item.html||escHtml(item.text||''),value=>updateTimeline(item.id,x=>Object.assign(x,value)),'pi-note-card-body','Add details…',true));}
   timelineEl.append(card);
  });
 }
 function renderSectionSelect(){const want=sectionSelect.value;sectionSelect.replaceChildren();state.sections.forEach(s=>{const opt=el('option','',s.name);opt.value=s.id;sectionSelect.append(opt);});sectionSelect.value=state.sections.some(s=>s.id===want)?want:state.sections[0].id;}
 function reorderEntry(id,targetId=null,targetSectionId=null){
  const from=state.entries.findIndex(x=>x.id===id);if(from<0)return;
  const [item]=state.entries.splice(from,1);
  if(targetSectionId)item.sectionId=targetSectionId;
  let at=targetId?state.entries.findIndex(x=>x.id===targetId):-1;
  if(at<0)at=state.entries.length;
  state.entries.splice(at,0,item);selectedItem=null;dragItem=null;store();renderNotes();
 }
 function reorderSection(id,before=null){
  const from=state.sections.findIndex(x=>x.id===id);if(from<0)return;
  const [s]=state.sections.splice(from,1);let to=before?state.sections.findIndex(x=>x.id===before):-1;
  if(to<0)to=state.sections.length;state.sections.splice(to,0,s);
  selectedSection=null;dragSection=null;store();renderNotes();
 }
 function makeNoteCard(item){
  const card=el('article','pi-note-card');card.dataset.itemId=item.id;
  if(selectedItem===item.id)card.classList.add('pi-move-selected');
  const head=el('div','pi-note-card-head');
  const move=btn('⠿','Tap to move this note, then tap another note or section',()=>{selectedItem=selectedItem===item.id?null:item.id;selectedSection=null;renderNotes();},'pi-mini-icon pi-move-handle');
  move.draggable=true;move.addEventListener('dragstart',event=>{dragItem=item.id;event.dataTransfer.setData('text/plain',item.id);event.dataTransfer.effectAllowed='move';});move.addEventListener('dragend',()=>{dragItem=null;});
  const title=makeEditable(item.title||'Untitled',value=>{Object.assign(item,value);store();},'pi-card-title','Title');
  const toggle=btn(item.expanded?'▾':'▸',item.expanded?'Collapse note':'Expand note',()=>{item.expanded=!item.expanded;store();renderNotes();},'pi-mini-icon');
  const del=btn('×','Delete saved note',()=>{if(!confirm('Delete this saved note?'))return;state.entries=state.entries.filter(x=>x.id!==item.id);store();renderNotes();},'pi-mini-icon');
  head.append(move,title,toggle,del);card.append(head);
  const sub=el('div','pi-note-subrow');
  const dateInput=el('input','pi-card-date');dateInput.type='date';dateInput.value=item.date||iso();dateInput.setAttribute('aria-label','Note date');dateInput.addEventListener('change',()=>{item.date=dateInput.value;store();});
  const select=el('select','pi-card-section-select');select.setAttribute('aria-label','Move note to section');state.sections.forEach(s=>{const opt=el('option','',s.name);opt.value=s.id;select.append(opt);});select.value=item.sectionId;select.addEventListener('change',()=>reorderEntry(item.id,null,select.value));
  sub.append(dateInput,select);card.append(sub);
  if(item.expanded){card.append(makeEditable(item.html||escHtml(item.text||''),values=>{Object.assign(item,values);store();},'pi-note-card-body','Add details…',true));if(item.imageUrl&&/^https?:\/\//.test(item.imageUrl)){const image=el('img','pi-note-image');image.src=item.imageUrl;image.alt=item.title||'Attached image';image.loading='lazy';card.append(image);}if(item.linkUrl&&/^https?:\/\//.test(item.linkUrl)){const link=el('a','pi-note-link','open link ↗');link.href=item.linkUrl;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}}
  card.addEventListener('dragover',event=>{if(dragItem&&dragItem!==item.id){event.preventDefault();card.classList.add('pi-drop-ready');}});
  card.addEventListener('dragleave',()=>card.classList.remove('pi-drop-ready'));
  card.addEventListener('drop',event=>{if(!dragItem||dragItem===item.id)return;event.preventDefault();reorderEntry(dragItem,item.id,item.sectionId);});
  card.addEventListener('click',event=>{if(!selectedItem||selectedItem===item.id||event.target.closest('button,input,select,[contenteditable="true"],a'))return;event.preventDefault();reorderEntry(selectedItem,item.id,item.sectionId);});
  return card;
 }
 function renderNotes(){
  notesEl.replaceChildren();renderSectionSelect();
  $('piNoteCount').textContent=String(state.entries.length);
  state.sections.forEach((section,index)=>{
   const sectionBox=el('section','pi-notes-section');if(selectedSection===section.id)sectionBox.classList.add('pi-move-selected');
   const head=el('div','pi-notes-section-head');
   const move=btn('⠿','Move section: drag or tap, then choose another section',()=>{selectedSection=selectedSection===section.id?null:section.id;selectedItem=null;renderNotes();},'pi-mini-icon pi-move-handle');
   move.draggable=true;move.addEventListener('dragstart',event=>{dragSection=section.id;event.dataTransfer.setData('text/plain',section.id);event.dataTransfer.effectAllowed='move';});move.addEventListener('dragend',()=>{dragSection=null;});
   const title=makeEditable(section.name,value=>{section.name=value.title||'Section';store();renderSectionSelect();},'pi-section-name','Section name');
   const count=el('small','pi-muted',String(state.entries.filter(x=>x.sectionId===section.id).length));
   const up=btn('↑','Move section up',()=>{if(index>0)reorderSection(section.id,state.sections[index-1].id);},'pi-mini-icon');
   const down=btn('↓','Move section down',()=>{if(index<state.sections.length-1)reorderSection(section.id,state.sections[index+2]?.id||null);},'pi-mini-icon');
   const fold=btn(section.collapsed?'▸':'▾',section.collapsed?'Expand section':'Collapse section',()=>{section.collapsed=!section.collapsed;store();renderNotes();},'pi-mini-icon');
   const del=btn('×','Remove empty section',()=>{
    if(state.sections.length===1){alert('Keep at least one section.');return;}
    if(state.entries.some(x=>x.sectionId===section.id)){
     if(!confirm('Move this section’s notes into the first remaining section?'))return;
     const target=state.sections.find(s=>s.id!==section.id);state.entries.forEach(x=>{if(x.sectionId===section.id)x.sectionId=target.id;});
    }
    state.sections=state.sections.filter(s=>s.id!==section.id);store();renderNotes();
   },'pi-mini-icon');
   head.append(move,title,count,up,down,fold,del);sectionBox.append(head);
   head.addEventListener('dragover',event=>{if(dragSection&&dragSection!==section.id){event.preventDefault();head.classList.add('pi-drop-ready');}});
   head.addEventListener('dragleave',()=>head.classList.remove('pi-drop-ready'));
   head.addEventListener('drop',event=>{if(dragSection&&dragSection!==section.id){event.preventDefault();reorderSection(dragSection,section.id);}});
   head.addEventListener('click',event=>{if(selectedSection&&selectedSection!==section.id&&!event.target.closest('button,input,[contenteditable="true"]')){reorderSection(selectedSection,section.id);}});
   if(!section.collapsed){
    const body=el('div','pi-notes-section-body');
    const entries=state.entries.filter(x=>x.sectionId===section.id);
    if(!entries.length)body.append(el('p','pi-muted','An open space for notes.'));
    entries.forEach(entry=>body.append(makeNoteCard(entry)));
    body.addEventListener('dragover',event=>{if(dragItem){event.preventDefault();body.classList.add('pi-drop-ready');}});
    body.addEventListener('dragleave',()=>body.classList.remove('pi-drop-ready'));
    body.addEventListener('drop',event=>{if(!dragItem)return;event.preventDefault();reorderEntry(dragItem,null,section.id);});
    body.addEventListener('click',event=>{if(selectedItem && !event.target.closest('button,input,select,[contenteditable="true"],.pi-note-card'))reorderEntry(selectedItem,null,section.id);});
    sectionBox.append(body);
   }
   notesEl.append(sectionBox);
  });
 }
 function addNote(){
  const title=name.value.trim();const html=safeHtml(editor.innerHTML);const text=editor.innerText.trim();if(!title&&!text){name.focus();return;}
  state.entries.unshift({id:uid('ref'),title:title||text.slice(0,90)||'Untitled',text,html,sectionId:sectionSelect.value||state.sections[0].id,date:date.value||iso(),createdAt:new Date().toISOString(),expanded:true,imageUrl:$('piNoteImageUrl').value.trim(),linkUrl:$('piNoteLinkUrl').value.trim()});
  store();name.value='';editor.innerHTML='';$('piNoteImageUrl').value='';$('piNoteLinkUrl').value='';renderNotes();name.focus();
 }
 function addSection(){const id=uid('section');state.sections.push({id,name:'New section',collapsed:false});store();renderNotes();notesEl.querySelectorAll('.pi-section-name')[state.sections.length-1]?.focus();}
 function addTimeline(){
  const title=$('piTimelineTitle').value.trim();const body=$('piTimelineBody').value.trim();if(!title&&!body){$('piTimelineTitle').focus();return;}
  const rows=read(LEGACY_KEY,[]);if(!Array.isArray(rows))return;
  rows.unshift({id:uid('milestone'),zone:'timeline',title:title||body.slice(0,90),text:body,html:escHtml(body),date:$('piTimelineDate').value||iso(),createdAt:new Date().toISOString(),expanded:!!body});
  save(LEGACY_KEY,rows);$('piTimelineTitle').value='';$('piTimelineBody').value='';renderTimeline();
 }
 async function recoverTimeline(file){
  const data=JSON.parse(await file.text());const rows=read(LEGACY_KEY,[]);if(!Array.isArray(rows))return;
  const getItems=key=>{let a=data[key];if(typeof a==='string'){try{a=JSON.parse(a);}catch{a=[];}}return Array.isArray(a)?a:[];};
  const sources=[...getItems(LEGACY_KEY).filter(x=>x.zone==='timeline'),...getItems('pi-timeline-markers-v1'),...getItems('pigeonhole-v15-timeline-markers')];
  let found=0;for(const item of sources){if(!item||typeof item!=='object')continue;const id=item.id||uid('recovered');if(rows.some(x=>x.id===id))continue;rows.push({...item,id,zone:'timeline',title:item.title||item.text||'Milestone',text:item.text||'',html:item.html||escHtml(item.text||''),date:item.date||iso(),expanded:!!item.expanded});found++;}
  if(found)save(LEGACY_KEY,rows);renderTimeline();alert(found?`${found} missing Timeline item${found===1?'':'s'} recovered.`:'No missing Timeline entries were found in that backup.');
 }
 $('piSaveNote').addEventListener('click',addNote);
 editor.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();addNote();}});
 $('piAddNoteSection').addEventListener('click',addSection);
 $('piAddTimeline').addEventListener('click',addTimeline);
 $('piTimelineDate').value=iso();date.value=iso();
 $('piRecoverTimeline').addEventListener('click',()=>$('piTimelineBackupInput').click());
 $('piTimelineBackupInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{await recoverTimeline(file);}catch(err){console.error(err);alert('Could not read that backup.');}e.target.value='';});
 window.addEventListener('storage',e=>{if(e.key===LEGACY_KEY){importLegacy();renderTimeline();renderNotes();}if(e.key===NOTES_KEY){state=normalizeState(read(NOTES_KEY,null));importLegacy();renderNotes();}});
 window.addEventListener('focus',()=>{importLegacy();renderTimeline();renderNotes();});
 importLegacy();renderTimeline();renderNotes();
}
document.addEventListener('DOMContentLoaded',()=>{initArchive();initReflections();});
})();
