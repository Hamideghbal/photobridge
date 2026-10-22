'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');

function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1354-patch-on-import-'));
 const dir=path.join(root,'scripts'),dist=path.join(root,'dist/api');
 fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(dist,{recursive:true});
 fs.copyFileSync(path.join(__dirname,'enable-r1351-lab-ui-exact-byte-serving.mjs'),path.join(dir,'enable-r1351-lab-ui-exact-byte-serving.mjs'));
 // The five actual production route anchors, BEFORE the patch. Intentionally
 // do not include a pre-patched line; a missing import-time side effect fails.
 const input=[
  "    let full = path.resolve(WEB_DIR, rel);",
  "    if (!full.startsWith(WEB_DIR) || !fs.existsSync(full) || fs.statSync(full).isDirectory())",
  "cacheControl = (isIndex || isRetouchAccount || isBuildMarker) ?",
  "        const raw = fs.readFileSync(full, 'utf8');",
  "        const html = seoInjectHtml(raw, pathname);",
  "        res.writeHead(200, { ...common, 'content-length': Buffer.byteLength(html),",
  "    if (!String(req.headers.range || '').trim() && String(req.headers['if-none-match'] || '') === etag) {"
 ].join('\n');
 const serverFile=path.join(dist,'server.js');
 fs.writeFileSync(serverFile,input);
 return {root,serverFile,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
test('dynamic import used by Liara actually patches the runtime server, then stays idempotent',()=>{
 const f=fixture();
 try{
  const program=String.raw`
    import fs from 'node:fs';
    import path from 'node:path';
    import {pathToFileURL} from 'node:url';
    const url=pathToFileURL(path.resolve('scripts/enable-r1351-lab-ui-exact-byte-serving.mjs')).href;
    await import(url);
    const expected=[
      'const isLabDesktopUiAsset',
      'isLabDesktopUiAsset ? raw : seoInjectHtml(raw, pathname)',
      "cacheControl = isLabDesktopUiAsset ? 'no-store",
      "return sendText(res, 404, 'Desktop UI asset unavailable.')",
      'if (!isLabDesktopUiAsset && !String(req.headers.range'
    ];
    const file='dist/api/server.js';
    const patched=fs.readFileSync(file,'utf8');
    for(const marker of expected)if(!patched.includes(marker))throw Error('Import did not patch: '+marker);
    await import(url+'?import-second-time');
    if(fs.readFileSync(file,'utf8')!==patched)throw Error('Patch not idempotent');
  `;
  const run=spawnSync(process.execPath,['--input-type=module','-e',program],{cwd:f.root,encoding:'utf8',timeout:15000});
  assert.equal(run.status,0,run.stderr||run.stdout||'patch import failed');
 }finally{f.cleanup();}
});
test('unknown server code fails closed instead of silently passing on import',()=>{
 const f=fixture();
 try{
  fs.writeFileSync(f.serverFile,'// changed server without required anchors');
  const run=spawnSync(process.execPath,['--input-type=module','-e',"await import('./scripts/enable-r1351-lab-ui-exact-byte-serving.mjs')"],{cwd:f.root,encoding:'utf8',timeout:15000});
  assert.notEqual(run.status,0,'invalid server source must fail');
  assert.match(run.stderr,/R1351 expected server static route anchor/);
 }finally{f.cleanup();}
});
