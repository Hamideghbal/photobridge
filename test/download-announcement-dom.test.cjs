'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function element(tag='div'){
 return {tagName:tag,children:[],hidden:false,textContent:'',className:'',setAttribute(){},
 append(...items){this.children.push(...items)},replaceChildren(...items){this.children=[...items]},
 before(){},remove(){}};
}
function view(){
 const source=fs.readFileSync(path.join(__dirname,'../alert-renderer.js'),'utf8');
 const start=source.indexOf('function renderDownloads(items){'),end=source.indexOf('\nfunction status(',start);
 assert(start>=0&&end>start,'test must run the actual renderer function');
 const downloads=element(),network=element('aside');network.id='networkProblem';
 const ctx={document:{createElement:element},$:(id)=>id==='downloads'?downloads:network,
  fit(){},window:{labAlert:{retryDownload:async()=>{}}},status(){}};
 const render=vm.runInNewContext(source.slice(start,end)+'\nrenderDownloads',ctx);
 const parts=()=>downloads.children[0]?.children||[];
 return {render,parts,downloads};
}
function order(phase,more={}){return {orderId:'order-A',number:'42',phase,stage:'download',loadedBytes:25,totalBytes:100,percent:25,done:1,total:4,...more}}
test('real notification DOM displays byte-progress during transfer, then removes progress and percent',()=>{
 const app=view();
 app.render([order('downloading')]);
 assert.equal(app.parts().filter(x=>x.tagName==='progress').length,1);
 assert(app.parts().some(x=>x.tagName==='small'&&x.textContent.includes('۲۵')));
 app.render([order('verified',{downloadVerified:true,percent:100})]);
 assert.equal(app.parts().filter(x=>x.tagName==='progress').length,0);
 assert(app.parts().some(x=>x.textContent==='دانلود تأیید شد'));
 assert(!app.parts().some(x=>x.textContent?.includes('٪')));
 app.render([order('invoice_issuing',{downloadVerified:true,stage:'invoice'})]);
 assert.equal(app.parts().filter(x=>x.tagName==='progress').length,0);
 assert(app.parts().some(x=>x.textContent==='در حال صدور فاکتور'));
 app.render([order('invoice_issued',{downloadVerified:true,stage:'pdf'})]);
 assert(app.parts().some(x=>x.textContent==='فاکتور صادر شد'));
 app.render([order('complete',{downloadVerified:true,invoiceIssued:true})]);
 assert(app.parts().some(x=>x.textContent==='سفارش تکمیل شد'));
});
test('a failed invoice or PDF is never rendered as final success',()=>{
 const app=view();
 for(const stage of ['invoice','pdf','print']){
  app.render([order('failed',{downloadVerified:true,stage,reason:'network error',percent:100})]);
  assert.equal(app.parts().filter(x=>x.tagName==='progress').length,0);
  const s=app.parts().find(x=>x.tagName==='small').textContent;
  assert(!s.includes('تمام مراحل با موفقیت انجام شد'));
  assert(s.includes('انجام نشد')||s.includes('بررسی'));
 }
});

test('R1912: download and invoice have independent success/warning indicators, with no repeat download after invoice',()=>{
 const app=view();
 app.render([order('verified',{downloadVerified:true})]);
 let checks=app.parts().find(x=>x.className==='stageChecks').children;
 assert.equal(checks[0].textContent,'✓ دانلود');
 assert.equal(checks[1].textContent,'… صدور فاکتور');
 app.render([order('invoice_issuing',{downloadVerified:true,stage:'invoice'})]);
 checks=app.parts().find(x=>x.className==='stageChecks').children;
 assert.equal(checks[0].textContent,'✓ دانلود');
 assert.equal(checks[1].textContent,'… صدور فاکتور');
 app.render([order('failed',{downloadVerified:true,stage:'invoice'})]);
 checks=app.parts().find(x=>x.className==='stageChecks').children;
 assert.equal(checks[0].textContent,'✓ دانلود');
 assert.equal(checks[1].textContent,'⚠ صدور فاکتور');
 app.render([order('failed',{downloadVerified:false,stage:'download'})]);
 checks=app.parts().find(x=>x.className==='stageChecks').children;
 assert.equal(checks[0].textContent,'⚠ دانلود');
 assert.equal(checks[1].textContent,'… صدور فاکتور');
 app.render([order('invoice_issued',{downloadVerified:true,stage:'pdf'})]);
 checks=app.parts().find(x=>x.className==='stageChecks').children;
 assert.deepEqual(checks.map(x=>x.textContent),['✓ دانلود','✓ صدور فاکتور']);
 assert(!app.parts().some(x=>x.tagName==='progress'));
 app.render([order('complete',{downloadVerified:true,stage:'pdf',invoiceIssued:true})]);
 assert(app.parts().some(x=>x.tagName==='small'&&x.textContent==='سفارش تکمیل شد'));
 assert(!app.parts().some(x=>x.tagName==='small'&&x.textContent.includes('دانلود')));
 checks=app.parts().find(x=>x.className==='stageChecks').children;
 assert.deepEqual(checks.map(x=>x.textContent),['✓ دانلود','✓ صدور فاکتور']);
});

test('R1912: a downloaded order without confirmed invoice must not display a false invoice check',()=>{
 const app=view();app.render([order('complete',{downloadVerified:true,stage:'download'})]);
 const checks=app.parts().find(x=>x.className==='stageChecks').children;
 assert.deepEqual(checks.map(x=>x.textContent),['✓ دانلود','⚠ صدور فاکتور']);
});
