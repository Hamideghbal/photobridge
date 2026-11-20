'use strict';
// R1921 server-side pagination: 10 records only, scoped by lab and mode.
// This helper does not modify orders, files, invoices or audit history.
const modes=new Set(['print','album']),tabs=new Set(['flow','ready','completed']);
function params(input={}){
 const mode=modes.has(input.mode)?input.mode:'print';
 const tab=tabs.has(input.tab)?input.tab:'flow';
 const page=Number(input.page||1);
 if(!Number.isSafeInteger(page)||page<1||page>100000)throw Object.assign(Error('invalid_page'),{status:400});
 const q=String(input.search||'').trim();
 if(q.length>80)throw Object.assign(Error('search_too_long'),{status:400});
 return{mode,tab,page,search:q,limit:10,offset:(page-1)*10};
}
async function labOrderPage(db,labId,input={}){
 if(!/^[0-9a-f-]{36}$/i.test(labId||''))throw Object.assign(Error('invalid_lab'),{status:401});
 const {mode,tab,page,search,limit,offset}=params(input);
 const match=tab==='ready'?"o.status='ready'":tab==='completed'?"o.status='completed'":"o.status NOT IN ('ready','completed','cancelled','canceled','deleted')";
 const where=`o.lab_id=$1 AND o.mode=$2 AND ${match} AND o.status NOT IN ('cancelled','canceled','deleted') AND ($3='' OR o.number::text ILIKE $3 OR COALESCE(NULLIF(o.walkin_customer_name,''),u.name,'') ILIKE $3)`;
 const args=[labId,mode,search?'%'+search.replace(/[\\%_]/g,'\\$&')+'%':''];
 const query=`SELECT o.*,COALESCE(NULLIF(o.walkin_customer_name,''),u.name,'') AS customer_name
 FROM orders o LEFT JOIN users u ON u.id=o.customer_id
 WHERE ${where}
 ORDER BY o.created_at DESC,o.id DESC LIMIT $4 OFFSET $5`;
 const [list,total]=await Promise.all([
  db.query(query,[...args,limit,offset]),
  db.query(`SELECT count(*)::integer AS total FROM orders o LEFT JOIN users u ON u.id=o.customer_id WHERE ${where}`,args)
 ]);
 const count=Number(total.rows[0]?.total||0);
 return{orders:list.rows,page,pageSize:limit,total:count,pages:Math.max(1,Math.ceil(count/limit)),mode,tab,search};
}
module.exports={params,labOrderPage};
