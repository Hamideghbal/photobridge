/* PhotoBridge v0.17.663 — durable Instagram-style likes, preserved totals and cross-device sync */
(function(){
  'use strict';
  var CLIENT_KEY='pb.album-design.rating-client-v1';
  var MY_LIKES_KEY='pb.album-design.my-likes-v661';
  var sortMode='default',scheduled=false,sorting=false,busy={},syncBusy=false,lastSync=0;
  function getClientKey(){
    try{var k=localStorage.getItem(CLIENT_KEY)||'';if(k.length>=8)return k;k=(window.crypto&&crypto.randomUUID?crypto.randomUUID():('pb-'+Date.now()+'-'+Math.random().toString(36).slice(2)));localStorage.setItem(CLIENT_KEY,k);return k}catch(e){return 'pb-'+Date.now()+'-'+Math.random().toString(36).slice(2)}
  }
  function readMine(){try{return JSON.parse(localStorage.getItem(MY_LIKES_KEY)||'{}')||{}}catch(e){return {}}}
  function saveMine(id,on){try{var m=readMine();if(on)m[String(id)]=1;else delete m[String(id)];localStorage.setItem(MY_LIKES_KEY,JSON.stringify(m))}catch(e){}}
  function num(v,d){v=Number(v);return Number.isFinite(v)?v:(d||0)}
  function canonicalId(v){return String(v||'').replace(/^saved:/,'').replace(/^pb-instagram-slide-/,'').trim()}
  function templateId(card){return canonicalId(card&&card.getAttribute('data-template-id')||'')}
  function likeCount(card){return Math.max(0,Math.round(num(card&&card.getAttribute('data-like-count'),num(card&&card.getAttribute('data-rating-count'),0))))}
  function mineLike(card,id){var attr=card&&card.getAttribute('data-my-liked');if(attr!==null&&attr!==undefined)return attr==='1'||attr==='true';return num(card&&card.getAttribute('data-my-rating'),0)>0||Boolean(readMine()[id])}
  function ensureHost(card){
    var host=card.querySelector('.pb659DesignLike');
    if(!host){host=document.createElement('div');host.className='pb659DesignLike';host.setAttribute('dir','ltr');card.appendChild(host)}
    var b=host.querySelector('.pb659LikeHeart');
    if(!b){b=document.createElement('button');b.type='button';b.className='pb659LikeHeart';b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.2 4.7 13.5C1.2 10.3 3 4.5 7.5 4.2c1.9-.1 3.5.8 4.5 2.2 1-1.4 2.6-2.3 4.5-2.2 4.5.3 6.3 6.1 2.8 9.3L12 20.2Z"/></svg>';host.appendChild(b)}
    var meta=host.querySelector('.pb659LikeCount');if(!meta){meta=document.createElement('small');meta.className='pb659LikeCount';host.appendChild(meta)}
    return {host:host,button:b,meta:meta};
  }
  function renderLike(card){
    var id=templateId(card);if(!id)return;
    var old=card.querySelector('.albumDesignModelMinimalLabel');if(old)old.style.display='none';
    var legacy=card.querySelector('.pb657DesignRating');if(legacy)legacy.remove();
    var ui=ensureHost(card),count=likeCount(card),mine=mineLike(card,id);
    ui.button.classList.toggle('active',mine);ui.button.disabled=Boolean(busy[id]);ui.button.setAttribute('aria-label',mine?'برداشتن لایک':'لایک کردن طرح');ui.button.setAttribute('aria-pressed',mine?'true':'false');ui.button.title=mine?'برداشتن لایک':'پسندیدن';ui.meta.textContent=String(count);card.classList.add('pb659LikesReady');
  }
  function updateAll(id,count,mine){
    id=canonicalId(id);if(!id)return;
    document.querySelectorAll('.albumDesignModelCard[data-template-id]').forEach(function(card){if(templateId(card)!==id)return;card.setAttribute('data-like-count',String(Math.max(0,Math.round(num(count,0)))));card.setAttribute('data-rating-count',String(Math.max(0,Math.round(num(count,0)))));card.setAttribute('data-my-liked',mine?'1':'0');card.setAttribute('data-my-rating',mine?'5':'0');renderLike(card)});saveMine(id,Boolean(mine));
  }
  async function toggleLike(card){
    var id=templateId(card);if(!id||busy[id])return;busy[id]=1;
    var before=likeCount(card),had=mineLike(card,id),next=!had,optimistic=Math.max(0,before+(next?1:-1));updateAll(id,optimistic,next);
    try{
      var r=await fetch('/api/public/album-design/templates/'+encodeURIComponent(id)+'/rating',{method:'POST',credentials:'include',cache:'no-store',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify({liked:next,clientKey:getClientKey(),knownCount:before})});
      var data=await r.json().catch(function(){return {}});if(!r.ok)throw new Error(data&&data.error||'like_failed');
      updateAll(id,data.likeCount!=null?data.likeCount:data.ratingCount,Boolean(data.myLiked));if(sortMode==='popular')sortCards();
    }catch(e){updateAll(id,before,had);if(String(e&&e.message)!=='design_coming_soon')alert('ثبت لایک انجام نشد. دوباره تلاش کن.')}finally{delete busy[id];document.querySelectorAll('.albumDesignModelCard[data-template-id]').forEach(function(c){if(templateId(c)===id)renderLike(c)})}
  }
  function ensureSort(){
    var root=document.querySelector('.photographerAlbumDesignCatalog');if(!root)return;var filters=root.querySelector('.albumDesignCatalogFilters');if(!filters)return;
    var old=filters.querySelector('.pb657PopularitySort');if(old)old.remove();var label=filters.querySelector('.pb659PopularitySort');if(label)return;
    label=document.createElement('label');label.className='pb659PopularitySort';var span=document.createElement('span');span.textContent='مرتب‌سازی';var select=document.createElement('select');[['default','پیش‌فرض'],['popular','محبوب‌ترین']].forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];select.appendChild(o)});select.value=sortMode;select.onchange=function(){sortMode=select.value==='popular'?'popular':'default';sortCards()};label.appendChild(span);label.appendChild(select);filters.appendChild(label);
  }
  function sortCards(){if(sorting||sortMode!=='popular')return;var grid=document.querySelector('.albumDesignModelGrid');if(!grid)return;var cards=Array.prototype.slice.call(grid.querySelectorAll(':scope > .albumDesignModelCard'));if(cards.length<2)return;var desired=cards.slice().sort(function(a,b){return likeCount(b)-likeCount(a)}),changed=desired.some(function(c,i){return cards[i]!==c});if(!changed)return;sorting=true;try{var frag=document.createDocumentFragment();desired.forEach(function(c){frag.appendChild(c)});grid.appendChild(frag)}finally{sorting=false}}
  function enhance(){scheduled=false;document.querySelectorAll('.albumDesignModelGrid .albumDesignModelCard').forEach(renderLike);ensureSort();if(sortMode==='popular')sortCards()}
  function schedule(){if(scheduled)return;scheduled=true;(window.requestAnimationFrame||setTimeout)(enhance,30)}
  async function syncFromServer(force){
    if(syncBusy)return;if(!force&&Date.now()-lastSync<5000)return;var cards=[].slice.call(document.querySelectorAll('.albumDesignModelCard[data-template-id]'));if(!cards.length)return;
    syncBusy=true;try{var r=await fetch('/api/public/album-design/templates?ratingClientKey='+encodeURIComponent(getClientKey())+'&_='+Date.now(),{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(!r.ok)return;var d=await r.json().catch(function(){return {}}),rows=Array.isArray(d&&d.templates)?d.templates:[],localMine=readMine(),promote=[];rows.forEach(function(x){var id=canonicalId(x&&x._pbSourceSlideshowId||x&&x.id);if(!id)return;var mine=Boolean(x.myLiked!=null?x.myLiked:Number(x.myRating||0)>0);if(!mine&&localMine[id]){promote.push(id);return}updateAll(id,x.likeCount!=null?x.likeCount:x.ratingCount,mine)});for(var i=0;i<promote.length;i++){var id=promote[i],known=0;document.querySelectorAll('.albumDesignModelCard[data-template-id]').forEach(function(c){if(templateId(c)===id)known=Math.max(known,likeCount(c))});try{var pr=await fetch('/api/public/album-design/templates/'+encodeURIComponent(id)+'/rating',{method:'POST',credentials:'include',cache:'no-store',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify({liked:true,clientKey:getClientKey(),knownCount:known})}),pd=await pr.json().catch(function(){return {}});if(pr.ok)updateAll(id,pd.likeCount!=null?pd.likeCount:pd.ratingCount,Boolean(pd.myLiked))}catch(e){}}lastSync=Date.now();if(sortMode==='popular')sortCards()}catch(e){}finally{syncBusy=false}
  }
  document.addEventListener('click',function(ev){var b=ev.target&&ev.target.closest&&ev.target.closest('.pb659LikeHeart');if(!b)return;var card=b.closest('.albumDesignModelCard');if(!card)return;ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();toggleLike(card)},true);
  document.addEventListener('pointerdown',function(ev){var b=ev.target&&ev.target.closest&&ev.target.closest('.pb659LikeHeart');if(!b)return;ev.stopPropagation()},true);
  var obs=new MutationObserver(function(){if(!sorting)schedule()});obs.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',function(){schedule();setTimeout(function(){syncFromServer(true)},350)});if(document.readyState!=='loading'){schedule();setTimeout(function(){syncFromServer(true)},350)}
  window.addEventListener('focus',function(){syncFromServer(true)},{passive:true});document.addEventListener('visibilitychange',function(){if(!document.hidden)syncFromServer(true)});setInterval(function(){if(!document.hidden)syncFromServer(false)},6500);
})();
