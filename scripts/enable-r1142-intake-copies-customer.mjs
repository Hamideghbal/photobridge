import fs from 'node:fs';
const file='dist/api/server.js';let source=fs.readFileSync(file,'utf8');
function patchSection(start,end,changes){const a=source.indexOf(start),b=source.indexOf(end,a);if(a<0||b<0)throw Error('R1142 intake section missing');let part=source.slice(a,b);for(const [before,after]of changes){if(part.includes(after))continue;if(part.split(before).length!==2)throw Error('R1142 intake patch mismatch: '+before);part=part.replace(before,after);}source=source.slice(0,a)+part+source.slice(b);}
patchSection("if (req.method === 'POST' && url.pathname === '/api/lab/delegated-orders')",'const delegatedFiles =',[ 
 ["const studioName = String(b.studioName || '').trim().slice(0, 140);","const studioName = String(b.studioName || b.mobile || '').trim().slice(0, 140);"],
 ["const mode = String(b.mode || 'print');","// PB1142 optional mobile-only customer, opening debt and invitation\n            const initialDebt = Number(b.initialDebt ?? 0);\n            if (!Number.isSafeInteger(initialDebt) || initialDebt < 0 || initialDebt > 1_000_000_000_000 || (existingCustomerId && initialDebt)) return sendJson(res,400,{error:'invalid_initial_debt'});\n            const mode = String(b.mode || 'print');"],
 ["const paymentStatus = settlement === 'prepaid'",`if (initialDebt > 0) {
                    const priorDebt = await c.query("SELECT id FROM finance_transactions WHERE lab_id=$1 AND reference_type='lab_delegated_opening_debt' AND reference_id=$2 LIMIT 1",[labId,customerId]);
                    if(priorDebt.rowCount){await c.query('ROLLBACK');return sendJson(res,409,{error:'initial_debt_already_recorded'});}
                    await ensureFinanceAccounts(c,labId);
                    await postBalancedFinanceTransaction(c,{labId,actorId:a.userId,referenceType:'lab_delegated_opening_debt',referenceId:customerId,description:'بدهی قبلی مشتری حضوری '+mobile,lines:[{accountKey:'receivable',customerId,debit:initialDebt,note:'بدهی قبلی'},{accountKey:'opening_balance_equity',customerId,credit:initialDebt,note:'مانده افتتاحیه'}]});
                }
                const paymentStatus = settlement === 'prepaid'`],
 ["if (result.invitationId && result.newInvitation) {","if (result.invitationId && (b.sendInvitation === true || b.sendInvitation === undefined && result.newInvitation)) {"],
]);
patchSection("if (req.method === 'POST' && delegatedFiles)",'const delegatedLocalFile =',[
 ["const name = safeFileName(String(b.name || 'file'));",`const printCopies = Number(b.printCopies ?? 1);
            if(!Number.isInteger(printCopies)||printCopies<1||printCopies>99)return sendJson(res,400,{error:'invalid_print_copies'});
            let name = safeFileName(String(b.name || 'file'));
            if (!albumMode && printCopies > 1) {const dot=name.lastIndexOf('.'),stem=dot>0?name.slice(0,dot):name,ext=dot>0?name.slice(dot):'';name=safeFileName(stem.slice(0,110)+' = '+printCopies+ext);}`],
 ["crop_handling,original_state)\n                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)","crop_handling,print_copies,original_state)\n                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)"],
 ["String(b.cropHandling || '') === 'lab' ? 'lab' : 'none', deviceLocal ? 'active' : 'pending'","String(b.cropHandling || '') === 'lab' ? 'lab' : 'none', albumMode ? 1 : printCopies, deviceLocal ? 'active' : 'pending'"],
]);
patchSection("if (req.method === 'POST' && submitDelegatedOrder)","if (req.method === 'GET' && url.pathname === '/api/lab/orders')",[
 ["count(*) FILTER(WHERE chassis)::int chassis_qty,", "COALESCE(SUM(print_copies) FILTER(WHERE chassis),0)::int chassis_qty,"],
 ["count(*) FILTER(WHERE frame)::int frame_qty", "COALESCE(SUM(print_copies) FILTER(WHERE frame),0)::int frame_qty"],
]);
fs.writeFileSync(file,source);
