(()=>{'use strict';
const states=new WeakMap();
function setup(doc){let state=states.get(doc);if(!state){state={groups:new Map(),nodes:new Map()};states.set(doc,state);}
 for(const [parent]of state.groups)if(!parent.isConnected)state.groups.delete(parent);for(const [key,el]of state.nodes)if(!el.isConnected)state.nodes.delete(key);const counts=new Map();for(const el of doc.querySelectorAll('main [data-site-field],main h1[data-site-style],main h2[data-site-style],main h3[data-site-style],main p[data-site-style],main li[data-site-style],main img')){
  if(el.closest('form,#products,.cart,.breadcrumbs')||el.closest('a,button,summary')||el.querySelector('[data-site-field]'))continue;
  const card=el.closest('[data-site-card]');const base=el.tagName==='IMG'?(el.dataset.siteImage?'image:'+el.dataset.siteImage:card?'card:'+card.dataset.siteCard+':image:'+el.dataset.cardImage:null):el.dataset.siteStyle||'field:'+el.dataset.siteField;if(!base)continue;
  const count=counts.get(base)||0;counts.set(base,count+1);const key=base+(count?':copy:'+count:'');el.dataset.siteLayout=key;if(state.nodes.get(key)===el)continue;state.nodes.set(key,el);
  const parent=el.parentElement;if(!state.groups.has(parent))state.groups.set(parent,[]);const group=state.groups.get(parent);if(!el.hasAttribute('data-site-layout-original'))el.dataset.siteLayoutOriginal=String(group.length);group.push(el);group.sort((a,b)=>Number(a.dataset.siteLayoutOriginal)-Number(b.dataset.siteLayoutOriginal));
 }
 if(!doc.getElementById('site-layout-style')){const style=doc.createElement('style');style.id='site-layout-style';style.textContent='[data-site-layout]{position:relative;left:var(--site-shift-x,0px);top:var(--site-shift-y,0px)}@media(max-width:640px){[data-site-layout]{left:0;top:0}}';doc.head.append(style);}return state;
}
function apply(doc,config,path){const state=setup(doc),entries=config.layout?.[path]||{};
 for(const [key,el]of state.nodes){const v=entries[key]||{};el.style.setProperty('--site-shift-x',(v.x||0)+'px');el.style.setProperty('--site-shift-y',(v.y||0)+'px');}
 for(const [parent,original]of state.groups){const live=[...parent.children].filter(el=>original.includes(el));if(live.length<2)continue;const sorted=[...live].sort((a,b)=>(entries[a.dataset.siteLayout]?.rank??original.indexOf(a))-(entries[b.dataset.siteLayout]?.rank??original.indexOf(b)));
  if(sorted.every((el,i)=>el===live[i]))continue;const slots=live.map(el=>{const marker=doc.createComment('layout');parent.insertBefore(marker,el);el.remove();return marker;});slots.forEach((slot,i)=>slot.replaceWith(sorted[i]));
 }return state;
}
window.PBSiteLayout={apply,setup};
const data=document.getElementById('site-layout-data');if(data){const saved=JSON.parse(data.textContent);apply(document,saved,saved.pathname);}
})();
