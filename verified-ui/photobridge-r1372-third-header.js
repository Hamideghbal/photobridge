(()=>{'use strict';if(window.pb1372ThirdHeader)return;window.pb1372ThirdHeader=true;
const media=matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)');let queued=false,resize;
function pb1425CustomersSource(root,native){
 let source=root.querySelector('.pb1425CustomerTabs');
 if(!source){source=document.createElement('nav');source.className='pb1425CustomerTabs';source.hidden=true;
 for(const [index,label,path] of [[0,'عکاس‌ها','/lab/settings/customers/photographers'],[1,'دعوت‌نامه','/lab/settings/customers/invites'],[2,'درخواست همکاری','/lab/settings/customers/collaboration'],[3,'مشتری آزاد','/lab/settings/walkin']]){
 const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>{const live=root.querySelectorAll('.labCustomerSubnav>button')[index];if(index<3&&live){live.click();return}if(location.pathname!==path){history.pushState(null,'',path);dispatchEvent(new PopStateEvent('popstate'));}};source.append(button);}
 root.querySelector('main').append(source);}
 const active=location.pathname.includes('/walkin')?3:location.pathname.includes('/invites')||location.hash==='#customers-invites'?1:location.pathname.includes('/collaboration')||location.hash==='#customers-collaboration'?2:0;
 [...source.children].forEach((button,i)=>button.classList.toggle('active',i===active));
 return source;
}
function buttonSource(root){
 const customers=root.querySelector('.labCustomerSubnav');if(customers||new RegExp('^/lab/settings/(?:customers|walkin)(?:/|$)').test(location.pathname))return {source:pb1425CustomersSource(root,customers),kind:'customers',title:'',selector:':scope>button'};
 /* PB1433 album navigation priority */
 const album=root.querySelector('.albumSettingsInnerTabs');if(album)return {source:album,kind:'album',title:'تنظیمات آلبوم',selector:':scope>button'};
 const pricing=root.querySelector('.labPrintPricingCard>.panelHead');if(pricing)return {source:pricing,kind:'pricing',title:'تعرفه چاپ و سایز',selector:'.priceCatalogActions>button'};
 const finance=root.querySelector('.financeSectionTabs');if(finance)return {source:finance,kind:'finance',title:'',selector:':scope>button'};
 return null;
}
function clear(root){root.classList.remove('pb1433AlbumThird');root.classList.remove('pb1429InlineThird');root.classList.remove('pb1425PromotedSecond');root.querySelector('.pb1372ThirdHeader')?.remove();root.querySelectorAll('.pb1372Source,.pb1372RetiredBox').forEach(n=>n.classList.remove('pb1372Source','pb1372RetiredBox'));root.classList.remove('pb1372HasThird');}
function render(){queued=false;const root=document.querySelector('.labRoleWorkspace');if(!root)return;if(!media.matches){clear(root);return}const header=root.querySelector('.labSingleHeader'),second=root.querySelector('.pb1148SecondaryHeader'),data=buttonSource(root);if(!header||!second||!data){clear(root);return}
 /* PB1425 finance second row */
 root.classList.toggle('pb1425PromotedSecond',data.kind==='finance'||data.kind==='customers');
 root.querySelectorAll('.pb1372Source,.pb1372RetiredBox').forEach(n=>{if(n!==data.source&&!n.contains(data.source))n.classList.remove('pb1372Source','pb1372RetiredBox')});
 data.source.classList.add('pb1372Source');if(data.kind==='customers')data.source.closest('.labCustomerSectionMenu')?.classList.add('pb1372RetiredBox');
 if(data.kind==='finance'){root.querySelector('.financeTopline')?.classList.add('pb1372RetiredBox');root.querySelector('.financeNavDock')?.classList.add('pb1372RetiredBox');}
 let row=root.querySelector('.pb1372ThirdHeader');if(!row){row=document.createElement('nav');row.className='pb1372ThirdHeader';row.setAttribute('aria-label','زیرگزینه‌های بخش');second.after(row)}
 /* PB1429 inline pricing actions */
 /* PB1430 album third row */
 const inline=data.kind==='pricing';root.classList.toggle('pb1429InlineThird',inline);root.classList.toggle('pb1433AlbumThird',data.kind==='album');row.classList.toggle('pb1433AlbumRow',data.kind==='album');row.classList.toggle('pb1429InlineActions',inline);if(inline&&row.parentElement!==second)second.append(row);else if(!inline&&row.parentElement===second)second.after(row);
 row.classList.toggle('pb1376ActionRow',data.kind==='pricing');
 const originals=[...data.source.querySelectorAll(data.selector)];if(data.kind==='finance')originals.push(...root.querySelectorAll('.financeSectionTools>button'));
 /* PB1379 album menu toggle */
 if(data.kind==='album'){const toggle=root.querySelector('.pb1379AlbumMenuToggle');if(toggle)originals.push(toggle)}
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
 button.classList.toggle('pb1379HeaderToggle',original.classList.contains('pb1379AlbumMenuToggle'));if(original.getAttribute('role')==='switch'){button.setAttribute('role','switch');button.setAttribute('aria-checked',original.getAttribute('aria-checked'))}else{button.removeAttribute('role');button.removeAttribute('aria-checked')}
 button.classList.toggle('pb1418ManualInvoiceAction',original.classList.contains('pb1176ManualOpen'));button.disabled=original.disabled;const active=original.classList.contains('active')||original.getAttribute('aria-selected')==='true';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
 const top=Math.ceil(((data.kind==='finance'||data.kind==='customers')?header:second).getBoundingClientRect().bottom);if(row.style.top!==top+'px')row.style.top=top+'px';root.classList.add('pb1372HasThird');
 const edge=Math.ceil((inline?second:row).getBoundingClientRect().bottom)+'px';if(root.style.getPropertyValue('--pb1375-fade-top')!==edge)root.style.setProperty('--pb1375-fade-top',edge);
 // R1396: the scroll viewport owner measures all headers plus the collaboration notice.
 if(typeof ResizeObserver!=='undefined'){resize||=new ResizeObserver(schedule);if(resize._second!==second||resize._row!==row){resize.disconnect();resize.observe(second);resize.observe(row);resize._second=second;resize._row=row}}
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(render)}}
function start(){new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','aria-selected']});addEventListener('popstate',schedule);addEventListener('resize',schedule);addEventListener('photobridge-auth-session-changed',schedule);media.addEventListener('change',schedule);schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})();


/* PB1439 manual action stays in invoice toolbar */
