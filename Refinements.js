/* V21.6: keep cloud account access available with the compact, two-row Home header. */
(() => {
  'use strict';
  function addCloudShortcut() {
    const header=document.querySelector('.database-header');
    const native=header?.querySelector('.header-right > .pi-home-cloud-login');
    const menu=header?.querySelector('.header-right > .pi-tools-menu');
    const tray=menu?.querySelector(':scope > .pi-tools-popover');
    if(!native || !tray || tray.querySelector('[data-pi-cloud-shortcut]'))return;
    const button=document.createElement('button');
    button.type='button';button.className='small-button pi-v16-tool-action';
    button.dataset.piCloudShortcut='1';button.textContent='☁ Cloud account';
    button.title='Open cloud account login or account options';
    button.addEventListener('click',()=>{menu.open=false;native.click();});
    tray.append(button);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addCloudShortcut,{once:true});
  else addCloudShortcut();
})();
