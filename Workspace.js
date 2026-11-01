/* ===== Original module: Workspace.js ===== */
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
const dateLabel=value=>{const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(value||'')?value+'T12:00:00':value||0);return Number.isNaN(d.getTime())?'date unknown':d.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'2-digit'});};
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
const routes={home:'Database.html',database:'Database.html',aquarium:'Aquarium.html',week:'Week.html',month:'Month.html',archive:'Patterns.html',almanac:'Almanac.html',compass:'Compass.html',longform:'Longform.html',neopets:'neopets.html'};
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
   a.append(el('span','pi-activity-action',item.action||'Updated item'),el('span','pi-activity-text',item.text||''),el('small','pi-muted',`${item.page==='database'?'Home':item.page==='almanac'?'Timeline & Notes':item.page==='compass'?'Compass':item.page||'Intranet'} · ${when(item.timestamp)}`));recentList.append(a);
  });
 }
 window.addEventListener('storage',e=>{if(e.key===ARCHIVE_KEY)renderArchive();if(e.key===ACT_KEY)renderActivity();});
 window.addEventListener('pi-activity-updated',renderActivity);
 renderArchive();renderActivity();
}

/* Shared Compass / Timeline note system (V20.9).
   All existing pi-* storage keys and legacy Timeline milestones stay readable.
   Category notes and checklist lines share a single renderer and move behavior. */
