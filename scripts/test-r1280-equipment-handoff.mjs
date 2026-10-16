import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {equipmentStorefrontLoginHandoff} from '../dist/api/equipment-storefront-handoff.js';

const shopId='10000000-0000-4000-8000-000000000001';
function fixture(){
 const tickets=new Map(),calls=[],res=()=>({
  status:0,headers:{},data:null,redirect:null,
  setHeader(k,v){this.headers[k.toLowerCase()]=v;},
  writeHead(status,headers){this.status=status;this.headers={...this.headers,...Object.fromEntries(Object.entries(headers).map(([k,v])=>[k.toLowerCase(),v]))};this.redirect=this.headers.location;},
  end(){this.ended=true;}
 });
 let actor={userId:'20000000-0000-4000-8000-000000000002',labRole:'customer'};
 const d={
  primaryHostname:'photobridge.ir',publicOrigin:'https://photobridge.ir',rateAllowed:()=>true,
  sendJson(r,status,data){r.status=status;r.data=data;r.ended=true;},
  auth:async()=>actor,
  createSessionToken:async userId=>{calls.push(['session',userId]);return 'verified-fresh-session';},
  setSessionCookie(r,token,portal){calls.push(['cookie',token,portal]);r.setHeader('set-cookie','photobridge_photographer_session='+token+'; HttpOnly; Secure; SameSite=Lax; Path=/');},
  pool:{async query(q,args=[]){
    if(q.includes('expires_at<=now()'))return{rows:[]};
    if(q.includes('INSERT INTO equipment_storefront_login_handoffs')){
      const [hash,user,shop,host]=args;tickets.set(hash,{user_id:user,shop_id:shop,host,expires_at:Date.now()+90000});return{rows:[]};
    }
    if(q.includes('DELETE FROM equipment_storefront_login_handoffs')&&q.includes('RETURNING')){
      const stored=tickets.get(args[0]);if(!stored||stored.expires_at<=Date.now())return{rows:[]};
      tickets.delete(args[0]);return{rows:[stored]};
    }
    throw Error('Unexpected SQL: '+q);
  }}
 };
 const request=(method,host,origin)=>({method,url:'/api/auth/equipment-store-handoff',headers:{host,...(origin?{origin}:{})}});
 const issue=async(options={})=>{const req=request('POST','cameras.example.org',options.origin||'https://cameras.example.org'),r=res();await equipmentStorefrontLoginHandoff(req,r,new URL('https://cameras.example.org/api/auth/equipment-store-handoff'),{id:shopId},'cameras.example.org',d);return r;};
 const redeem=async code=>{const req=request('GET','photobridge.ir'),r=res();await equipmentStorefrontLoginHandoff(req,r,new URL('https://photobridge.ir/auth/equipment-store-handoff?code='+code),null,'photobridge.ir',d);return r;};
 return{issue,redeem,d,res,tickets,calls,setActor:v=>{actor=v;}};
}

test('one authenticated shop form login creates a short-lived, single-use scoped handoff',async()=>{
 const x=fixture(),issued=await x.issue();
 assert.equal(issued.status,200);
 const target=new URL(issued.data.redirectUrl);
 assert.equal(target.origin,'https://photobridge.ir');
 assert.equal(target.pathname,'/auth/equipment-store-handoff');
 assert.match(target.searchParams.get('code'),/^[a-zA-Z0-9_-]{43}$/);
 const entries=[...x.tickets.values()];
 assert.equal(entries.length,1);
 assert.equal(entries[0].shop_id,shopId);
 assert.equal(entries[0].host,'cameras.example.org');
 assert.equal([...x.tickets.keys()][0].length,64,'only a SHA-256 code digest is stored');
 const result=await x.redeem(target.searchParams.get('code'));
 assert.equal(result.status,303);
 assert.equal(result.redirect,'/equipment-rental/book?panel=rental&shopId='+shopId);
 assert.match(result.headers['set-cookie'],/HttpOnly/);
 assert.equal(result.headers['referrer-policy'],'no-referrer');
 assert.deepEqual(x.calls,[['session',entries[0].user_id],['cookie','verified-fresh-session','photographer']]);
 const replay=await x.redeem(target.searchParams.get('code'));
 assert.equal(replay.status,410,'consumed ticket must not be accepted twice');
 assert.equal(x.calls.length,2);
});

