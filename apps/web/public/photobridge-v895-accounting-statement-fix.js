// PhotoBridge v895 — reliable external-accounting tracking + stray text cleanup.
(()=>{
  if(document.documentElement.dataset.pb895AccountingRuntime)return;
  document.documentElement.dataset.pb895AccountingRuntime='1';
  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:String(input?.url||'');
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    const isAccounting=/\/api\/(?:lab|rental)\/invoices\/[0-9a-f-]{36}\/accounting-recorded(?:\?|$)/i.test(url);
    const first=await originalFetch(input,init);
    if(!isAccounting||method!=='PATCH'||first.ok||first.status===401||first.status===403)return first;
    try{
      const retryInit={...init,method:'POST',headers:{...(init?.headers||{})}};
      return await originalFetch(url,retryInit);
    }catch{return first}
  };
  const bad=new Set(['\\n','/n','\\N','/N']);
  const clean=root=>{if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const drop=[];while(w.nextNode()){const n=w.currentNode,v=String(n.nodeValue||'').trim();if(bad.has(v))drop.push(n)}drop.forEach(n=>n.remove())};
  const ready=()=>{clean(document.body);if(!document.body)return;new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData'){const v=String(m.target?.nodeValue||'').trim();if(bad.has(v))m.target.remove()}for(const n of m.addedNodes||[])clean(n)}}).observe(document.body,{subtree:true,childList:true,characterData:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
