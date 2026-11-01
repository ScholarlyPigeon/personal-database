/* V14: consistent compose shortcuts and safe, nonintrusive editor behavior. */
(() => {
  'use strict';
  const newEntrySelector = [
    '#databaseNotesInput','.day-entry-row .day-input',
    '.pi-nested-compose textarea','.planner-category-add textarea',
    '.planner-day-form textarea','#plannerNoteInput',
    '#captureInput','#aqCaptureTitle','#longformInput','#longformTitleInput',
    '#piTimelineTitle','#piTimelineBody','#patternInput','#timelineMarkerInput',
    '.pi-timeline-add textarea'
  ].join(',');
  const submit = node => {
    if(node.closest('form')) {
      const form=node.closest('form');
      if(form.querySelector('[type="submit"]')) {form.requestSubmit();return true;}
    }
    let btn;
    if(node.matches('#databaseNotesInput'))btn=document.getElementById('addDatabaseNote');
    else if(node.matches('.day-entry-row .day-input'))btn=node.closest('.day-entry-row')?.querySelector('button');
    else if(node.matches('#captureInput,#aqCaptureTitle'))btn=document.getElementById('captureBtn');
    else if(node.matches('#longformInput,#longformTitleInput'))btn=document.getElementById('saveLongformEntry');
    else if(node.matches('#piTimelineTitle,#piTimelineBody,.pi-timeline-add textarea'))btn=document.getElementById('piAddTimeline');
    else if(node.matches('#patternInput'))btn=document.getElementById('addPattern');
    else if(node.matches('#timelineMarkerInput'))btn=document.getElementById('addTimelineMarker');
    if(btn){btn.click();return true;}return false;
  };
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||event.shiftKey||event.isComposing||event.altKey)return;
    const node=event.target.closest?.(newEntrySelector);
    if(!node)return;
    if(submit(node)){
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);
  // These save hints describe the same keyboard behavior across all editors.
  const labelChanges={
    '.aq-shortcut':'Enter saves · Shift+Enter adds a line',
    '.longform-submit-note':'Enter saves · Shift+Enter adds a line'
  };
  const repaint=()=>Object.entries(labelChanges).forEach(([selector,value])=>{
    const el=document.querySelector(selector);if(el&&el.textContent!==value)el.textContent=value;
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',repaint,{once:true});else repaint();
})();
