'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {validateNavigation}=require('../navigation-contract.cjs');
const {validateNativeUi}=require('../verify-native-ui.cjs');
const {patchNavigationHeader}=require('../navigation-header-patch.cjs');
const ui=path.join(__dirname,'../verified-ui');
test('shipped UI includes six General sections, customer subnavigation, archive and native bridge',()=>{assert(validateNavigation(ui));validateNativeUi(ui);});
test('an otherwise intact UI with the reported three General tabs is refused before activation',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pb-nav-contract-'));
 try{for(const name of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1147-lab-admin-header.js','photobridge-r1372-third-header.js']){fs.mkdirSync(path.dirname(path.join(temp,name)),{recursive:true});fs.copyFileSync(path.join(ui,name),path.join(temp,name));}
 const file=path.join(temp,'assets/index-UIRefine-v655-r84.js'),source=fs.readFileSync(file,'utf8');
 fs.writeFileSync(file,source.replace('["sms","پیامک مشتریان"],','').replace('["snappbox","اسنپ و ارسال"],','').replace(',["desktop","برنامهٔ ویندوز"]',''));
 assert.throws(()=>validateNavigation(temp),/ui_navigation_incomplete:general/);
 fs.copyFileSync(path.join(ui,'assets/index-UIRefine-v655-r84.js'),file);
 fs.writeFileSync(path.join(temp,'photobridge-r1372-third-header.js'),'old customer navigation');
 assert.throws(()=>validateNavigation(temp),/ui_navigation_incomplete:customers/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('native header adapter preserves the shipped UI and is idempotent',()=>{const original=fs.readFileSync(path.join(ui,'photobridge-r1147-lab-admin-header.js'),'utf8'),patched=patchNavigationHeader(original);assert(patched.includes('PB1572 reconcile header actions'));assert.equal(patchNavigationHeader(patched),patched);assert(patched.includes('nav.dataset.pb1572Signature=pb1572Signature;h.append(nav)'));});
test('a correctly hashed but incomplete automatic update cannot replace the current UI',async()=>{
 const {updateUi}=require('../ui-update.cjs'),crypto=require('node:crypto'),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pb-nav-update-')),values=new Map([['uiRoot',ui],['uiBuild','known-complete']]),store={get:key=>values.get(key),set:(key,value)=>values.set(key,value),transaction:fn=>fn()};
 const names=['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1147-lab-admin-header.js','photobridge-r1372-third-header.js','desktop-overlay.js'];
 const assets=Object.fromEntries(names.map(name=>[name,fs.readFileSync(path.join(ui,name))]));
 assets[names[1]]=Buffer.from(assets[names[1]].toString().replace('["sms","پیامک مشتریان"],',''));
 const files=names.map(name=>({name,url:'/lab-desktop-ui/'+name,sha256:hash(assets[name])})),manifest={protocol:1,channel:'lab',files,build:hash(JSON.stringify(files))};
 try{
  await assert.rejects(updateUi({store,bundled:ui,directory:temp,acceptRoot:validateNativeUi,request:async url=>url.includes('manifest')?Response.json(manifest):new Response(assets[url.replace('/lab-desktop-ui/','')])}),/ui_navigation_incomplete/);
  assert.equal(store.get('uiRoot'),ui);assert.equal(store.get('uiBuild'),'known-complete');assert(!fs.existsSync(path.join(temp,manifest.build)));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
