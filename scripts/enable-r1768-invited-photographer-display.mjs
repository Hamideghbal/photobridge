// R1768: orders/finance show the actual registered studio name for a lab-invited
// photographer whose shared users.name was initially their mobile number.
// Read/display-only SQL repair. No user rename, invoice mutation or data migration.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/api/server.js';
let server=fs.readFileSync(file,'utf8');
const marker='/* PB_R1768_INVITED_STUDIO_DISPLAY */';
if(server.includes(marker))throw Error('[R1768] display-name repair already applied twice');
const profile="(SELECT NULLIF(BTRIM(pb_profile.studio_name),'') FROM photographer_profiles pb_profile WHERE pb_profile.user_id=u.id LIMIT 1)";
function once(source,from,to,label){
 const count=source.split(from).length-1;
 if(count!==1)throw Error('[R1768] '+label+' anchor count '+count);
 return source.replace(from,to);
}
// Preserve the historical "(حساب حذف‌شده)" rule. Only improve the active
// photographer display fallback in the existing read-only SQL expression.
const start=server.indexOf('function labFinanceCustomerNameSql() {');
const end=server.indexOf('\nasync function audit(',start);
if(start<0||end<start||end-start>2000)throw Error('[R1768] finance name resolver boundary moved');
let resolver=server.slice(start,end);
resolver=once(resolver,'      ELSE u.name END','      ELSE COALESCE('+profile+',u.name) END','finance active studio name');
server=server.slice(0,start)+resolver+server.slice(end);
// Maintain walk-in name precedence; canonical profile name is only a fallback.
const walkin='COALESCE(o.walkin_customer_name,u.name)';
const expected=5;
if(server.split(walkin).length-1!==expected)
 throw Error('[R1768] order/invoice walk-in display query count '+(server.split(walkin).length-1));
server=server.split(walkin).join('COALESCE(o.walkin_customer_name,'+profile+',u.name)');
server=once(server,
 "COALESCE(o.walkin_customer_name,u.name,'مشتری آزاد')",
 "COALESCE(o.walkin_customer_name,"+profile+",u.name,'مشتری آزاد')",
 'completed order archive display name');
// The lab's pending-print card and manual-intake submission read u.name directly.
const pendingAt=server.indexOf('async function pendingPrintAlerts(');
const pendingEnd=server.indexOf('async function acknowledgePrintAlerts(',pendingAt);
if(pendingAt<0||pendingEnd<pendingAt)throw Error('[R1768] pending print query boundary moved');
let pending=server.slice(pendingAt,pendingEnd);
pending=once(pending,'o.priority,o.delivery,u.name customer_name,',
 'o.priority,o.delivery,COALESCE('+profile+',u.name) customer_name,',
 'pending print photographer name');
server=server.slice(0,pendingAt)+pending+server.slice(pendingEnd);
server=once(server,
 "SELECT o.*,u.name customer_name FROM orders o\n                    JOIN lab_delegated_order_intakes",
 "SELECT o.*,COALESCE("+profile+",u.name) customer_name FROM orders o\n                    JOIN lab_delegated_order_intakes",
 'delegated order submission name');
// Do not change signup identities, historical posted invoices or finance values.
server+='\n'+marker+'\n';
fs.writeFileSync(file,server);
execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
console.log('[R1768] actual photographer studio name exposed to lab orders, invoice views and financial displays');
