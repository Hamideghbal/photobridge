/* R1845: overlap labs discovery with application boot. */
(()=>{
 const q=new URLSearchParams(location.search);
 if(!location.pathname.startsWith('/photographer')||(q.get('pbLabChooser')!=='1'&&q.get('workspace')!=='print'))return;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 window.__PBLabsEarly=fetch('/api/customer/labs',{credentials:'include',signal:controller.signal})
  .then(response=>response.ok?response.json():null).catch(()=>null).finally(()=>clearTimeout(timer));
})();
