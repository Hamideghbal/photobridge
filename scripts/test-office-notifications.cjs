const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {chromium}=require('playwright');
const server=fs.readFileSync(path.join(__dirname,'../dist/api/server.js'),'utf8');
const portal=fs.readFileSync(path.join(__dirname,'../dist/api/equipment-rental-portal.html'),'utf8');
function section(from,to){const i=server.indexOf(from),j=server.indexOf(to,i+from.length);assert(i>=0&&j>i);return server.slice(i,j)}
function notificationRuntime(){
  const delivered=[],stored=[];
  const ctx=vm.createContext({console,URL,Date,Map,Set,JSON,Promise,
    ensureWebPushVapid:async()=>{},
    webpush:{async sendNotification(sub,payload){delivered.push({sub,payload:JSON.parse(payload)})}},
    pool:{async query(sql,args){
      if(sql.startsWith('INSERT INTO system_notifications')){const row={id:'notice',title:args[2],message:args[3]};stored.push({recipient:args[0],event:args[1],metadata:JSON.parse(args[4])});return {rows:[row]}}
      if(sql.includes('SELECT DISTINCT user_id'))return {rows:[{user_id:'manager'}]};
      if(sql.includes('SELECT id,endpoint'))return {rows:[{id:'subscription',endpoint:'https://fixture.invalid/push',p256dh:'fixture',auth:'fixture'}]};
      if(sql.includes('count(*)'))return {rows:[{count:3}]};
      return {rows:[]};
    }}
  });
  vm.runInContext(section('function notificationOrderNo(', 'function customerEventKey(')+section('async function publishRentalShopEvent(', 'function publishCustomerEventEverywhere('),ctx);
  return {ctx,delivered,stored};
}
test('photographer/store notifications persist and reach the push transport',async()=>{
  const {ctx,delivered,stored}=notificationRuntime();
  const cases=[['equipment_collaboration_review','rejected'],['equipment_collaboration_review','approved'],...['payment_pending','reserved','rejected','picked_up','returned','cancelled'].map(s=>['equipment_rental_status',s]),...['confirmed','completed','cancelled'].map(s=>['equipment_sale_status',s])];
  for(const [event,status] of cases)await ctx.storeCustomerSystemNotification('photographer',event,{status,shopName:'Seven'});
  for(const event of ['equipment_collaboration_request','equipment_rental_request','equipment_rental_request_cancelled','equipment_sale_order_new'])await ctx.publishRentalShopEvent('shop',event,{photographerName:'Studio'});
  // Production delivery is asynchronous after persisting the inbox row.
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(stored.length,cases.length+4);
  assert.equal(delivered.length,stored.length);
  assert.equal(stored.filter(x=>x.recipient==='manager').length,4);
  const rejection=delivered.find(x=>x.payload.event==='equipment_collaboration_review');
  assert.match(rejection.payload.body,/رد شد/);
  assert.match(rejection.payload.body,/Seven/);
  assert.equal(rejection.payload.url,'/equipment-rental/book');
  assert.equal(rejection.payload.unreadCount,3);
  for(const event of ['equipment_collaboration_request','equipment_rental_request','equipment_sale_order_new']){
    assert.match(delivered.find(x=>x.payload.event===event).payload.url,/^\/rental\//);
  }
});
test('actual rejection handler publishes only after commit; approval failure sends no success notice',async()=>{
  const route=section('    const rentalCollaborationRoute =','    if (req.method === \'GET\' && url.pathname === \'/api/rental/subscription\')');
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  const dependencies=['req','res','url','a','equipmentRentalCurrentShop','ensureEquipmentRentalV628Schema','bodyJson','equipmentRentalNormalizeRequiredFields','pool','normalizeMobile','audit','publishCustomerEventEverywhere','sendJson','photographerInviteMobileBinding','PUBLIC_APP_URL','sendSms'];
  const handler=new AsyncFunction(...dependencies,route);
  for(const status of ['rejected','approved'])for(const smsFails of status==='approved'?[false,true]:[false]){
    const order=[],events=[],row={id:'request',photographer_id:'photographer',mobile:'09120000001',photographer_name:'Studio'};
    const query=async sql=>{if(sql==='COMMIT')order.push('commit');return {rowCount:1,rows:sql.includes('SELECT i.*')?[{id:'invite',code:'PBTEST'}]:[row]}};
    const pool={connect:async()=>({query,release(){}}),query};
    const result=await handler({method:'PATCH'},{},new URL('http://localhost/api/rental/collaboration-requests/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),{userId:'manager'},async()=>({id:'shop',name:'Seven'}),async()=>{},async()=>({status}),()=>({}),pool,x=>x,async()=>{},(...args)=>{order.push('notify');events.push(args)},(_res,code,body)=>({code,body}),()=> 'binding','https://fixture.invalid',async()=>{if(smsFails)throw new Error('sms_send_failed');return {reference:'sms-fixture'}});
    assert.equal(events.length,smsFails?0:1);
    if(!smsFails){assert.deepEqual(order.slice(0,2),['commit','notify']);assert.equal(events[0][0],'photographer');assert.equal(events[0][2].status,status);assert.equal(result.code,200)}
    else assert.equal(result.code,502);
  }
});
test('other photographer/lab notification copies also persist and dispatch',async()=>{
  const {ctx,delivered,stored}=notificationRuntime();
  const customerEvents=['collaboration_review','lab_membership_removed','order_status','payment_receipt_review','invoice_ready','album_stage_updated','lab_tariff_updated','archive_order_recovered','recovered_order_file_removed','order_file_print_settings_updated','courier_update','invoice_pricing_ready','client_gallery_finalized','ai-job'];
  const labEvents=['photographer_invite_accepted','photographer_removed_by_admin','photographer_removed_by_lab','collaboration_request','order_submitted','order_payment_approved','payment_receipt_submitted','order_cancelled','archive_order_recovered','album_stage_updated','ai-job','lab_disabled'];
  for(const event of customerEvents)await ctx.storeCustomerSystemNotification('photographer',event,{status:'completed',orderId:'order',invoiceId:'invoice'});
  for(const event of labEvents)await ctx.storeLabSystemNotification('lab',event,{status:'completed',orderId:'order'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(stored.length,customerEvents.length+labEvents.length);
  assert.equal(delivered.length,stored.length);
});
test('service worker displays background notifications and forwards foreground events',async()=>{
  const code=fs.readFileSync(path.join(__dirname,'../dist/web/photobridge-sw-v710.js'),'utf8');
  for(const visible of [false,true]){
    const handlers={},notices=[],messages=[];
    const ctx=vm.createContext({URL,console,self:{location:{origin:'https://fixture.invalid'},addEventListener(name,fn){handlers[name]=fn},navigator:{},clients:{async matchAll(){return visible?[{visibilityState:'visible',postMessage:x=>messages.push(x)}]:[]}},registration:{async showNotification(title,options){notices.push({title,options})}}}});
    vm.runInContext(code,ctx);
    let completed;
    handlers.push({data:{json:()=>({event:'equipment_collaboration_review',title:'درخواست همکاری رد شد',body:'رد شد',url:'/equipment-rental/book',notificationId:'notice'})},waitUntil:p=>completed=p});
    await completed;
    assert.equal(notices.length,visible?0:1);
    assert.equal(messages.length,visible?1:0);
    if(!visible)assert.equal(notices[0].options.data.notificationId,'notice');
    else assert.equal(messages[0].type,'PB_PUSH_FOREGROUND');
  }
});
test('receipt fits mobile/desktop without inner scroll or clipped confirmation buttons',async()=>{
  const styles=[...portal.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>`<style>${m[1]}</style>`).join('');
  const script=portal.match(/<script id="pbR100F5OfficeReceipt">([\s\S]*?)<\/script>/)[1];
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
  try{
    for(const viewport of [{width:360,height:640},{width:390,height:844},{width:1366,height:768}]){
      const page=await browser.newPage({viewport});
      await page.setContent(`<html><head>${styles}</head><body></body></html>`);
      await page.addScriptTag({content:script});
      await page.evaluate(()=>{
        window.bookingPhotographerMode='existing';
        window.data={items:Array.from({length:8},(_,i)=>({id:String(i),title:'دوربین Canon EOS R8 و تجهیزات عکاسی'}))};
        window.pbR100F5OfficeReceipt({form:{photographerId:{selectedOptions:[{textContent:'آتلیه عکاسی ماندگاران'}]}},startDate:'1405/07/16',endDate:'1405/07/18',items:window.data.items.map(x=>({itemId:x.id,quantity:2})),smsText:'پیامک ثبت آفیش و لینک مشاهده وضعیت با موفقیت ارسال شد.'});
      });
      const size=await page.locator('.pbR100F5Receipt').evaluate(el=>({h:el.clientHeight,sh:el.scrollHeight,w:el.clientWidth,sw:el.scrollWidth,top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom}));
      assert(size.sh<=size.h+1,`inner vertical overflow at ${viewport.width}: ${JSON.stringify(size)}`);
      assert(size.sw<=size.w+1,'no horizontal overflow');
      assert(size.top>=0&&size.bottom<=viewport.height,'dialog must fit viewport');
      await page.locator('.pbR100F5ReceiptClose').click();
      assert.equal(await page.locator('.pbR100F5ReceiptBack').count(),0);
      await page.close();
    }
  }finally{await browser.close()}
});
