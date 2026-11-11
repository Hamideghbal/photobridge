/* R1794: exact model inventory by print size in the transaction. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/api/server.js';
let server=fs.readFileSync(path,'utf8');
// Build-time transforms can change whitespace and the precise prepaid expression.
// Confine matching to the active customer submit transaction, not the entire file.
const region=server.indexOf('const submitCustomerOrder');
const nextRoute=region<0?-1:server.indexOf('const customerReceiptPresign',region);
const transactionStart=region<0?-1:server.indexOf("await c.query('BEGIN')",region);
const transactionEnd=transactionStart<0?-1:server.indexOf("await c.query('COMMIT')",transactionStart);
const transaction=transactionStart>=0&&transactionEnd>transactionStart
 ?server.slice(transactionStart,transactionEnd):'';
const stockMatch=/\bconst\s+stockReq\s*=/.exec(transaction);
const start=stockMatch?transactionStart+stockMatch.index:-1;
const prepaidMatch=start>=0?/\bconst\s+prepaid\s*=/.exec(server.slice(start,transactionEnd)):null;
const end=prepaidMatch?start+prepaidMatch.index:-1;
if(region<0||nextRoute<region||transactionStart<region||transactionEnd<transactionStart||
   transactionEnd>nextRoute||start<transactionStart||end<=start||end>=transactionEnd)
 throw Error('[R1794] stock transaction boundary not found: '+JSON.stringify({
  region,nextRoute,transactionStart,transactionEnd,stockMatch:!!stockMatch,prepaidMatch:!!prepaidMatch,
  transactionPreview:transaction.slice(0,180)}));
const old=server.slice(start,end);
if(!old.includes('chassis_qty')||!old.includes('stockReq.rows'))
 throw Error('[R1794] previous base stock handler changed: '+old.slice(0,250));
const patch=fs.readFileSync('scripts/r1794-stock-submit-handler.js.txt','utf8');
server=server.slice(0,start)+patch+server.slice(end);
fs.writeFileSync(path,server);
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
console.log('[R1794] matched model and size stock in customer submit');
