const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),sharp=require('sharp');
const id='11111111-1111-4111-8111-111111111111';
async function serve(p,state){await p.route('**/*',async route=>{const u=new URL(route.request().url());if(u.pathname.startsWith('/api/')){
 let data={items:[],labs:[],orders:[],notifications:[],shops:[],jobs:[],galleries:[],settings:{}};
 if(u.pathname==='/api/auth/me')data={user:{id,userId:id,name:'عکاس',labRole:'customer',platformRole:'user',photographerName:'آتلیه',photographerAvatarData:state.avatar}};
 if(u.pathname==='/api/photographer/navigation-tabs')data={tabs:{ai:false,album:false,instagram:false},adminBypass:false};
 if(u.pathname==='/api/customer/entry-context')data={destination:'none',connectedCount:0};
 if(u.pathname==='/api/customer/client-galleries')data={billing:{enabled:true,fee:0,freeGalleriesRemaining:3,maxPhotos:500,balance:0,lifetimeDays:45},galleries:[],printSizes:[],uploadAvailable:true};
 if(u.pathname==='/api/photographer/profile/avatar'){state.requests.push(route.request());if(state.status!==200)return route.fulfill({status:state.status,json:{error:'save_failed'}});state.avatar=route.request().postDataJSON().imageData;data={ok:true,imageData:state.avatar};}
 return route.fulfill({json:data});}
 const file=path.join(process.cwd(),'dist/web',u.pathname.startsWith('/photographer')?'index.html':u.pathname);return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});});}
async function select(p,buffer){const choosing=p.waitForEvent('filechooser');await p.locator('.pb1163ProfileButton').click();const chooser=await choosing;assert.equal(await chooser.element().getAttribute('id'),'pb1325DesktopAvatarInput');await chooser.setFiles({name:'avatar.png',mimeType:'image/png',buffer});}
test('desktop avatar bypasses stale mobile input, saves once and survives page reload',async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const p=await b.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'}),state={avatar:'',status:200,requests:[]};await serve(p,state);await p.goto('https://panel.test/photographer/gallery');await p.waitForSelector('.pb1163ProfileButton');
 await p.evaluate(()=>{document.querySelector('#pbF37AvatarInput')?.remove();const input=document.createElement('input');input.id='pbF37AvatarInput';input.type='file';input.hidden=true;window.staleChanges=0;input.onchange=()=>staleChanges++;document.body.append(input);});
 const buffer=await sharp({create:{width:400,height:260,channels:3,background:'#2457e8'}}).png().toBuffer();await select(p,buffer);await p.waitForFunction(()=>document.querySelector('.pb1163ProfileButton img')?.src.startsWith('data:image/jpeg'));
 assert.equal(state.requests.length,1);assert.equal(state.requests[0].headers()['x-photobridge-portal'],'photographer');assert.equal(await p.evaluate(()=>staleChanges),0);const meta=await sharp(Buffer.from(state.avatar.split(',')[1],'base64')).metadata();assert.equal(meta.width,192);assert.equal(meta.height,192);
 await p.reload();await p.waitForSelector('.pb1163ProfileButton img');assert.equal(await p.locator('.pb1163ProfileButton img').getAttribute('src'),state.avatar);
 }finally{await b.close()}
});
test('failed avatar save preserves previous picture and allows selecting the same file again',async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const old='data:image/png;base64,'+(await sharp({create:{width:20,height:20,channels:3,background:'#bb4455'}}).png().toBuffer()).toString('base64');const p=await b.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'}),state={avatar:old,status:500,requests:[]};await serve(p,state);await p.goto('https://panel.test/photographer/gallery');await p.waitForSelector('.pb1163ProfileButton img');await p.evaluate(()=>{window.savedEvents=0;addEventListener('photobridge-profile-avatar-updated',()=>savedEvents++);});const buffer=await sharp({create:{width:24,height:24,channels:3,background:'#226699'}}).png().toBuffer();const warning=p.waitForEvent('dialog').then(async d=>{const msg=d.message();await d.accept();return msg;});await select(p,buffer);assert((await warning).includes('ذخیره عکس'));assert.equal(await p.locator('.pb1163ProfileButton img').getAttribute('src'),old);assert.equal(await p.evaluate(()=>savedEvents),0);await p.waitForFunction(()=>!document.querySelector('.pb1163ProfileButton').disabled);
 state.status=200;await select(p,buffer);await p.waitForFunction(()=>savedEvents===1);assert.equal(state.requests.length,2);assert.notEqual(state.avatar,old);
 }finally{await b.close()}
});

