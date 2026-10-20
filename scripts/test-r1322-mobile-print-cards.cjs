const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const start=bundle.indexOf('e.jsx("div",{"data-order-id":De.id,className:"card customerOrderCard'),end=bundle.indexOf('},De.id)',start)+'},De.id)'.length;
assert(start>0&&end>start);const card=bundle.slice(start,end);
const ts=bundle.indexOf('ft=De=>',bundle.indexOf('function Zg(')),te=bundle.indexOf(';return e.jsxs("section",{className:"ordersWorkspace customerOrders',ts);
assert(ts>0&&te>ts);const timeline=bundle.slice(ts+3,te);
const us=bundle.indexOf('function Ug('),ue=bundle.indexOf('function $f(',us),disclosure=bundle.slice(us,ue);
for(const width of [320,390,820,1100])test('production Print card markup, stages and actions at '+width,async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width,height:900}});
 await p.setContent('<html dir="rtl"><body class="pbAuthenticatedPhotographerPortal pbF37UnifiedActive pbF37PrintMode"><div id="root"><main class="photographerMain photographerPrintWorkspace"><section class="ordersWorkspace customerOrders liveCustomerOrders"><div class="customerOrderGrid liveOrderGrid"></div></section></main></div></body></html>');
 const entry=fs.readFileSync('dist/web/index.html','utf8');
 const names=[...entry.matchAll(/<link[^>]+href=["']([^"']+)/g)].map(m=>m[1].split('?')[0].replace(/^\//,'')).filter(name=>name.endsWith('.css')&&name!=='photobridge-r1322-mobile-print-cards.css'&&fs.existsSync('dist/web/'+name));
 assert(names.some(name=>name.includes('r54-print-refresh'))&&names.some(name=>name.includes('r59-order-card')),'include the legacy four-stage and two-action-column CSS from the actual entry page');
 await p.addStyleTag({content:names.map(name=>fs.readFileSync('dist/web/'+name,'utf8').replace(/@import[^;]+;/g,'')).join('\n')});
 await p.evaluate(({card,timeline,disclosure})=>{
  window.actions=[];const e={};function jsx(tag,props){if(typeof tag==='function')return tag(props);const el=document.createElement(tag);for(const [key,value]of Object.entries(props||{})){if(key==='children'){const append=x=>{if(Array.isArray(x))x.forEach(append);else if(x instanceof Node)el.append(x);else if(x!=null&&x!==false)el.append(String(x));};append(value);}else if(key==='className')el.className=value;else if(key.startsWith('on'))el.addEventListener(key.slice(2).toLowerCase(),value);else if(value!=null&&value!==false)el.setAttribute(key,value===true?(key.startsWith('aria-')?'true':''):value);}return el;}e.jsx=e.jsxs=jsx;
  const Ug=new Function('e',disclosure+';return Ug')(e),ft=new Function('e','l','Ge','Le','Yi','return ('+timeline+')')(e,'print',(order,statuses)=>statuses.includes(order.status),()=>null,()=>''),nil=()=>null;
  for(const [i,status]of ['sent','printing','ready','completed','needs_fix'].entries()){
   const De={id:'order-'+i,number:123450+i,mode:'print',status,file_count:123,total_bytes:123456789,priority:'urgent',created_at:'2026-10-20',delivery:'courier',downloaded_at:i?'2026-10-20':null,invoice_id:i===1||i===2?'invoice':null,invoice_pdf_ready:i===2};
   const payment=({order})=>order.status==='printing'?jsx('div',{className:'prepayPaidConfirmation',children:'پرداخت تأیید شد'}):null;
   const action=name=>order=>window.actions.push(name+':'+order.id);
   const render=new Function('e','De','C','V','eo','Vi','Ac','Ug','ft','vn','Yi','bv','I','re','xv','Ze','Ke','F','He','y','br','return '+card);
   const el=render(e,De,'',x=>String(x),({status})=>jsx('span',{className:'orderStatus',children:status}),()=> '118 MB',{urgent:'فوری'},Ug,ft,()=> '۱۴۰۵/۷/۲۸',()=> '۱۲:۳۰',payment,null,nil,nil,action('invoice'),action('pdf'),'',action('delete'),action('details'),{sent:'ارسال شد',printing:'در حال چاپ',ready:'آماده تحویل',completed:'تحویل شده',needs_fix:'نیازمند اصلاح'});document.querySelector('.liveOrderGrid').append(el);
  }
 },{card,timeline,disclosure});
 await p.addStyleTag({content:'@font-face{font-family:Vazirmatn;src:url(data:font/woff2;base64,'+fs.readFileSync('dist/web/assets/photobridge-handover-vazirmatn.woff2').toString('base64')+')}'});await p.evaluate(()=>document.fonts.ready);
 const desktopSnapshot=()=>[...document.querySelectorAll('.customerOrderCard,.customerOrderFacts,.customerOrderHead,.liveTimeline,.customerOrderQuickActions')].map(el=>{const s=getComputedStyle(el);return [s.display,s.padding,s.fontSize,s.gridTemplateColumns,s.backgroundColor,s.borderRadius]});const before=width>820?await p.evaluate(desktopSnapshot):null;await p.addStyleTag({path:'dist/web/photobridge-r1322-mobile-print-cards.css'});
 const cards=p.locator('.customerOrderCard');assert.equal(await cards.count(),5);
 if(width<=820){
  for(let i=0;i<5;i++){
   const c=cards.nth(i),head=await c.locator('.customerOrderHead').boundingBox(),files=await c.locator('.pb1324OrderFileSummary').boundingBox();
   assert.equal(await c.locator('.customerOrderFacts').isVisible(),false);assert.equal(await c.getByText('اولویت',{exact:true}).isVisible(),false);
   assert.equal(await c.locator('.pb1324OrderFileSummary').textContent(),'123 فایل (118 MB)');
   assert(files.y>head.y&&files.x>=head.x-1&&files.x+files.width<=head.x+head.width+1,'file count and parenthesized size fit below the order identity');
   assert.equal(await c.locator('.mobileOrderDisclosureToggle').isVisible(),false);const stages=await c.locator('.liveTimeline>div').evaluateAll(nodes=>nodes.map(el=>el.getBoundingClientRect().toJSON()));assert.equal(stages.length,5);assert(Math.abs(stages[0].y-head.y)<12,'stage row sits opposite the order identity');assert.deepEqual(await c.locator('.pb1323ShortStageLabel').allTextContents(),['ارسال','دریافت','چاپ','آماده','تحویل']);assert(await c.locator('.pb1323ShortStageLabel').evaluateAll(nodes=>nodes.every(el=>el.getClientRects().length===1&&el.getBoundingClientRect().height<20)),'short stage labels stay on one line');assert(stages.every(r=>r.width>20&&r.height>=30&&r.height<=32&&Math.abs(r.y-stages[0].y)<1),'all stages remain visible in a single row');
   const rect=await c.boundingBox();assert(stages.every(r=>r.x>=rect.x&&r.x+r.width<=rect.x+rect.width+1));
  }
  const printing=cards.nth(1);assert.equal(await printing.locator('.liveTimeline>.current .pb1323ShortStageLabel').textContent(),'چاپ');assert.equal(await printing.locator('.liveTimeline>.current').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(234, 240, 255)');
  assert.equal(await printing.locator('.liveTimeline>.current').evaluate(el=>getComputedStyle(el,'::after').content),'"✓"');assert.equal(await printing.locator('.liveTimeline b').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=9),true);assert.equal(await printing.locator('.prepayPaidConfirmation').isVisible(),false,'redundant paid confirmation is hidden');assert.equal(await cards.nth(2).getByRole('button',{name:'PDF',exact:true}).isVisible(),false);
  const only=cards.nth(3);assert.equal(await only.locator('.customerOrderQuickActions button').count(),1);const button=await only.locator('.detail').boundingBox(),rail=await only.locator('.customerOrderQuickActions').boundingBox();assert(Math.abs(button.width-rail.width)<2,'details-only action fills the row');
  await printing.getByRole('button',{name:'فاکتور',exact:true}).click();await printing.getByRole('button',{name:'جزئیات',exact:true}).click();await cards.nth(0).getByRole('button',{name:'حذف',exact:true}).click();assert.deepEqual(await p.evaluate(()=>actions),['invoice:order-1','details:order-1','delete:order-0']);
  assert(await cards.nth(4).locator('.orderStatus').isVisible(),'correction status is not lost');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
  await p.screenshot({path:'work/r1324-print-cards-'+width+'.png',fullPage:true});
 }else{
  assert.deepEqual(await p.evaluate(desktopSnapshot),before,'desktop styles remain unchanged');
 }
 }finally{await b.close()}
});
