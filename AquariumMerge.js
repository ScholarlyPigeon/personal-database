/* V28 combined Aquarium UI: date defaults and editor safeguards.
   Folder data and cloud-synced note save logic remain owned by Script.js. */
(() => {
  'use strict';
  if (!document.documentElement.classList.contains('aquarium-merged-page')) return;
  function start() {
    const date = document.getElementById('aqComposeDate');
    if (date && !date.value) {
      const now=new Date();
      date.value=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
    }
    const editor = document.getElementById('captureInput');
    const title = document.getElementById('aqCaptureTitle');
    const type = document.getElementById('aqNoteType');
    const destination = document.getElementById('aqSaveDestination');
    const image = document.getElementById('aqComposeImage');
    const link = document.getElementById('aqComposeLink');
    const save = document.getElementById('captureBtn');
    const DRAFT_KEY = 'pi-aquarium-writing-draft-v1';
    let draft = null;
    try {draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');}catch{}
    if (draft && typeof draft === 'object' && !title?.value && !editor?.innerText?.trim()) {
      title.value=String(draft.title||'');editor.innerHTML=String(draft.html||'');
      if (draft.noteType && type) type.value=draft.noteType;
      if (draft.destination && destination && [...destination.options].some(o=>o.value===draft.destination)) destination.value=draft.destination;
      if (draft.date && date) date.value=draft.date;
      if (draft.imageUrl && image) image.value=draft.imageUrl;
      if (draft.linkUrl && link) link.value=draft.linkUrl;
      if (draft.title || draft.html) {
        const hint=document.getElementById('aqComposeHint');
        if (hint) hint.textContent='Draft restored · Enter makes a new line · Ctrl/Cmd + Enter saves';
      }
    }
    let queue=null;
    const autosave = () => {
      clearTimeout(queue);
      queue=setTimeout(()=>{
        const payload={title:title?.value||'',html:editor?.innerHTML||'',noteType:type?.value||'category',
          destination:destination?.value||'inbox',date:date?.value||'',imageUrl:image?.value||'',linkUrl:link?.value||''};
        // Draft is local; saved notes themselves use the cloud-synced Aquarium key.
        if (payload.title || editor?.innerText?.trim()) localStorage.setItem(DRAFT_KEY,JSON.stringify(payload));
        else localStorage.removeItem(DRAFT_KEY);
      },400);
    };
    [title,editor,type,destination,date,image,link].forEach(control=>{
      control?.addEventListener('input',autosave);
      control?.addEventListener('change',autosave);
    });
    save?.addEventListener('click',()=>{
      clearTimeout(queue);
      if (!title?.value && !editor?.innerText?.trim()) {
        localStorage.removeItem(DRAFT_KEY);
        const hint=document.getElementById('aqComposeHint');
        if (hint) hint.textContent='Enter creates a new line · Ctrl/Cmd + Enter saves';
      }
    });
    // Rich text remains a native contenteditable, just like Longform. Enter
    // inserts a paragraph, and the existing Ctrl/Cmd+Enter saves a note.
    editor?.addEventListener('paste', event => {
      // Images and external rich HTML may be pasted directly; standard browser
      // text styling is kept. No premature save on Enter.
      if (event.clipboardData?.types?.includes('text/html')) return;
    });
    document.getElementById('aqSaveDestination')?.addEventListener('change',event => {
      if (event.target.value !== 'inbox') {
        const unsorted=document.querySelector('.aq-merged-unsorted');
        if (unsorted?.open) unsorted.open=false;
      }
    });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
