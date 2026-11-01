/* Alignment · V21.3. This page deliberately borrows Longform's existing visual
   vocabulary and rich editor, but keeps its records in its OWN synced pi-* key. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const app=$('alignmentApp'); if(!app)return;
  const STATE='pi-alignment-v1', DRAFT='pi-alignment-draft-v1';
  const UNSORTED='readings', SHELF='shelf';
  const uid=(prefix='al')=>`${prefix}-${crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2)}`;
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const load=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}};
  const blank=()=>({version:1,entries:[],folders:[],sections:[]});
  const validPlace=(place,s)=>place===UNSORTED||place===SHELF||(place?.startsWith('folder:')&&s.folders.some(f=>place==='folder:'+f.id))||(place?.startsWith('section:')&&s.sections.some(f=>place==='section:'+f.id));
  const normalize=raw=>{
    const s=raw&&typeof raw==='object'?raw:blank();
    s.entries=Array.isArray(s.entries)?s.entries.filter(n=>n&&typeof n.id==='string').map(n=>({...n,place:n.place||UNSORTED,expanded:!!n.expanded})):[];
    s.folders=Array.isArray(s.folders)?s.folders.filter(f=>f&&typeof f.id==='string'):[];
    s.sections=Array.isArray(s.sections)?s.sections.filter(f=>f&&typeof f.id==='string'):[];
    s.entries.forEach(n=>{if(!validPlace(n.place,s))n.place=UNSORTED;});
    return s;
  };
  let state=normalize(load(STATE,blank()));
  let editing=null,openedFolder=null,selectedMove=null,dragId=null,dragType=null,menu=null,draftTimer=null;
  const editor=$('alignmentEditor'),title=$('alignmentTitle'),date=$('alignmentDate'),destination=$('alignmentDestination');
  const saveButton=$('alignmentSave'),library=$('alignmentLibrary'),shelf=$('alignmentShelf'),dialog=$('alignmentFolderDialog');
  function save(){localStorage.setItem(STATE,JSON.stringify(state));window.showSaved?.();}
  function node(tag,cls='',content){const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;}
  function button(text,aria,fn,cls=''){const b=node('button',cls,text);b.type='button';b.title=aria;b.setAttribute('aria-label',aria);b.addEventListener('click',fn);return b;}
  function tidy(v){return String(v||'').replace(/\s+/g,' ').trim();}
  function clean(html){
    if(window.PIInlineRich?.cleanHTML)return window.PIInlineRich.cleanHTML(html);
    const t=document.createElement('template');t.innerHTML=String(html||'');
    t.content.querySelectorAll('script,style,iframe,form,object,embed,svg').forEach(x=>x.remove());
    t.content.querySelectorAll('*').forEach(x=>[...x.attributes].forEach(a=>{
      if(a.name.toLowerCase().startsWith('on')||['href','src'].includes(a.name) && !/^(https?:|mailto:)/i.test(a.value)||a.name==='style')x.removeAttribute(a.name);
    }));return t.innerHTML;
  }
  const plain=html=>{const e=node('div');e.innerHTML=clean(html);return tidy(e.textContent);};
  const entriesAt=place=>state.entries.filter(n=>n.place===place).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned));
  const allPlaces=()=>[
    {value:UNSORTED,label:'Readings & Rituals · Unsorted'},
    ...state.sections.map(s=>({value:'section:'+s.id,label:'Readings & Rituals · '+s.name})),
    {value:SHELF,label:'Affirmations & Scripts · Tiles'},
    ...state.folders.map(f=>({value:'folder:'+f.id,label:'Folder · '+f.name}))
  ];
  function fillDestination(select,current=UNSORTED){
    select.replaceChildren();allPlaces().forEach(p=>{const o=node('option','',p.label);o.value=p.value;select.append(o);});
    select.value=allPlaces().some(p=>p.value===current)?current:UNSORTED;
  }
  function draftWrite(){clearTimeout(draftTimer);draftTimer=setTimeout(()=>{localStorage.setItem(DRAFT,JSON.stringify({title:title.value,html:editor.innerHTML,date:date.value,dest:destination.value,image:$('alignmentImage').value,link:$('alignmentLink').value,editing}));},250);}
  function resetComposer(clearDraft=true){
    editing=null;title.value='';editor.innerHTML='';date.value=today();fillDestination(destination,UNSORTED);
    $('alignmentImage').value='';$('alignmentLink').value='';saveButton.textContent='Save thought';$('alignmentCancel').hidden=true;
    $('alignmentSaveHint').textContent='Enter adds a new line · click Save thought when ready';
    if(clearDraft)localStorage.removeItem(DRAFT);
  }
  function beginEdit(id){
    const n=state.entries.find(n=>n.id===id);if(!n)return;
    editing=id;title.value=n.title||'';editor.innerHTML=clean(n.html||'');date.value=n.date||today();fillDestination(destination,n.place);
    $('alignmentImage').value=n.imageUrl||'';$('alignmentLink').value=n.linkUrl||'';
    saveButton.textContent='Update thought';$('alignmentCancel').hidden=false;
    $('alignmentSaveHint').textContent='Editing saved thought · click Update thought to save';
    closeMenu();if(dialog.open)dialog.close();editor.focus();draftWrite();
  }
  function submit(){
    const name=tidy(title.value), html=clean(editor.innerHTML.trim()), text=plain(html);
    if(!name&&!text){title.focus();return;}
    const place=validPlace(destination.value,state)?destination.value:UNSORTED;
    if(editing){const item=state.entries.find(n=>n.id===editing);if(item)Object.assign(item,{title:name||text.slice(0,90)||'Untitled',html,text,date:date.value||today(),place,imageUrl:$('alignmentImage').value.trim(),linkUrl:$('alignmentLink').value.trim()});}
    else state.entries.unshift({id:uid('note'),title:name||text.slice(0,90)||'Untitled',html,text,createdAt:new Date().toISOString(),date:date.value||today(),place,expanded:false,pinned:false,imageUrl:$('alignmentImage').value.trim(),linkUrl:$('alignmentLink').value.trim()});
    save();resetComposer();render();
  }
  const menuItems=(trigger,items)=>{
    closeMenu();const p=node('div','alignment-floating-menu');p.setAttribute('role','menu');
    items.forEach(item=>{
      if(item.sep){p.append(node('div','alignment-menu-divider'));return;}
      const b=button(item.label,item.label,()=>{closeMenu();item.run();},'alignment-menu-option');p.append(b);
    });document.body.append(p);menu=p;
    const r=trigger.getBoundingClientRect(),w=p.offsetWidth||200,h=p.offsetHeight||230;
    p.style.left=Math.max(8,Math.min(window.innerWidth-w-8,r.right-w))+'px';
    p.style.top=Math.max(8,Math.min(window.innerHeight-h-8,window.innerHeight-r.bottom<h+8?r.top-h-4:r.bottom+4))+'px';
  };
  function closeMenu(){if(menu){menu.remove();menu=null;}}
  document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target)&&!e.target.closest('[data-alignment-menu]'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  function moveNote(id,to,before){
    if(!validPlace(to,state))return;
    const i=state.entries.findIndex(n=>n.id===id);if(i<0)return;
    const [item]=state.entries.splice(i,1);item.place=to;
    const target=before?state.entries.findIndex(n=>n.id===before):-1;
    if(target>=0)state.entries.splice(target,0,item);else state.entries.push(item);
    selectedMove=null;dragId=null;dragType=null;save();render();
  }
  function noteOptions(trigger,n){
    menuItems(trigger,[
      {label:'Edit in composer',run:()=>beginEdit(n.id)},
      {label:n.pinned?'Unpin note':'Pin to top',run:()=>{n.pinned=!n.pinned;save();render();}},
      {label:n.expanded?'Hide details':'Show details',run:()=>{n.expanded=!n.expanded;save();render();}},
      {sep:true},
      ...allPlaces().filter(p=>p.value!==n.place).map(p=>({label:'Move → '+p.label,run:()=>moveNote(n.id,p.value)})),
      {sep:true},
      {label:'Archive thought',run:()=>archiveNote(n)},
      {label:'Delete thought',run:()=>{if(!confirm('Delete this thought?'))return;state.entries=state.entries.filter(x=>x.id!==n.id);save();render();}}
    ]);
  }
  function archiveNote(n){
    if(!confirm('Archive this thought?'))return;
    const key='pi-archive-v1';const history=load(key,[]);
    if(!Array.isArray(history)){alert('Archive records could not be read. Nothing was moved.');return;}
    history.unshift({id:uid('archived'),recordType:'item',source:'Alignment',text:[n.title,n.text].filter(Boolean).join('\n\n'),createdAt:n.createdAt||null,archivedAt:new Date().toISOString(),metadata:{bodyHtml:n.html,date:n.date,place:n.place}});
    try{localStorage.setItem(key,JSON.stringify(history));state.entries=state.entries.filter(e=>e.id!==n.id);save();render();}catch(e){alert('Archiving failed. Check your backup.');console.error(e);}
  }
  function enableNoteDrag(handle,n){
    handle.draggable=true;handle.title='Drag note to a new destination';
    handle.addEventListener('dragstart',e=>{dragId=n.id;dragType='note';e.dataTransfer.setData('application/x-alignment-note',n.id);e.dataTransfer.effectAllowed='move';});
    handle.addEventListener('dragend',()=>{dragId=null;dragType=null;document.querySelectorAll('.alignment-drop-ready').forEach(x=>x.classList.remove('alignment-drop-ready'));});
  }
  function enableDrop(target,dest,before=null){
    target.addEventListener('dragover',e=>{if(dragType!=='note')return;e.preventDefault();e.stopPropagation();target.classList.add('alignment-drop-ready');});
    target.addEventListener('dragleave',e=>{if(!target.contains(e.relatedTarget))target.classList.remove('alignment-drop-ready');});
    target.addEventListener('drop',e=>{if(dragType!=='note')return;e.preventDefault();e.stopPropagation();target.classList.remove('alignment-drop-ready');if(dragId&&dragId!==before)moveNote(dragId,dest,before);});
    target.addEventListener('click',e=>{if(!selectedMove||e.target.closest('button,input,select,textarea,[contenteditable="true"],.alignment-note,.alignment-folder'))return;moveNote(selectedMove,dest,before);});
  }
  function attachment(n,body){
    if(n.imageUrl&&/^https?:\/\//i.test(n.imageUrl)){const img=node('img','alignment-attachment-image');img.src=n.imageUrl;img.loading='lazy';img.alt=n.title||'Attached image';body.append(img);}
    if(n.linkUrl&&/^https?:\/\//i.test(n.linkUrl)){const a=node('a','alignment-attachment-link','open link ↗');a.href=n.linkUrl;a.target='_blank';a.rel='noopener noreferrer';body.append(a);}
  }
  function noteCard(n,mode='list'){
    const card=node('article',`alignment-note alignment-${mode}`);card.dataset.entryId=n.id;card.classList.toggle('expanded',!!n.expanded);card.classList.toggle('selected',selectedMove===n.id);
    const head=node('div','alignment-note-head');
    const handle=button('⠿','Drag or tap to move note',()=>{selectedMove=selectedMove===n.id?null:n.id;render();},'alignment-icon alignment-move');enableNoteDrag(handle,n);
    const label=node('div','alignment-note-title',(n.pinned?'📌 ':'')+(n.title||'Untitled'));
    label.tabIndex=0;label.title='Open or close details';
    const toggle=button(n.expanded?'▾':'▸',n.expanded?'Hide details':'Show details',()=>{n.expanded=!n.expanded;save();render();},'alignment-icon alignment-fold');
    toggle.setAttribute('aria-expanded',String(!!n.expanded));
    const opts=button('⋮','Note options',e=>{},'alignment-icon alignment-options');opts.dataset.alignmentMenu='note';
opts.addEventListener('click',()=>noteOptions(opts,n));
    label.addEventListener('click',()=>{n.expanded=!n.expanded;save();render();});
    label.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();n.expanded=!n.expanded;save();render();}});
    head.append(handle,label,toggle,opts);
    card.append(head);
    if(n.expanded){
      const content=node('div','alignment-note-content longform-entry-text');content.contentEditable='true';content.role='textbox';content.setAttribute('aria-label','Edit thought');content.innerHTML=clean(n.html||'');
      content.addEventListener('blur',()=>{n.html=clean(content.innerHTML);n.text=plain(n.html);save();});
      content.addEventListener('input',()=>{n.html=clean(content.innerHTML);n.text=plain(n.html);save();});
      card.append(content);
      const foot=node('div','alignment-note-foot');const stamp=node('span','',n.date||'');foot.append(stamp);attachment(n,card);card.append(foot);
    }else if(mode==='list'){
      card.append(node('div','alignment-note-date',n.date||''));
    }
    enableDrop(card,n.place,n.id);
    card.addEventListener('click',e=>{if(selectedMove&&selectedMove!==n.id&&!e.target.closest('button,[contenteditable="true"],.alignment-note-title'))moveNote(selectedMove,n.place,n.id);});
    return card;
  }
  function renderLibrary(){
    library.replaceChildren();
    function zone(name,dest,section){
      const wrapper=node('section','alignment-list-zone');wrapper.dataset.place=dest;
      const head=node('div','alignment-list-section-head');
      if(section){
        const drag=button('⠿','Drag to reorder section',()=>{},'alignment-icon');drag.draggable=true;
        drag.addEventListener('dragstart',e=>{dragId=section.id;dragType='section';e.dataTransfer.setData('application/x-alignment-section',section.id);});
        drag.addEventListener('dragend',()=>{dragId=null;dragType=null;});head.append(drag);
      }
      const label=node('span','alignment-list-section-name',name);head.append(label,node('span','alignment-count',String(entriesAt(dest).length)));
      if(section){
        const fold=button(section.collapsed?'▸':'▾','Collapse / expand section',()=>{section.collapsed=!section.collapsed;save();renderLibrary();},'alignment-icon');head.append(fold);
        const options=button('⋮','Section options',()=>{},'alignment-icon');options.dataset.alignmentMenu='section';
        options.addEventListener('click',()=>menuItems(options,[{label:'Rename',run:()=>{const v=prompt('Section name',section.name);if(v?.trim()){section.name=v.trim();save();render();}}},
          {label:'Delete section (move notes to Unsorted)',run:()=>{if(!confirm('Remove this section? Notes will move to Unsorted.'))return;state.entries.forEach(n=>{if(n.place===dest)n.place=UNSORTED;});state.sections=state.sections.filter(s=>s.id!==section.id);save();render();}}]));head.append(options);
        head.addEventListener('dragover',e=>{if(dragType==='section'){e.preventDefault();head.classList.add('alignment-drop-ready');}});
        head.addEventListener('dragleave',()=>head.classList.remove('alignment-drop-ready'));
        head.addEventListener('drop',e=>{if(dragType!=='section'||dragId===section.id)return;e.preventDefault();const i=state.sections.findIndex(s=>s.id===dragId),j=state.sections.findIndex(s=>s.id===section.id);if(i<0||j<0)return;const [m]=state.sections.splice(i,1);state.sections.splice(j,0,m);dragId=null;dragType=null;save();render();});
      }
      wrapper.append(head);
      const body=node('div','alignment-list-section-body');
      if(!section?.collapsed){const records=entriesAt(dest);if(!records.length)body.append(node('p','alignment-empty','Drop a thought here, or choose this destination in Write it out.'));records.forEach(n=>body.append(noteCard(n)));}
      else body.hidden=true;
      enableDrop(body,dest);enableDrop(head,dest);
      wrapper.append(body);return wrapper;
    }
    library.append(zone('Unsorted',UNSORTED));state.sections.forEach(s=>library.append(zone(s.name,'section:'+s.id,s)));
  }
  function folderTile(f){
    const tile=node('article','alignment-tile alignment-folder');tile.dataset.folderId=f.id;
    const grip=button('⠿','Drag to reorder folders',()=>{},'alignment-icon alignment-tile-handle');
    grip.draggable=true;grip.addEventListener('dragstart',e=>{dragId=f.id;dragType='folder';e.dataTransfer.setData('application/x-alignment-folder',f.id);});
    grip.addEventListener('dragend',()=>{dragId=null;dragType=null;});
    const controls=node('div','alignment-folder-controls');
    const opts=button('⋮','Folder options',()=>{},'alignment-icon');opts.dataset.alignmentMenu='folder';
    opts.addEventListener('click',()=>menuItems(opts,[{label:'Open folder',run:()=>openFolder(f.id)},
      {label:'Rename folder',run:()=>{const v=prompt('Folder title',f.name);if(v?.trim()){f.name=v.trim();save();render();}}},
      {label:'Edit description',run:()=>openFolder(f.id)},
      {label:'Delete folder (keep notes in Readings & Rituals)',run:()=>{if(!confirm('Delete this folder? Its notes will move to Readings & Rituals.'))return;state.entries.forEach(n=>{if(n.place==='folder:'+f.id)n.place=UNSORTED;});state.folders=state.folders.filter(x=>x.id!==f.id);save();render();}}]));
    controls.append(opts);tile.append(grip,controls);
    const center=node('div','alignment-folder-center');center.append(node('span','alignment-folder-symbol','✧'),node('strong','alignment-folder-title',f.name||'Folder'),node('p','alignment-folder-description',f.description||'. . .'));
    tile.append(center,node('span','alignment-folder-count',`${entriesAt('folder:'+f.id).length} thought${entriesAt('folder:'+f.id).length===1?'':'s'}`));
    center.tabIndex=0;center.setAttribute('role','button');center.setAttribute('aria-label','Open folder '+f.name);
    center.addEventListener('click',()=>openFolder(f.id));center.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openFolder(f.id);}});
    tile.addEventListener('dragover',e=>{if(dragType==='note'||dragType==='folder'){e.preventDefault();tile.classList.add('alignment-drop-ready');}});
    tile.addEventListener('dragleave',()=>tile.classList.remove('alignment-drop-ready'));
    tile.addEventListener('drop',e=>{
      e.preventDefault();e.stopPropagation();tile.classList.remove('alignment-drop-ready');
      if(dragType==='note'&&dragId)moveNote(dragId,'folder:'+f.id);
      else if(dragType==='folder'&&dragId!==f.id){const i=state.folders.findIndex(x=>x.id===dragId),j=state.folders.findIndex(x=>x.id===f.id);if(i<0||j<0)return;const [move]=state.folders.splice(i,1);state.folders.splice(j,0,move);dragId=null;dragType=null;save();render();}
    });
    return tile;
  }
  function renderShelf(){
    shelf.replaceChildren();$('alignmentTileCount').textContent=String(state.folders.length+entriesAt(SHELF).length);
    state.folders.forEach(f=>shelf.append(folderTile(f)));
    entriesAt(SHELF).forEach(n=>shelf.append(noteCard(n,'tile')));
    if(!shelf.children.length)shelf.append(node('div','alignment-shelf-empty','Your affirmations, scripts, and folders will live here.'));
    enableDrop(shelf,SHELF);
  }
  function addFolder(){
    const name=prompt('Folder name','New folder');if(!name?.trim())return;
    const folder={id:uid('folder'),name:name.trim(),description:'',createdAt:new Date().toISOString()};state.folders.push(folder);save();render();openFolder(folder.id);
  }
  function openFolder(id){
    const f=state.folders.find(x=>x.id===id);if(!f)return;openedFolder=id;
    $('alignmentFolderName').value=f.name;$('alignmentFolderDescription').value=f.description||'';
    dialog.showModal();renderFolder();
  }
  function renderFolder(){
    if(!openedFolder||!dialog.open)return;
    const f=state.folders.find(x=>x.id===openedFolder);if(!f){dialog.close();return;}
    const list=$('alignmentFolderNotes');list.replaceChildren();const entries=entriesAt('folder:'+f.id);
    $('alignmentFolderCount').textContent=`${entries.length} thought${entries.length===1?'':'s'}`;
    if(!entries.length)list.append(node('div','alignment-empty','This folder is waiting for its first thought.'));
    entries.forEach(n=>list.append(noteCard(n)));
    enableDrop(list,'folder:'+f.id);
  }
  function render(){
    const current=destination.value;fillDestination(destination,current);
    renderLibrary();renderShelf();renderFolder();
  }
  $('alignmentAddSection').addEventListener('click',()=>{
    const name=prompt('Section name','New section');if(!name?.trim())return;
    state.sections.push({id:uid('section'),name:name.trim(),collapsed:false});save();render();
  });
  $('alignmentShelfMenu').addEventListener('click',e=>{
    const b=e.target.closest('[data-shelf-action]');if(!b)return;
    $('alignmentShelfMenu').open=false;
    if(b.dataset.shelfAction==='folder')addFolder();
    else{fillDestination(destination,SHELF);title.focus();}
  });
  saveButton.addEventListener('click',submit);
  $('alignmentCancel').addEventListener('click',()=>resetComposer());
  [title,editor,date,destination,$('alignmentImage'),$('alignmentLink')].forEach(f=>{
    f.addEventListener('input',draftWrite);f.addEventListener('change',draftWrite);
  });
  title.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();editor.focus();}});
  $('alignmentFolderClose').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{openedFolder=null;});
  $('alignmentFolderName').addEventListener('change',e=>{const f=state.folders.find(x=>x.id===openedFolder);if(!f)return;f.name=tidy(e.target.value)||'Folder';save();renderShelf();});
  $('alignmentFolderDescription').addEventListener('input',e=>{const f=state.folders.find(x=>x.id===openedFolder);if(!f)return;f.description=e.target.value.slice(0,500);save();renderShelf();});
  $('alignmentFolderNew').addEventListener('click',()=>{if(!openedFolder)return;const place='folder:'+openedFolder;dialog.close();fillDestination(destination,place);title.focus();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu)closeMenu();});
  window.addEventListener('storage',e=>{if(e.key===STATE){state=normalize(load(STATE,blank()));render();}});
  window.addEventListener('focus',()=>{const next=normalize(load(STATE,blank()));if(JSON.stringify(next)!==JSON.stringify(state)){state=next;render();}});
  date.value=today();fillDestination(destination,UNSORTED);
  const draft=load(DRAFT,null);if(draft){
    title.value=draft.title||'';editor.innerHTML=clean(draft.html||'');date.value=draft.date||today();fillDestination(destination,draft.dest||UNSORTED);
    $('alignmentImage').value=draft.image||'';$('alignmentLink').value=draft.link||'';
    if(draft.editing&&state.entries.some(n=>n.id===draft.editing)){editing=draft.editing;saveButton.textContent='Update thought';$('alignmentCancel').hidden=false;}
  }
  render();
})();
