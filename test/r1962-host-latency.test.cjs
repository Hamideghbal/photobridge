'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {LabStore}=require('../store.cjs');
const {createHost}=require('../host.cjs');

async function withHost(upstream,run){
  const store=new LabStore(':memory:');
  store.set('labId','test-lab');
  store.set('auth',{user:{id:'test-operator'}});
  const host=createHost({
    store,request:upstream,roots:()=>[],token:'r1962-probe',
    sync:{status:()=>({online:true,pending:0}),wake:()=>{}},
    isOnline:()=>true,onLogin:async()=>{},onLogout:async()=>{}
  });
  await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+host.address().port;
  const get=(path,options={})=>fetch(origin+path,{
    ...options,headers:{connection:'close',cookie:'desktop=r1962-probe',...options.headers}
  });
  try{return await run(get);}
  finally{
    host.closeAllConnections?.();
    await new Promise(resolve=>host.close(resolve));
    store.db.close();
  }
}

for (const query of ['', '?download=1']) {
test('photo '+(query?'download':'preview')+' delivers first byte before upstream completion',async()=>{
  const path='/api/lab/order-files/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/content'+query;
  let finish=()=>{};
  const body=new ReadableStream({start(controller){
    controller.enqueue(Uint8Array.of(1,2,3));
    finish=()=>{finish=()=>{};controller.enqueue(Uint8Array.of(4,5));controller.close();};
  }});
  try{
    await withHost(async route=>{
      assert.equal(route,path);
      return new Response(body,{status:200,headers:{
        'Content-Type':'application/octet-stream',
        'Content-Length':'5',
        'X-PB-File-Name':'photo-original.jpg',
        'X-PB-Fallback-Original':'1'
      }});
    },async get=>{
      const response=await Promise.race([
        get(path),
        new Promise((_,reject)=>setTimeout(()=>reject(Error('headers_waited_for_full_download')),2500))
      ]);
      assert.equal(response.status,200);
      assert.equal(response.headers.get('x-pb-file-name'),'photo-original.jpg');
      assert.equal(response.headers.get('content-length'),'5');
      assert.equal(response.headers.get('x-pb-fallback-original'),'1');
      const reader=response.body.getReader();
      const first=await Promise.race([
        reader.read(),
        new Promise((_,reject)=>setTimeout(()=>reject(Error('first_byte_waited_for_full_download')),2500))
      ]);
      assert.deepEqual([...first.value],[1,2,3]);
      assert.equal(first.done,false);
      finish();
      const second=await reader.read();
      assert.deepEqual([...second.value],[4,5]);
      assert.equal((await reader.read()).done,true);
    });
  }finally{finish();}
});

}

test('a failed unrelated endpoint never imposes a fifteen-second wait on a healthy paged orders read',async()=>{
  const calls=[];
  await withHost(async route=>{
    calls.push(route);
    if(route==='/api/lab/unrelated-error')throw Error('transient_upstream_failure');
    if(route.startsWith('/api/lab/orders?'))
      return Response.json({orders:[{id:'one'}],total:1,pages:1,counts:{printing:1}});
    throw Error('unexpected_upstream_route:'+route);
  },async get=>{
    assert.equal((await get('/api/lab/unrelated-error')).status,503);
    const started=Date.now();
    const result=await get('/api/lab/orders?paged=1&page=1&status=printing');
    assert.equal(result.status,200);
    assert.equal((await result.json()).orders.length,1);
    assert(Date.now()-started<5000,'paged orders were delayed by an unrelated upstream failure');
    assert(calls.some(url=>url.includes('paged=1')));
  });
});


test('an unrelated upstream failure does not delay notification detail, settings or photo content',async()=>{
  const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const paths=['/api/lab/orders/'+id,'/api/lab/automation','/api/lab/order-files/'+id+'/content?download=1'];
  const calls=[];
  await withHost(async route=>{
    calls.push(route);
    if(route==='/api/lab/background')throw Error('upstream_timeout');
    return Response.json({ok:true});
  },async get=>{
    for(const path of paths){
      assert.equal((await get('/api/lab/background')).status,503);
      assert.equal((await get(path)).status,200,path);
      assert.equal(calls.at(-1),path);
    }
  });
});

test('abandoning an early photo request cancels the upstream read before response headers',async()=>{
  let entered, aborted;
  const upstreamStarted=new Promise(resolve=>{entered=resolve;});
  const upstreamAborted=new Promise(resolve=>{aborted=resolve;});
  const controller=new AbortController();
  await withHost((_,{signal})=>new Promise((resolve,reject)=>{
    signal.addEventListener('abort',()=>{aborted();reject(signal.reason);},{once:true});
    entered();
  }),async get=>{
    const pending=get('/api/lab/order-files/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/content?download=1',{signal:controller.signal}).catch(error=>error);
    await upstreamStarted;
    controller.abort();
    let timeout;
    try{
      await Promise.race([upstreamAborted,new Promise((_,reject)=>{
        timeout=setTimeout(()=>reject(Error('upstream photo request did not cancel')),2000);
      })]);
    }finally{clearTimeout(timeout);}
    assert.equal((await pending).name,'AbortError');
  });
});
