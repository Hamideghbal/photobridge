'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=process.env.PB_TEST_ROOT||process.cwd(),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const moduleApi=()=>import(pathToFileURL(path.join(root,'dist/api/sms-message-units.js')).href);
test('SMS billing counts GSM extensions, Unicode boundaries and preserves required short links',async()=>{
 const {smsParts,compactSms,orderConfirmationSms}=await moduleApi();for(const[n,want]of[[70,1],[71,2],[134,2],[135,3]])assert.equal(smsParts('ا'.repeat(n)).parts,want);for(const[n,want]of[[160,1],[161,2],[306,2],[307,3]])assert.equal(smsParts('a'.repeat(n)).parts,want);assert.equal(smsParts('^'.repeat(81)).parts,2);assert.equal(smsParts('😀'.repeat(36)).parts,2);
 const url='https://photobridge.ir/pi/abcdefghijk';const invitation=compactSms({purpose:'lab_photographer_permanent_invite',metadata:{shortToken:'token'},message:'PhotoBridge\nلابراتوار «'+ 'شعبه مرکزی '.repeat(20).trim()+'» شما را دعوت کرد\nhttps://photobridge.ir/guides\n'+url});assert(invitation.includes(url));assert(invitation.includes('شعبه مرکزی '.repeat(20).trim()));assert(!invitation.includes('PhotoBridge'));const confirmation=orderConfirmationSms('شعبه مرکزی '.repeat(30).trim(),123456789,'album');assert(confirmation.includes('123456789'));assert(confirmation.startsWith('لابراتوار عکس '));assert(confirmation.includes('شعبه مرکزی '.repeat(30).trim()));assert(!confirmation.includes('PhotoBridge'));assert.equal(smsParts(orderConfirmationSms('شعبه مرکزی',123,'print')).parts,1);
});
function fn(source,name){const a=source.indexOf('async function '+name+'('),b=source.indexOf('\nasync function ',a+20);assert(a>=0&&b>a);return source.slice(a,b)}
test('lab, photographer and shop wallets debit two unit prices, and refuse insufficient total credit',async()=>{
 const source=read('dist/api/server.js');for(const name of ['reserveServiceWalletCharge','reservePhotographerWalletCharge','reserveEquipmentRentalSmsCharge'])for(const balance of [100,15]){
  const calls=[],query=async(sql,args)=>{calls.push({sql,args});if(sql.includes('SELECT balance'))return{rows:[{balance}]};if(sql.includes('SELECT unit_price'))return{rows:[{unit_price:10,enabled:true,name:'SMS'}]};if(sql.includes('RETURNING'))return{rows:[{id:'tx'}]};return{rows:[],rowCount:0}};
  const c={query,release(){}},context={pool:{connect:async()=>c},crypto:{randomUUID:()=> 'id'},serviceWalletEnsure:async()=>{},photographerWalletEnsure:async()=>{},equipmentRentalSmsWalletEnsure:async()=>{},equipmentSmsSponsoredAdminRecipient:async()=>false,shopSmsTestRecipient:async()=>false,serviceEffectivePrice:async()=>({enabled:true,lab_enabled:true,effective_price:10}),photographerEffectivePrice:async()=>({enabled:true,customer_enabled:false,lab_enabled:true,effective_price:10})};vm.createContext(context);vm.runInContext(fn(source,name),context);const run=()=>context[name]({labId:'lab',userId:'user',shopId:'shop',serviceKey:'sms_customer_notification',units:2,expectedAmount:10,labOrderSms:true});
  if(balance===15){await assert.rejects(run(),e=>e.message==='service_wallet_insufficient'&&e.required===20);assert(!calls.some(c=>c.sql.startsWith('UPDATE')))}else{const result=await run();assert.equal(result.amount,20);assert.equal(result.balanceAfter,80)}
 }
});
test('browser archive recovery downloads and verifies before marking downloaded; native flow stays unchanged',async()=>{
 const source=read('dist/web/assets/index-UIRefine-v655-r84.js'),a=source.indexOf('async function pb1451RecoverOrder('),b=source.indexOf('\nfunction pb1451RecoveryMessage',a);assert(a>=0&&b>a);
 for(const native of [false,true])for(const fail of [false,true]){
  const events=[],order={id:'new',mode:'print'},context={window:native?{pbNativeStorage:{}}:{},ai:()=>true,pb1451ReadArchive:async()=>null,pb1450Code:e=>e.message,pb1450Root:async()=>{events.push('folder');return{id:'disk'}},pb1451LiveRecovery:async(url,body,method)=>{events.push(method==='PATCH'?'status':'clone');return{order,fileCount:1}},Me:async()=>({order,files:[{id:'photo'}]}),pb1550Root:async()=>events.push('pin'),pb1451AcknowledgeDownload:async()=>events.push('receipt'),Dg:async()=>{events.push('download');if(fail)throw Error('disk_full');return{done:1}}};vm.createContext(context);vm.runInContext(source.slice(a,b),context);
  const run=()=>context.pb1451RecoverOrder({order:{id:'old'},files:[{}]},false,'',()=>{});
  if(!native&&fail){await assert.rejects(run(),e=>e.message==='disk_full'&&e.recoveryOrder.id==='new');assert(!events.includes('status'));assert.equal(events.filter(x=>x==='clone').length,1)}else{const result=await run();assert.equal(result.localPrepared,!native);assert.deepEqual(events,native?['clone']:['folder','clone','pin','download','receipt','status'])}
 }
});

test('browser recovery uses canonical API routes; native and receipt requests retain live suffix',async()=>{
 const source=read('dist/web/assets/index-UIRefine-v655-r84.js');
 for(const native of [false,true]){const calls=[],ctx={window:native?{pbNativeStorage:{}}:{},Me:async(url)=>{calls.push(url);return{order:{id:'new'}}}};vm.createContext(ctx);vm.runInContext(fn(source,'pb1451LiveRecovery'),ctx);await ctx.pb1451LiveRecovery('/api/lab/orders/new',{},'PATCH');await ctx.pb1451LiveRecovery('/api/lab/orders/new/download-receipt',{files:[]});assert.equal(calls[0],'/api/lab/orders/new'+(native?'/download':''));assert.equal(calls[1],'/api/lab/orders/new/download-receipt/download');}
});
