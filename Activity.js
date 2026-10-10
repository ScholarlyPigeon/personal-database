/* Personal Intranet: meaningful, local user-edit activity trail.
   Records additions and content edits, not drafts, layout, filtering,
   sync echoes, checkbox toggles, or each keystroke as a separate event. */
(() => {
  'use strict';
  const LOG = 'pi-activity-v1';
  const nativeSet = Storage.prototype.setItem;
  let interactionAt = -Infinity;
  let writingLog = false;
  const stamp = () => performance.now();
  ['pointerdown', 'keydown', 'input', 'change', 'click'].forEach(type => {
    document.addEventListener(type, () => { interactionAt = stamp(); }, true);
  });
  const watched = key => {
    if (/^pi-calendar-day-\d{4}-\d{2}-\d{2}$/.test(key)) return true;
    if (/^pi-planner-month-\d{4}-\d{2}$/.test(key)) return true;
    return [
      'pi-database-radar-v1','pi-database-near-radar-v1','pi-database-notes-v1',
      'pi-aquarium-state-v3','pi-longform-state-v1','pi-longform-titles-v1',
      'pi-archive-v1','pi-archive-workspace-v1','pi-planner-week-notes-v1',
      'pi-neopets-state-v3','pi-almanac-state-v1','pi-strain-journal-v1',
      'pi-reflections-notes-v1'
    ].includes(key);
  };
  const pageForKey = key => {
    if (key.startsWith('pi-calendar-day-') || key.startsWith('pi-database-')) return 'database';
    if (key.startsWith('pi-planner-week')) return 'week';
    if (key.startsWith('pi-planner-month')) return 'month';
    if (key.includes('aquarium')) return 'aquarium';
    if (key.includes('longform')) return 'longform';
    if (key === 'pi-archive-workspace-v1' || key === 'pi-reflections-notes-v1') return 'almanac';
    if (key === 'pi-archive-v1') return 'archive';
    if (key.includes('neopets')) return 'neopets';
    return 'almanac';
  };
  const areaForKey = key => {
    if (key.includes('near-radar')) return 'Near Radar';
    if (key.includes('radar')) return 'Radar';
    if (key.includes('database-notes')) return 'Home notes';
    if (key.startsWith('pi-calendar-day-')) return `Calendar · ${key.slice(16)}`;
    if (key.includes('planner-week')) return 'Week notes';
    if (key.includes('planner-month')) return 'Month notes';
    if (key.includes('aquarium')) return 'Aquarium';
    if (key.includes('longform')) return 'Longform';
    if (key.includes('archive-workspace')) return 'Timeline & Notes';
    if (key.includes('reflections')) return 'Timeline & Notes';
    if (key.includes('archive')) return 'Archive';
    if (key.includes('neopets')) return 'Neopets';
    return 'Reference';
  };
  function parse(raw) {try{return JSON.parse(raw || 'null');}catch{return null;}}
  function flatten(value, area) {
    const out = [];
    const visit = (node, path) => {
      if (Array.isArray(node)) {node.forEach((item, index) => visit(item, `${path}[${index}]`));return;}
      if (!node || typeof node !== 'object') return;
      if (typeof node.id === 'string' && node.id && (typeof node.text === 'string' || typeof node.title === 'string' || typeof node.name === 'string' || typeof node.label === 'string' || typeof node.html === 'string')) {
        const label = [node.title,node.name,node.label,node.text].find(s => typeof s === 'string' && s.trim()) || 'Untitled';
        const content = [node.title,node.text,node.html,node.name,node.label,node.imageUrl,node.linkUrl,node.url,node.date,node.sectionId,node.zone,String(node.done??'')].map(v => typeof v === 'string' ? v : '').join('\u241f');
        out.push({id:node.id, label:label.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,140), content, area:path});
        return;
      }
      Object.entries(node).forEach(([key,val]) => {
        if (['assignments','sections','kinds','hidden','collapsed','order','config','settings'].includes(key)) return;
        if (Array.isArray(val) || (val && typeof val === 'object')) visit(val, `${path} / ${key}`);
      });
    };
    if (area === 'Longform' && value && Array.isArray(value.entries)) visit(value.entries,area);
    else visit(value,area);
    return out;
  }
  function changes(key, before, after) {
    const old = parse(before), now = parse(after);
    const area=areaForKey(key);
    if (key === 'pi-longform-titles-v1') {
      if (!now || typeof now !== 'object') return [];
      return Object.entries(now).filter(([id,label]) => typeof label==='string' && old?.[id] !== undefined && old?.[id] !== label)
        .map(([id,label])=>({id, action: old?.[id] === undefined?'titled a Longform thought':'edited a Longform title',text:label,area}));
    }
    if (!old && !now) return [];
    const prior = new Map(flatten(old,area).map(x=>[x.id,x]));
    return flatten(now,area).filter(x=>!prior.has(x.id) || prior.get(x.id).content!==x.content)
      .map(x=>({id:x.id, action:prior.has(x.id)?'edited an item':'added an item',text:x.label,area}));
  }
  function append(key, change) {
    const page=pageForKey(key);
    const now=new Date().toISOString();
    let entries=[];
    try {const old=JSON.parse(localStorage.getItem(LOG)||'[]');if(Array.isArray(old))entries=old;}catch{}
    const last=entries[0];
    // Continuous text editing updates the last breadcrumb instead of adding one per letter.
    if (last && last._itemId===change.id && last._key===key &&
        Date.now()-new Date(last.timestamp).getTime()<12000 && last.action===change.action) {
      last.text=change.text;last.timestamp=now;
    } else {
      entries.unshift({id:`activity-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        timestamp:now,page,action:`${change.action} · ${change.area}`,text:change.text,
        _key:key,_itemId:change.id});
    }
    writingLog=true;
    try {nativeSet.call(localStorage,LOG,JSON.stringify(entries.slice(0,250)));}
    finally {writingLog=false;}
    window.dispatchEvent(new Event('pi-activity-updated'));
  }
  Storage.prototype.setItem = function(key, value) {
    const targetKey=String(key); const oldValue=watched(targetKey) && !writingLog ? this.getItem(targetKey) : null;
    const result=nativeSet.call(this,key,value);
    if (this!==localStorage || writingLog || !watched(targetKey) || oldValue===String(value)) return result;
    if (stamp()-interactionAt > 15000) return result;
    try {changes(targetKey,oldValue,String(value)).slice(0,8).forEach(change=>append(targetKey,change));}
    catch(err){console.warn('Activity recording skipped this update:',err);}
    return result;
  };
})();
