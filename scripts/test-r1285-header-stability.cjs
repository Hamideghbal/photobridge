const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function serve(page,state){
 await page.route('**/*',async r=>{const u=new URL(r.request().url());
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/photographer/navigation-tabs'){if(state.delay)await new Promise(resolve=>setTimeout(resolve,state.delay));return r.fulfill({json:{tabs:state.tabs||{ai:false,album:false,instagram:false},adminBypass:false}})}
  if(u.pathname==='/api/auth/me')return r.fulfill({json:{user:{userId:'customer',name:'Customer',labRole:'customer',platformRole:'user',photographerName:'Test Studio'}}});
  if(u.pathname==='/api/customer/entry-context')return r.fulfill({json:{destination:'none',connectedCount:0}});
  return r.fulfill({json:{labs:[],galleries:[],items:[],notifications:[],jobs:[],models:[],settings:{},stats:{},transactions:[],shops:[]}});
 }
 const f=u.pathname==='/equipment-rental/book'?path.join(root,'dist/api/equipment-rental-book.html'):path.join(root,'dist/web',u.pathname.startsWith('/photographer')?'index.html':u.pathname.slice(1));
 return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});
 });
}
test('gallery identity text settles without observer-driven rewrites',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,serviceWorkers:'block'});await serve(page,{});
 await page.goto('https://panel.test/photographer/gallery');
 await page.waitForSelector('#photographerRoleHeaderV710',{state:'attached'});
 await page.waitForTimeout(1200);
 const mutations=await page.evaluate(()=>new Promise(resolve=>{let count=0;const nodes=document.querySelectorAll('#photographerRoleHeaderV710 .workspaceIdentityCopy>h1,#photographerRoleHeaderV710 .workspaceIdentityCopy>small,#pbF37StudioName,#pbF37Manager');const o=new MutationObserver(records=>count+=records.length);nodes.forEach(n=>o.observe(n,{childList:true,characterData:true,subtree:true}));setTimeout(()=>{o.disconnect();resolve({count,nodes:nodes.length})},700)}));
 assert(mutations.nodes>0,'real photographer identity is present');assert.equal(mutations.count,0,'unchanged header identity must not be rewritten');
 }finally{await browser.close()}
});
