import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Readable} from 'node:stream';
import {readEquipmentHandoffPost} from '../dist/api/equipment-office-handoff.js';
import {renderEquipmentPage} from '../dist/api/equipment-site-content.js';

const shop={id:'10000000-0000-4000-8000-000000000001',name:'فروشگاه تجهیزات',rental_enabled:true,sale_enabled:true};
test('equipment handoff does not reject privacy-restricted top-level POST Origin headers',async()=>{
 const url='https://store.example.test',token='A'.repeat(43);
 for(const originHeader of ['null',undefined,'https://other.example.test',url]){
  const req=Readable.from([Buffer.from(new URLSearchParams({ticket:token,origin:url}).toString())]);
  req.headers={'content-type':'application/x-www-form-urlencoded','origin':originHeader};
  const data=await readEquipmentHandoffPost(req);
  assert.deepEqual(data,{ticket:token,origin:url});
 }
 const server=readFileSync('dist/api/server.js','utf8');
 const start=server.indexOf("url.pathname==='/api/auth/equipment-site-handoff'");
 const end=server.indexOf('    // v790:',start);
 assert(start>0&&end>start,'first-party handoff route must exist');
 const handler=server.slice(start,end);
 assert.doesNotMatch(handler,/invalid_origin|req\.headers\.origin\s*!==/,'do not fail a valid one-time ticket on an optional browser Origin hint');
 assert.match(handler,/consumeEquipmentStoreHandoff\(pool,form\)/);
 assert.match(handler,/createSession\(grant\.userId,res,'photographer'\)/);
 assert.match(handler,/pbDirectShop/);
 assert.match(handler,/location:'\/photographer\?login_error=office_handoff'/);
});
test('office page has a directly accessible centered login form, not an extra navigation CTA',()=>{
 const html=renderEquipmentPage(shop,{},'https://photobridge.ir',{hostname:'store.example.test',pathname:'/rental-equipment'}).html;
 assert.match(html,/id="equipmentOfficePageLogin"/);
 assert.match(html,/name="mobile"/);
 assert.match(html,/name="password"/);
 assert.match(html,/id="equipmentOfficePageMessage"/);
 assert.doesNotMatch(html,/data-open-equipment-login|class="equipment-office-cta"/);
 assert.match(html,/equipment-site.css\?v=r1281/);
 assert.match(html,/equipment-site.js\?v=r1281/);
});
test('header login stays compact and readable while a white-to-blue surface extends below the header',()=>{
 const css=readFileSync('dist/web/equipment-site.css','utf8');
 assert.match(css,/\.equipment-site \.photographer-dropdown\.\w* > summary\.equipment-office-entry|\.equipment-site \.photographer-dropdown > summary\.equipment-office-entry/);
 assert.match(css,/\[open\].*summary\.equipment-office-entry/s);
 assert.match(css,/-webkit-text-fill-color:#fff!important/);
 assert.match(css,/width:236px!important/);
 assert.match(css,/\.equipment-site > \.equipment-page-scroll\s*\{[^}]*linear-gradient/s);
 assert.match(css,/\.equipment-office-login-card/);
});
