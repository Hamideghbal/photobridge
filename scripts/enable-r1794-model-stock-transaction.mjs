/* R1794: exact model inventory by print size in the transaction. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/api/server.js';
let server=fs.readFileSync(path,'utf8');
const region=server.indexOf('const submitCustomerOrder = url.pathname.match(');
const start=server.indexOf('const stockReq = albumMode',region);
const end=server.indexOf('const prepaid = String(q.rows[0]',start);
if(region<0||start<region||end<=start||end-start>4200)throw Error('[R1794] stock transaction boundary not found');
const old=server.slice(start,end);
if(!old.includes('chassis_qty')||!old.includes('frame_stock=frame_stock-$3'))throw Error('[R1794] previous base-stock handler unexpected');
const patch=fs.readFileSync('scripts/r1794-stock-submit-handler.js.txt','utf8');
server=server.slice(0,start)+patch+server.slice(end);
fs.writeFileSync(path,server);
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
console.log('[R1794] matched model and size stock in customer submit');