for(const width of [390,1100,1366,1920])test('existing selected-Print-photo card grid at '+width,async()=>{
 const source=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),start=source.indexOf('e.jsxs("article",{className:"simplePrintPhotoCard'),end=source.indexOf('},Be.id)',start)+'},Be.id)'.length;assert(start>0&&end>start);const card=source.slice(start,end);
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width,height:1000}});await p.setContent('<html dir="rtl"><body><div id="root"><main class="photographerMain photographerPrintWorkspace"><section class="simplePrintPilot"><section class="simplePrintSizeCard"><div class="simplePrintSizeBody"><div class="simplePrintPhotoGrid"></div></div></section></section></main></div></body></html>');
 const html=fs.readFileSync('dist/web/index.html','utf8'),names=[...html.matchAll(/<link[^>]+href=["']([^"']+)/g)].map(m=>m[1].split('?')[0].replace(/^\//,'')).filter(name=>name.endsWith('.css')&&name!=='photobridge-r1325-desktop-print-grid.css'&&fs.existsSync('dist/web/'+name));await p.addStyleTag({content:names.map(name=>fs.readFileSync('dist/web/'+name,'utf8').replace(/@import[^;]+;/g,'')).join('\n')});
 // Use the production card JSX, including copies, paper and both optional add-ons.
 await p.evaluate(card=>{
 const e={};function jsx(tag,props){if(typeof tag==='function')return tag(props);const el=document.createElement(tag);for(const[k,v]of Object.entries(props||{})){if(k==='children'){const append=x=>{if(Array.isArray(x))x.forEach(append);else if(x instanceof Node)el.append(x);else if(x!=null&&x!==false)el.append(String(x));};append(v);}else if(k==='className')el.className=v;else if(k.startsWith('on'))el.addEventListener(k.slice(2).toLowerCase(),v);else if(v!=null&&v!==false)el.setAttribute(k,v===true?'':v);}return el;}e.jsx=e.jsxs=jsx;window.calls=[];
 const noop=()=>{},select=()=>jsx('button',{className:'pbSelectTrigger',children:'مات'});
 const render=new Function('e','Be','ue','re','pbPrintCopyFilename','pbPrintCopies','V','W','PBsetCopies','b','Da','wn','Ie','ee','Q','Y','pe','A','bt','Nt','return '+card);
 for(let i=0;i<6;i++){const file={id:'photo-'+i,file:{name:'sample-'+i+'.jpg',size:20000},progress:0};const el=render(e,file,{id:'size',paperType:'mat'},noop,x=>x,()=>1,String,false,(...args)=>calls.push(args),['mat'],{mat:'مات'},select,noop,true,true,noop,noop,noop,false,false);document.querySelector('.simplePrintPhotoGrid').append(el);}
 const add=jsx('button',{className:'simplePrintPhotoAddCard',children:'افزودن عکس دیگر'});document.querySelector('.simplePrintPhotoGrid').append(add);
 },card);
 await p.addStyleTag({content:'@media(min-width:821px){.simplePrintPilot{width:calc(100% - 260px);margin:0!important}}'});
 const snapshot=()=>[...document.querySelectorAll('.simplePrintPhotoGrid,.simplePrintPhotoCard,.simplePrintThumb')].map(el=>{const s=getComputedStyle(el);return [s.gridTemplateColumns,s.minHeight,s.padding,s.fontSize]});const before=width<821?await p.evaluate(snapshot):null;
 await p.addStyleTag({path:'dist/web/photobridge-r1325-desktop-print-grid.css'});
 if(width<821)assert.deepEqual(await p.evaluate(snapshot),before,'mobile layout stays unchanged');
 else{
 const cards=await p.locator('.simplePrintPhotoCard').evaluateAll(nodes=>nodes.map(el=>el.getBoundingClientRect().toJSON()));const columns=width>=1280?6:4;assert.equal(cards.filter(r=>Math.abs(r.y-cards[0].y)<1).length,columns);
 const grid=await p.locator('.simplePrintPhotoGrid').boundingBox();for(const r of cards)assert(r.x>=grid.x-1&&r.x+r.width<=grid.x+grid.width+1);
 const controls=await p.locator('.simplePrintPhotoCard').first().evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('button,input,.simplePrintPhotoCopies')].map(n=>({r:n.getBoundingClientRect().toJSON(),outer:r.toJSON()}))});assert(controls.every(({r,outer})=>r.x>=outer.x-1&&r.x+r.width<=outer.x+outer.width+1),'existing controls fit inside smaller cards');
 await p.locator('.simplePrintPhotoCard').first().getByRole('button',{name:'افزایش تعداد چاپ'}).click();assert.deepEqual(await p.evaluate(()=>calls),[['size','photo-0',2]]);
 await p.screenshot({path:'work/r1325-print-grid-'+width+'.png',fullPage:true});
 }
 }finally{await b.close()}
});
