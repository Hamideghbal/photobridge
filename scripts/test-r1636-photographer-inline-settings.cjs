'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const source=fs.readFileSync('scripts/r1635-photographer-inline-settings.js','utf8');
const css=fs.readFileSync('scripts/r1635-photographer-inline-settings.css','utf8');

test('R1636 mounts real lab, location and invite pages in the main window',()=>{
 for(const [key,route] of [
  ['labs','/photographer/labs'],
  ['location','/photographer/settings/location'],
  ['invites','/photographer/invites']
 ]){
  assert.ok(source.includes("key:'"+key+"'"),key+' missing key');
  assert.ok(source.includes("path:'"+route+"'"),key+' must load existing React page');
 }
 assert.match(source,/label:'تعریف لابراتوار'/);
 assert.match(source,/panel\.id='pb1635SettingsPanel'/);
 assert.match(source,/document\.body\.append\(panel\)/);
 assert.match(source,/frame\.src=item\.path\+'\?pbDesktopContent=1'/);
 assert.match(source,/frame\.addEventListener\('load'/);
 assert.match(source,/status\.hidden=true/);
 assert.match(source,/window\.location\.assign\(url\.pathname\+url\.search\+url\.hash\)/);
 assert.doesNotMatch(source,/openUtilityWindow|aria-modal|role.*dialog/);
 assert.doesNotThrow(()=>new Function(source));
});

test('settings render above native print panel but below header; left and right tab metrics match',()=>{
 const printZ=2147483400,headerZ=2147483550;
 const match=css.match(/#pb1635SettingsPanel\{[^}]*z-index:(\d+)!important/s);
 assert.ok(match,'explicit inline panel stacking expected');
 const z=Number(match[1]);assert.ok(z>printZ&&z<headerZ);
 assert.match(css,/\.pb1635SettingsLoading\[hidden\]\{display:none!important\}/);
 assert.match(css,/\.pb1127PrintModes>button,\s*html\.pb1126Desktop[^\n]*\.pb1635SettingsNav>button\{/);
 assert.match(css,/font:800 11px\/1\.4 Vazirmatn,Tahoma,sans-serif!important/);
 assert.match(css,/font:700 10\.5px\/1\.35 Vazirmatn,Tahoma,sans-serif!important/);
});

test('the hosted site and native Windows bundle include versioned R1636 assets',()=>{
 const cssName='photobridge-r1635-photographer-inline-settings.css';
 const jsName='photobridge-r1635-photographer-inline-settings.js';
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(html.includes('/'+cssName+'?v=r1636'),'missing CSS cache bust: '+root);
  assert.ok(html.includes('/'+jsName+'?v=r1636'),'missing JS cache bust: '+root);
  assert.equal(fs.readFileSync(path.join(root,cssName),'utf8'),css);
  assert.equal(fs.readFileSync(path.join(root,jsName),'utf8'),source);
 }
 const root='dist/web/lab-desktop-ui';
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 for(const name of ['index.html',cssName,jsName]){
  const entry=manifest.files.find(x=>x.name===name);
  assert.ok(entry,'missing Windows asset '+name);
  assert.equal(entry.sha256,hash(fs.readFileSync(path.join(root,name))),name+' hash mismatch');
 }
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
});
