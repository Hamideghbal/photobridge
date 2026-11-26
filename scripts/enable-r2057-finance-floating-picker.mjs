// R2057: final Lab-only presentation fix, after R2047/R2056 and before final manifest/HTML encoding.
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
const style="\n/* PB2057: one neutral control, not two independently sized input/button boxes. */\nhtml body .globalModalLayer .modalContent .pb2056PromptPicker.pb2051PickerFrame{display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:36px!important;min-height:36px!important;max-height:36px!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;flex:none!important}\nhtml body .globalModalLayer .modalContent .pb2056PromptPicker>.pb2050CustomerPicker{position:relative!important;display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;height:100%!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important}\nhtml body .globalModalLayer .modalContent .pb2056PromptPicker .pbSelect.pbSelectSearchable,html body .globalModalLayer .modalContent .pb2056PromptPicker .pbSelectSearchShell{box-sizing:border-box!important;width:100%!important;min-width:0!important}\nhtml body .globalModalLayer .modalContent .pb2056PromptPicker .pbSelectSearchShell{display:flex!important;align-items:center!important;gap:0!important;direction:rtl!important;height:36px!important;min-height:36px!important;max-height:36px!important;padding:0 8px!important;margin:0!important;border:1px solid #d3def2!important;border-radius:8px!important;background:#fff!important;box-shadow:none!important;overflow:hidden!important}\nhtml body .globalModalLayer .modalContent .pb2056PromptPicker .pbSelectSearchInput{display:block!important;box-sizing:border-box!important;flex:1 1 0!important;width:0!important;min-width:0!important;height:32px!important;min-height:0!important;max-height:32px!important;margin:0!important;padding:0 2px!important;border:0!important;border-radius:0!important;background:transparent!important;outline:0!important;box-shadow:none!important;font:500 11px/1.4 Vazirmatn,Tahoma,sans-serif!important;text-overflow:ellipsis!important}\nhtml body .globalModalLayer .modalContent .pb2056PromptPicker .pbSelectSearchArrow{display:grid!important;place-items:center!important;box-sizing:border-box!important;flex:0 0 24px!important;width:24px!important;min-width:24px!important;max-width:24px!important;height:32px!important;min-height:0!important;max-height:32px!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#344054!important;box-shadow:none!important}\nhtml body .globalModalLayer .modalContent .pb2056PromptPicker .pbSelectSearchArrow i{font-size:0!important;line-height:1!important;width:7px!important;height:7px!important;border:solid currentColor!important;border-width:0 1.5px 1.5px 0!important;transform:rotate(45deg) translate(-1px,-1px)!important}\nhtml body .globalModalLayer .modalContent .pb2056PromptPicker .pbSelect.open .pbSelectSearchArrow i{transform:rotate(225deg)!important}\n";
// R2058: PB_PERF_FIX_V1 merges all web styles into a content-addressed boot CSS.
function pb2058AssetHtml(html,readCss,manualCss){
 const js='photobridge-r1176-lab-finance.js',css='photobridge-r1176-lab-finance.css';
 function updateTag(tag,name,attribute){
  const attr=new RegExp('\\b'+attribute+'\\s*=\\s*(["\\x27])([^"\\x27]+)\\1','i');
  return tag.replace(attr,(match,q,url)=>{
   if(url.split(/[?#]/)[0].split('/').pop()!==name)return match;
   return attribute+'='+q+url.split(/[?#]/)[0]+'?v=r2058'+q;
  });
 }
 let scripts=0,direct=0,bundled=false;
 html=html.replace(/<script\b[^>]*>/gi,tag=>{
  if(!/\bsrc\s*=\s*["'][^"']*photobridge-r1176-lab-finance\.js(?:[?#][^"']*)?["']/i.test(tag))return tag;
  scripts++;return updateTag(tag,js,'src');
 });
 if(scripts!==1)throw Error('R2058 expected one finance script, found '+scripts);
 html=html.replace(/<link\b[^>]*>/gi,tag=>{
  if(!/\brel\s*=\s*["']stylesheet["']/i.test(tag))return tag;
  const url=tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]||'';
  if(url.split(/[?#]/)[0].split('/').pop()===css){direct++;return updateTag(tag,css,'href')}
  if(/(?:^|\/)photobridge-boot-[a-f0-9]{16}\.css(?:[?#]|$)/i.test(url)){
   const content=readCss(url.split(/[?#]/)[0].replace(/^\/+/,''));
   if(content&&content.includes('PB2057: the native dialog is a top-layer element'))bundled=true;
  }
  return tag;
 });
 // An older bundle without the latest rules still gets an explicit final
 // stylesheet inside the page; keep the one-link boot optimization intact.
 if(!direct&&!bundled&&!html.includes('id="pb2058FinanceCssFallback"')){
  if(!/<\/head>/i.test(html))throw Error('R2058 missing HTML head');
  html=html.replace(/<\/head>/i,'<style id="pb2058FinanceCssFallback">'+manualCss+'</style></head>');
 }
 return {html,direct,bundled};
}

const files=['photobridge-r1176-lab-finance.js','photobridge-r1176-lab-finance.css'];
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const refresh=(file)=>{const bytes=fs.readFileSync(file);for(const [ext,encode] of [['.br',zlib.brotliCompressSync],['.gz',zlib.gzipSync]])if(fs.existsSync(file+ext))fs.writeFileSync(file+ext,encode(bytes));};
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const native=root.endsWith('/lab-desktop-ui');
 // The archived native snapshot needs the same two changed standalone assets.
 if(native)for(const name of files)fs.copyFileSync('dist/web/'+name,root+'/'+name);
 for(const name of files)refresh(root+'/'+name);
 const path=root+'/index.html';let html=fs.readFileSync(path,'utf8');
 const prepared=pb2058AssetHtml(html,name=>{const f=root+'/'+name;return fs.existsSync(f)?fs.readFileSync(f,'utf8'):''},fs.readFileSync(root+'/'+files[1],'utf8'));
 html=prepared.html;
 console.log('[R2058] '+root+' finance CSS: '+(prepared.direct?'standalone':prepared.bundled?'boot bundle':'inline fallback'));
 if(native&&!html.includes('id="pb2057FinancePickerStyle"'))html=html.replace('</head>','<style id="pb2057FinancePickerStyle">'+style+'</style></head>');
 fs.writeFileSync(path,html);
 if(native){const manifestPath=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));for(const name of files){const row=manifest.files.find(x=>x.name===name);if(!row)throw Error('R2057 native manifest missing '+name);row.sha256=sha(fs.readFileSync(root+'/'+name));for(const ext of ['.br','.gz']){const encoded=manifest.files.find(x=>x.name===name+ext);if(encoded)encoded.sha256=sha(fs.readFileSync(root+'/'+name+ext));}}manifest.build=sha(Buffer.from(JSON.stringify(manifest.files)));fs.writeFileSync(manifestPath,JSON.stringify(manifest));}
}
console.log('[R2057] floating manual invoice picker, matched payment/discount controls');
