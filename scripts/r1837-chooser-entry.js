/* R1837: a selection stays observable and survives a list refresh during a tap. */
let storeSelectionPendingR1837=false;
function storeChooserMessageR1837(text,kind='error'){
 let status=document.getElementById('storeChooserStatusR1837');
 if(!status){const list=document.getElementById('storeChooserListR96');if(!list)return;status=document.createElement('div');status.id='storeChooserStatusR1837';status.className='msg';status.setAttribute('aria-live','polite');list.before(status)}
 status.hidden=!text;status.textContent=text||'';status.dataset.kind=text?kind:'';
 status.setAttribute('role',kind==='error'?'alert':'status');
}
function syncStoreChooserBusyR1837(){
 const root=document.getElementById('storeChooserListR96');if(!root)return;
 root.setAttribute('aria-busy',String(storeSelectionPendingR1837));
 root.querySelectorAll('[data-enter-store-r96]').forEach(button=>{button.disabled=storeSelectionPendingR1837});
}
const originalStoreSelectionR1837=selectShop;
selectShop=async function(...args){
 if(storeSelectionPendingR1837)return;
 storeSelectionPendingR1837=true;syncStoreChooserBusyR1837();
 if(document.body.classList.contains('pbR96ChoosingStore'))storeChooserMessageR1837('در حال ورود به فروشگاه…','pending');
 try{
  const result=await originalStoreSelectionR1837.apply(this,args);
  const status=document.getElementById('storeChooserStatusR1837');
  if(document.body.classList.contains('pbR96ChoosingStore')&&status?.dataset.kind==='pending')storeChooserMessageR1837('ورود انجام نشد؛ فروشگاه را از فهرست به‌روز دوباره انتخاب کنید.');
  return result;
 }catch{
  storeChooserMessageR1837('ورود به فروشگاه انجام نشد؛ دوباره تلاش کنید.');
 }finally{storeSelectionPendingR1837=false;syncStoreChooserBusyR1837()}
};
function renderStoreChooserMarkupR1837(root,markup){
 const template=document.createElement('template');template.innerHTML=markup;
 const existing=new Map([...root.children].map(card=>[card.dataset.pb1837Shop,card]));
 const wanted=[];
 for(const fresh of [...template.content.children]){
  const key=fresh.dataset.pb1837Shop;let card=key&&existing.get(key);
  if(!card)card=fresh;
  else {
   card.className=fresh.className;card.dataset.storeKind=fresh.dataset.storeKind;
   const info=card.querySelector('.pbR96StoreInfo'),nextInfo=fresh.querySelector('.pbR96StoreInfo');
   if(info&&nextInfo&&info.innerHTML!==nextInfo.innerHTML)info.innerHTML=nextInfo.innerHTML;
   const actions=card.querySelector('.pbR96StoreCardActions'),nextActions=fresh.querySelector('.pbR96StoreCardActions');
   if(actions&&nextActions&&card.__pb1837Actions!==nextActions.innerHTML)actions.innerHTML=nextActions.innerHTML;
  }
  card.__pb1837Actions=fresh.querySelector('.pbR96StoreCardActions')?.innerHTML||'';
  wanted.push(card);
 }
 wanted.forEach((card,index)=>{if(root.children[index]!==card)root.insertBefore(card,root.children[index]||null)});
 for(const card of [...root.children])if(!wanted.includes(card))card.remove();
}
