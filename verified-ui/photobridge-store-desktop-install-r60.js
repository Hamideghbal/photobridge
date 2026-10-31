(()=>{
  // One installer entry in Store Settings. The previous alert-agent pairing app
  // is independent and no longer shown; this download is the full Store app.
  if(location.hostname==='127.0.0.1')return;
  const archive='/downloads/store-desktop/PhotoBridge-Store-R1089-Setup-1.0.3-x64.zip';
  function mount(){
    const settings=document.getElementById('settings');
    if(!settings||settings.classList.contains('hidden')||document.getElementById('pbStoreDesktopCandidate'))return;
    const box=document.createElement('section');
    box.id='pbStoreDesktopCandidate';
    box.className='panel';
    box.style.cssText='display:block;box-sizing:border-box;max-width:100%;margin:14px 0;padding:16px;border:1px solid #d0d5dd;border-radius:12px;direction:rtl';
    const heading=document.createElement('h3');
    heading.textContent='برنامه ویندوز فروشگاه — نسخه ۱.۰.۳';
    heading.style.cssText='margin:0 0 12px;font-size:15px';
    const link=document.createElement('a');
    link.className='btn';
    link.href=archive;
    link.setAttribute('download','PhotoBridge-Store-R1089-Setup-1.0.3-x64.zip');
    link.textContent='دانلود برنامه ویندوز (ZIP)';
    box.append(heading,link);
    settings.appendChild(box);
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-rental-desktop-tab="settings"],[data-rental-tab="settings"],[data-rental-bottom-tab="settings"]'))
      setTimeout(mount,150);
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,150),{once:true});
  else setTimeout(mount,150);
  setTimeout(mount,2000);
})();
