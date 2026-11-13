/* V26.3: folder Aquarium header interaction + repaired floating palettes.
   View-only controls; existing note storage and cross-page moves are unchanged. */
(() => {
  'use strict';
  if (!document.documentElement.classList.contains('aquarium-folders-page')) return;

  function installHeaderToggle(header, body, surface, key) {
    if (!header || !body || !surface || header.dataset.aqToggleReady) return;
    header.dataset.aqToggleReady='true';
    header.tabIndex=0;
    header.setAttribute('role','group');
    // Brain Dump already participates in the standard shared collapse system.
    // Reuse that existing live button instead of installing a second arrow or
    // a competing save-state key. Keep the whole header clickable.
    if (surface.hasAttribute('data-collapsible-panel') && !header.querySelector('.panel-collapse-toggle')) {
      window.PIBindCollapsiblePanels?.();
    }
    const nativeCollapse = surface.hasAttribute('data-collapsible-panel')
      ? header.querySelector('.panel-collapse-toggle') : null;
    if (nativeCollapse) {
      header.addEventListener('click',event=>{
        if(event.target.closest('button,details,summary,a,select,input,textarea,[contenteditable="true"]'))return;
        event.stopPropagation(); nativeCollapse.click();
      });
      header.addEventListener('keydown',event=>{
        if(event.target!==header || !['Enter',' '].includes(event.key))return;
        event.preventDefault();event.stopPropagation();nativeCollapse.click();
      });
      return;
    }
    const old = sessionStorage.getItem('pi-folder-aq-collapsed:'+key)==='true';
    let collapsed=old;
    const arrow=document.createElement('button');
    arrow.type='button';arrow.className='aq-folder-panel-toggle panel-collapse-toggle';
    arrow.setAttribute('aria-label','Collapse '+key);
    function apply() {
      body.hidden=collapsed;
      surface.classList.toggle('aq-collapsed',collapsed);
      arrow.textContent=collapsed?'▸':'▾';
      arrow.setAttribute('aria-label',(collapsed?'Expand ':'Collapse ')+key);
      arrow.setAttribute('aria-expanded',String(!collapsed));
      header.setAttribute('aria-expanded',String(!collapsed));
      try {sessionStorage.setItem('pi-folder-aq-collapsed:'+key,String(collapsed));}catch{}
    }
    function toggle() {collapsed=!collapsed;apply();}
    arrow.addEventListener('click',event=>{event.stopPropagation();toggle();});
    header.addEventListener('click',event=>{
      if(event.target.closest('button,details,summary,a,select,input,textarea,[contenteditable="true"]')) return;
      event.stopPropagation(); toggle();
    });
    header.addEventListener('keydown',event=>{
      if(event.target!==header || !['Enter',' '].includes(event.key))return;
      event.preventDefault();toggle();
    });
    // Insert immediately ahead of the 3-dot menu, keeping the standard right rail.
    const menu=header.querySelector(':scope > .aq-folder-options, :scope > .pi-v25-control-rail');
    if(menu)menu.before(arrow);else header.append(arrow);
    apply();
  }

  function positionOpenMenus() {
    document.querySelectorAll('details[open]').forEach(details=>{
      const summary=details.querySelector(':scope > summary');
      const panel=[...details.children].find(child=>{
        try{return child.matches(':popover-open');}catch{return false;}
      });
      if (!summary || !panel) return;
      const anchor=summary.getBoundingClientRect();
      const width=Math.min(panel.offsetWidth || 240,innerWidth-16);
      const height=Math.min(panel.offsetHeight || 240,innerHeight-16);
      const left=Math.max(8,Math.min(innerWidth-width-8,anchor.right-width));
      const yBelow=anchor.bottom+5;
      const yAbove=anchor.top-height-5;
      const top=(yBelow+height+8<=innerHeight || yAbove<8)
        ? Math.max(8,Math.min(innerHeight-height-8,yBelow))
        : Math.max(8,yAbove);
      // Several legacy selectors specify inset:auto!important. Set the real
      // coordinates at matching priority, preventing 0,0 popover placement.
      panel.style.setProperty('position','fixed','important');
      panel.style.setProperty('inset','auto','important');
      panel.style.setProperty('left',left+'px','important');
      panel.style.setProperty('top',top+'px','important');
      panel.style.setProperty('right','auto','important');
      panel.style.setProperty('bottom','auto','important');
      panel.style.setProperty('margin','0','important');
    });
  }
  let queued=false;
  function queuePosition(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;positionOpenMenus();});
  }
  function init(){
    const dashboard=document.querySelector('.aq-folder-dashboard');
    const capture=document.querySelector('.aq-folder-capture .aq-capture-panel');
    const folders=document.querySelector('.aq-folder-board');
    installHeaderToggle(dashboard?.querySelector('.aq-panel-head'),dashboard?.querySelector('.aq-dashboard-list'),dashboard,'Dashboard');
    installHeaderToggle(capture?.querySelector('.aq-panel-head'),capture?.querySelector('.aq-capture-body'),capture,'Brain Dump');
    installHeaderToggle(folders?.querySelector('.aq-folder-heading'),folders?.querySelector('.aq-section-board'),folders,'Folders');
    document.addEventListener('toggle',event=>{
      if(event.target instanceof HTMLDetailsElement)queuePosition();
    },true);
    document.addEventListener('click',queuePosition,true);
    window.addEventListener('resize',queuePosition,{passive:true});
    // Folder tiles are inside a scrolling column; keep menus attached when
    // that column scrolls without changing the underlying note or menu state.
    document.querySelector('.aq-folder-workspace')?.addEventListener('scroll',queuePosition,true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
