#!/usr/bin/env node
// PhotoBridge first-load performance patch. Executed after all build stages.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {spawnSync} from 'node:child_process';
const web=path.resolve('dist/web');
const index=path.join(web,'index.html'),server=path.resolve('dist/api/server.js'),assets=path.join(web,'assets');
const marker='/* PB_PERF_FIX_V1 */';
const snapshot=path.resolve('.photobridge-perf-backup',new Date().toISOString().replace(/[:.]/g,'-'));
let oldHtml,oldServer;
function ok(v,m){if(!v)throw new Error('PB_PERF_FIX_V1 '+m)}
function asset(u){const relative=decodeURIComponent(u.split(/[?#]/)[0]).replace(/^\/+/,'');const p=path.resolve(web,relative);ok(p.startsWith(web+path.sep),'unsafe asset '+u);return p}
function adjusted(u,from){if(/^(\/|#|data:|https?:|\/\/)/i.test(u))return u;const m=u.match(/^([^?#]*)(.*)$/);return path.posix.normalize(path.posix.join(path.posix.dirname('/'+path.relative(web,from).split(path.sep).join('/')),m[1]))+m[2]}
function zipped(p){if(!fs.existsSync(p)||!/\.(js|css|html)$/i.test(p))return;const bytes=fs.readFileSync(p);if(bytes.length<256||bytes.length>16000000)return;fs.writeFileSync(p+'.gz',zlib.gzipSync(bytes,{level:bytes.length>256*1024?9:4}));fs.writeFileSync(p+'.br',zlib.brotliCompressSync(bytes,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:bytes.length>256*1024?11:4}}))}
function zipAssetTree(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())zipAssetTree(file);
  else if(entry.isFile()&&/\.(?:js|css)$/i.test(entry.name))zipped(file);
 }
}
function zipRentalHtml(){
 for(const f of fs.readdirSync(path.resolve('dist/api')))if(/^(?:equipment-rental-.*|admin-equipment-rental)\.html$/.test(f))zipped(path.resolve('dist/api',f));
}
try{
 ok(fs.existsSync(index)&&fs.existsSync(server),'missing dist outputs');
 oldHtml=fs.readFileSync(index,'utf8');oldServer=fs.readFileSync(server,'utf8');
 if(oldServer.includes(marker)){
  for(const f of fs.readdirSync(web))if(/\.(?:js|css)$/i.test(f))zipped(path.join(web,f));
  zipAssetTree(assets);zipRentalHtml();
  console.log('[PB_PERF_FIX_V1] refreshed compressed outputs');process.exit(0)
 }
 const sheets=[];
 let html=oldHtml.replace(/<link\b[^>]*>/gi,t=>{
   if(!/\brel\s*=\s*["']stylesheet["']/i.test(t))return t;
   const u=t.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
   if(!u||/^(?:https?:)?\/\//i.test(u))return t;
   sheets.push(u);return '';
 });
 ok(sheets.length>0,'no stylesheets');
 const imports=[],body=[];
 const font='/assets/photobridge-handover-vazirmatn.woff2',hasFont=fs.existsSync(asset(font));
 for(const url of sheets){
  const file=asset(url);ok(fs.existsSync(file),'missing stylesheet '+url);
  let css=fs.readFileSync(file,'utf8').replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi,(m,q,u)=>'url('+q+adjusted(u.trim(),file)+q+')');
  css=css.replace(/@import\s+[^;]+;/gi,imp=>{if(hasFont&&/fonts\.googleapis\.com/i.test(imp))return '';imports.push(imp);return ''});
  body.push('/* '+path.relative(web,file)+' */\n'+css);
 }
 const css=imports.join('\n')+'\n'+(hasFont?'@font-face{font-family:Vazirmatn;src:url("'+font+'") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}\n':'')+body.join('\n\n');
 const name='photobridge-boot-'+crypto.createHash('sha256').update(css).digest('hex').slice(0,16)+'.css';
 ok(/<\/head>/i.test(html),'missing head');
 html=html.replace(/<\/head>/i,(hasFont?'<link rel="preload" href="'+font+'" as="font" type="font/woff2" crossorigin>\n':'')+'<link rel="stylesheet" href="/assets/'+name+'">\n</head>');
 ok((html.match(/<link\b[^>]*rel\s*=\s*["']stylesheet["']/gi)||[]).length===1,'boot CSS link count not one');
 const hook='    const st = fs.statSync(full), contentType = mime(full)';
 ok(oldServer.includes(hook),'server static handler anchor missing');
 const injected=[
 '    '+marker,
 '    if (/\\.(?:css|js)$/i.test(full) && (req.method === "GET" || req.method === "HEAD")) {',
 '      const mimeType=mime(full),accept=String(req.headers["accept-encoding"]||"");',
 '      let selected=full,encoding="";',
 '      if (/\\bbr\\b/i.test(accept)&&fs.existsSync(full+".br")){selected=full+".br";encoding="br"}',
 '      else if (/\\bgzip\\b/i.test(accept)&&fs.existsSync(full+".gz")){selected=full+".gz";encoding="gzip"}',
 '      const st=fs.statSync(selected),originalStat=fs.statSync(full);',
 '      const etag="W/"+String.fromCharCode(34)+st.size+"-"+Math.trunc(st.mtimeMs)+"-"+(encoding||"plain")+String.fromCharCode(34);',
 '      const versioned=/[?&](?:v|ver|version|build|rev)=|photobridge-boot-[a-f0-9]{16}/i.test(req.url||"");',
 '      const headers={"content-type":mimeType,"content-length":st.size,"cache-control":versioned?"public, max-age=31536000, immutable":"public, max-age=3600, must-revalidate","vary":"Accept-Encoding","etag":etag,"last-modified":originalStat.mtime.toUTCString(),"x-content-type-options":"nosniff"};',
 '      if(encoding)headers["content-encoding"]=encoding;',
 '      if(!req.headers.range&&req.headers["if-none-match"]===etag){delete headers["content-length"];res.writeHead(304,headers);res.end();return}',
 '      res.writeHead(200,headers);if(req.method==="HEAD"){res.end();return}',
 '      fs.createReadStream(selected).pipe(res);return;',
 '    }',
 ''
 ].join('\n');
 const patched=oldServer.replace(hook,injected+hook);
 ok(patched.includes(marker),'server injection missing');
 fs.mkdirSync(snapshot,{recursive:true});
 fs.copyFileSync(index,path.join(snapshot,'index.html'));
 fs.copyFileSync(server,path.join(snapshot,'server.js'));
 fs.mkdirSync(assets,{recursive:true});
 fs.writeFileSync(path.join(assets,name),css);
 fs.writeFileSync(index,html);fs.writeFileSync(server,patched);
 const result=spawnSync(process.execPath,['--check',server],{encoding:'utf8'});
 ok(result.status===0,'server syntax '+result.stderr);
 zipped(path.join(assets,name));
 ok(fs.existsSync(path.join(assets,name+'.gz'))&&fs.existsSync(path.join(assets,name+'.br')),'boot compression failed');
 for(const m of oldHtml.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi))if(!/^(?:https?:)?\/\//i.test(m[1])){const f=asset(m[1]);if(fs.existsSync(f))zipped(f)}
 for(const f of fs.readdirSync(web))if(/\.(js|css)$/i.test(f))zipped(path.join(web,f));
 zipAssetTree(assets);
 zipRentalHtml();
 fs.writeFileSync(path.join(assets,'photobridge-boot-manifest.json'),JSON.stringify({boot:name,sources:sheets},null,2)+'\n');
 console.log('[PB_PERF_FIX_V1] PASS '+sheets.length+' stylesheets -> '+name+'; br/gzip generated; syntax OK');
}catch(error){
 if(oldHtml!==undefined&&oldServer!==undefined){fs.writeFileSync(index,oldHtml);fs.writeFileSync(server,oldServer)}
 console.error('[PB_PERF_FIX_V1] failed; original HTML and server restored: '+(error.stack||error));
 process.exitCode=1;
}
