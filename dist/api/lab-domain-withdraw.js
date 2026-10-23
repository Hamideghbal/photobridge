export async function withdrawDomainRequest({pool,labId,domain}){
 const c=await pool.connect();try{await c.query('BEGIN');
 const key='lab_domain_request:'+labId+':'+domain;
 const r=(await c.query('SELECT value FROM platform_settings WHERE key=$1 FOR UPDATE',[key])).rows[0]?.value;
 if(!r)throw Object.assign(Error('request_not_found'),{status:404});
 if(r.gatewayCheckoutId||r.paymentTransactionId||r.paymentStatus||!['pending','reviewing','quoted'].includes(r.status))throw Object.assign(Error('domain_request_cannot_remove'),{status:409});
 await c.query('DELETE FROM platform_settings WHERE key=$1',[key]);await c.query('COMMIT');return {ok:true,domain};
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
