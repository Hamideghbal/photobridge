'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function element(tag='div'){
 return {tagName:tag,children:[],hidden:false,textContent:'',className:'',setAttribute(){},
  append(...items){this.children.push(...items)},replaceChildren(...items){this.children=[...items]},before(){},remove(){}};
}
const uuid='11111111-2222-4333-8444-555555555555';
function view({id=uuid,number='42',completed=false}={}){
 const source=fs.readFileSync(path.join(__dirname,'../alert-renderer.js'),'utf8');
 const start=source.indexOf('function renderDownloads(items){'),end=source.indexOf('\nfunction status(',start);
 assert(start>=0&&end>start,'test must execute the real renderer');
 const downloads=element(),panel=element(),notice={id:'notification-A',orderAlert:true,orderId:id,orderNumber:number,created_at:'2026-11-19T12:00:00.000Z',...(completed?{completionNote:'✅ confirmed'}:{})};
 const orderPanels=new Map([['notification-A',{notice,panel}]]),state={downloads:[]};
 const ctx={document:{createElement:element},$:(id)=>id==='downloads'?downloads:element(),
  state,orderPanels,fit(){},window:{labAlert:{retryDownload:async()=>{}}},status(){}};
 const render=vm.runInNewContext(source.slice(start,end)+'\nrenderDownloads',ctx);
 const parts=()=>panel.children;
 const checks=()=>parts().find(x=>x.className==='stageChecks')?.children.map(x=>x.textContent)||[];
 const stage=()=>parts().find(x=>x.className==='orderStageLabel')?.textContent||'';
 return {render,parts,checks,stage,downloads,panel,state};
}
function order(phase,more={}){return {orderId:uuid,number:'42',phase,stage:'download',loadedBytes:25,totalBytes:100,percent:25,done:1,total:4,orderCreatedAt:'2026-11-19T12:00:00.000Z',...more}}
test('R1913: original order card displays both pending stages before downloader starts; no second card',()=>{
 const app=view();app.render([]);
 assert.deepEqual([...app.checks()],['… دانلود','… صدور فاکتور']);
 assert.match(app.stage(),/در انتظار شروع/);
 assert.equal(app.downloads.children.length,0);
 assert.equal(app.downloads.hidden,true);
});
test('R1913: byte progress only while downloading; two checks stay in one original card',()=>{
 const app=view();app.render([order('downloading')]);
 assert.equal(app.parts().filter(x=>x.tagName==='progress').length,1);
 assert.match(app.stage(),/۲۵/);
 assert.deepEqual([...app.checks()],['… دانلود','… صدور فاکتور']);
 app.render([order('verified',{downloadVerified:true,percent:100})]);
 assert.equal(app.parts().filter(x=>x.tagName==='progress').length,0);
 assert.equal(app.stage(),'دانلود تأیید شد');
 assert.deepEqual([...app.checks()],['✓ دانلود','… صدور فاکتور']);
 assert(!app.stage().includes('٪'));
});
test('R1913: invoice confirmation is independent from verified download, no duplicated download stage after invoice',()=>{
 const app=view();
 app.render([order('invoice_issuing',{downloadVerified:true,stage:'invoice'})]);
 assert.equal(app.stage(),'در حال صدور فاکتور');
 assert.deepEqual([...app.checks()],['✓ دانلود','… صدور فاکتور']);
 app.render([order('invoice_issued',{downloadVerified:true,stage:'invoice'})]);
 assert.equal(app.stage(),'فاکتور صادر شد');
 assert.deepEqual([...app.checks()],['✓ دانلود','✓ صدور فاکتور']);
 app.render([order('complete',{downloadVerified:true,invoiceIssued:true})]);
 assert.equal(app.stage(),'سفارش تکمیل شد');
 assert.deepEqual([...app.checks()],['✓ دانلود','✓ صدور فاکتور']);
 assert.equal(app.downloads.children.length,0);
});
test('R1913: invoice 100% / generic complete are not invoice proof',()=>{
 const app=view();app.render([order('complete',{downloadVerified:true,percent:100})]);
 assert.deepEqual([...app.checks()],['✓ دانلود','… صدور فاکتور']);
 assert.equal(app.stage(),'صدور فاکتور هنوز تأیید نشده');
});
test('R1913: failed invoice is warning while downloaded files remain verified',()=>{
 const app=view();app.render([order('failed',{downloadVerified:true,stage:'invoice',reason:'server error'})]);
 assert.deepEqual([...app.checks()],['✓ دانلود','⚠ صدور فاکتور']);
 assert.match(app.stage(),/صدور فاکتور انجام نشد/);
 assert.equal(app.parts().filter(x=>x.tagName==='progress').length,0);
});
test('R1913: old progress from another UUID cannot mark new order as complete',()=>{
 const app=view();app.render([order('complete',{orderId:'99999999-8888-4777-8666-555555555555',downloadVerified:true,invoiceIssued:true})]);
 assert.deepEqual([...app.checks()],['… دانلود','… صدور فاکتور']);
});
test('R1913: completion persists in original unread order card after progress is gone',()=>{
 const app=view({completed:true});app.render([]);
 assert.deepEqual([...app.checks()],['✓ دانلود','✓ صدور فاکتور']);
 assert.equal(app.stage(),'سفارش تکمیل شد');
});
test('R1913: renderer creates only an inline stage panel for the original order card',()=>{
 const s=fs.readFileSync(path.join(__dirname,'../alert-renderer.js'),'utf8');
 assert.match(s,/orderPanels\.set\(n\.id,\{notice:n,panel:stagePanel\}\)/);
 assert.match(s,/renderDownloads\(next\.downloads\)/);
 assert(!s.includes('root.append(row)'),'no separate download card may be appended');
});
