/* Date dashboards. Calendar records deliberately share Database's canonical keys. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const today = () => makeLocalIsoDate();
 const month = () => today().slice(0,7);
 const read = (key, fallback=[]) => {
   const raw = localStorage.getItem(key);
   if (raw === null) return fallback;
   const value = JSON.parse(raw);
   if (!Array.isArray(value)) throw new Error('Saved list has an unexpected format.');
   return value;
 };
 const write = (key,value) => localStorage.setItem(key,JSON.stringify(value));
 const safe = fn => { try { return fn(); } catch(e) { console.error(e); alert('This change could not be saved. Your existing data is still available; please download a backup and check browser storage.'); } };
 const el = (tag,cls,text) => { const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=text; return n; };
 const button = (text,title,fn) => {const b=el('button','planner-action',text);b.type='button';b.title=title;b.setAttribute('aria-label',title);b.onclick=()=>safe(fn);return b;};
 const labelMonth = key => new Date(key+'-01T12:00:00').toLocaleDateString(undefined,{month:'long',year:'numeric'});
 const datesOfMonth = key => {const d=new Date(key+'-01T12:00:00'), dates=[];while(makeLocalIsoDate(d).startsWith(key)){dates.push(makeLocalIsoDate(d));d.setDate(d.getDate()+1);}return dates;};
 function dayItems(date) {
   const current=read('pi-calendar-day-'+date);
   const historical=readArchiveRecords().filter(r=>r.recordType==='day'&&r.originalDate===date).flatMap(r=>r.items||[]);
   return [...historical,...current];
 }
 // Completed months are discovered from retained day history and dated notes.
 // One key per month avoids duplicate snapshots on reload and across tabs.
 function archiveMonths() {
   const keys=new Set(readArchiveRecords().filter(r=>r.recordType==='day').map(r=>r.originalDate?.slice(0,7)).filter(Boolean));
   for(const key of Object.keys(localStorage)) {
     const match=key.match(/^pi-planner-month-(\d{4}-\d{2})(?:-draft)?$/);
     if(match)keys.add(match[1]);
   }
   keys.forEach(key=>{
     if(key>=month())return;
     const previous=JSON.parse(localStorage.getItem('pi-planner-archive-'+key)||'null');
     const snapshot={month:key,days:datesOfMonth(key).map(date=>({date,items:dayItems(date)})),notes:read('pi-planner-month-'+key),draft:localStorage.getItem('pi-planner-month-'+key+'-draft')||'',archivedAt:previous?.archivedAt||new Date().toISOString()};
     if(JSON.stringify(previous)===JSON.stringify(snapshot))return;
     localStorage.setItem('pi-planner-archive-'+key,JSON.stringify(snapshot));
   });
 }
 safe(archiveMonths);
 function archivePanel() {
   if(!$('archiveApp'))return;
   const section=el('section','panel planner-month-history');
   section.append(el('h2','','Month Archive'));
   const keys=Object.keys(localStorage).filter(k=>/^pi-planner-archive-\d{4}-\d{2}$/.test(k)).sort().reverse();
   if(!keys.length)section.append(el('p','','Completed months will appear here automatically.'));
   keys.forEach(key=>{
     const snapshot=JSON.parse(localStorage.getItem(key));
     const details=el('details');details.append(el('summary','',labelMonth(snapshot.month)));
     const link=el('a','small-button','Open calendar');link.href='Month.html?month='+snapshot.month;details.append(link);
     snapshot.days.filter(d=>d.items.length).forEach(d=>{details.append(el('h3','',d.date));d.items.forEach(i=>details.append(el('p','',`${i.done?'☑':'☐'} ${i.text}`)));});
     if(snapshot.notes.length)details.append(el('h3','','Notes'));
     snapshot.notes.forEach(i=>details.append(el('p','',`${i.checkable===false?'':i.done?'☑ ':'☐ '}${i.text}`)));
     if(snapshot.draft){details.append(el('h3','','Unfinished note'));details.append(el('p','',snapshot.draft));}
     section.append(details);
   });
   const grid=document.querySelector('.archive-v2-grid');
   // Keep the existing archive columns intact; month history opens on demand.
   const dialog=el('dialog','planner-history-dialog');
   dialog.append(button('Close','Close month archive',()=>dialog.close()),section);document.body.append(dialog);
   const open=button('Month Archive','Open month archive',()=>dialog.showModal());
   (document.getElementById('piArchiveModes')||document.querySelector('.patterns-header')).append(open);
 }
 safe(archivePanel);
 const kind=document.body.dataset.planner;
 if(!kind)return;
 let dateStamp=today(), currentMonth=month();
 const requested=new URLSearchParams(location.search).get('month');
 const historical=kind==='month'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(requested||'')&&requested<month()?requested:null;
 const snapshot=historical?JSON.parse(localStorage.getItem('pi-planner-archive-'+historical)||'null'):null;
 const noteKey=()=>kind==='week'?'pi-planner-week-notes-v1':'pi-planner-month-'+(historical||currentMonth);
 const draftKey=()=>noteKey()+'-draft';
 let drag=null;
 const dayDialog=el('dialog','planner-day-dialog');
 let selectedDate=null;
 dayDialog.addEventListener('close',()=>safe(renderDays));
 document.body.append(dayDialog);
 function fillDayDialog(){
   if(!selectedDate)return;
   const card=document.querySelector(`.planner-day[data-date="${selectedDate}"]`);
   if(!card)return;
   dayDialog.replaceChildren(button('Close','Close day',()=>dayDialog.close()),el('h2','',new Date(selectedDate+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})));
   for(const child of [...card.children])if(child.matches('.planner-day-items,.planner-day-form'))dayDialog.append(child);
 }
 function openDay(date){selectedDate=date;fillDayDialog();dayDialog.showModal();}

 function updateList(key,index,fn) {const items=read(key);fn(items,index);write(key,items);renderNotes();renderDays();showSaved();}
 function row(item,index,key,readonly=false) {
   const r=el('div','planner-item'+(item.done?' is-done':''));
   if(item.checkable!==false){const c=el('input');c.type='checkbox';c.checked=!!item.done;c.disabled=readonly;c.setAttribute('aria-label','Complete: '+item.text);c.onchange=()=>safe(()=>updateList(key,index,a=>{a[index].done=c.checked;}));r.append(c);}
   const text=el('div','planner-item-text',item.text);r.append(text);
   if(readonly)return r;
   const actions=el('div','planner-item-actions');
   actions.append(button('✎','Edit item',()=>{
     const field=el('textarea','planner-edit');field.value=item.text;text.replaceWith(field);actions.replaceChildren();
     actions.append(button('Save','Save edit',()=>{if(!field.value.trim())return;updateList(key,index,a=>{a[index].text=field.value.trim();});}),button('Cancel','Cancel edit',()=>{renderNotes();renderDays();}));field.focus();
   }));
   for(const [label,delta] of [['↑',-1],['↓',1]])actions.append(button(label,delta<0?'Move item up':'Move item down',()=>updateList(key,index,a=>{const next=index+delta;if(next>=0&&next<a.length)[a[index],a[next]]=[a[next],a[index]];})));
   actions.append(button('×','Delete item',()=>{if(confirm('Delete this item?'))updateList(key,index,a=>a.splice(index,1));}));
   r.append(actions);r.draggable=true;
   r.ondragstart=e=>{if(e.target.closest('textarea,input,button')){e.preventDefault();return;}drag={key,index};e.dataTransfer.setData('text/plain','planner-item');};
   r.ondragend=()=>{drag=null;};
   r.ondragover=e=>{if(drag?.key===key)e.preventDefault();};
   r.ondrop=e=>{if(drag?.key!==key)return;e.preventDefault();const from=drag.index;drag=null;safe(()=>updateList(key,index,a=>{const [v]=a.splice(from,1);a.splice(index,0,v);}));};
   return r;
 }
 function renderNotes(){
   const container=$('plannerNotes');container.replaceChildren();
   const items=historical?(snapshot?.notes||[]):read(noteKey());
   if(!items.length)container.append(el('p','planner-empty',historical?'No notes saved.':'A clear space for what matters.'));
   items.forEach((item,i)=>container.append(row(item,i,noteKey(),!!historical)));
 }
 const drafts=new Map();
 function renderDays(){
   document.querySelectorAll('.planner-day-input').forEach(n=>drafts.set(n.dataset.date,n.value));
   const grid=$('plannerGrid');grid.replaceChildren();grid.classList.toggle('is-month',kind==='month');
   let dates=[];
   if(kind==='week'){
     const d=new Date(dateStamp+'T12:00:00');for(let i=0;i<8;i++){dates.push(makeLocalIsoDate(d));d.setDate(d.getDate()+1);}
     const fmt={month:'short',day:'numeric'};
     $('plannerRange').textContent=new Date(dates[0]+'T12:00:00').toLocaleDateString(undefined,fmt)+' – '+new Date(dates[7]+'T12:00:00').toLocaleDateString(undefined,fmt);
     $('plannerHint').textContent='Today + 7 days';
   } else {
     dates=datesOfMonth(historical||currentMonth);$('plannerRange').textContent=labelMonth(historical||currentMonth);
     $('plannerHint').textContent=historical?'Archived month · read only':'Shared with Database';
     if(historical){const a=el('a','small-button','Current month');a.href='Month.html';$('plannerHint').append(' · ',a);}
     ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>grid.append(el('div','planner-weekday',d)));
     const offset=(new Date(dates[0]+'T12:00:00').getDay()+6)%7;
     for(let i=0;i<offset;i++){const empty=el('div','planner-blank');empty.setAttribute('aria-hidden','true');grid.append(empty);}
   }
   dates.forEach(date=>{
     const past=date<today(), readonly=!!historical||past;
     const card=el('section','planner-day'+(date===today()?' is-today':'')+(past?' is-past':''));card.dataset.date=date;
     const d=new Date(date+'T12:00:00');const h=el('h3');h.append(el('span','',d.toLocaleDateString(undefined,{weekday:'short'})),el('strong','',String(d.getDate())));if(date===today())h.append(el('span','planner-today','Today'));card.append(h);
     if(kind==='month'){const dateButton=button(String(d.getDate()),'View '+date,()=>openDay(date));dateButton.classList.add('planner-date-button');h.querySelector('strong').replaceWith(dateButton);}
     if(kind==='month'){const open=button(String(d.getDate()),'Open '+date,()=>openDay(date));open.classList.add('planner-mobile-day');card.append(open);}
     const list=el('div','planner-day-items');
     const items=historical?(snapshot?.days.find(d=>d.date===date)?.items||[]):dayItems(date);
     // Archived fragments remain read-only; active records retain their original indices.
     const archivedCount=historical?items.length:items.length-read('pi-calendar-day-'+date).length;
     items.forEach((item,i)=>list.append(row(item,i-archivedCount,'pi-calendar-day-'+date,readonly||i<archivedCount)));
     card.append(list);
     if(kind==='month')card.append(el('span','planner-mobile-count',items.length?`${items.length} item${items.length===1?'':'s'}`:''));
     if(!readonly){
       const form=el('form','planner-day-form'),input=el('textarea','planner-day-input');input.rows=1;input.dataset.date=date;input.setAttribute('aria-label','Add item for '+date);input.placeholder='Add…';input.value=drafts.get(date)??localStorage.getItem('pi-planner-day-draft-'+date)??'';
       input.oninput=()=>safe(()=>{drafts.set(date,input.value);localStorage.setItem('pi-planner-day-draft-'+date,input.value);});
       const add=el('button','planner-action','+');add.type='submit';add.setAttribute('aria-label','Save item for '+date);form.append(input,add);
       form.onsubmit=e=>{e.preventDefault();safe(()=>{if(!input.value.trim())return;const key='pi-calendar-day-'+date,a=read(key);a.push({id:archiveId('task'),text:input.value.trim(),done:false});write(key,a);input.value='';drafts.delete(date);localStorage.removeItem('pi-planner-day-draft-'+date);renderDays();showSaved();});};card.append(form);
     }
     grid.append(card);
   });
   if(kind==='month'){while((grid.children.length-7)%7)grid.append(el('div','planner-blank'));grid.style.setProperty('--month-weeks',(grid.children.length-7)/7);}
   if(dayDialog.open)fillDayDialog();
 }
 function restoreDraft(){ $('plannerNoteInput').value=historical?(snapshot?.draft||''):localStorage.getItem(draftKey())||''; }
 $('plannerComposer').hidden=!!historical;
 $('plannerNoteInput').oninput=()=>safe(()=>localStorage.setItem(draftKey(),$('plannerNoteInput').value));
 $('plannerComposer').onsubmit=e=>{e.preventDefault();safe(()=>{const text=$('plannerNoteInput').value.trim();if(!text)return;const a=read(noteKey());a.unshift({id:archiveId('planner'),text,done:false,checkable:$('plannerCheckable').checked});write(noteKey(),a);$('plannerNoteInput').value='';localStorage.removeItem(draftKey());renderNotes();showSaved();});};
 function refreshDate(){safe(()=>{
   if(today()===dateStamp)return;
   // Draft is already saved under the old month's key before rollover.
   archiveExpiredDayLists();archiveMonths();dateStamp=today();currentMonth=month();restoreDraft();renderNotes();renderDays();
 });}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDate();});
 setInterval(refreshDate,30000);
 window.addEventListener('storage',e=>{if(e.key&&(e.key.startsWith('pi-calendar-day-')||e.key===noteKey()||e.key===ARCHIVE_STORAGE_KEY))safe(()=>{if(document.activeElement?.matches('textarea'))return;renderNotes();renderDays();});});
 safe(()=>{restoreDraft();renderNotes();renderDays();});
})();
