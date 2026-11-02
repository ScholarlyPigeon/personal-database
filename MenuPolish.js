/* V21.7 – responsive menu anchoring & closing, and consistent planner headers.
   No storage changes. Existing buttons remain the original live controls. */
(()=>{'use strict';
 const MAX=300;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const isOpen=p=>{try{return p.matches(':popover-open')}catch{return false}};
 const place=(panel,anchor)=>{
   if(!panel||!anchor)return;
   const rect=anchor.getBoundingClientRect();
   const w=Math.min(MAX,window.innerWidth-16),height=panel.getBoundingClientRect().height;
   const h=Math.min(height,window.innerHeight-16);
   const left=clamp(rect.right-w,8,Math.max(8,innerWidth-w-8));
   const below=rect.bottom+5,above=rect.top-h-5;
   const top=below+h+8<=innerHeight?below:above>=8?above:clamp(below,8,Math.max(8,innerHeight-h-8));
   panel.style.setProperty('left',left+'px','important');
   panel.style.setProperty('top',top+'px','important');
   panel.style.setProperty('width',w+'px','important');
 };
 const floatMenu=(menu,selector)=>{
   if(menu.dataset.piV17Floated)return;
   const panel=menu.querySelector(':scope > '+selector);
   if(!panel)return;
   menu.dataset.piV17Floated='1';
   menu.addEventListener('toggle',()=>{
     if(!menu.open || !menu.isConnected){
       if(isOpen(panel))try{panel.hidePopover()}catch{}
       panel.removeAttribute('popover');return;
     }
     if(typeof panel.showPopover==='function'){
       panel.setAttribute('popover','manual');
       if(!isOpen(panel))try{panel.showPopover()}catch{}
     }
     place(panel,menu.querySelector(':scope > summary')||menu);
   });
 };
 const plannerActions=()=>{
   document.querySelectorAll('.planner-item').forEach(row=>{
     const panel=row.querySelector(':scope > .planner-item-actions');
     if(!panel)return;
     const opened=row.classList.contains('actions-open');
     if(opened){
       if(typeof panel.showPopover==='function'){
         panel.setAttribute('popover','manual');
         if(!isOpen(panel))try{panel.showPopover()}catch{}
       }
       place(panel,row.querySelector(':scope > .planner-more')||row);
     }else if(isOpen(panel)){
       try{panel.hidePopover()}catch{}
       panel.removeAttribute('popover');
     }else if(!opened&&panel.hasAttribute('popover'))panel.removeAttribute('popover');
   });
 };
 const plannerHeaders=()=>{
   if(!document.body.classList.contains('planner-body'))return;
   for(const head of document.querySelectorAll('.planner-heading,.planner-notes>.panel-header')){
     const palette=head.querySelector(':scope > .pi-color-panel-menu');
     const pop=head.querySelector(':scope > .pi-popout-button');
     if(!palette&&!pop)continue;
     let controls=head.querySelector(':scope > .pi-v17-header-actions');
     if(!controls){controls=document.createElement('div');controls.className='pi-v17-header-actions';head.append(controls);}
     if(palette&&palette.parentElement!==controls)controls.append(palette);
     if(pop&&pop.parentElement!==controls)controls.append(pop);
   }
 };
 const scan=()=>{
   document.querySelectorAll('details.pi-ws-menu').forEach(m=>floatMenu(m,'.pi-ws-menu-panel'));
   document.querySelectorAll('details.pi-nested-tools').forEach(m=>floatMenu(m,'.pi-nested-tools-menu'));
   document.querySelectorAll('details.planner-category-menu').forEach(m=>floatMenu(m,'.planner-category-menu-actions'));
   document.querySelectorAll('details.planner-nested-tools').forEach(m=>floatMenu(m,'.planner-nested-options'));
   document.querySelectorAll('details.pi-focus-tools').forEach(m=>floatMenu(m,'.pi-focus-tools-panel'));
   plannerHeaders();plannerActions();
 };
 let scheduled=false;
 const queue=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;scan();});};
 // One document-wide policy: clicking outside an open menu closes it.
 // Keep nested move dropdowns and native dialogs working normally.
 document.addEventListener('pointerdown',event=>{
   const target=event.target;
   const owners=['.pi-cross-menu[open]','.pi-item-tools[open]','.pi-focus-tools[open]',
     '.pi-nested-tools[open]','.pi-ws-menu[open]','.planner-category-menu[open]','.planner-nested-tools[open]','.longform-card-tools[open]',
     '.pi-color-panel-menu[open]','.ecosystem-menu[open]'];
   document.querySelectorAll(owners.join(',')).forEach(menu=>{
     if(menu.contains(target))return;
     const trays=menu.querySelectorAll('[popover]');
     if([...trays].some(tray=>tray.contains(target)))return;
     menu.open=false;
   });
   document.querySelectorAll('.planner-item.actions-open').forEach(row=>{
     if(row.contains(target))return;
     const tray=row.querySelector('.planner-item-actions');
     if(tray?.contains(target))return;
     if(!row.classList.contains('is-editing'))row.classList.remove('actions-open');
   });
 },true);
 document.addEventListener('keydown',e=>{
   if(e.key!=='Escape')return;
   document.querySelectorAll('.pi-cross-menu[open],.pi-item-tools[open],.pi-focus-tools[open],.pi-nested-tools[open],.pi-ws-menu[open],.planner-category-menu[open],.planner-nested-tools[open],.longform-card-tools[open],.pi-color-panel-menu[open],.ecosystem-menu[open]').forEach(m=>m.open=false);
   document.querySelectorAll('.planner-item.actions-open:not(.is-editing)').forEach(row=>row.classList.remove('actions-open'));
 });
 window.addEventListener('resize',queue);
 window.addEventListener('scroll',()=>{
   document.querySelectorAll('details.pi-ws-menu[open],details.pi-nested-tools[open]').forEach(menu=>{
     const panel=menu.querySelector(':scope > .pi-ws-menu-panel,:scope > .pi-nested-tools-menu');
     if(isOpen(panel))place(panel,menu.querySelector(':scope > summary'));
   });
 },true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
   scan();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
 },{once:true});else{
   scan();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
 }
})();
