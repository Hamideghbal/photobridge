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
  ['prices','/photographer/settings/prices'],
  ['location','/photographer/settings/location'],
  ['invites','/photographer/invites']
 ]){
  assert.ok(source.includes("key:'"+key+"'"),key+' missing key');
  assert.ok(source.includes("path:'"+route+"'"),key+' must load existing React page');
 }
 assert.match(source,/label:'تعرفه‌های لابراتوار'/);
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

test('the hosted site and native Windows bundle include versioned R1637 assets',()=>{
 const cssName='photobridge-r1635-photographer-inline-settings.css';
 const jsName='photobridge-r1635-photographer-inline-settings.js';
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(html.includes('/'+cssName+'?v=r1637'),'missing CSS cache bust: '+root);
  assert.ok(html.includes('/'+jsName+'?v=r1637'),'missing JS cache bust: '+root);
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

test('R1637 replaces lab management with tariff settings and removes redundant inner navigation',()=>{
 assert.match(source,/key:'prices',label:'تعرفه‌های لابراتوار',path:'\/photographer\/settings\/prices'/);
 assert.match(source,/key:'location',label:'موقعیت عکاسی',path:'\/photographer\/settings\/location'/);
 assert.match(source,/key:'invites',label:'دعوت همکار',path:'\/photographer\/invites'/);
 assert.doesNotMatch(source,/key:'labs',label:'تعریف لابراتوار'/);
 assert.match(source,/\.photographerSettingsTabs,.settingsNav\.photographerSettingsTabs\{display:none!important\}/);
 assert.match(source,/key==='prices'\?doc\.querySelector\('\.photographerPricingSettings'\)/);
 assert.match(css,/pb1635SettingsOpen body #pb1126ChromeHost #pb1126DesktopHeader \.pb1126MainNav>button\.active/);
 assert.match(css,/\.pb1126MainNav>\.pb1131MovingIndicator\{\s*opacity:0!important;visibility:hidden!important;/);
 assert.match(css,/font:800 12px\/1\.4 Vazirmatn,Tahoma,sans-serif!important/);
 const deploy=fs.readFileSync('scripts/enable-r1635-photographer-inline-settings.mjs','utf8');
 assert.match(deploy,/labelRange\.getBoundingClientRect\(\)\.width/);
 assert.match(deploy,/rect\.width-parseFloat\(width\)/);
 assert.match(deploy,/\?v=r1637/);
});
