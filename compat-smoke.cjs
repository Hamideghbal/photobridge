'use strict';
async function run(){
 const {app,BrowserWindow,net}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');let dir,db,server,win;const timeout=setTimeout(()=>{console.error('COMPAT_SMOKE_TIMEOUT');app.exit(1);},45000);
 try{
  const {ipcMain}=require('electron');let orderWorkerReady=false;
  ipcMain.on('lab-fast-order-ready',event=>{if(win&&event.sender===win.webContents)orderWorkerReady=true;});
  await app.whenReady();dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb-compat-'));const {LabStore}=require('./store.cjs');db=new LabStore(path.join(dir,'lab.sqlite'));db.set('labId','smoke');db.enqueue('POST','/api/lab/test',{total:1200});assert.equal(db.rows().length,1);
  server=http.createServer((req,res)=>{res.setHeader('Set-Cookie',['one=1; Path=/','two=2; Path=/']);res.end('{"ok":true}');});await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port,result=await require('./runtime-compat.cjs').electronFetch(net,'http://127.0.0.1:'+port);assert.deepEqual(await result.json(),{ok:true});assert.equal(result.headers.getSetCookie().length,2);await new Promise(r=>server.close(r));
  const root=app.isPackaged?path.join(process.resourcesPath,'runtime'):path.join(__dirname,'runtime');require('./verify-native-ui.cjs').validateNativeUi(root);
  if(Number(app.getVersion().split('.')[2])>=137){
   const {compile}=require('./native-renderer-bundle.cjs'),{directDownloadMarker}=require('./native-notice-first-photo.cjs');
   const entry=compile(path.join(root,'assets','index-UIRefine-v655-r84.js'),app.getVersion());
   assert(entry.includes(directDownloadMarker),'The bundled UI does not support the native direct download path');
   if(Number(app.getVersion().split('.')[2])>=143)assert(entry.includes('className:"pbNativeQueueSkeleton'),'The bundled UI does not support the native order loading cards');
   if(Number(app.getVersion().split('.')[2])>=160){assert(entry.includes('/* PB160 dashboard first */')&&entry.includes('pb161ShowStatement')&&!entry.includes('pb160Photographers'),'The verified bundled UI lacks the latest dashboard/statement patch');}
   if(Number(app.getVersion().split('.')[2])>=162){assert(entry.includes('pbNativeReceiptView=')&&entry.includes('data-pb162-invoice-all')&&entry.includes('/* PB162 inline backup */'),'The verified bundled UI lacks receipt/backup changes');}
   if(Number(app.getVersion().split('.')[2])>=165){
    assert(entry.includes('/* PB165 native performance */')&&entry.includes('pb2063Options=x.useMemo')&&entry.includes('pb165ExtraTimes'),'Missing native performance renderer');
    const perf=require('./native-performance-165.cjs');
    const intake=require('./native-intake-168.cjs').compileRoot(root);
    const manual=perf.patchManual(fs.readFileSync(path.join(root,'photobridge-r1176-lab-finance.js'),'utf8'));
    assert(intake.includes('PB168 native walk-in mount')&&((intake.includes('pb2063ByHash.get(hash)')&&intake.includes('pb2063FilesById.get(item.fileId)'))||intake.includes('PB168 original intake performance fallback')),'Missing usable native intake');
    assert(manual.includes("let value='',matches=[],limit=32"),'Missing bounded manual customer picker');
    new Function(intake);new Function(manual);
   }
   if(Number(app.getVersion().split('.')[2])>=145){
    const intake=require('./native-intake-168.cjs').compileRoot(root);
    assert(intake.includes('pbNativeIntakePhotoPicker'),'The bundled UI does not support automatic intake photo insertion');
   }
  }
  server=require('./host.cjs').createHost({store:db,sync:{status:()=>db.status(),run:async()=>{}},request:async()=>Response.json({error:'login_required'},{status:401}),roots:()=>[root],token:'smoke',isOnline:()=>false});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(43761,'127.0.0.1',resolve);});
  win=new BrowserWindow({show:false,webPreferences:{preload:path.join(__dirname,'main-preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false}});await win.loadURL('http://127.0.0.1:'+server.address().port+'/start?token=smoke');
  const state=await win.webContents.executeJavaScript("new Promise(resolve=>{const started=Date.now();const check=()=>{if(document.querySelector('input[type=password]'))return resolve({login:true,bridge:!!window.pbNativeStorage});if(Date.now()-started>10000)return resolve({login:false,text:document.body.innerText.slice(0,200)});setTimeout(check,100)};check()})");assert.equal(state.login,true,JSON.stringify(state));assert.equal(state.bridge,true);
  const served=await win.webContents.executeJavaScript("fetch('/photobridge-r1137-lab-local-intake.js',{cache:'no-store'}).then(async r=>({ok:r.ok,body:await r.text()}))");
  assert(served.ok,'Native intake HTTP request failed');assert(served.body.includes('PB168 native walk-in mount'),'Native host did not serve 168 launcher');new Function(served.body);
  const begin=served.body.indexOf('function mount(){'),end=served.body.indexOf('\nlet primaryState=',begin);
  assert(begin>=0&&end>begin,'Native launcher missing');
  const probe=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
  try{
   await probe.loadURL('data:text/html,%3Cdiv%20id%3D%22root%22%3E%3C/div%3E');
   const run="("+function(mount){
    document.body.innerHTML='<div id="root"><div class="labRoleWorkspace"><header class="labSingleHeader">header</header><nav class="pb1148SecondaryHeader pb1174QueueNav">tabs</nav><main><div class="mainQueueFilters">filters</div></main></div></div>';
    const route={pathname:'/lab/orders'},calls=[];
    const node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;el.className=cls;return el;};
    const work=new Function('document','location','window','storage','node','open','primaryState','checkPrimary',mount+'\nreturn mount;')(document,route,window,()=>({deviceId:()=>null}),node,m=>calls.push(m),false,()=>{});
    const check=(mode)=>{const b=document.getElementById('pb1137LocalIntakeButton');if(!b||b.dataset.pb168Intake!==mode||!b.getClientRects().length||getComputedStyle(b).visibility==='hidden')throw Error('missing visible '+mode);return b;};
    work();const print=check('print');print.click();
    const previous=document.querySelector('nav'),next=previous.cloneNode(false);next.textContent='tabs';previous.replaceWith(next);
    route.pathname='/lab/album';work();const album=check('album');album.click();
    if(album.parentElement!==next)throw Error('not in second header');route.pathname='/lab/finance';work();
    return {calls,removed:!document.getElementById('pb1137LocalIntakeButton')};
   }.toString()+")("+JSON.stringify(served.body.slice(begin,end))+")";
   const outcome=await probe.webContents.executeJavaScript(run);
   assert.deepEqual(outcome,{calls:['print','album'],removed:true});
  }finally{probe.destroy();}
  console.log('PB168_WALKIN_HOST_BROWSER_PASS');

  if(Number(app.getVersion().split('.')[2])>=129)assert(orderWorkerReady,'Original fast-order worker did not register');
  const alert=new (require('./alert-window.cjs').AlertWindow)({BrowserWindow,ipcMain,store:db,getAccount:()=> 'smoke',open:async()=>{}});
  await alert.present({items:[{id:'test-order',title:'سفارش آزمایشی',message:'اعلان سفارش'}]},null,()=>{},'smoke');
  const alertState=await alert.window.webContents.executeJavaScript("new Promise(resolve=>{let tries=0;const check=()=>{const hasOrder=!!document.querySelector('#items .order'),bridge=!!window.labAlert;if(hasOrder&&bridge)return resolve({rendered:true,hidden:document.hidden,bridge});if(++tries>200)return resolve({rendered:false,hidden:document.hidden,bridge,hasOrder,body:(document.body?.innerText||'').slice(0,160)});setTimeout(check,50)};check()})");assert.equal(alertState.rendered,true,JSON.stringify(alertState));assert.equal(alertState.bridge,true,JSON.stringify(alertState));alert.destroy();
  const menu=new (require('./tray-menu.cjs').TrayMenu)({BrowserWindow,ipcMain,items:[{label:'باز کردن برنامه',click:()=>{}}],getWorkArea:()=>({x:0,y:0,width:1024,height:728})});await menu.popup({x:1000,y:728,width:24,height:24});
  const menuState=await menu.window.webContents.executeJavaScript("document.fonts.ready.then(()=>new Promise((resolve,reject)=>{let tries=0;const check=()=>{const items=document.querySelectorAll('button').length;if(items)return resolve({rtl:document.documentElement.dir,font:getComputedStyle(document.body).fontFamily,items});if(++tries>100)return reject(Error('tray renderer not ready'));setTimeout(check,50)};check()}))");assert.equal(menuState.rtl,'rtl');assert(menuState.font.includes('Vazirmatn'));assert.equal(menuState.items,1);menu.destroy();
  const backups=new (require('./data-backups.cjs').DataBackups)({store:db,userData:dir,exportAccess:async()=>{throw Error('Access must not run')}});const saved=await backups.run();assert(saved.ok&&saved.databaseSaved&&saved.viewerSaved,JSON.stringify(saved));assert(!fs.existsSync(path.join(saved.folder,'finance.accdb')));await require('./data-backups.cjs').verifyBackup(saved.folder);
  const viewer=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});const viewerErrors=[];viewer.webContents.on('console-message',(_event,level,message)=>{if(level>=3)viewerErrors.push(message)});await viewer.loadFile(path.join(saved.folder,'مشاهده بکاپ.html'));const viewerText=await viewer.webContents.executeJavaScript('document.body.innerText');assert(viewerText.includes('فاکتورها')&&viewerText.includes('دریافت‌ها'),viewerText.slice(0,300));assert.deepEqual(viewerErrors,[]);viewer.destroy();
  console.log('PB_COMPAT_SMOKE_PASS '+JSON.stringify({electron:process.versions.electron,node:process.versions.node,sqlite:true,network:true,login:true}));
 }catch(e){console.error(e.stack||e);process.exitCode=1;}finally{clearTimeout(timeout);win?.destroy();if(server?.listening)await new Promise(r=>server.close(r));db?.db.close();if(dir)fs.rmSync(dir,{recursive:true,force:true});app.exit(process.exitCode||0);}
}
module.exports={run};
