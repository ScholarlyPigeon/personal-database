/* ===== Original module: AquariumHeaderV19.js ===== */
/* Aquarium note headers toggle via existing collapse buttons. Preserve
   direct title editing, drag handles, menu buttons and selections. */
(() => {
  'use strict';
  const excluded = 'button,input,textarea,select,a,summary,details,label,.aq-card-drag,.aq-category-handle,.aq-card-actions,.aq-category-actions';
  function getAction(target) {
    const cardHeader = target.closest?.('.aq-card-header');
    if (cardHeader) {
      const title = target.closest('.aq-card-title');
      if (target.closest(excluded)) return null;
      // One click on a collapsed title opens it; once open, titles remain
      // directly editable with a normal click, with no second editor.
      if (title && !cardHeader.closest('.aq-card')?.classList.contains('collapsed')) return null;
      return cardHeader.querySelector('.aq-card-collapse');
    }
    const categoryHead = target.closest?.('.aq-category-head');
    if (!categoryHead || target.closest(excluded)) return null;
    if (target.closest('.aq-category-name') &&
        !categoryHead.closest('.aq-category')?.classList.contains('collapsed')) return null;
    return categoryHead.querySelector('.aq-category-collapse');
  }
  document.addEventListener('click', event => {
    const toggle = getAction(event.target);
    if (!toggle) return;
    event.preventDefault();event.stopPropagation();toggle.click();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const head = event.target.closest?.('.aq-card-header');
    if (!head || event.target !== head) return;
    event.preventDefault();head.querySelector('.aq-card-collapse')?.click();
  });
  function bindHeaders() {
    document.querySelectorAll('.aq-card-header').forEach(head => {
      if (head.dataset.aqV19Bound) return;
      head.dataset.aqV19Bound='1';
      head.tabIndex=0;
      head.setAttribute('aria-label','Click empty space to expand or collapse note; click title to edit');
      head.title='Click the header to expand or collapse; click the open title to edit';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',bindHeaders);
  else bindHeaders();
  let queued=false;
  new MutationObserver(() => {
    if (queued) return;
    queued=true;
    queueMicrotask(()=>{queued=false;bindHeaders();});
  }).observe(document.documentElement,{subtree:true,childList:true});
})();
;
