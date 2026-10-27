const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('all Lab tabs measure the visible secondary header and remove the viewport on logout/mobile',()=>{
 let active=true,desktop=true,headers=[{getClientRects:()=>[{}],getBoundingClientRect:()=>({bottom:72})},{getClientRects:()=>[{}],getBoundingClientRect:()=>({bottom:120})}],top,queue=false;
 const root={querySelectorAll:()=>headers},main={querySelector:()=>({getBoundingClientRect:()=>({bottom:42})}),closest:()=>root,style:{getPropertyValue:()=>top,setProperty:(_,v)=>top=v}};
 const document={readyState:'complete',documentElement:{classList:{toggle:(_,v)=>queue=v}},querySelector:selector=>{assert.equal(selector.includes('labPrimaryConnectorMode'),false);return active?main:null},getElementById:()=>({getBoundingClientRect:()=>({bottom:40})})};
 const media={get matches(){return desktop},addEventListener:()=>{}};
 const context={window:{pbNativeStorage:{invoke(){}}},document,matchMedia:()=>media,requestAnimationFrame:fn=>fn(),MutationObserver:class{observe(){}},ResizeObserver:class{observe(){}disconnect(){}},addEventListener:()=>{},getComputedStyle:()=>({visibility:'visible'}),innerHeight:900};
 const source=fs.readFileSync('dist/web/photobridge-r1363-lab-queue.js','utf8').replace('function schedule(){','window.measureForTest=measure;function schedule(){');vm.runInNewContext(source,context);
 assert.equal(queue,true);assert.equal(top,'120px');headers=[headers[0]];context.window.measureForTest();assert.equal(top,'72px');desktop=false;context.window.measureForTest();assert.equal(queue,false);desktop=true;active=false;context.window.measureForTest();assert.equal(queue,false);
});
test('blue shadow strength falls while neutral shadows, text and focus outlines remain unchanged',async()=>{
 const {softenCss}=await import('./soften-blue-shadows.mjs');
 const input='.card{color:rgba(49,94,251,1);box-shadow:0 6px 16px rgba(49,94,251,.2),0 1px 3px rgba(15,23,42,.1);outline:2px solid rgba(49,94,251,.5)}.headerFade{background:linear-gradient(rgba(49,94,251,.12),transparent)}';
 const output=softenCss(input);assert.match(output,/rgba\(70,103,221,0.12\)/);assert.match(output,/rgba\(15,23,42,.1\)/);assert.match(output,/color:rgba\(49,94,251,1\)/);assert.match(output,/outline:2px solid rgba\(49,94,251,.5\)/);assert.match(output,/rgba\(70,103,221,0.072\)/);assert.equal(softenCss(output),output);
});
test('long Lab conversations return the newest bounded messages in chronological order, preserving membership check',async()=>{
 const {latestLabChats}=await import('./lab-chat-latest.mjs');
 const source=fs.readFileSync('dist/api/server.js','utf8'),patched=latestLabChats(source);assert.equal(latestLabChats(patched),patched);
 const cases=[['if (labChat && req.method === \'GET\') {','if (labChat && req.method === \'POST\') {','cm.created_at DESC LIMIT 500'],["if (req.method === 'GET' && url.pathname === '/api/lab/platform-chat') {","if (req.method === 'POST' && url.pathname === '/api/lab/platform-chat') {",'m.created_at DESC LIMIT 300']];
 for(const [start,end,order] of cases){
  const section=patched.slice(patched.indexOf(start),patched.indexOf(end,patched.indexOf(start)));let queries=0,result;
  const context={req:{method:'GET'},url:{pathname:'/api/lab/platform-chat'},labChat:['match','customer'],labId:'lab',res:{},issueStoredPreviewUrl:x=>x,voiceRows:rows=>rows,customerBelongsToLab:async()=>true,pool:{query:async sql=>{queries++;assert.ok(sql.includes(order));return {rows:[{id:502},{id:501}]}}},sendJson:(_,status,data)=>result={status,data}};
  await vm.runInNewContext('(async()=>{'+section+'})()',context);assert.equal(queries,1);assert.equal(result.status,200);assert.equal(JSON.stringify(result.data.messages),'[{"id":501},{"id":502}]');
  if(start.includes('labChat')){context.customerBelongsToLab=async()=>false;queries=0;await vm.runInNewContext('(async()=>{'+section+'})()',context);assert.equal(queries,0);assert.equal(result.status,404)}
 }
});
