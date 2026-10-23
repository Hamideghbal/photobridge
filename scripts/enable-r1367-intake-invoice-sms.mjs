import fs from 'node:fs';
const once=(s,a,b,label)=>{const n=s.split(a).length-1;if(n===1)return s.replace(a,b);if(n===0&&s.includes(b))return s;throw Error('R1367 SMS anchor changed: '+label)};
const file='dist/api/server.js';let server=fs.readFileSync(file,'utf8');
if(!server.includes('/* PB1367 order-scoped invoice SMS */')){
 server="import {recordIntakeInvoiceSms,intakeInvoiceSmsState,dispatchIntakeInvoiceSms,startIntakeInvoiceSmsWorker} from './lab-intake-invoice-sms.js';\n"+server;
 const a=server.indexOf('const submitDelegatedOrder ='),b=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/lab/push/subscribe')",a);
 if(a<0||b<0)throw Error('R1367 submit route missing');let block=server.slice(a,b);
 block=once(block,'const orderId = submitDelegatedOrder[1], c = await pool.connect();',`const smsBody=await bodyJson(req);
            if(smsBody.sendInvoiceSms!==undefined&&typeof smsBody.sendInvoiceSms!=='boolean')return sendJson(res,400,{error:'invalid_invoice_sms_choice'});
            const orderId = submitDelegatedOrder[1], c = await pool.connect();`,'submit body');
 block=once(block,"return sendJson(res, 200, { order, invoice: invoice.rows[0] || null, replay: true });", "return sendJson(res, 200, { order, invoice: invoice.rows[0] || null, replay: true,invoiceSms:await intakeInvoiceSmsState(c,labId,orderId) });",'replay state');
 block=once(block,'submitted = uq.rows[0];',`submitted = uq.rows[0];
                /* PB1367 order-scoped invoice SMS */
                await recordIntakeInvoiceSms(c,{labId,orderId,actorId:a.userId,requested:smsBody.sendInvoiceSms===true});`,'persist consent');
 block=once(block,'return sendJson(res, 200, { order: submitted, invoice: submitted._invoice || null,',`const invoiceSms=await dispatchIntakeInvoiceSms({pool,sendSms,normalizeMobile},labId,orderId).catch(()=>({requested:smsBody.sendInvoiceSms===true,status:'pending'}));
            return sendJson(res, 200, { order: submitted, invoice: submitted._invoice || null,invoiceSms,`,'submit response');
 server=server.slice(0,a)+block+server.slice(b);
 // A manual intake's dedicated invoice SMS is controlled by its checkbox; retain ordinary status notifications.
 server=once(server,"if (status === 'ready' && invoice && r.invoice_enabled)","if (status === 'ready' && invoice && r.invoice_enabled && !(await pool.query('SELECT 1 FROM lab_intake_invoice_sms WHERE order_id=$1 AND lab_id=$2',[order.id,labId])).rowCount)",'avoid duplicate invoice SMS');
 server=once(server,"server.listen(PORT, '0.0.0.0', () => { console.log", "server.listen(PORT, '0.0.0.0', () => { startIntakeInvoiceSmsWorker({pool,sendSms,normalizeMobile}); console.log",'worker startup');
 fs.writeFileSync(file,server);
}
const page='dist/web/index.html';let html=fs.readFileSync(page,'utf8');html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?v=)[^&"'\s]+/g,'$1r1367');fs.writeFileSync(page,html);
