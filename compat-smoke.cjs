'use strict';
async function run(){
 const {app,BrowserWindow,net}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');let dir,db,server,win;const timeout=setTimeout(()=>{console.error('COMPAT_SMOKE_TIMEOUT');app.exit(1);},45000);
 try{
  await app.whenReady();dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb-compat-'));const {LabStore}=require('./store.cjs');db=new LabStore(path.join(dir,'lab.sqlite'));db.set('labId','smoke');db.enqueue('POST','/api/lab/test',{total:1200});assert.equal(db.rows().length,1);
  server=http.createServer((req,res)=>{res.setHeader('Set-Cookie',['one=1; Path=/','two=2; Path=/']);res.end('{"ok":true}');});await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port,result=await require('./runtime-compat.cjs').electronFetch(net,'http://127.0.0.1:'+port);assert.deepEqual(await result.json(),{ok:true});assert.equal(result.headers.getSetCookie().length,2);await new Promise(r=>server.close(r));
  const root=app.isPackaged?path.join(process.resourcesPath,'runtime'):path.join(__dirname,'runtime');require('./verify-native-ui.cjs').validateNativeUi(root);
  server=require('./host.cjs').createHost({store:db,sync:{status:()=>db.status(),run:async()=>{}},request:async()=>Response.json({error:'login_required'},{status:401}),roots:()=>[root],token:'smoke',isOnline:()=>false});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(43761,'127.0.0.1',resolve);});
  win=new BrowserWindow({show:false,webPreferences:{preload:path.join(__dirname,'main-preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false}});await win.loadURL('http://127.0.0.1:'+server.address().port+'/start?token=smoke');
  const state=await win.webContents.executeJavaScript("new Promise(resolve=>{const started=Date.now();const check=()=>{if(document.querySelector('input[type=password]'))return resolve({login:true,bridge:!!window.pbNativeStorage});if(Date.now()-started>10000)return resolve({login:false,text:document.body.innerText.slice(0,200)});setTimeout(check,100)};check()})");assert.equal(state.login,true,JSON.stringify(state));assert.equal(state.bridge,true);
  console.log('PB_COMPAT_SMOKE_PASS '+JSON.stringify({electron:process.versions.electron,node:process.versions.node,sqlite:true,network:true,login:true}));
 }catch(e){console.error(e.stack||e);process.exitCode=1;}finally{clearTimeout(timeout);win?.destroy();if(server?.listening)await new Promise(r=>server.close(r));db?.db.close();if(dir)fs.rmSync(dir,{recursive:true,force:true});app.exit(process.exitCode||0);}
}
module.exports={run};
