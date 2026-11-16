/* V28.3 · Shared folder symbol + symbol color editor.
   Appearance belongs to the existing folder records and is saved through
   Aquarium/Alignment's original cloud-synced state keys. No extra store. */
(() => {
  'use strict';
  const DEFAULT_ICON = '✧';
  const icons = ['✧','✦','★','☆','♡','☾','☀','❀','☘','✎','⚙','♫','⚡','∞','🌸','🌿','🌙','🔮','🪼','🐚','📚','🎨','💡','🎮','🧠','💻','🗂️','📝','☕','🪴','💜','🦋'];
  const colors = ['#71cfcc','#9c8aca','#e6a0b9','#88b6db','#98c69e','#edbd77','#e89a87','#d0b0ec','#edf0f7'];
  const hex = value => /^#[0-9a-f]{6}$/i.test(String(value||'')) ? String(value).toLowerCase() : '';
  const cleanIcon = value => String(value||'').trim().slice(0,32) || DEFAULT_ICON;
  let dialog, input, colorInput, preview, reset, currentColor='', onSave=null, lastFocus=null;

  function apply(node, folder) {
    if (!node) return;
    node.classList.add('pi-custom-folder-symbol');
    node.textContent = cleanIcon(folder?.icon);
    const color = hex(folder?.iconColor);
    node.classList.toggle('pi-custom-folder-has-color', Boolean(color));
    node.style.color = color || '';
    if (color) node.style.setProperty('--pi-folder-symbol-color', color);
    else node.style.removeProperty('--pi-folder-symbol-color');
    node.setAttribute('aria-hidden','true');
  }
  function text(tag, cls, content){
    const el=document.createElement(tag);
    if(cls) el.className=cls;
    if(content!==undefined)el.textContent=content;
    return el;
  }
  function button(label, cls, onClick, title){
    const node=text('button',cls,label);node.type='button';
    if(title)node.title=title;
    node.addEventListener('click',onClick);
    return node;
  }
  function setColor(value){
    currentColor=hex(value);
    if(currentColor)colorInput.value=currentColor;
    reset.setAttribute('aria-pressed',String(!currentColor));
    dialog.querySelectorAll('.pi-folder-appearance-swatch').forEach(b=>{
      b.setAttribute('aria-pressed',String(b.dataset.color===currentColor));
    });
    updatePreview();
  }
  function updatePreview(){apply(preview,{icon:input.value,color:currentColor});}
  function close(){if(dialog?.open)dialog.close();}
  function ensure(){
    if(dialog)return;
    dialog=text('dialog','pi-folder-appearance-dialog');
    dialog.setAttribute('aria-label','Folder icon and color');
    const head=text('div','pi-folder-appearance-head');
    const title=text('h2','pi-folder-appearance-title','Folder icon & color');title.id='piFolderAppearanceTitle';
    const x=button('×','pi-folder-appearance-close',close,'Close without changes');
    x.setAttribute('aria-label','Close without changes');
    head.append(title,x);
    dialog.setAttribute('aria-labelledby',title.id);
    const top=text('div','pi-folder-appearance-top');
    preview=text('span','pi-folder-appearance-preview');
    const intro=text('div','pi-folder-appearance-intro');
    intro.append(text('strong','','Choose your folder symbol'),text('p','','Use an emoji, a star, or any symbol you like.'));
    top.append(preview,intro);
    const field=text('label','pi-folder-appearance-label','Symbol or emoji');
    input=text('input','pi-folder-appearance-input');
    input.type='text';input.maxLength=32;input.placeholder='✧';input.autocomplete='off';
    input.setAttribute('aria-label','Folder symbol or emoji');
    input.addEventListener('input',updatePreview);
    field.append(input);
    const presets=text('div','pi-folder-appearance-presets');
    presets.setAttribute('role','group');presets.setAttribute('aria-label','Suggested folder symbols');
    icons.forEach(icon=>{
      const b=button(icon,'pi-folder-appearance-preset',()=>{input.value=icon;updatePreview();},'Choose '+icon);
      b.setAttribute('aria-label','Use symbol '+icon);presets.append(b);
    });
    const colorLabel=text('label','pi-folder-appearance-color-label','Symbol color');
    const colorRow=text('div','pi-folder-appearance-colors');
    colorRow.setAttribute('role','group');colorRow.setAttribute('aria-label','Symbol color choices');
    colors.forEach(color=>{
      const swatch=button('','pi-folder-appearance-swatch',()=>setColor(color),'Use '+color);
      swatch.style.backgroundColor=color;swatch.dataset.color=color;
      swatch.setAttribute('aria-label','Choose icon color '+color);
      colorRow.append(swatch);
    });
    reset=button('Theme default','pi-folder-appearance-default',()=>setColor(''));
    colorInput=text('input','pi-folder-appearance-custom-color');
    colorInput.type='color';colorInput.value=colors[0];colorInput.title='Choose a custom icon color';
    colorInput.setAttribute('aria-label','Custom icon color');
    colorInput.addEventListener('input',()=>setColor(colorInput.value));
    const custom=text('label','pi-folder-appearance-custom-label','Custom');custom.append(colorInput);
    colorRow.append(reset,custom);
    const hint=text('p','pi-folder-appearance-hint','For full-color emoji, the selected color tints the glow behind the emoji. Text symbols take the color directly.');
    const footer=text('div','pi-folder-appearance-actions');
    footer.append(button('Cancel','pi-folder-appearance-cancel',close),button('Save appearance','pi-folder-appearance-save',()=>{
      const save=onSave; const data={icon:cleanIcon(input.value),color:currentColor};
      close();if(typeof save==='function')save(data);
    }));
    dialog.append(head,top,field,presets,colorLabel,colorRow,hint,footer);
    dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
    dialog.addEventListener('close',()=>{onSave=null;lastFocus?.focus?.();lastFocus=null;});
    document.body.append(dialog);
  }
  function open({name,icon,color,onSave:save}){
    if(typeof save!=='function')return;
    ensure();
    lastFocus=document.activeElement;
    onSave=save;
    input.value=cleanIcon(icon);
    dialog.querySelector('.pi-folder-appearance-intro strong').textContent='Choose a symbol for '+String(name||'this folder');
    setColor(color);
    if(!dialog.open)dialog.showModal();
    input.focus();input.select();
  }
  window.PIFolderAppearance={open,apply};
})();
