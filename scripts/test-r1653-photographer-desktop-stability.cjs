'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const roots=['dist/web','dist/web/lab-desktop-ui'];
const source=fs.readFileSync('scripts/r1653-photographer-inline-settings.js','utf8');
const css=fs.readFileSync('scripts/r1653-photographer-desktop-stability.css','utf8');

test('R1653 cached settings reuse one iframe per tariff/location/invites option; no per-click full reload',()=>{
 for(const path of ['/photographer/settings/prices','/photographer/settings/location','/photographer/invites'])
  assert(source.includes(path),'missing real settings route '+path);
 assert.match(source,/const frameCache=new Map\(\),frameLoaded=new Set\(\)/);
 assert.match(source,/let frame=frameCache.get\(item.key\)/);
 assert.match(source,/if\(frame\)return frame/);
 assert.match(source,/frameCache.set\(item.key,frame\)/);
 assert.match(source,/frame.src=item.path\+'\?pbDesktopContent=1'/);
 assert.match(source,/cached\.hidden=!active/);
 assert.match(source,/frameLoaded\.has\(key\)/);
 assert.match(source,/button\.addEventListener\('pointerenter'/);
 assert.match(source,/panel\.hidden=true/);
 assert.doesNotMatch(source,/panel\?\.remove\(\)/);
 assert.doesNotThrow(()=>new Function(source));
});

test('R1653 ignores regular order-card mutations and temporary missing print-mode nav',()=>{
 for(const root of roots){
  const code=fs.readFileSync(root+'/photobridge-r1126-desktop-navigation.js','utf8');
  assert.match(code,/PB1653 stable desktop photographer/);
  assert.match(code,/pb1653RelevantHeader\(records\)/);
  assert.match(code,/if\(pb1653RelevantHeader\(records\)\)schedule\(\)/);
  assert.match(code,/const navHighlight=document\.documentElement\.classList\.contains\('pb1635SettingsOpen'\)\?null:active/);
  assert.doesNotMatch(code,/\|\|\(!doc\?\.querySelector\('\.photographerPrintModeNav'\)&&selected==='print'\)/);
  assert.match(code,/new MutationObserver\(records=>/);
  assert.match(code,/pb1653-settings-selection/);
  assert.match(code,/!settingsOpen&&original\.classList\.contains\('active'\)/);
  assert.match(code,/financeThird\.children\.length>0&&chrome\.classList\.contains\('pb1632FinanceThird'\)/);
  assert.doesNotThrow(()=>new Function(code));
  // Normalization must be in render(), not at the top level.
  const normal=code.indexOf("const copies=[...row.querySelectorAll('.pb1127PrintModes>button,.pb1127PrintUtilities>button')];");
  const render=code.indexOf('function render(){'),press=code.indexOf('const pressTimers=new WeakMap();');
  assert(render>=0&&normal>render&&press>normal);
  assert.match(code.slice(normal,press+34),/\n \}\n const pressTimers/);
 }
});

test('R1653 removes the duplicate customer finance heading, holds previous tab neutral and hides slow legacy header',()=>{
 assert.match(css,/\.financeWorkspace\.financeWorkspaceCompact > \.sectionTopline\.financeTopline/);
 assert.match(css,/display:none!important/);
 assert.match(css,/pb1635SettingsOpen/);
 assert.match(css,/pb1653DesktopBoot/);
 assert.match(css,/pb1653EmbeddedBoot/);
 assert.match(css,/#pb1635SettingsPanel\[hidden\]/);
 assert(!css.includes('labArchiveWorkspace'));
 const prev=fs.readFileSync('scripts/r1652-photographer-settings-archive.css','utf8');
 assert(prev.includes('photographerArchiveWorkspace'),'R1652 calendar kept intact');
});

test('R1653 is registered after R1652, both web and Windows payloads contain verified assets and early bootstrap',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const before=build.indexOf("await deployStep('./enable-r1652-photographer-settings-archive.mjs')");
 const current=build.indexOf("await deployStep('./enable-r1653-photographer-header-settings-speed.mjs')");
 const testAnchor=build.indexOf("'scripts/test-r1653-photographer-desktop-stability.cjs'");
 assert(before>=0&&current>before&&testAnchor>current);
 const name='photobridge-r1635-photographer-inline-settings.js';
 const newCss='photobridge-r1653-photographer-desktop-stability.css';
 for(const root of roots){
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert.equal(html.split('stable=r1653').length-1,1,root);
  assert.equal(html.split('speed=r1653').length-1,1,root);
  assert.equal(html.split(newCss+'?v=r1653').length-1,1,root);
  assert.equal(html.split('id="pb1653FirstPaintBoot"').length-1,1,root);
  assert(html.indexOf('id="pb1653FirstPaintBoot"')<html.indexOf('index-UIRefine-v655-r84.js'),root);
  const snippet=html.match(/<script id="pb1653FirstPaintBoot">([\s\S]*?)<\/script>/)?.[1];
  assert(snippet,'missing early bootstrap '+root);
  assert.doesNotThrow(()=>new Function(snippet));
  assert.equal(fs.readFileSync(root+'/'+name,'utf8'),source);
  assert.equal(fs.readFileSync(root+'/'+newCss,'utf8'),css);
 }
 const root='dist/web/lab-desktop-ui';
 const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 assert.equal(manifest.channel,'lab');
 assert.equal(manifest.protocol,1);
 for(const name of ['index.html','photobridge-r1126-desktop-navigation.js',
                       'photobridge-r1635-photographer-inline-settings.js',
                       'photobridge-r1653-photographer-desktop-stability.css']){
  const item=manifest.files.find(x=>x.name===name);
  assert(item,'native manifest missing '+name);
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'),name);
 }
});
