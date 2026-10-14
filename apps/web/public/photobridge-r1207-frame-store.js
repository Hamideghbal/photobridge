(()=>{'use strict';const C=window.PBFrameCatalog,selected=new Map();
const isFrame=()=>Boolean(saleShopConfig?.production);
function render(){if(!isFrame())return;const host=document.getElementById('saleItems');if(!host)return;const groups=C.groups(saleItems);host.innerHTML=groups.map(g=>{const item=C.choose(g,selected.get(g.id));if(!item)return '';selected.set(g.id,item.id);return C.card(g,item.id,{esc,money});}).join('')||'<div class="empty">مدلی برای سفارش وجود ندارد.</div>';applySaleCategory();}
const originalRender=renderSales;renderSales=function(){originalRender();render();};
const originalCart=renderSaleCart;renderSaleCart=function(){originalCart();if(isFrame()){const rows=[...document.querySelectorAll('#saleCartLines .saleCartLine')];for(const [index,line] of rows.entries()){const entry=saleCart[index],item=saleItems.find(x=>String(x.id)===String(entry?.itemId));if(item)line.querySelector('b').textContent=item.title||C.label(item);}}};
function changeChoice(e){const el=e.target.closest('[data-frame-choice]');if(!el||!isFrame())return;const card=el.closest('[data-frame-model]'),g=C.groups(saleItems).find(x=>String(x.id)===card.dataset.frameModel);if(!g)return;const current=C.choose(g,selected.get(g.id)),quantity=card.querySelector('input[id^=saleQty-]')?.value||'1',next=C.changeChoice(g,current,el.dataset.frameChoice,el.dataset.frameColor||el.value);if(next){selected.set(g.id,next.id);render();const qty=document.getElementById('saleQty-'+next.id);if(qty)qty.value=quantity;}}
document.addEventListener('change',changeChoice);
document.addEventListener('click',e=>{if(e.target.closest('[data-frame-color]')){changeChoice(e);return;}const btn=e.target.closest('[data-frame-show-gallery]');if(btn)pb834OpenShopGallery('sale',btn.dataset.frameShowGallery);});
const style=document.createElement('style');style.textContent=C.cardStyles();document.head.append(style);if(isFrame())render();
})();
