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
 const drafts=new Map();
 const dayDialog=el('dialog','planner-day-dialog');
 let selectedDate=null;
 document.body.append(dayDialog);
 const sortedEntries = entries => entries.slice().sort((a,b)=>Number(!!a.item.done)-Number(!!b.item.done));
 function getDayEntries(date){
   if(historical)return (snapshot?.days.find(d=>d.date===date)?.items||[]).map(item=>({item,index:-1,readonly:true}));
   const archived=readArchiveRecords().filter(r=>r.recordType==='day'&&r.originalDate===date).flatMap(r=>r.items||[]).map(item=>({item,index:-1,readonly:true}));
   const past=date<today();
   const active=read('pi-calendar-day-'+date).map((item,index)=>({item,index,readonly:past}));
   return sortedEntries([...archived,...active]);
 }
 function updateList(key,index,fn){
   const items=read(key);if(index<0||index>=items.length)return;
   fn(items,index);write(key,items);renderNotes();renderDays();if(dayDialog.open)fillDayDialog();showSaved();
 }
 // Do not dismiss Save / Cancel while an item is being edited. The editor
 // lives within the row, outside the options popup, and must remain usable
 // when the user taps the textarea or clicks elsewhere to reposition focus.
 function closeActionMenus(except=null){
   document.querySelectorAll('.planner-item.actions-open').forEach(node=>{
     if(node!==except && !node.classList.contains('is-editing')) node.classList.remove('actions-open');
   });
 }
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('.planner-item-actions,.planner-more'))closeActionMenus();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeActionMenus();});
 function row(item,index,key,readonly=false,mode='full'){
   const r=el('div','planner-item'+(item.done?' is-done':''));
   if(mode==='preview'){
     r.classList.add('planner-preview-item');
     r.append(el('span','planner-item-text',item.text));
     return r;
   }
   if(item.checkable!==false){const c=el('input');c.type='checkbox';c.checked=!!item.done;c.disabled=readonly;c.setAttribute('aria-label','Complete: '+item.text);c.onchange=()=>safe(()=>updateList(key,index,a=>{a[index].done=c.checked;}));r.append(c);}
   const content=el('div','planner-item-text',item.text);r.append(content);
   if(readonly)return r;
   const more=button('⋮','Item options',()=>{const was=r.classList.contains('actions-open');closeActionMenus();r.classList.toggle('actions-open',!was);});more.classList.add('planner-more');more.setAttribute('aria-haspopup','true');r.append(more);
   const actions=el('div','planner-item-actions');
   const addAction=(label,title,fn)=>{const b=button(label,title,()=>{closeActionMenus();fn();});actions.append(b);};
   addAction('Edit','Edit item',()=>{
     const field=el('textarea','planner-edit');field.value=item.text;content.replaceWith(field);more.hidden=true;actions.replaceChildren();r.classList.add('actions-open','is-editing');
     actions.append(button('Save','Save edit',()=>{if(!field.value.trim())return;updateList(key,index,a=>{a[index].text=field.value.trim();});}),button('Cancel','Cancel edit',()=>{renderNotes();renderDays();if(dayDialog.open)fillDayDialog();}));field.focus();
   });
   for(const [label,delta] of [['↑','-1'],['↓','1']])addAction(label,delta==='-1'?'Move item up':'Move item down',()=>{
     const step=Number(delta);updateList(key,index,a=>{const group=a.map((v,i)=>({v,i})).filter(x=>!!x.v.done===!!a[index].done);const at=group.findIndex(x=>x.i===index),next=group[at+step];if(next)[a[index],a[next.i]]=[a[next.i],a[index]];});
   });
   addAction('Delete','Delete item',()=>{if(confirm('Delete this item?'))updateList(key,index,a=>a.splice(index,1));});
   r.append(actions);r.draggable=true;
   r.ondragstart=e=>{if(e.target.closest('textarea,input,button')){e.preventDefault();return;}drag={key,index,done:!!item.done};e.dataTransfer.setData('text/plain','planner-item');};
   r.ondragend=()=>{drag=null;};
   r.ondragover=e=>{if(drag?.key===key&&drag.done===!!item.done)e.preventDefault();};
   r.ondrop=e=>{if(drag?.key!==key||drag.done!==!!item.done)return;e.preventDefault();const from=drag.index;drag=null;safe(()=>updateList(key,index,a=>{const [v]=a.splice(from,1);a.splice(index,0,v);}));};
   return r;
 }
 function renderNotes(){
   const container=$('plannerNotes');container.replaceChildren();
   const items=historical?(snapshot?.notes||[]):read(noteKey());
   if(!items.length)container.append(el('p','planner-empty',historical?'No notes saved.':'A clear space for what matters.'));
   sortedEntries(items.map((item,index)=>({item,index}))).forEach(({item,index})=>container.append(row(item,index,noteKey(),!!historical)));
 }
 function makeDayForm(date){
   const form=el('form','planner-day-form is-open');const input=el('textarea','planner-day-input');input.rows=2;input.dataset.date=date;input.setAttribute('aria-label','Add item for '+date);input.placeholder='Write an item…';input.value=drafts.get(date)??localStorage.getItem('pi-planner-day-draft-'+date)??'';
   input.oninput=()=>safe(()=>{drafts.set(date,input.value);localStorage.setItem('pi-planner-day-draft-'+date,input.value);});
   const add=el('button','planner-action planner-submit-add','+');add.type='submit';add.title='Save item';add.setAttribute('aria-label','Save item for '+date);form.append(input,add);
   form.onsubmit=e=>{e.preventDefault();safe(()=>{if(!input.value.trim())return;const key='pi-calendar-day-'+date,a=read(key);a.push({id:archiveId('task'),text:input.value.trim(),done:false});write(key,a);input.value='';drafts.delete(date);localStorage.removeItem('pi-planner-day-draft-'+date);renderDays();if(dayDialog.open)fillDayDialog();showSaved();});};
   return form;
 }
 function fillDayDialog(){
   if(!selectedDate)return;
   const date=selectedDate, readonly=!!historical||date<today();
   const title=new Date(date+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
   const close=button('×','Close day',()=>dayDialog.close());close.classList.add('planner-dialog-close');
   const header=el('div','planner-dialog-header');header.append(el('h2','',title),close);
   const list=el('div','planner-dialog-list');const entries=getDayEntries(date);
   if(!entries.length)list.append(el('p','planner-empty','Nothing planned for this day yet.'));
   entries.forEach(({item,index,readonly:entryReadonly})=>list.append(row(item,index,'pi-calendar-day-'+date,readonly||entryReadonly)));
   dayDialog.replaceChildren(header,list);
   if(!readonly){const form=makeDayForm(date);form.classList.add('planner-dialog-form');dayDialog.append(form);}
   else dayDialog.append(el('p','planner-dialog-readonly','Past days and archived entries are read only.'));
 }
 function openDay(date){
   document.querySelectorAll('.planner-day-input').forEach(n=>drafts.set(n.dataset.date,n.value));
   selectedDate=date;fillDayDialog();if(!dayDialog.open)dayDialog.showModal();
 }
 dayDialog.addEventListener('click',e=>{if(e.target===dayDialog)dayDialog.close();});
 function renderDays(){
   document.querySelectorAll('.planner-day-input').forEach(n=>drafts.set(n.dataset.date,n.value));
   const grid=$('plannerGrid');grid.replaceChildren();grid.classList.toggle('is-month',kind==='month');
   let dates=[];
   if(kind==='week'){
     const d=new Date(dateStamp+'T12:00:00');for(let i=0;i<8;i++){dates.push(makeLocalIsoDate(d));d.setDate(d.getDate()+1);}
     const fmt={month:'short',day:'numeric'};
     $('plannerRange').textContent=new Date(dates[0]+'T12:00:00').toLocaleDateString(undefined,fmt)+' – '+new Date(dates[7]+'T12:00:00').toLocaleDateString(undefined,fmt);
     $('plannerHint').textContent='Today + 7 days';
   }else{
     dates=datesOfMonth(historical||currentMonth);$('plannerRange').textContent=labelMonth(historical||currentMonth);
     $('plannerHint').textContent=historical?'Archived month · read only':'Shared with Database';
     if(historical){const a=el('a','small-button','Current month');a.href='Month.html';$('plannerHint').append(' · ',a);}
     ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>grid.append(el('div','planner-weekday',d)));
     const offset=(new Date(dates[0]+'T12:00:00').getDay()+6)%7;
     for(let i=0;i<offset;i++){const empty=el('div','planner-blank');empty.setAttribute('aria-hidden','true');grid.append(empty);}
   }
   dates.forEach(date=>{
     const readonly=!!historical||date<today();
     const card=el('section','planner-day'+(date===today()?' is-today':'')+(date<today()?' is-past':''));card.dataset.date=date;
     const d=new Date(date+'T12:00:00');const h=el('h3');h.append(el('span','',d.toLocaleDateString(undefined,{weekday:'short'})),el('strong','',String(d.getDate())));if(date===today())h.append(el('span','planner-today','Today'));card.append(h);
    const list=el('div','planner-day-items');const entries=getDayEntries(date);
    // Month tiles are compact previews, not scrolling lists. Two lines always
    // fit above the reserved footer; the pop-out shows every item in full.
    const previewLimit=kind==='month'?2:entries.length;
    const shown=entries.slice(0,previewLimit);
    shown.forEach(({item})=>list.append(row(item,-1,'',true,'preview')));
    if(kind==='month' && entries.length){
      const count=el('span','planner-month-total',`${entries.length} item${entries.length===1?'':'s'}`);
      count.title=`${entries.length} items on this date`;
      h.append(count);
    }
    card.append(list);
    if(kind==='month'){
      const remaining=entries.length-shown.length;
      const footer=el('div','planner-month-footer');
      if(remaining>0){
        const extra=el('span','planner-month-extra',`+${remaining} more`);
        extra.title=`${remaining} additional items. ${entries.length} total. Click to open this day.`;
        footer.append(extra);
      }
      card.append(footer);
      card.append(el('span','planner-mobile-count',entries.length?`${entries.length} item${entries.length===1?'':'s'}`:''));
    }
     if(!readonly){const plus=button('+','Add item for '+date,()=>openDay(date));plus.classList.add('planner-add-toggle');card.append(plus);}
     const activate=e=>{if(e.target.closest('button,input,textarea,a'))return;openDay(date);};
     card.addEventListener('click',activate);card.setAttribute('tabindex','0');card.setAttribute('role','button');card.setAttribute('aria-label','Open '+date+' day details');card.addEventListener('keydown',e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openDay(date);}});
     grid.append(card);
   });
   if(kind==='month'){while((grid.children.length-7)%7)grid.append(el('div','planner-blank'));grid.style.setProperty('--month-weeks',(grid.children.length-7)/7);}
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