function initUnifiedWorkspace(mode){
 const compass=mode==='compass';
 const root=$(compass?'piCompass':'piReflections'); if(!root)return;
 const KEY=compass?'pi-compass-v1':NOTES_KEY;
 const MAIN='__current__', TIMELINE='__timeline__', GOALS='__goals__', GROUNDING='__grounding__';
 const cols=compass
   ? [{id:'goals',title:'Goals',list:$('piCompassGoalsList'),count:$('piCompassGoalsCount')},
      {id:'grounding',title:'Grounding',list:$('piCompassGroundingList'),count:$('piCompassGroundingCount')}]
   : [{id:'timeline',title:'Timeline',list:$('piTimelineList'),count:$('piTimelineCount')},
      {id:'notes',title:'Saved Notes',list:$('piSavedNoteList'),count:$('piNoteCount')}];
 const current=compass?$('piCompassCurrentList'):null;
 const titleField=$(compass?'piCompassTitle':'piNoteTitle'),
       editor=$(compass?'piCompassEditor':'piNoteEditor'),
       sectionField=$(compass?'piCompassSection':'piNoteSection'),
       dateField=$(compass?'piCompassDate':'piNoteDate'),
       saveButton=$(compass?'piCompassSave':'piSaveNote'),
       imageField=$(compass?'piCompassImageUrl':'piNoteImageUrl'),
       linkField=$(compass?'piCompassLinkUrl':'piNoteLinkUrl');
 const defaults=()=>compass?
   [{id:'goals-core',name:'Core Goals',side:'goals',collapsed:false},
    {id:'grounding-everyday',name:'Everyday Joy',side:'grounding',collapsed:false}]:
   [{id:'general',name:'General',side:'notes',collapsed:false},
    {id:'patterns',name:'Patterns',side:'notes',collapsed:false}];
 const destinations=()=>[
   ...(compass?[{id:MAIN,label:'Currently...',side:'current'},
     {id:GOALS,label:'Goals · main column',side:'goals'},
     {id:GROUNDING,label:'Grounding · main column',side:'grounding'}]:[
     {id:TIMELINE,label:'Timeline · main column',side:'timeline'},
     {id:MAIN,label:'Saved Notes · main column',side:'notes'}]),
   ...cols.flatMap(c=>state.sections.filter(s=>s.side===c.id).map(s=>({id:s.id,label:c.title+' · '+s.name,side:c.id})))
 ];
 function normalise(data){
   if(!data||!Array.isArray(data.entries)||!Array.isArray(data.sections)) data={sections:defaults(),entries:[]};
   if(!data.sections.length)data.sections=defaults();
   data.sections.forEach(s=>{ if(!s.side)s.side=compass?'goals':'notes';if(!['goals','grounding','timeline','notes'].includes(s.side))s.side=compass?'goals':'notes';if(typeof s.collapsed!=='boolean')s.collapsed=false; });
   data.entries.forEach(n=>{if(!n.sectionId)n.sectionId=data.sections[0].id;});
   return data;
 }
 let state=normalise(read(KEY,null));
 let selected=null,dragging=null,dragSection=null,dragSub=null;
 function persist(){save(KEY,state);}
 function sideOf(id){ if(id===MAIN)return compass?'current':'notes';if(id===GOALS)return 'goals';if(id===GROUNDING)return 'grounding';if(id===TIMELINE)return 'timeline';return state.sections.find(s=>s.id===id)?.side||cols[0].id; }
 function isLine(n){return n.noteType==='line';}
 function isExpanded(n){return n.wsExpanded!==undefined?Boolean(n.wsExpanded):(compass&&n.sectionId===MAIN?Boolean(n.currentExpanded):Boolean(n.expanded));}
 function setExpanded(n,x,legacy){n.wsExpanded=x;n.currentExpanded=x;n.expanded=x;commit(n,legacy);renderAll();}
 function created(n){return n.createdAt||n.date||iso();}
 function dateOnly(n){ const v=String(created(n));return /^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(0,10):iso(); }
 function shortDate(d){return d?dateLabel(d):'';}
 function legacyItems(){if(compass)return[];const all=read(LEGACY_KEY,[]);return Array.isArray(all)?all.filter(x=>x&&x.zone==='timeline'):[];}
 function legacyById(id){return legacyItems().find(n=>n.id===id);}
 function commit(n,legacy){
   if(!legacy){persist();return;}
   const old=read(LEGACY_KEY,[]);if(!Array.isArray(old))return;
   const at=old.findIndex(x=>x.id===n.id&&x.zone==='timeline');if(at<0)return;
   old[at]={...old[at],...n,zone:'timeline'};save(LEGACY_KEY,old);
 }
 function migrateLegacy(n,destination){
   const raw=localStorage.getItem(KEY), old=localStorage.getItem(LEGACY_KEY);
   const rows=read(LEGACY_KEY,[]);if(!Array.isArray(rows))return false;
   if(!rows.some(row=>row.zone==='timeline'&&row.id===n.id))return false;
   const entry={...n,id:uid('moved-timeline'),legacyId:n.id,legacySource:'timeline',sectionId:destination};
   delete entry.zone;
   try {
     state.entries.unshift(entry);
     persist();
     save(LEGACY_KEY,rows.filter(row=>!(row.zone==='timeline'&&row.id===n.id)));
     return true;
   }catch(e){
     state.entries=state.entries.filter(x=>x.id!==entry.id);
     try{raw===null?localStorage.removeItem(KEY):localStorage.setItem(KEY,raw);old===null?localStorage.removeItem(LEGACY_KEY):localStorage.setItem(LEGACY_KEY,old);}catch{}
     alert('The note could not be moved; the original is preserved.');console.error(e);return false;
   }
 }
 function movingId(n,legacy){return(legacy?'legacy:':'entry:')+n.id;}
 function findSelected(){if(!selected)return null;const legacy=selected.startsWith('legacy:');const id=selected.slice(legacy?7:6);const n=legacy?legacyById(id):state.entries.find(x=>x.id===id);return n?{n,legacy}:null;}
 function move(n,legacy,dest,before=null){
   if(!destinations().some(x=>x.id===dest))return;
   if(legacy){if(!migrateLegacy(n,dest))return;}else{
     const at=state.entries.findIndex(x=>x.id===n.id);if(at<0)return;
     state.entries.splice(at,1);
     if(dest===MAIN&&compass&&n.sectionId!==MAIN){n.currentSide=sideOf(n.sectionId);n.lastSectionId=n.sectionId;}
     n.sectionId=dest;
     const target=before?state.entries.findIndex(x=>x.id===before):-1;
     state.entries.splice(target<0?state.entries.length:target,0,n);
     persist();
   }
   selected=null;dragging=null;dragSub=null;renderAll();
 }
 function moveSection(s,targetSide){if(s.side===targetSide)return;s.side=targetSide;persist();renderAll();}
 function addSection(side){
   const s={id:uid('ws-section'),name:'New section',side,collapsed:false};
   state.sections.push(s);persist();renderAll();
   requestAnimationFrame(()=>document.querySelector(`[data-ws-section="${s.id}"] .pi-section-name`)?.focus());
 }
 function deleteNote(n,legacy){
   if(!confirm('Delete this note and its checklist items?'))return;
   if(legacy){const a=read(LEGACY_KEY,[]);save(LEGACY_KEY,a.filter(x=>!(x.zone==='timeline'&&x.id===n.id)));}
   else{state.entries=state.entries.filter(x=>x.id!==n.id);persist();}
   renderAll();
 }
 function archiveNote(n,legacy){
   if(!confirm('Archive this note and its checklist items?'))return;
   const key=ARCHIVE_KEY,old=localStorage.getItem(key),prev=localStorage.getItem(legacy?LEGACY_KEY:KEY);
   const rows=read(key,[]);if(!Array.isArray(rows)){alert('Archive format could not be read. Nothing changed.');return;}
   const text=[n.title,n.text,...(n.subtasks||[]).map(s=>(s.done?'☑ ':'☐ ')+s.text)].filter(Boolean).join('\n');
   const record={id:uid('archived'),recordType:'item',source:compass?'Compass':'Timeline',context:sideOf(n.sectionId),text,archivedAt:new Date().toISOString(),metadata:{noteType:n.noteType||'category',subtasks:n.subtasks||[],createdAt:created(n),completedAt:n.completedAt||null}};
   try {
     save(key,[record,...rows]);
     if(legacy){const list=read(LEGACY_KEY,[]);save(LEGACY_KEY,list.filter(x=>!(x.zone==='timeline'&&x.id===n.id)));}
     else{state.entries=state.entries.filter(x=>x.id!==n.id);persist();}
     renderAll();
   }catch(e){try{old===null?localStorage.removeItem(key):localStorage.setItem(key,old);prev===null?localStorage.removeItem(legacy?LEGACY_KEY:KEY):localStorage.setItem(legacy?LEGACY_KEY:KEY,prev);}catch{}alert('Archive not completed. Your note was preserved.');console.error(e);}
 }
 function createSub(n,legacy,value){const text=String(value||'').trim();if(!text)return;
   n.subtasks=Array.isArray(n.subtasks)?n.subtasks:[];
   n.subtasks.push({id:uid('sub'),text,done:false,createdAt:new Date().toISOString(),completedAt:null});commit(n,legacy);renderAll();
 }
 function moveSub(n,legacy,sub,target,otherParent=null){
   if(!destinations().some(d=>d.id===target)&&!otherParent)return;
   const oldSubs=Array.isArray(n.subtasks)?n.subtasks:[];
   if(!oldSubs.some(x=>x.id===sub.id))return;
   if(otherParent){
     const {n:other,legacy:otherLegacy}=otherParent;
     if(other.id===n.id)return;
     other.subtasks=Array.isArray(other.subtasks)?other.subtasks:[];
     other.subtasks.push({...sub});
     commit(other,otherLegacy);
   }else{
     state.entries.unshift({id:uid('line'),title:sub.text,text:'',html:'',noteType:'line',done:!!sub.done,createdAt:sub.createdAt||new Date().toISOString(),completedAt:sub.completedAt||null,sectionId:target,expanded:false});
     persist();
   }
   n.subtasks=oldSubs.filter(x=>x.id!==sub.id);commit(n,legacy);dragSub=null;renderAll();
 }
 function makeMenu(items,title='Note actions'){
   const menu=el('details','pi-ws-menu');
   const s=el('summary','','⋮');s.title=title;s.setAttribute('aria-label',title);
   const panel=el('div','pi-ws-menu-panel');
   items.forEach(action=>{
     if(action===null){panel.append(el('div','pi-ws-menu-divider'));return;}
     const b=btn(action[0],action[0],()=>{menu.open=false;action[1]();},'pi-ws-action');
     panel.append(b);
   });menu.append(s,panel);
   // Float menus above scrolling columns so destination choices do not clip.
   menu.addEventListener('toggle',()=>{
     if(!menu.open)return;
     const rect=s.getBoundingClientRect(), width=235;
     const spaceBelow=window.innerHeight-rect.bottom;
     panel.style.position='fixed';
     panel.style.left=Math.max(6,Math.min(rect.right-width,window.innerWidth-width-6))+'px';
     panel.style.top=(spaceBelow>260?rect.bottom+5:Math.max(6,rect.top-325))+'px';
   });
   return menu;
 }
 function attachDrop(target,destination,before=null,parent=null){
   if(target.dataset.wsDropBound===destination)return;
   target.dataset.wsDropBound=destination;
   target.addEventListener('dragover',ev=>{
     if(!dragging&&!dragSub)return;
     ev.preventDefault();ev.stopPropagation();target.classList.add('pi-drop-ready');
   });
   target.addEventListener('dragleave',ev=>{if(!target.contains(ev.relatedTarget))target.classList.remove('pi-drop-ready');});
   target.addEventListener('drop',ev=>{
     if(!dragging&&!dragSub)return;ev.preventDefault();ev.stopPropagation();target.classList.remove('pi-drop-ready');
     if(dragSub){const {n,sub,legacy}=dragSub;moveSub(n,legacy,sub,destination,parent);return;}
     const {n,legacy}=dragging;move(n,legacy,destination,before);
   });
   target.addEventListener('click',ev=>{
     if(!selected||ev.target.closest('button,input,select,[contenteditable="true"],a,summary'))return;
     const chosen=findSelected();if(chosen)move(chosen.n,chosen.legacy,destination,before);
   });
 }
 function editableTitle(n,legacy){
   const heading=el('div','pi-card-title pi-ws-title',n.title||'Untitled');heading.contentEditable='true';heading.spellcheck=true;heading.dataset.placeholder='Title';
   heading.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();heading.blur();}});
   heading.addEventListener('blur',()=>{n.title=heading.innerText.trim()||'Untitled';commit(n,legacy);});
   return heading;
 }
 function makeChecklist(n,legacy){
   const zone=el('div','pi-ws-subtasks');
   (Array.isArray(n.subtasks)?n.subtasks:[]).forEach(sub=>{
     const line=el('div','pi-ws-subrow');
     const grip=btn('⠿','Drag to another category or column',()=>{},'pi-mini-icon pi-move-handle');
     grip.draggable=true;grip.addEventListener('dragstart',e=>{e.stopPropagation();dragSub={n,sub,legacy};dragging=null;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',sub.id);});
     grip.addEventListener('dragend',()=>{dragSub=null;});
     const check=el('input');check.type='checkbox';check.checked=!!sub.done;check.setAttribute('aria-label','Complete '+sub.text);
     check.onchange=()=>{sub.done=check.checked;sub.completedAt=check.checked?new Date().toISOString():null;commit(n,legacy);renderAll();};
     const input=el('input','pi-ws-subtext');input.type='text';input.value=sub.text||'';input.setAttribute('aria-label','Checklist line');
     input.onchange=()=>{sub.text=input.value;commit(n,legacy);};
     input.onkeydown=e=>{if(e.key==='Enter')input.blur();};
     const stamp=el('span','pi-ws-stamp',shortDate(sub.completedAt||sub.createdAt));stamp.title=sub.completedAt?'Completed':'Created';
     const opt=destinations().map(d=>['Move to '+d.label,()=>moveSub(n,legacy,sub,d.id)]);
     const menu=makeMenu([...opt,null,['Delete line',()=>{if(!confirm('Delete this checklist line?'))return;n.subtasks=n.subtasks.filter(x=>x.id!==sub.id);commit(n,legacy);renderAll();}]],'Checklist actions');
     line.classList.toggle('is-done',!!sub.done);line.append(grip,check,input,stamp,menu);zone.append(line);
   });
   const addRow=el('div','pi-ws-addsub');
   const input=el('input');input.type='text';input.placeholder='. . .';input.setAttribute('aria-label','New checklist line');
   const add=btn('+','Add checklist line',()=>createSub(n,legacy,input.value),'pi-workspace-quiet');
   input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();createSub(n,legacy,input.value);}};
   addRow.append(input,add);zone.append(addRow);
   return zone;
 }
 function makeNote(n,legacy=false,isCurrent=false){
   const line=isLine(n),open=isCurrent?Boolean(n.currentExpanded):isExpanded(n);
   const card=el('article',`pi-note-card pi-ws-note ${isCurrent?'pi-current-tile pi-ws-current-tile':''} ${line?'pi-ws-line':'pi-ws-category'}`);
   card.dataset.itemId=n.id;card.dataset.noteType=line?'line':'category';card.classList.toggle('is-expanded',open);
   card.classList.toggle('pi-move-selected',selected===movingId(n,legacy));
   const head=el('div','pi-note-card-head pi-ws-note-head');
   // This card already owns a complete movement/actions menu. Do not install a duplicate from the older global UI.
   head.dataset.piCrossReady='true';
   const moveBtn=btn('⠿','Move note: drag or click, then choose a destination',()=>{selected=selected===movingId(n,legacy)?null:movingId(n,legacy);renderAll();},'pi-mini-icon pi-move-handle');
   moveBtn.draggable=true;moveBtn.addEventListener('dragstart',e=>{dragging={n,legacy};dragSub=null;e.dataTransfer.setData('text/plain',n.id);e.dataTransfer.effectAllowed='move';});moveBtn.addEventListener('dragend',()=>{dragging=null;});
   head.append(moveBtn);
   if(line){const check=el('input');check.type='checkbox';check.checked=Boolean(n.done);check.setAttribute('aria-label','Complete '+(n.title||'checklist note'));
     check.onchange=()=>{n.done=check.checked;n.completedAt=check.checked?new Date().toISOString():null;commit(n,legacy);renderAll();};head.append(check);card.classList.toggle('is-done',Boolean(n.done));
   }
   head.append(editableTitle(n,legacy));
   const fold=btn(open?'▾':'▸',open?'Collapse note':'Expand note',()=>{if(isCurrent){n.currentExpanded=!open;commit(n,legacy);renderAll();}else setExpanded(n,!open,legacy);},'pi-mini-icon pi-ws-note-toggle');
   fold.setAttribute('aria-expanded',String(open));
   const menuItems=[...destinations().filter(d=>d.id!==n.sectionId).map(d=>['Move to '+d.label,()=>move(n,legacy,d.id)]),null,
     [line?'Convert to category note':'Convert to checklist line',()=>{n.noteType=line?'category':'line';commit(n,legacy);renderAll();}],
     ...(!line?[[(n.showDetails===false?'Show':'Hide')+' details field',()=>{n.showDetails=n.showDetails===false;commit(n,legacy);renderAll();}]]:[]),
     ['Archive',()=>archiveNote(n,legacy)],['Delete',()=>deleteNote(n,legacy)]];
   const menu=makeMenu(menuItems,'Note actions and movement');
   head.append(fold,menu);card.append(head);
   head.addEventListener('click',e=>{if(e.target.closest('button,input,select,[contenteditable],a,summary,details'))return;fold.click();});
   if(open){
     const body=el('div','pi-ws-note-body');
     const meta=el('div','pi-ws-meta');meta.append(el('span','',`Created ${shortDate(created(n))}`));
     if(n.completedAt)meta.append(el('span','',`Completed ${shortDate(n.completedAt)}`));
     body.append(meta);
     if(!line){
       if(n.showDetails!==false){const desc=el('div','pi-note-card-body pi-ws-details');desc.contentEditable='true';desc.spellcheck=true;desc.dataset.placeholder='. . .';desc.innerHTML=safeHtml(n.html||escHtml(n.text||''));
         desc.onblur=()=>{n.html=safeHtml(desc.innerHTML);n.text=desc.innerText.trim();commit(n,legacy);};body.append(desc);}
       body.append(makeChecklist(n,legacy));
     }else if(n.html||n.text){
       const desc=el('div','pi-note-card-body pi-ws-details');desc.contentEditable='true';desc.spellcheck=true;desc.dataset.placeholder='. . .';desc.innerHTML=safeHtml(n.html||escHtml(n.text||''));
       desc.onblur=()=>{n.html=safeHtml(desc.innerHTML);n.text=desc.innerText.trim();commit(n,legacy);};body.append(desc);
     }
     if(n.imageUrl&&/^https?:\/\//i.test(n.imageUrl)){const pic=el('img','pi-note-image');pic.src=n.imageUrl;pic.alt=n.title||'Attached image';pic.loading='lazy';body.append(pic);}
     if(n.linkUrl&&/^https?:\/\//i.test(n.linkUrl)){const link=el('a','pi-note-link','open link ↗');link.href=n.linkUrl;link.rel='noopener noreferrer';link.target='_blank';body.append(link);}
     card.append(body);
   }
   if(isCurrent){card.classList.add('pi-current-tile');card.style.setProperty('--ws-tile-index',String((state.entries.indexOf(n)+4)%4));}
   attachDrop(card,n.sectionId,n.id,line?null:{n,legacy});
   return card;
 }
 function makeSection(s){
   const wrap=el('section','pi-notes-section pi-ws-section');wrap.dataset.wsSection=s.id;
   const head=el('div','pi-notes-section-head pi-ws-section-head');
   const drag=btn('⠿','Drag section to another column',()=>{},'pi-mini-icon pi-move-handle');drag.draggable=true;
   drag.addEventListener('dragstart',e=>{dragSection=s;e.dataTransfer.setData('text/plain',s.id);e.dataTransfer.effectAllowed='move';});drag.addEventListener('dragend',()=>dragSection=null);
   const title=el('div','pi-section-name',s.name);title.contentEditable='true';title.spellcheck=true;
   title.onblur=()=>{s.name=title.innerText.trim()||'Section';persist();renderPicker();};title.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();title.blur();}};
   const count=el('small','pi-muted',String(state.entries.filter(x=>x.sectionId===s.id).length));
   const fold=btn(s.collapsed?'▸':'▾',s.collapsed?'Expand section':'Collapse section',()=>{s.collapsed=!s.collapsed;persist();renderAll();},'pi-mini-icon');
   const menu=makeMenu([['Add category note',()=>addBlank(s.id,'category')],['Add checklist note',()=>addBlank(s.id,'line')],
     ...cols.filter(c=>c.id!==s.side).map(c=>['Move section to '+c.title,()=>moveSection(s,c.id)]),null,
     ['Delete section',()=>{const entries=state.entries.filter(x=>x.sectionId===s.id);if(entries.length&&!confirm('Move the notes to the main column and remove this section?'))return;
       entries.forEach(n=>n.sectionId=compass?MAIN:s.side==='timeline'?TIMELINE:MAIN);state.sections=state.sections.filter(x=>x.id!==s.id);persist();renderAll();}]],'Section options');
   head.append(drag,title,count,fold,menu);
   head.onclick=e=>{if(e.target.closest('button,input,[contenteditable],summary,details'))return;s.collapsed=!s.collapsed;persist();renderAll();};
   const body=el('div','pi-notes-section-body pi-ws-section-body');body.hidden=!!s.collapsed;
   if(!s.collapsed){state.entries.filter(n=>n.sectionId===s.id).forEach(n=>body.append(makeNote(n)));
     if(!body.children.length)body.append(el('p','pi-muted','Move a note here or add one from the menu.'));
   }
   attachDrop(body,s.id);attachDrop(head,s.id);
   head.addEventListener('dragover',e=>{if(dragSection&&dragSection!==s){e.preventDefault();e.stopPropagation();head.classList.add('pi-drop-ready');}});
   head.addEventListener('drop',e=>{if(dragSection&&dragSection!==s){e.preventDefault();e.stopPropagation();dragSection.side=s.side;const from=state.sections.indexOf(dragSection);state.sections.splice(from,1);state.sections.splice(state.sections.indexOf(s),0,dragSection);dragSection=null;persist();renderAll();}});
   wrap.append(head,body);return wrap;
 }
 function addBlank(dest,kind){
   const n={id:uid('ws-note'),title:'Untitled',text:'',html:'',subtasks:[],noteType:kind,createdAt:new Date().toISOString(),completedAt:null,done:false,sectionId:dest,expanded:kind==='category',currentExpanded:false};
   state.entries.unshift(n);persist();renderAll();requestAnimationFrame(()=>document.querySelector(`.pi-ws-note[data-item-id="${n.id}"] .pi-ws-title`)?.focus());
 }
 function renderColumn(c){
   const root=c.list;root.replaceChildren();root.classList.add('pi-ws-column');
   const main=compass?(c.id==='goals'?GOALS:GROUNDING):(c.id==='timeline'?TIMELINE:MAIN);
   if(main){
     const rows=state.entries.filter(x=>x.sectionId===main);
     rows.forEach(n=>root.append(makeNote(n)));
     if(c.id==='timeline')legacyItems().forEach(n=>root.append(makeNote(n,true)));
   }
   state.sections.filter(s=>s.side===c.id).forEach(s=>root.append(makeSection(s)));
   if(!root.children.length)root.append(el('p','pi-muted','Add a note or move one into this column.'));
   if(c.count)c.count.textContent=String(state.entries.filter(n=>sideOf(n.sectionId)===c.id).length+(c.id==='timeline'?legacyItems().length:0));
   attachDrop(root,main);
 }
 function renderCurrent(){
   if(!current)return;
   const scroll=current.scrollLeft;
   current.replaceChildren();current.classList.add('pi-current-rail','pi-ws-current-rail');
   const entries=state.entries.filter(n=>n.sectionId===MAIN);
   $('piCompassCurrentCount').textContent=String(entries.length);
   entries.forEach(n=>current.append(makeNote(n,false,true)));
   if(!entries.length)current.append(el('div','pi-muted pi-current-empty','Move a category or checklist note here to keep it in view.'));
   current.scrollLeft=scroll;
   attachDrop(current,MAIN);
 }
 function renderPicker(){
   const value=sectionField.value;sectionField.replaceChildren();
   const groups=compass?[{side:'current',title:'Currently...'},{side:'goals',title:'Goals'},{side:'grounding',title:'Grounding'}]:[{side:'timeline',title:'Timeline'},{side:'notes',title:'Saved Notes'}];
   const items=destinations();groups.forEach(group=>{
     const optgroup=document.createElement('optgroup');optgroup.label=group.title;
     items.filter(item=>item.side===group.side).forEach(d=>{const o=el('option','',d.label);o.value=d.id;optgroup.append(o);});
     sectionField.append(optgroup);
   });
   sectionField.value=items.some(d=>d.id===value)?value:(compass?MAIN:MAIN);
 }
 function renderAll(){renderPicker();renderCurrent();cols.forEach(renderColumn);}
 // Opt-in type picker that keeps the existing title, rich editor and date inputs.
 const formRow=sectionField.closest('.pi-workspace-form-row');
 let typeField=$(compass?'piCompassNoteType':'piTimelineNoteType');
 if(formRow&&!typeField){
   const label=el('label','pi-ws-type-label','Type');typeField=el('select');typeField.id=compass?'piCompassNoteType':'piTimelineNoteType';
   [['line','Checklist line'],['category','Category note']].forEach(([v,t])=>{const option=el('option','',t);option.value=v;typeField.append(option);});
   typeField.value='category';label.append(typeField);formRow.prepend(label);formRow.classList.add('pi-ws-three-fields');
 }
 function submit(destination=null){
   const title=titleField.value.trim(),text=editor.innerText.trim(),html=safeHtml(editor.innerHTML);
   if(!title&&!text){titleField.focus();return;}
   const kind=typeField?.value==='line'?'line':'category';
   const target=destination||sectionField.value||(compass?MAIN:MAIN);
   const n={id:uid('ws-note'),title:title||text.split('\n')[0].slice(0,90)||'Untitled',text:kind==='line'&&(!title)?'':text,
     html:kind==='line'&&(!title)?'':html,noteType:kind,subtasks:[],createdAt:new Date().toISOString(),done:false,completedAt:null,
     sectionId:target,date:dateField.value||iso(),expanded:kind==='category',currentExpanded:false,
     imageUrl:imageField.value.trim(),linkUrl:linkField.value.trim()};
   // A standalone checklist line uses the composer text as its label if no separate title.
   if(kind==='line'&&!title&&text)n.title=text.replace(/\s+/g,' ').slice(0,180);
   state.entries.unshift(n);persist();titleField.value='';editor.innerHTML='';imageField.value='';linkField.value='';renderAll();titleField.focus();
 }
 saveButton.onclick=()=>submit();
 editor.onkeydown=e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();submit();}};
 if(compass){
   $('piCompassAddGoalSection').onclick=()=>addSection('goals');
   $('piCompassAddGroundingSection').onclick=()=>addSection('grounding');
 }else{
   $('piAddNoteSection').onclick=()=>addSection('notes');
   $('piAddTimelineSection').onclick=()=>addSection('timeline');
   $('piMoveToTimeline').onclick=()=>submit(TIMELINE);
 }
 dateField.value=iso();
 window.addEventListener('storage',event=>{
   if(event.key===KEY||(!compass&&event.key===LEGACY_KEY)){state=normalise(read(KEY,null));renderAll();}
 });
 window.addEventListener('focus',()=>{state=normalise(read(KEY,null));renderAll();});
 renderAll();
}
function initReflections(){initUnifiedWorkspace('timeline');}
function initCompass(){initUnifiedWorkspace('compass');}

document.addEventListener('DOMContentLoaded',()=>{initArchive();initReflections();initCompass();});
})();
;
