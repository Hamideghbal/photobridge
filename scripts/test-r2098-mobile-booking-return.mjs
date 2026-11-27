import test from 'node:test';import assert from 'node:assert/strict';import {patchBook} from './enable-r2098-mobile-booking-return.mjs';
import fs from 'node:fs';
test('R2098 mobile confirmation returns home, clears draft, desktop keeps existing behavior',async()=>{
 const raw=fs.readFileSync('dist/api/equipment-rental-book.html','utf8'),out=patchBook(raw),i=out.indexOf('async function submitRentalBooking'),end=out.indexOf('\n',i),src=out.slice(i,end);
 assert.equal(patchBook(out),out);assert.match(src,/showMobilePanel\('storePanel'\)/);assert.match(src,/else\{await loadBookings\(\);renderItems\(\);showMobilePanel\('bookingsPanel'\)\}/);assert.match(src,/rentalDateConfirmedKeyV811=''/);new Function(src);
 for(const mobile of [true,false]){const nodes=new Map(),calls=[];const $=id=>{if(!nodes.has(id))nodes.set(id,{value:'draft',innerHTML:'draft',prepend(){}});return nodes.get(id)};const run=new Function('$','api','validRequestBody','msg','closeRentalRequestV809','loadBookings','renderItems','showMobilePanel','setDefaultDates','window','document','calls',`let shopId='shop',shops=[{id:'shop'}],rentalDateConfirmedKeyV811='old';`+src+';return submitRentalBooking()');
 await run($,async()=>({id:'new'}),()=>({}),()=>{},()=>calls.push('close'),async()=>calls.push('load'),()=>calls.push('render'),v=>calls.push(v),()=>calls.push('dates'),{matchMedia:()=>({matches:mobile})},{createElement:()=>({setAttribute(){}})},calls);assert.ok(calls.includes(mobile?'storePanel':'bookingsPanel'));assert.equal($('#notes').value,mobile?'':'draft')}
});
