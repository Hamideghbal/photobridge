/* R1777: content-owned mobile mode and a feature-detected fallback for older Safari.
   This file intentionally uses ES2017-compatible syntax and ordinary selectors. */
(function(){
 'use strict';
 if(window.__PB1777_MOBILE_BROWSER__)return;window.__PB1777_MOBILE_BROWSER__=true;
 var queued=false;
 function qs(selector,root){return (root||document).querySelector(selector)}
 function toggle(el,name,on){if(el.classList.contains(name)!==on)el.classList.toggle(name,on)}
 function style(el,key,value){if(el.style.getPropertyValue(key)!==value||el.style.getPropertyPriority(key)!=='important')el.style.setProperty(key,value,'important')}
 function source(main,index,album){
  if(album)return qs(index===0?'.albumOrderWorkspace .albumFileActionFile':'.albumOrderWorkspace .albumQuoteCard button.primary',main);
  return qs(index===0?'.simplePrintPilotPrimaryAdd':'.simplePrintPilotQuoteSubmit,.simplePrintPilotHeaderSubmit',main);
 }
 function choose(index){var main=qs('main.photographerMain.photographerPrintWorkspace');if(!main)return;var button=source(main,index,!!qs('.albumOrderWorkspace',main));if(button&&!button.disabled)button.click()}
 function createPlus(){
  var button=document.createElement('button');button.type='button';button.id='pb765-add';button.setAttribute('data-pb1777-owned','');button.textContent='+';button.setAttribute('aria-label','سفارش چاپ عکس جدید');
  button.addEventListener('click',function(){
   var main=qs('main.photographerMain.photographerPrintWorkspace');if(!main)return;
   var old=qs('.photographerMobileOrderLaunch.print .photographerMobileOrderAction',main);
   if(old&&!old.disabled){window.PB765OpenComposerOnly=true;old.click();setTimeout(function(){window.PB765OpenComposerOnly=false},250);return}
   history.pushState(history.state,'','/photographer/upload?workspace=print');window.dispatchEvent(new PopStateEvent('popstate',{state:history.state}));
  });document.body.appendChild(button);return button;
 }
 function createActions(){
  var row=document.createElement('div');row.id='pbF37PrintComposerActions';row.setAttribute('data-pb1777-owned','');row.setAttribute('aria-label','ارسال سفارش');
  row.innerHTML='<button type="button" class="pbF37Choose">انتخاب عکس</button><button type="button" class="pbF37Send">ارسال فایل برای چاپ</button>';
  row.children[0].addEventListener('click',function(){choose(0)});row.children[1].addEventListener('click',function(){choose(1)});
  document.body.appendChild(row);return row;
 }
 function bounds(el){if(!el||el.hidden)return null;var css=getComputedStyle(el),box=el.getBoundingClientRect();return css.display!=='none'&&css.visibility!=='hidden'&&box.width>0&&box.height>0?box:null}
 function fallbackGeometry(main,row){
  var top=0,bottom=innerHeight,viewport=window.visualViewport,items=document.querySelectorAll('#pbF37PhotographerHeader,#pbF37Subheader,.photographerPrintModeHeader');
  if(viewport)bottom=Math.min(bottom,(viewport.offsetTop||0)+viewport.height);
  for(var i=0;i<items.length;i++){var b=bounds(items[i]);if(b)top=Math.max(top,b.bottom)}
  var actions=bounds(row);if(actions)top=Math.max(top,actions.bottom);
  var docks=document.querySelectorAll('.photographerBottomAppNav,.photographerMobileUtilityRail');
  for(var j=0;j<docks.length;j++){var dock=bounds(docks[j]);if(dock&&dock.top>top)bottom=Math.min(bottom,dock.top)}
  return {top:Math.ceil(top),bottom:Math.max(0,Math.ceil(innerHeight-bottom))};
 }
 function passwords(){
  var fields=document.querySelectorAll('.passwordField');
  for(var i=0;i<fields.length;i++){
   if(!qs('.passwordToggle',fields[i]))continue;
   if(!fields[i].hasAttribute('data-pb-no-password-eye'))fields[i].setAttribute('data-pb-no-password-eye','');
   var duplicates=fields[i].querySelectorAll('.pb1536PasswordEye');
   for(var j=0;j<duplicates.length;j++)duplicates[j].parentNode.removeChild(duplicates[j]);
  }
 }
 function sync(){
  queued=false;passwords();var body=document.body,main=qs('main.photographerMain.photographerPrintWorkspace');
  var mobile=window.matchMedia?matchMedia('(max-width:820px)').matches:innerWidth<=820;
  var embedded=document.documentElement.classList.contains('pb1126Embedded');
  var active=mobile&&!embedded&&!!main&&!qs('#pbR99LabChooser')&&!body.classList.contains('pbR100F14ChoosingLab');
  var composer=active&&!!qs('.simplePrintPilot,.albumOrderWorkspace',main);
  toggle(body,'pb1777PrintOverview',active&&!composer);toggle(body,'pb1777PrintComposer',!!composer);
  if(!active){var owned=document.querySelectorAll('[data-pb1777-owned]');for(var n=0;n<owned.length;n++)if(!owned[n].hidden)owned[n].hidden=true;return;}
  var plus=qs('#pb765-add'),row=qs('#pbF37PrintComposerActions');
  if(!composer){if(!plus)plus=createPlus();if(plus.hidden)plus.hidden=false;if(plus.getAttribute('aria-hidden')!=='false')plus.setAttribute('aria-hidden','false');if(row&&!row.hidden)row.hidden=true;}
  else{
   if(plus&&!plus.hidden)plus.hidden=true;if(!row)row=createActions();if(row.hidden)row.hidden=false;
   var album=!!qs('.albumOrderWorkspace',main),buttons=row.querySelectorAll('button');
   for(var i=0;i<buttons.length&&i<2;i++){var target=source(main,i,album),disabled=!target||target.disabled;if(buttons[i].disabled!==disabled)buttons[i].disabled=disabled;}
  }
  // Prefer the existing shared geometry. The fallback uses actual visible edges,
  // so old browsers without dvh, visualViewport or ResizeObserver still fill the dock.
  if(typeof window.pb1310PrintGeometry!=='function')window.pb1310PrintGeometry=function(w){return fallbackGeometry(w,qs('#pbF37PrintComposerActions'))};
  var geometry=window.pb1310PrintGeometry(main);
  if(!geometry)return;
  var scroll=qs('.photographerRolePageScrollArea',main);if(!scroll||scroll.parentElement!==main)return;
  var values={position:'fixed',top:geometry.top+'px',bottom:geometry.bottom+'px',left:'0px',right:'0px',height:'auto','min-height':'0px','max-height':'none','overflow-y':'auto','overflow-x':'hidden'};
  for(var key in values)style(scroll,key,values[key]);
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(sync)}}
 function start(){
  var root=qs('#root');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled']});
  new MutationObserver(schedule).observe(document.body,{childList:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);window.addEventListener('popstate',schedule);window.addEventListener('pageshow',schedule);
  if(window.visualViewport)window.visualViewport.addEventListener('resize',schedule);schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
