/* V28.1 shared page-navigation order and accessible Calendars flyout. */
(()=>{
 'use strict';
 const routes=[
   ['Database.html','🏠 Home'],
   ['Alignment.html','✨ Alignment'],
   ['Aquarium.html','🪼 Aquarium'],
   ['Almanac.html','📜 Timeline'],
   ['Patterns.html','🗄️ Archive'],
   ['neopets.html','💻 Neopets']
 ];
 const calendars=[
   ['Week.html','🗓️ This Week'],
   ['Month.html','📅 This Month'],
   ['NextMonth.html','📆 Next Month']
 ];
 function buildMenu(menu){
   if(menu.dataset.piV281Nav==='true')return;
   // Native links remain navigable even if some higher-level app logic fails.
   const href=location.pathname.split('/').pop()||'Database.html';
   const panel=menu.querySelector(':scope > .ecosystem-menu-popover');
   if(!panel)return;
   const mk=(url,label)=>{
     const a=document.createElement('a');a.href=url;a.textContent=label;
     if(url===href){a.classList.add('current');a.setAttribute('aria-current','page');}
     return a;
   };
   panel.replaceChildren();
   routes.slice(0,3).forEach(([url,label])=>panel.append(mk(url,label)));
   const group=document.createElement('div');group.className='pi-calendars-nav';
   const toggle=document.createElement('button');toggle.type='button';
   toggle.className='pi-calendars-trigger';toggle.textContent='📅 Calendars';
   toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-haspopup','true');
   toggle.setAttribute('aria-label','Show calendar pages');
   const flyout=document.createElement('div');flyout.className='pi-calendars-flyout';
   flyout.setAttribute('role','group');flyout.setAttribute('aria-label','Calendar pages');
   calendars.forEach(([url,label])=>flyout.append(mk(url,label)));
   if(calendars.some(([url])=>url===href))group.classList.add('pi-calendar-current');
   group.append(toggle,flyout);panel.append(group);
   routes.slice(3).forEach(([url,label])=>panel.append(mk(url,label)));
   function setOpen(open){group.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));}
   toggle.addEventListener('click',e=>{e.stopPropagation();setOpen(!group.classList.contains('is-open'));});
   toggle.addEventListener('keydown',e=>{
     if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='ArrowDown'){
       e.preventDefault();setOpen(true);flyout.querySelector('a')?.focus();
     }
   });
   group.addEventListener('keydown',e=>{
     if(e.key==='Escape'){e.stopPropagation();setOpen(false);toggle.focus();}
   });
   document.addEventListener('pointerdown',e=>{
     if(!group.contains(e.target))setOpen(false);
   });
   menu.addEventListener('toggle',()=>{if(!menu.open)setOpen(false);});
   menu.dataset.piV281Nav='true';
 }
 function init(){
   document.querySelectorAll('header details.ecosystem-menu:not(.pi-theme-menu):not(.pi-tools-menu)').forEach(buildMenu);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
