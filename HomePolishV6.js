/* V6: stabilize Home controls without changing saved collapse state. */
(() => {
  if (!document.querySelector('.database-page')) return;
  function align() {
    for (const head of document.querySelectorAll('.database-page .pi-focus-head, .database-page .home-upcoming-panel > .panel-header, .database-page .database-notes-panel > .panel-header')) {
      const pop=head.querySelector(':scope > .pi-popout-button');
      const collapse=head.querySelector(':scope > .pi-focus-collapse, :scope > .panel-collapse-toggle');
      if (pop && collapse && pop.nextElementSibling!==collapse) {
        head.append(pop,collapse);
      }
    }
  }
  align();
  let queued=false;
  new MutationObserver(()=>{
    if (queued) return;
    queued=true;
    queueMicrotask(()=>{queued=false;align();});
  }).observe(document.body,{childList:true,subtree:true});
})();
