'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const css=fs.readFileSync('dist/web/photobridge-r1728-intake-customer-layout.css','utf8');

const sources=['dist/web','dist/web/lab-desktop-ui'].map(dir=>({
 dir,js:fs.readFileSync(dir+'/photobridge-r1137-lab-local-intake.js','utf8'),
 html:fs.readFileSync(dir+'/index.html','utf8')
}));

test('the selected account has a full-width picker row above its debt, dates and action row',()=>{
 assert(css.includes('grid-template-columns:minmax(0,1fr)!important'));
 assert(css.includes('> .pb1139Customer'));
 assert(css.includes('> .pb1294SelectedDetails'));
 assert(css.includes('grid-template-columns:minmax(0,1fr) minmax(270px,360px)!important'));
 assert(css.includes('.pb1294AccountSummary'));
 assert(css.includes('.pb1586IntakeDebtDate'));
 assert(css.includes('flex-wrap:wrap!important'));
 assert(css.includes('white-space:normal!important'));
 assert(css.includes('overflow-wrap:anywhere!important'));
 assert(css.includes('@media (max-width:1000px)'));
 assert(css.includes('.pb1294InitialEdit[hidden]'));
 assert(css.includes('position:static!important'),'debt edit and notices cannot overlap fields');
});

function makeMenuFixture(source,pending){
 const beg=source.indexOf('function customerMenu(');
 // Earlier build steps can rename/rewrite the function following the chooser.
 // Isolate the chooser by its own final return instead of depending on open().
 const match=beg>=0?/\n\s*return model;\s*\n\s*\}/g.exec(source.slice(beg)):null;
 const end=match?beg+match.index+match[0].length:-1;
 assert(beg>0&&end>beg,'customer chooser function and its return must remain reachable');
 const dialog={addEventListener(){}};
 const node=(tag,text='',className='')=>{
  const el={
   tag,className,children:[],parent:null,textContent:text??'',value:'',hidden:false,
   checked:false,disabled:false,style:{},dataset:{},attributes:{},
   classList:{toggle(){},add(){},remove(){}},
   append(...nodes){for(const child of nodes){if(!child)continue;child.parent=this;this.children.push(child)}},
   appendChild(child){this.append(child);return child},
   replaceChildren(...nodes){this.children=[];this.append(...nodes)},
   replaceWith(other){const p=this.parent;if(!p)throw Error('parent missing');const index=p.children.indexOf(this);p.children[index]=other;other.parent=p},
   setAttribute(key,value){this.attributes[key]=value},
   addEventListener(){},
   closest(){return dialog},
   contains(){return false},
   getBoundingClientRect(){return {top:30,bottom:72,left:10,right:320}},
   querySelector(){return null},
   querySelectorAll(){return []},
   focus(){},
   get lastElementChild(){return this.children[this.children.length-1]}
  };
  return el;
 };
 const field=(parent,title,input)=>{
  const label=node('label',title);label.append(input);parent.append(label);return input;
 };
 const ctx={node,field,innerWidth:1080,innerHeight:800,document:{activeElement:null},confirm:()=>true};
 vm.createContext(ctx);
 vm.runInContext(source.slice(beg,end)+'\nthis.customerMenu=customerMenu;',ctx);
 const parent=node('div');
 let smsCount=0;
 const customer={id:'c1',name:'آتلیه نمونه',mobile:'09120000000',registrationPending:pending};
 const model=ctx.customerMenu(parent,[customer],
  async()=>({customer}),
  async id=>{assert.equal(id,'c1');smsCount++;return {invitationSmsSent:true}},
  async()=>({balance:28000,initialDebt:9000,initialDebtUpdatedAt:'2026-11-09T10:00:00Z',invoices:[],smsEnabled:true,canEditInitialDebt:true}),
  async()=>({initialDebt:10000}),
  async()=>{});
 const traverse=(root,predicate)=>{
  if(predicate(root))return root;
  for(const child of root.children||[]){const found=traverse(child,predicate);if(found)return found}
  return null;
 };
 return {model,parent,traverse,smsCount:()=>smsCount,async select(){
  model.button.onclick();
  const option=traverse(parent,n=>n.className==='pb1294SimpleChoice');
  assert(option,'photographer option must exist');
  option.onclick();
  for(let i=0;i<12;i++)await Promise.resolve();
 },sendToggle(){
   return traverse(parent,n=>n.attributes?.['aria-label']?.startsWith('ارسال پیامک'));
 }};
}

test('pre-registered photographer has ONE checkbox for invitation and no resend button',async()=>{
 for(const {dir,js} of sources){
  const f=makeMenuFixture(js,true);
  await f.select();
  const sms=f.sendToggle();
  assert(sms,dir+' SMS checkbox missing');
  assert.equal(sms.attributes['aria-label'],'ارسال پیامک دعوت‌نامه پس از ثبت سفارش');
  assert.equal(f.traverse(f.parent,n=>n.className==='pb1294ResendInvite'),null);
  sms.checked=true;sms.onchange();
  assert.equal(f.model.sendInvoiceSms,true);
  assert.equal(f.smsCount(),0,'choosing SMS does not send before the order is recorded');
  assert.equal(typeof f.model.resendPendingInvitation,'function');
 }
});

