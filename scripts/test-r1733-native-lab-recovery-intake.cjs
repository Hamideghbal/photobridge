'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),http=require('node:http');
const read=p=>fs.readFileSync(p,'utf8');
const base='dist/web/lab-desktop-ui/';
test('R1733 Windows lab header retains one walk-in action for print and album; server device validation remains',()=>{
 const js=read(base+'photobridge-r1137-lab-local-intake.js');
 const header=read(base+'photobridge-r1147-lab-admin-header.js');
 assert.doesNotThrow(()=>new Function(js));
 assert.doesNotThrow(()=>new Function(header));
 assert(js.includes('/* PB1733 native Lab walk-in header fix */'));
 assert(js.includes("'ثبت سفارش آلبوم حضوری':'ثبت سفارش عکس حضوری'"));
 assert(js.includes("button.textContent=pb1733IntakeLabel()"));
 assert(js.includes("button.disabled=!ready"));
 assert(!js.includes('if(!primaryState){old?.remove();return;}'));
 assert(js.includes("if(!primary.registered||!primary.isThisDevice)throw Error("));
 assert(header.includes('/* PB1733 keep intake across header rebuild */'));
 assert(header.includes("if(pb1733Intake)row.prepend(pb1733Intake);"));
});
test('R1733 release is isolated to native UI, has valid hashes and safe browser recovery',()=>{
 const manifest=JSON.parse(read(base+'manifest.json'));
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const files=['photobridge-r1137-lab-local-intake.js','photobridge-r1147-lab-admin-header.js','r1733-native-intake.css','r1733-native-auth-help.js','index.html'];
 assert.equal(manifest.channel,'lab');
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
 for(const name of files){
  const entry=manifest.files.find(x=>x.name===name);
  assert(entry,name);assert.equal(entry.sha256,hash(fs.readFileSync(base+name)),name);
 }
 const nativeIndex=read(base+'index.html'),help=read(base+'r1733-native-auth-help.js');
 assert(nativeIndex.includes('/r1733-native-intake.css?v=r1733'));
 assert(nativeIndex.includes('/r1733-native-auth-help.js?v=r1733'));
 assert(help.includes("https://photobridge.ir/account-recovery.html"));
 assert(help.includes('event.stopImmediatePropagation()'));
 assert(!help.includes("input[name='password']"));
});
test('R1733 Windows localhost proxy forwards public OTP endpoints but rejects unauthenticated origin',async()=>{
 const {createHost}=require('./r1388-native/host.cjs');
 let requests=[];
 const responseData=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
 const srv=createHost({store:{get:()=>null},sync:{},request:async(path,options)=>{
  requests.push({path,options});return path==='/api/auth/lab-login'
   ?responseData(401,{error:'invalid_credentials'})
   :responseData(200,{challengeId:'challenge'});
 },roots:()=>[],token:'secret',onLogin:async()=>{throw Error('unexpected success')},onLogout:async()=>({})});
 await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
 const send=(path,data,cookie='desktop=secret')=>new Promise((resolve,reject)=>{
  const payload=JSON.stringify(data);
  const req=http.request({host:'127.0.0.1',port:srv.address().port,path,method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}},r=>{
   let str='';r.setEncoding('utf8');r.on('data',x=>str+=x);r.on('end',()=>resolve({status:r.statusCode,body:JSON.parse(str)}));
  });req.on('error',reject);req.end(payload);
 });
 try{
  const blocked=await send('/api/auth/password-reset/request',{portal:'account',mobile:'09123456789'},'');
  assert.equal(blocked.status,403);assert.equal(requests.length,0);
  for(const name of ['request','verify','complete']){
   const forwarded=await send('/api/auth/password-reset/'+name,{portal:'account',mobile:'09123456789'});
   assert.equal(forwarded.status,200);
   const last=requests.at(-1);assert.equal(last.path,'/api/auth/password-reset/'+name);
   assert.equal(last.options.anonymous,true);
  }
  const login=await send('/api/auth/lab-login',{mobile:'۰۹۱۲ ۳۴۵۶۷۸۹',password:'  sEcRet+78  '});
  assert.equal(login.status,401);
  const sent=JSON.parse(requests.at(-1).options.body);
  assert.equal(sent.mobile,'09123456789');
  assert.equal(sent.password,'  sEcRet+78  ');
 }finally{await new Promise(resolve=>srv.close(resolve))}
});
