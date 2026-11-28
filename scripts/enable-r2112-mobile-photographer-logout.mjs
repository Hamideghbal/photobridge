import fs from 'node:fs';
import zlib from 'node:zlib';

export function installPhotographerLogout(w){
  if(w.pb2112LogoutInstalled)return;
  if(!w.matchMedia('(max-width:820px)').matches||w.pbNativeStorage||/Electron/i.test(w.navigator?.userAgent||''))return;
  const portalPath=p=>/^\/photographer(?:\/|$)/.test(p)||p==='/equipment-rental/book';
  const ordinary=()=>{
    if(!portalPath(w.location.pathname))return false;
    const q=new w.URLSearchParams(w.location.search);
    if(['pbAdminShop','pbStorePreview','pbDesktopContent','pbDesktopPanel','impersonation','maintenance_preview','token','invite','reset','code'].some(k=>q.has(k))||/(?:impersonation|token|reset)=/i.test(w.location.hash||''))return false;
    try{
      if(w.sessionStorage.getItem('lablink_test_session')||w.sessionStorage.getItem('photobridge_admin_impersonation'))return false;
      if(w!==w.top&&(q.get('pbEmbeddedStore')!=='1'||w.top.location.origin!==w.location.origin||!portalPath(w.top.location.pathname)))return false;
    }catch{return false}
    return true;
  };
  if(!ordinary())return;
  w.pb2112LogoutInstalled=true;
  const destination='/photographer/login?logged_out=1';
  function finish(){
    if(w!==w.top||!ordinary()||w.pb2112LogoutNavigating)return;
    w.pb2112LogoutNavigating=true;
    // Never reload the current print/store route or restore its iframe.
    try{w.sessionStorage.removeItem('pb2092-account-handoff');if(w.localStorage.getItem('photobridge:pwa:last-portal')==='photographer')w.localStorage.removeItem('photobridge:pwa:last-portal')}catch{}
    const doc=w.document;
    doc.documentElement.classList.add('pb2112LogoutNavigating');
    delete doc.documentElement.dataset.pb2099Panel;
    doc.body?.classList.remove('pb1106PanelOpen');
    doc.querySelectorAll('.pb1106ContentPanel,#pbR99LabChooser,#pbR100F18RouteCover').forEach(x=>x.remove());
    w.location.replace(destination);
  }
  if(w===w.top)w.pb2112FinishPhotographerLogout=finish;
  const original=w.fetch.bind(w);
  let pending=null;
  w.fetch=(input,init)=>{
    let url;try{url=new w.URL(typeof input==='string'?input:input.url||input.href,w.location.href)}catch{}
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    if(!url||url.origin!==w.location.origin||url.pathname!=='/api/auth/logout'||method!=='POST'||!ordinary())return original(input,init);
    const headers=new w.Headers(init?.headers??input?.headers);
    if(headers.has('authorization')||headers.has('x-photobridge-impersonation')||(headers.has('x-photobridge-portal')&&headers.get('x-photobridge-portal')!=='photographer'))return original(input,init);
    if(!pending){
      headers.set('x-photobridge-portal','photographer');
      pending=Promise.resolve().then(()=>original(input,{...init,headers,credentials:'include',cache:'no-store'})).then(async response=>{
        if(!response.ok)return response;
        const data=await response.clone().json().catch(()=>null);
        if(data?.ok!==true)throw Error('photographer_logout_not_confirmed');
        // The top-level document owns the login, even when the click was inside Print.
        if(w===w.top)finish();
        else if(typeof w.top.pb2112FinishPhotographerLogout==='function')w.top.pb2112FinishPhotographerLogout();
        else w.top.location.replace(destination);
        return response;
      }).finally(()=>{pending=null});
    }
    return pending.then(response=>response.clone());
  };
}

export function patchHtml(html){
 if(html.includes('id="pb2112PhotographerLogout"'))return html;
 const anchor=/(<script id="pb1493MobileSessionResume">[\s\S]*?<\/script>)/g;
 if([...html.matchAll(anchor)].length!==1)throw Error('R2112 picker anchor');
 const source='('+installPhotographerLogout.toString()+')(window);';
 new Function(source);
 const style='<style id="pb2112LogoutStyle">html.pb2112LogoutNavigating body>*{visibility:hidden!important;pointer-events:none!important}html.pb2112LogoutNavigating body::after{content:"در حال خروج…";position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#f5f8ff;color:#315efb;font:700 15px Vazirmatn,Tahoma,sans-serif}</style>';
 return html.replace(anchor,(_,tag)=>tag+style+'<script id="pb2112PhotographerLogout">'+source+'</script>');
}
function write(p,s){const b=Buffer.from(s);fs.writeFileSync(p,b);for(const [ext,encode,decode] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]])if(fs.existsSync(p+ext)){fs.writeFileSync(p+ext,encode(b));if(!decode(fs.readFileSync(p+ext)).equals(b))throw Error('R2112 stale '+p+ext)}}
export function run(){for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html'])write(p,patchHtml(fs.readFileSync(p,'utf8')));console.log('[R2112] confirmed mobile Photographer logout replaces the entire document, including embedded Print and Store');}
if(process.argv[1]?.endsWith('enable-r2112-mobile-photographer-logout.mjs'))run();