test('untrusted origins, anonymous accounts and expired links cannot create PhotoBridge sessions',async()=>{
 const x=fixture();
 let r=x.res();await equipmentStorefrontLoginHandoff({method:'POST',headers:{host:'cameras.example.org',origin:'https://evil.example'}},r,new URL('https://cameras.example.org/api/auth/equipment-store-handoff'),{id:shopId},'cameras.example.org',x.d);
 assert.equal(r.status,403);
 x.setActor(null);r=await x.issue();assert.equal(r.status,401);
 x.setActor({userId:'a',labRole:'customer'});const accepted=await x.issue(),code=new URL(accepted.data.redirectUrl).searchParams.get('code');
 x.tickets.values().next().value.expires_at=0;
 r=await x.redeem(code);assert.equal(r.status,410);
 assert.equal(x.calls.length,0);
 r=await x.redeem('wrong');assert.equal(r.status,410);
});

test('both sale channels show discounted equipment price above crossed-out original with no percentage badge',()=>{
 const money=n=>Number(n).toLocaleString('fa-IR')+' تومان',fa=n=>Number(n).toLocaleString('fa-IR');
 const publicJs=readFileSync(new URL('../dist/web/storefront.js',import.meta.url),'utf8');
 const a=publicJs.indexOf('function price(item){'),b=publicJs.indexOf('function cartDraw(){',a);
 assert(a>=0&&b>a);
 const publicPrice=new Function('equipment','money','fa',publicJs.slice(a,b)+'return price;')(true,money,fa);
 const framePrice=new Function('equipment','money','fa',publicJs.slice(a,b)+'return price;')(false,money,fa);
 const item={sale_price:800000,channel_gross_price:1000000,channel_discount_percent:20};
 const website=publicPrice(item);
 assert(website.indexOf('equipmentPriceCurrent')<website.indexOf('equipmentPriceOld'));
 assert.match(website,/equipmentPriceOld[^>]*aria-label="قیمت قبل از تخفیف"/);
 assert(!website.includes('٪'));
 assert(website.includes(money(800000))&&website.includes(money(1000000)));
 assert(!publicPrice({...item,channel_gross_price:800000}).includes('<del'));
 assert(framePrice(item).includes('٪ تخفیف'),'frame and chassis presentation is intentionally untouched');
 const mainHtml=readFileSync(new URL('../dist/api/equipment-rental-book.html',import.meta.url),'utf8');
 const c=mainHtml.indexOf('function photographerEquipmentSalePrice(item){'),d=mainHtml.indexOf('function renderSales(){',c);
 assert(c>=0&&d>c);
 const mainPrice=new Function('money',mainHtml.slice(c,d)+'return photographerEquipmentSalePrice;')(money);
 const shown=mainPrice(item);
 assert(shown.indexOf('equipmentPriceCurrent')<shown.indexOf('equipmentPriceOld'));
 assert(!shown.includes('٪'));
 assert(!mainPrice({...item,channel_gross_price:800000}).includes('<del'));
 assert(mainHtml.includes('${photographerEquipmentSalePrice(i)}'));
 const publicCss=readFileSync(new URL('../dist/web/storefront.css',import.meta.url),'utf8');
 const mainCss=readFileSync(new URL('../dist/web/photobridge-r1280-equipment-sale-price-stack.css',import.meta.url),'utf8');
 for(const css of [publicCss,mainCss]){assert(css.includes('equipmentPriceCurrent'));assert(css.includes('equipmentPriceOld'));assert(css.includes('line-through'));}
});