test('registered photographer keeps original invoice SMS action and opening debt editor',async()=>{
 const f=makeMenuFixture(sources[0].js,false);
 await f.select();
 const sms=f.sendToggle();
 assert.equal(sms.attributes['aria-label'],'ارسال پیامک فاکتور همین سفارش');
 assert(f.traverse(f.parent,n=>n.className==='pb1294Edit'),'edit initial debt remains available');
});

test('pre-registered invitation is sent AFTER order completion, never as invoice SMS',async()=>{
 const js=sources[0].js;
 const payload='sendInvoiceSms:customers.sendInvoiceSms===true&&!customers.registrationPending';
 assert(js.includes(payload),'pending accounts must not queue invoice SMS');
 const submitStart=js.indexOf('form.onsubmit=async e=>');
 const start=js.indexOf('   if(customers.registrationPending===true&&customers.sendInvoiceSms===true){',submitStart);
 const end=js.indexOf('   const smsResult=result.invoiceSms;',start);
 assert(start>submitStart&&end>start);
 const block=js.slice(start,end);
 for(const pending of [true,false]){
  for(const checked of [true,false]){
   let attempts=0;
   const notices=[];
   const customers={registrationPending:pending,sendInvoiceSms:checked,
    async resendPendingInvitation(){attempts++;return {invitationSmsSent:true}}};
   const form={append(node){notices.push(node)}};
   const node=(_tag,text,cls)=>({textContent:text,className:cls});
   vm.runInNewContext(block,{customers,form,node});
   for(let i=0;i<12;i++)await Promise.resolve();
   assert.equal(attempts,pending&&checked?1:0);
   assert.equal(notices.length,pending&&checked?1:0);
   if(notices.length)assert.equal(notices[0].textContent,'پیامک دعوت‌نامه عضویت ارسال شد.');
   const option={sendInvoiceSms:checked&&!pending};
   assert.equal(option.sendInvoiceSms,checked&&!pending);
  }
 }
});

test('failed invitation does not roll back a saved order and gives a visible status',async()=>{
 const js=sources[0].js;
 const start=js.indexOf('   if(customers.registrationPending===true&&customers.sendInvoiceSms===true){',js.indexOf('form.onsubmit=async e=>'));
 const end=js.indexOf('   const smsResult=result.invoiceSms;',start);
 const notices=[];
 vm.runInNewContext(js.slice(start,end),{
  customers:{registrationPending:true,sendInvoiceSms:true,resendPendingInvitation:async()=>({invitationSmsSent:false,invitationSmsError:'invitation_sms_rate_limited'})},
  form:{append(n){notices.push(n)}},node:(_tag,text)=>({textContent:text})
 });
 for(let i=0;i<12;i++)await Promise.resolve();
 assert.match(notices[0].textContent,/سفارش ثبت شد/);
 assert.match(notices[0].textContent,/یک دقیقه/);
});

test('both real site and Windows Lab delivery have the styling, updated cache and hashes',()=>{
 for(const {dir,js,html} of sources){
  assert(js.includes('/* PB1728 consolidated pending-invite SMS */'));
  assert(js.includes('model.resendPendingInvitation=()=>resendInvitation(model.value)'));
  assert(html.includes('photobridge-r1728-intake-customer-layout.css?v=r1728'));
  assert(html.includes('accountRow=r1728'));
  assert(fs.existsSync(dir+'/photobridge-r1728-intake-customer-layout.css'));
 }
 const dir='dist/web/lab-desktop-ui/',m=JSON.parse(fs.readFileSync(dir+'manifest.json','utf8'));
 const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 for(const name of ['index.html','photobridge-r1137-lab-local-intake.js','photobridge-r1728-intake-customer-layout.css']){
  const entry=m.files.find(x=>x.name===name);assert(entry);
  assert.equal(entry.sha256,sha(fs.readFileSync(dir+name)));
 }
 assert.equal(m.build,sha(JSON.stringify(m.files)));
});


test('R1730 build patch accepts upstream SMS label and title changes',()=>{
 const installer=fs.readFileSync('scripts/enable-r1728-intake-customer-row.mjs','utf8');
 assert(installer.includes("const smsAnchor=src.includes(smsMount)?smsMount:smsChange;"),
   'use a stable checkbox mount/fallback rather than a historic SMS label');
 assert(installer.includes("src=once(src,smsAnchor,smsAnchor+'\\n'+smsLines,'SMS checkbox mount');"));
 assert(!installer.includes("'SMS type label'"),'a changed upstream label must not block Liara');
 assert(!installer.includes("'SMS explanatory title'"),'a changed tooltip must not block Liara');
 assert(installer.includes("c.registrationPending?'ارسال پیامک دعوت‌نامه پس از ثبت سفارش'"));
 assert(installer.includes("c.registrationPending?'پس از ثبت سفارش، پیامک دعوت‌نامه عضویت"));
});
