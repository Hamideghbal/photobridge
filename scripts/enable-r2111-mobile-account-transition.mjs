import fs from 'node:fs';
import zlib from 'node:zlib';

function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw Error('R2111 missing or duplicate anchor: ' + before);
  return source.replace(before, () => after);
}

export function patchPicker(source) {
  if (source.includes('/* PB2111 selected account probe */')) return source;
  source = replaceOnce(source, 'const validSession=async portal=>{', 'const validSession=async (portal, deadline=4500)=>{');
  source = replaceOnce(source, 'timer=setTimeout(()=>abort.abort(),4500);', 'timer=setTimeout(()=>abort.abort(),deadline);');
  const selection = source.includes('let valid=await validSession(selected);')
    ? "let valid=await validSession(selected);if(selected==='photographer'&&valid?.uncertain)valid=await validSession(selected);"
    : "const valid=await validSession(selected);";
  return replaceOnce(source, selection, `let valid=await validSession(selected);/* PB2111 selected account probe */
       if(selected==='photographer'&&valid?.uncertain)valid=await validSession(selected,8000);`);
}

export function patchRental(source) {
  if (source.includes('/* PB2111 confirmed logout landing */')) return source;
  source = replaceOnce(source, "setBookingPhotographerMode('existing');let me=null;", `setBookingPhotographerMode('existing');
  /* PB2111 confirmed logout landing */
  if(location.pathname==='/rental'&&new URLSearchParams(location.search).get('logged_out')==='1'&&matchMedia('(max-width:850px)').matches&&!window.pbNativeStorage&&!window.pb2079StorePreview){
    showLogin();
    return;
  }
  let me=null;`);
  source = replaceOnce(source, "window.__pbRentalAccount=await api('/api/auth/me');", `const rentalIdentity=await api('/api/auth/me',{headers:{'x-photobridge-portal':'rental'}});
  window.__pbRentalAccount=rentalIdentity;
  const loginUrl=new URL(location.href);
  if(loginUrl.searchParams.has('logged_out')&&rentalIdentity?.rentalShop){
    loginUrl.searchParams.delete('logged_out');
    try{history.replaceState(history.state,'',loginUrl.pathname+loginUrl.search+loginUrl.hash)}catch{}
  }`);
  return replaceOnce(source, "try{data=await api('/api/rental/overview')}catch(e){", `try{
    const overview=await api('/api/rental/overview');
    if(window.pb2107RentalLogoutPending)return false;
    data=overview;
  }catch(e){
    if(window.pb2107RentalLogoutPending)return false;`);
}

export function patchEntry(source) {
  if (source.includes('/* PB2111 gated landing */')) return source;
  source = replaceOnce(source, "else if(context?.destination==='rental')destination='/equipment-rental/book?pbStoreChooser=1';", `else if(context?.destination==='rental'){
          const storeQuery=new URLSearchParams({pbStoreChooser:'1'});
          destination=window===window.top
            ? '/photographer/gallery?'+new URLSearchParams({pbStorePanel:'store',pbStoreQuery:storeQuery.toString()})
            : '/equipment-rental/book?'+storeQuery;
        }`);
  return replaceOnce(source, 'if(!window.pb2092AccountNavigate?.(destination))location.replace(destination);', `/* PB2111 gated landing */
      if(window.pb2092AccountNavigate){
        if(!window.pb2092AccountNavigate(destination)){done=false;moving=false;}
      }else location.replace(destination);`);
}

function writeAsset(path, content) {
  const bytes = Buffer.from(content);
  fs.writeFileSync(path, bytes);
  if (fs.existsSync(path + '.br')) fs.writeFileSync(path + '.br', zlib.brotliCompressSync(bytes, {params:{[zlib.constants.BROTLI_PARAM_QUALITY]:5}}));
  if (fs.existsSync(path + '.gz')) fs.writeFileSync(path + '.gz', zlib.gzipSync(bytes));
}

export function run() {
  for (const path of ['dist/web/index.html', 'dist/api/equipment-rental-book.html', 'dist/api/equipment-rental-portal.html']) {
    let html = fs.readFileSync(path, 'utf8');
    const picker = /(<script id="pb1493MobileSessionResume">)([\s\S]*?)(<\/script>)/g;
    if ([...html.matchAll(picker)].length !== 1) throw Error('R2111 account picker count: ' + path);
    html = html.replace(picker, (_, open, script, close) => {
      const patched = patchPicker(script);
      new Function(patched);
      return open + patched + close;
    });
    if (path.endsWith('portal.html')) html = patchRental(html);
    if (path.endsWith('index.html')) {
      html = html.replace(/(?:photobridge-r100f5-entry-routing|photobridge-r1106-mobile-store-panel)\.js\?[^"'<>\s]+/g, url => url.includes('mobileTransition=r2111') ? url : url + '&mobileTransition=r2111');
    }
    writeAsset(path, html);
  }
  const panel = 'dist/web/photobridge-r1106-mobile-store-panel.js';
  const oldStoreQuery = "initialQuery.get('pbStoreQuery')||''";
  let panelScript = fs.readFileSync(panel, 'utf8');
  if (!panelScript.includes('/* PB2111 live Store query */')) {
    panelScript = replaceOnce(panelScript, oldStoreQuery,
      "/* PB2111 live Store query */new URLSearchParams(location.search).get('pbStoreQuery')||''");
  }
  new Function(panelScript);
  writeAsset(panel, panelScript);

  const entry = 'dist/web/photobridge-r100f5-entry-routing.js';
  const script = patchEntry(fs.readFileSync(entry, 'utf8'));
  new Function(script);
  writeAsset(entry, script);
}

if (process.argv[1]?.endsWith('enable-r2111-mobile-account-transition.mjs')) run();
