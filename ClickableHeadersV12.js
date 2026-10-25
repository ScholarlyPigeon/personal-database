/* V12: tap empty space on a collapsible header to toggle its existing button.
   Editing titles, popouts, menus, and drag handles remain independent. */
(() => {
  const headerSelector = [
    '.panel-header', '.pi-focus-head', '.aq-category-head', '.aq-panel-head',
    '.longform-saved-section-head','.pi-notes-section-head',
    '.longform-library-head','.longform-composer-head',
    '.neo-panel-heading','.neo-dailies-head','.almanac-panel-head',
    '.archive-v2-panel-head','.pi-category-note', '.planner-category-head'
  ].join(',');
  const exclude = 'button,input,textarea,select,a,summary,details,[contenteditable="true"],[contenteditable=""],[role="textbox"],[draggable="true"],label,.pi-category-note-content,.pi-focus-detail,.planner-category-content,.item-row-actions,.pi-focus-actions';
  const targetToggle = (head, from) => {
    if (head.matches('.planner-category-head')) return head.querySelector('.planner-category-toggle');
    if (head.matches('.pi-category-note')) {
      if(from.closest('.pi-category-note-content,.pi-focus-detail'))return null;
      return head.querySelector(':scope > .item-row-actions > .pi-note-open, :scope > .pi-focus-actions > .pi-focus-expand');
    }
    if(head.matches('.aq-category-head'))return head.querySelector('.aq-category-collapse');
    if(head.matches('.longform-saved-section-head'))return head.querySelector('.longform-section-toggle');
    return head.querySelector(':scope > .panel-collapse-toggle, :scope > .pi-focus-collapse, :scope > .aq-panel-collapse, :scope > .pi-notes-section-toggle, :scope > .longform-section-toggle');
  };
  function resolve(event){
    const head=event.target.closest?.(headerSelector);
    if(!head)return null;
    const toggle=targetToggle(head,event.target);
    if(!toggle)return null;
    if(event.target!==head && event.target.closest(exclude))return null;
    return {head,toggle};
  }
  document.addEventListener('click',event=>{
    const hit=resolve(event);
    if(!hit)return;
    event.preventDefault();hit.toggle.click();
  });
  document.addEventListener('keydown',event=>{
    if(!['Enter',' '].includes(event.key)||event.target!==event.target.closest?.(headerSelector))return;
    const hit=resolve(event);
    if(!hit)return;
    event.preventDefault();hit.toggle.click();
  });
  // Dynamically generated headers also get keyboard access. Never replace
  // existing click listeners or turn a container with embedded buttons into a button.
  function bind(){
    document.querySelectorAll(headerSelector).forEach(head=>{
      if(!head.dataset.piHeaderClickBound && targetToggle(head,head)){
        head.dataset.piHeaderClickBound='1';
        if(!head.hasAttribute('tabindex'))head.tabIndex=0;
        head.title ||= 'Click empty header space to expand or collapse';
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;bind();});}).observe(document.documentElement,{subtree:true,childList:true});
})();
