// Bounded visual adjustments stored with the existing tenant site configuration.
export function normalizeSiteLayout(input,strict=true){
 const fail=()=>{if(strict)throw Object.assign(new Error('invalid_site_layout'),{status:400});};
 if(input===undefined)return {};
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length>40){fail();return {};}
 const out={};for(const [page,entries]of Object.entries(input)){
  if(!/^\/[a-zA-Z0-9/_-]*$/.test(page)||page.length>160||!entries||typeof entries!=='object'||Array.isArray(entries)||Object.keys(entries).length>300){fail();continue;}
  const clean={};for(const [key,value]of Object.entries(entries)){
   if(!/^[A-Za-z0-9_:/.-]{1,200}$/.test(key)||!value||typeof value!=='object'||Array.isArray(value)){fail();continue;}
   const item={};for(const [prop,v]of Object.entries(value)){
    if((prop==='x'||prop==='y')&&Number.isInteger(v)&&Math.abs(v)<=48)item[prop]=v;
    else if(prop==='rank'&&Number.isInteger(v)&&v>=0&&v<=300)item.rank=v;else fail();
   }clean[key]=item;
  }out[page]=clean;
 }return out;
}
export function withSiteLayout(html,layout,pathname,nonce){
 const json=JSON.stringify({layout:normalizeSiteLayout(layout,false),pathname}).replace(/</g,'\\u003c');
 const safeNonce=String(nonce||'').replace(/[&<>"']/g,'');
 return html.replace('</body>',`<script id="site-layout-data" type="application/json" nonce="${safeNonce}">${json}</script><script src="/site-layout.js?v=r1275"></script></body>`);
}
