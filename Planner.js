/* Date dashboards. Calendar records deliberately share Database's canonical keys. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const today = () => makeLocalIsoDate();
 const month = () => today().slice(0,7);
 const followingMonth = key => {
   const [year, mm] = key.split('-').map(Number);
   const date = new Date(year, mm, 1, 12);
   return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
 };
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
 let dateStamp=today(), currentMonth=kind==='next-month'?followingMonth(month()):month();
 const requested=new URLSearchParams(location.search).get('month');
 const historical=kind==='month'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(requested||'')&&requested<month()?requested:null;
 const snapshot=historical?JSON.parse(localStorage.getItem('pi-planner-archive-'+historical)||'null'):null;
 const noteKey=()=>kind==='week'?'pi-planner-week-notes-v1':'pi-planner-month-'+(historical||currentMonth);
 const draftKey=()=>noteKey()+'-draft';
 let drag=null;
 const drafts=new Map();
 const dayDialog=el('dialog','planner-day-dialog');
 // Move entries from day categories to another category, a day, or outside the category.
 const moveNestedDayItem=(from,to)=>{
   if(!from?.key?.startsWith('pi-calendar-day-')||!to?.key?.startsWith('pi-calendar-day-'))return false;
   if(from.key===to.key&&from.parentId===to.parentId)return false;
   const source=read(from.key),dest=from.key===to.key?source:read(to.key);
   const src=source.find(x=>x.id===from.parentId&&x.kind==='note');
   const destParent=to.parentId?dest.find(x=>x.id===to.parentId&&x.kind==='note'):null;
   if(!src||!Array.isArray(src.subtasks)||(to.parentId&&!destParent))return false;
   const i=src.subtasks.findIndex(x=>x.id===from.itemId);if(i<0)return false;
   const entry=src.subtasks[i];const bucket=destParent?(destParent.subtasks ||= []):dest;
   if(bucket.some(x=>x.id===entry.id))return false;
   src.subtasks.splice(i,1);bucket.push(entry);
   const originalSource=localStorage.getItem(from.key),originalDest=localStorage.getItem(to.key);
   try {write(to.key,dest);if(from.key!==to.key)write(from.key,source);}catch(e){
     if(originalSource===null)localStorage.removeItem(from.key);else localStorage.setItem(from.key,originalSource);
     if(from.key!==to.key){if(originalDest===null)localStorage.removeItem(to.key);else localStorage.setItem(to.key,originalDest);}return false;
   }
   renderDays();if(dayDialog.open)fillDayDialog();showSaved();return true;
 };
 let plannerDragSource=null;
 document.addEventListener('dragstart',e=>{
   const line=e.target.closest?.('.planner-category-line');
   const group=line?.closest('.planner-category');
   if(!group||!line?.dataset.piSubtaskId||!e.target.closest('.planner-category-drag'))return;
   plannerDragSource={key:'pi-calendar-day-'+group.dataset.piDate,parentId:group.dataset.piCategoryId,itemId:line.dataset.piSubtaskId};
 },true);
 const plannerDest=target=>{
   const cat=target.closest?.('.planner-day-dialog .planner-category');
   if(cat)return {key:'pi-calendar-day-'+cat.dataset.piDate,parentId:cat.dataset.piCategoryId};
   const day=target.closest?.('.planner-day[data-date]');
   if(day)return {key:'pi-calendar-day-'+day.dataset.date};
   if(target.closest?.('.planner-day-dialog .planner-dialog-list')&&selectedDate)return {key:'pi-calendar-day-'+selectedDate};
   return null;
 };
 document.addEventListener('dragover',e=>{
   if(!plannerDragSource||!plannerDest(e.target))return;
   const dest=plannerDest(e.target);
   if(dest.key===plannerDragSource.key&&dest.parentId===plannerDragSource.parentId)return;
   e.preventDefault();e.dataTransfer.dropEffect='move';
 },true);
 document.addEventListener('drop',e=>{
   if(!plannerDragSource)return;
   const source=plannerDragSource;plannerDragSource=null;
   const dest=plannerDest(e.target);
   if(!dest||(dest.key===source.key&&dest.parentId===source.parentId))return;
   e.preventDefault();e.stopImmediatePropagation();safe(()=>moveNestedDayItem(source,dest));
 },true);
 document.addEventListener('dragend',()=>{plannerDragSource=null;},true);

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
 // Home category notes are stored directly in pi-calendar-day-YYYY-MM-DD.
 // The planner edits those same records, never makes separate copies.
 const stamp = record => {
   if(record?.createdAt) {
     const d=new Date(record.createdAt);
     if(!Number.isNaN(d.getTime())) return [String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0'),String(d.getFullYear()).slice(-2)].join('/');
   }
   const m=String(record?.date||'').match(/^(\d{4})-(\d\d)-(\d\d)/);
   return m?`${m[2]}/${m[3]}/${m[1].slice(-2)}`:'';
 };
 const autoHeight = field => {field.style.height='auto';field.style.height=`${field.scrollHeight+2}px`;};
 function categoryRow(item,index,key,readonly){
   const wrap=el('section','planner-category'+(item.expanded===false?' is-closed':''));
   wrap.dataset.piCategoryId=item.id;wrap.dataset.piDate=key.replace('pi-calendar-day-','');
   const head=el('div','planner-category-head');
   const name=el('textarea','planner-category-name');
   name.rows=1;name.value=item.text||'';name.readOnly=readonly;
   name.setAttribute('aria-label','Category name');
   name.addEventListener('input',()=>autoHeight(name));
   name.addEventListener('change',()=>safe(()=>{
     if(readonly||!name.value.trim())return;
     updateList(key,index,items=>{items[index].text=name.value.trim();});
   }));
   head.append(name);
   const toggle=button(item.expanded===false?'▸':'▾','Expand or collapse category',()=>{
     if(readonly){wrap.classList.toggle('is-closed');toggle.textContent=wrap.classList.contains('is-closed')?'▸':'▾';toggle.setAttribute('aria-expanded',String(!wrap.classList.contains('is-closed')));return;}
     updateList(key,index,items=>{items[index].expanded=items[index].expanded===false;});
   });
   toggle.classList.add('planner-category-toggle');
   toggle.setAttribute('aria-expanded',String(item.expanded!==false));
   head.append(toggle);
   if(!readonly){
     const menu=el('details','planner-category-menu');
     const trigger=el('summary','','⋮');trigger.title='Category options';
     trigger.setAttribute('aria-label','Category options');
     const options=el('div','planner-category-menu-actions');
     options.append(button(item.showDetails===false?'Show Details':'Hide Details','Show or hide the category Details section',()=>{
       menu.open=false;
       updateList(key,index,items=>{items[index].showDetails=items[index].showDetails===false;});
     }));
     menu.append(trigger,options);head.append(menu);
   }
   wrap.append(head);
   const content=el('div','planner-category-content');
   if(item.expanded===false)content.hidden=true;
   wrap.append(content);
   const fold=el('div','planner-category-details');
   if(item.showDetails!==false){
     const detailsToggle=button(item.detailsExpanded===false?'▸ Details':'▾ Details','Show or collapse category details',()=>{
       if(readonly){fold.classList.toggle('is-folded');detailsToggle.textContent=fold.classList.contains('is-folded')?'▸ Details':'▾ Details';return;}
       updateList(key,index,items=>{items[index].detailsExpanded=items[index].detailsExpanded===false;});
     });
     detailsToggle.classList.add('planner-details-toggle');
     fold.append(detailsToggle);
     if(item.detailsExpanded===false)fold.classList.add('is-folded');
     const details=el('textarea','planner-details-input');
     details.rows=2;details.value=item.details||'';details.readOnly=readonly;details.placeholder='Add details to this category…';
     details.setAttribute('aria-label','Freeform category details');
     details.addEventListener('input',()=>autoHeight(details));
     details.addEventListener('change',()=>safe(()=>{if(!readonly)updateList(key,index,items=>{items[index].details=details.value;});}));
     fold.append(details);content.append(fold);
     requestAnimationFrame(()=>autoHeight(details));
   }
   const list=el('div','planner-category-checklist');
   const subtasks=Array.isArray(item.subtasks)?item.subtasks:[];
   let movedId=null;
   subtasks.forEach((sub,subindex)=>{
     const line=el('div','planner-category-line'+(sub.done?' is-done':''));
     line.dataset.piSubtaskId=sub.id;
     const drag=el('span','planner-category-drag','⋮⋮');drag.title='Drag to reorder checklist item';
     drag.setAttribute('aria-label',drag.title);drag.draggable=!readonly;
     drag.ondragstart=e=>{if(readonly)return;movedId=sub.id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-pi-planner-subtask',JSON.stringify({key,parentId:item.id,itemId:sub.id}));e.dataTransfer.setData('text/plain',sub.id);};
     drag.ondragend=()=>{movedId=null;};
     line.ondragover=e=>{if(movedId&&movedId!==sub.id){e.preventDefault();e.dataTransfer.dropEffect='move';}};
     line.ondrop=e=>{if(readonly||!movedId||movedId===sub.id)return;e.preventDefault();e.stopPropagation();
       const sourceId=movedId;movedId=null;
       const after=e.clientY>line.getBoundingClientRect().top+line.getBoundingClientRect().height/2;
       safe(()=>updateList(key,index,items=>{
         const entries=items[index].subtasks||[];
         const from=entries.findIndex(i=>i.id===sourceId),to=entries.findIndex(i=>i.id===sub.id);
         if(from<0||to<0)return;
         const [entry]=entries.splice(from,1);
         const dest=entries.findIndex(i=>i.id===sub.id);
         entries.splice(dest+(after?1:0),0,entry);
       }));
     };
     const box=el('input');box.type='checkbox';box.checked=!!sub.done;box.disabled=readonly;
     box.setAttribute('aria-label','Complete '+(sub.text||'checklist item'));
     box.onchange=()=>safe(()=>updateList(key,index,items=>{const target=(items[index].subtasks||[]).find(x=>x.id===sub.id);if(target)window.PISetCompletedV14(target,box.checked);}));
     const field=el('textarea','planner-category-line-text');field.rows=1;field.value=sub.text||'';field.readOnly=readonly;
     field.setAttribute('aria-label','Checklist item text');field.addEventListener('input',()=>autoHeight(field));
     field.addEventListener('change',()=>safe(()=>{if(!readonly)updateList(key,index,items=>{const target=(items[index].subtasks||[]).find(x=>x.id===sub.id);if(target)target.text=field.value;});}));
     const date=el('span','planner-category-line-date',(sub.done && sub.completedAt ? `${stamp(sub)||'—'} · ✓ ${stamp({createdAt:sub.completedAt})}` : stamp(sub)||'—'));date.title=stamp(sub)?'Date added':'Date not recorded';
     line.append(drag,box,field,date);
     if(!readonly)line.append(button('×','Delete checklist item',()=>{
       if(!confirm('Delete this checklist item?'))return;
       updateList(key,index,items=>{items[index].subtasks=(items[index].subtasks||[]).filter(x=>x.id!==sub.id);});
     }));
     if(!readonly){
       const menu=el('details','planner-nested-tools');
       const summary=el('summary','','⋮');summary.title='Checklist item actions';summary.setAttribute('aria-label','Checklist item actions');
       const actions=el('div','planner-nested-options');
       actions.append(button('Archive','Archive this checklist item',()=>{
         if(!confirm('Archive this checklist item?'))return;
         const archiveItem={...sub};
         if(!archiveManualItem({text:archiveItem.text,source:'Calendar category',context:item.text,
              originalDate:archiveItem.date||null,createdAt:archiveItem.createdAt||null,metadata:archiveItem}))return;
         updateList(key,index,items=>{items[index].subtasks=(items[index].subtasks||[]).filter(x=>x.id!==sub.id);});
       }));
       menu.append(summary,actions);line.append(menu);
     }
     list.append(line);
     requestAnimationFrame(()=>autoHeight(field));
   });
   content.append(list);
   if(!readonly){
     const addForm=el('form','planner-category-add');
     const field=el('textarea');field.rows=1;field.placeholder='Add a checklist item…';
     field.setAttribute('aria-label','New category checklist item');
     field.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();addForm.requestSubmit();}});
     const add=el('button','planner-action','+ Add');add.type='submit';
     addForm.append(field,add);
     addForm.onsubmit=e=>{e.preventDefault();e.stopPropagation();safe(()=>{
       const text=field.value.trim();if(!text)return;
       updateList(key,index,items=>{
         if(!Array.isArray(items[index].subtasks))items[index].subtasks=[];
         items[index].subtasks.push({id:archiveId('sub'),text,done:false,date:today(),createdAt:new Date().toISOString()});
       });
     });};
     content.append(addForm);
   }
   requestAnimationFrame(()=>autoHeight(name));
   return wrap;
 }
 function row(item,index,key,readonly=false,mode='full'){
   const r=el('div','planner-item'+(item.done?' is-done':''));
   if(mode==='preview'){
     r.classList.add('planner-preview-item');
     r.append(el('span','planner-item-text',item.text));
     return r;
   }
   if(item.kind==='note')return categoryRow(item,index,key,readonly);
   if(item.checkable!==false){const c=el('input');c.type='checkbox';c.checked=!!item.done;c.disabled=readonly;c.setAttribute('aria-label','Complete: '+item.text);c.onchange=()=>safe(()=>updateList(key,index,a=>{window.PISetCompletedV14(a[index],c.checked);}));r.append(c);}
   const content=el('div','planner-item-text',item.text);r.append(content);
   if(item.done&&item.completedAt){
     const meta=el('span','planner-v14-dates',`${stamp(item)||'—'} · ✓ ${stamp({createdAt:item.completedAt})}`);
     meta.title='Created date · completed date';r.append(meta);
   }
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
   const kindPicker=el('select','planner-day-kind');
   kindPicker.setAttribute('aria-label','Add checklist line or category note');
   kindPicker.append(new Option('Checklist line','task'),new Option('Category note','note'));
   const add=el('button','planner-action planner-submit-add','+');add.type='submit';add.title='Save item';add.setAttribute('aria-label','Save item for '+date);form.append(kindPicker,input,add);
   form.onsubmit=e=>{e.preventDefault();safe(()=>{if(!input.value.trim())return;const key='pi-calendar-day-'+date,a=read(key);a.push({id:archiveId('task'),text:input.value.trim(),done:false,date:date,createdAt:new Date().toISOString(),...(kindPicker.value==='note'?{kind:'note',expanded:true,details:'',subtasks:[],showDetails:true}:{} )});write(key,a);input.value='';drafts.delete(date);localStorage.removeItem('pi-planner-day-draft-'+date);renderDays();if(dayDialog.open)fillDayDialog();showSaved();});};
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
   const grid=$('plannerGrid');grid.replaceChildren();grid.classList.toggle('is-month',kind!=='week');
   let dates=[];
   if(kind==='week'){
     const d=new Date(dateStamp+'T12:00:00');for(let i=0;i<8;i++){dates.push(makeLocalIsoDate(d));d.setDate(d.getDate()+1);}
     const fmt={month:'short',day:'numeric'};
     $('plannerRange').textContent=new Date(dates[0]+'T12:00:00').toLocaleDateString(undefined,fmt)+' – '+new Date(dates[7]+'T12:00:00').toLocaleDateString(undefined,fmt);
     $('plannerHint').textContent='Today + 7 days';
   }else{
     dates=datesOfMonth(historical||currentMonth);$('plannerRange').textContent=labelMonth(historical||currentMonth);
     $('plannerHint').textContent=historical?'Archived month · read only':kind==='next-month'?'Upcoming month · shared with calendar':'Shared with Database';
     if(historical){const a=el('a','small-button','Current month');a.href='Month.html';$('plannerHint').append(' · ',a);}
     ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>grid.append(el('div','planner-weekday',d)));
     const offset=new Date(dates[0]+'T12:00:00').getDay();
     for(let i=0;i<offset;i++){const empty=el('div','planner-blank');empty.setAttribute('aria-hidden','true');grid.append(empty);}
   }
   dates.forEach(date=>{
     const readonly=!!historical||date<today();
     const card=el('section','planner-day'+(date===today()?' is-today':'')+(date<today()?' is-past':''));card.dataset.date=date;
     const d=new Date(date+'T12:00:00');const h=el('h3');h.append(el('span','',d.toLocaleDateString(undefined,{weekday:'short'})),el('strong','',String(d.getDate())));if(date===today())h.append(el('span','planner-today','Today'));card.append(h);
    const list=el('div','planner-day-items');const entries=getDayEntries(date);
    // Month tiles are compact previews, not scrolling lists. The heading shows
    // the total item count; the pop-out shows every item in full.
    const previewLimit=kind!=='week'?2:entries.length;
    const shown=entries.slice(0,previewLimit);
    shown.forEach(({item})=>list.append(row(item,-1,'',true,'preview')));
    if(kind!=='week' && entries.length){
      const count=el('span','planner-month-total',`${entries.length} item${entries.length===1?'':'s'}`);
      count.title=`${entries.length} items on this date`;
      h.append(count);
    }
    card.append(list);
    if(kind!=='week'){
      card.append(el('span','planner-mobile-count',entries.length?`${entries.length} item${entries.length===1?'':'s'}`:''));
    }
     if(!readonly){const plus=button('+','Add item for '+date,()=>openDay(date));plus.classList.add('planner-add-toggle');card.append(plus);}
     const activate=e=>{if(e.target.closest('button,input,textarea,a'))return;openDay(date);};
     card.addEventListener('click',activate);card.setAttribute('tabindex','0');card.setAttribute('role','button');card.setAttribute('aria-label','Open '+date+' day details');card.addEventListener('keydown',e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openDay(date);}});
     grid.append(card);
   });
   if(kind!=='week'){while((grid.children.length-7)%7)grid.append(el('div','planner-blank'));grid.style.setProperty('--month-weeks',(grid.children.length-7)/7);}
 }
 function restoreDraft(){ $('plannerNoteInput').value=historical?(snapshot?.draft||''):localStorage.getItem(draftKey())||''; }
 $('plannerComposer').hidden=!!historical;
 $('plannerNoteInput').oninput=()=>safe(()=>localStorage.setItem(draftKey(),$('plannerNoteInput').value));
 $('plannerComposer').onsubmit=e=>{e.preventDefault();safe(()=>{const text=$('plannerNoteInput').value.trim();if(!text)return;const a=read(noteKey());a.unshift({id:archiveId('planner'),text,done:false,checkable:$('plannerCheckable').checked});write(noteKey(),a);$('plannerNoteInput').value='';localStorage.removeItem(draftKey());renderNotes();showSaved();});};
 function refreshDate(){safe(()=>{
   if(today()===dateStamp)return;
   // Draft is already saved under the old month's key before rollover.
   archiveExpiredDayLists();archiveMonths();dateStamp=today();currentMonth=kind==='next-month'?followingMonth(month()):month();restoreDraft();renderNotes();renderDays();
 });}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDate();});
 setInterval(refreshDate,30000);
 window.addEventListener('storage',e=>{if(e.key&&(e.key.startsWith('pi-calendar-day-')||e.key===noteKey()||e.key===ARCHIVE_STORAGE_KEY))safe(()=>{if(document.activeElement?.matches('textarea'))return;renderNotes();renderDays();});});
 safe(()=>{restoreDraft();renderNotes();renderDays();});
})();
