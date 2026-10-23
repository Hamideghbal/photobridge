(()=>{'use strict';if(window.pb1372ThirdHeader)return;window.pb1372ThirdHeader=true;
const media=matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)');let queued=false,resize;
function buttonSource(root){
 const customers=root.querySelector('.labCustomerSubnav');if(customers)return {source:customers,kind:'customers',title:'عکاسان و همکاری',selector:':scope>button'};
 const pricing=root.querySelector('.labPrintPricingCard>.panelHead');if(pricing)return {source:pricing,kind:'pricing',title:'تعرفه چاپ و سایز',selector:'.priceCatalogActions>button'};
 const album=root.querySelector('.albumSettingsInnerTabs');if(album)return {source:album,kind:'album',title:'تنظیمات آلبوم',selector:':scope>button'};
 const finance=root.querySelector('.financeSectionTabs');if(finance)return {source:finance,kind:'finance',title:'',selector:':scope>button'};
 return null;
}
function clear(root){root.querySelector('.pb1372ThirdHeader')?.remove();root.querySelectorAll('.pb1372Source,.pb1372RetiredBox').forEach(n=>n.classList.remove('pb1372Source','pb1372RetiredBox'));root.classList.remove('pb1372HasThird');}
function render(){queued=false;const root=document.querySelector('.labRoleWorkspace');if(!root)return;if(!media.matches){clear(root);return}const header=root.querySelector('.labSingleHeader'),second=root.querySelector('.pb1148SecondaryHeader'),data=buttonSource(root);if(!header||!second||!data){clear(root);return}
 root.querySelectorAll('.pb1372Source,.pb1372RetiredBox').forEach(n=>{if(n!==data.source&&!n.contains(data.source))n.classList.remove('pb1372Source','pb1372RetiredBox')});
 data.source.classList.add('pb1372Source');if(data.kind==='customers')data.source.closest('.labCustomerSectionMenu')?.classList.add('pb1372RetiredBox');
 if(data.kind==='finance'){root.querySelector('.financeTopline')?.classList.add('pb1372RetiredBox');root.querySelector('.financeNavDock')?.classList.add('pb1372RetiredBox');}
 let row=root.querySelector('.pb1372ThirdHeader');if(!row){row=document.createElement('nav');row.className='pb1372ThirdHeader';row.setAttribute('aria-label','زیرگزینه‌های بخش');second.after(row)}
 const originals=[...data.source.querySelectorAll(data.selector)];if(data.kind==='finance')originals.push(...root.querySelectorAll('.financeSectionTools>button'));
 const previous=row._originals||[];
 if(row._kind!==data.kind||previous.length!==originals.length||originals.some((n,i)=>n!==previous[i])){
  row.replaceChildren();row._kind=data.kind;row._originals=originals;
  originals.forEach((_,index)=>{const button=document.createElement('button');button.type='button';button.dataset.index=String(index);button.onclick=()=>{const live=row._originals[index];if(live?.isConnected&&!live.disabled)live.click();schedule()};row.append(button)});
 }
 const fontButton=second.querySelector(':scope>button[data-pb1173-index]');if(fontButton&&typeof getComputedStyle==='function'){const font=getComputedStyle(fontButton).font;if(font&&row.style.getPropertyValue('--pb1375-tab-font')!==font)row.style.setProperty('--pb1375-tab-font',font)}
 [...row.querySelectorAll('button')].forEach((button,i)=>{const original=originals[i],raw=original.textContent.trim();let count='',label=raw;
 if(data.kind==='customers'){label=original.querySelector('span')?.textContent.trim()||raw;const suffix=original.querySelector('small')?.textContent.trim()||'';count=suffix.match(/[0-9۰-۹٠-٩]+/)?.[0]||'';if(!original.querySelector('span'))label=raw.replace(/[0-9۰-۹٠-٩]+\s*(?:عضو|جدید)/g,'').trim();}
 if(data.kind==='pricing')label=raw.includes('چاپ')?'چاپ':raw.includes('جدید')?'سایز جدید':raw.includes('ذخیره')?(original.disabled?'در حال ذخیره…':'ذخیره'):raw;
 if(button.dataset.label!==label||button.dataset.count!==count){button.replaceChildren();const text=document.createElement('span');text.className='pb1375TabLabel';text.textContent=label;button.append(text);if(count){const badge=document.createElement('b');badge.className='pb1375TabCount';badge.textContent=count;button.append(badge)}button.dataset.label=label;button.dataset.count=count;}
 button.disabled=original.disabled;const active=original.classList.contains('active')||original.getAttribute('aria-selected')==='true';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
 const top=Math.ceil(second.getBoundingClientRect().bottom);if(row.style.top!==top+'px')row.style.top=top+'px';root.classList.add('pb1372HasThird');
 const edge=Math.ceil(row.getBoundingClientRect().bottom)+'px';if(root.style.getPropertyValue('--pb1375-fade-top')!==edge)root.style.setProperty('--pb1375-fade-top',edge);
 const main=root.querySelector('main.appWorkspacePage.pbFixedRoleHeader');if(main){if(main.style.getPropertyValue('--pb1363-order-top')!==edge)main.style.setProperty('--pb1363-order-top',edge)}
 if(typeof ResizeObserver!=='undefined'){resize||=new ResizeObserver(schedule);if(resize._second!==second||resize._row!==row){resize.disconnect();resize.observe(second);resize.observe(row);resize._second=second;resize._row=row}}
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(render)}}
function start(){new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','aria-selected']});addEventListener('popstate',schedule);addEventListener('resize',schedule);addEventListener('photobridge-auth-session-changed',schedule);media.addEventListener('change',schedule);schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})();
