import crypto from 'node:crypto';

const validUuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const hostName=value=>/^[a-z0-9][a-z0-9.-]{2,252}$/i.test(String(value||''))?String(value).toLowerCase():null;

// Only call from a verified, active, non-production equipment shop on its custom hostname
// AFTER the existing photographer credential endpoint and session checks succeed.
export async function issueEquipmentStoreHandoff(pool,{userId,shopId,host}={}){
 const hostname=hostName(host);
 if(!hostname||!validUuid(userId)||!validUuid(shopId))return null;
 const ticket=crypto.randomBytes(32).toString('base64url');
 await pool.query('DELETE FROM equipment_store_login_handoffs WHERE expires_at<now()');
 await pool.query(`INSERT INTO equipment_store_login_handoffs(token_hash,user_id,shop_id,origin_host,expires_at)
   VALUES($1,$2,$3,$4,now()+interval '60 seconds')`,[hash(ticket),userId,shopId,hostname]);
 return ticket;
}

// Origin is verified against the originating shop hostname. DELETE RETURNING is atomic:
// the same handoff can never be exchanged twice, including across application replicas.
export async function consumeEquipmentStoreHandoff(pool,{ticket,origin}={}){
 if(typeof ticket!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(ticket))return null;
 let domain;
 try{domain=new URL(origin);}catch{return null;}
 const hostname=hostName(domain.hostname);
 if(!hostname||domain.protocol!=='https:'||domain.origin!==origin)return null;
 const row=(await pool.query(`DELETE FROM equipment_store_login_handoffs
   WHERE token_hash=$1 AND origin_host=$2 AND expires_at>now()
   RETURNING user_id,shop_id`,[hash(ticket),hostname])).rows[0];
 if(!row)return null;
 const verified=await pool.query(`SELECT 1 FROM equipment_store_domains d
   JOIN equipment_rental_shops s ON s.id=d.shop_id
   JOIN users u ON u.id=$3
   WHERE d.hostname=$1 AND d.shop_id=$2 AND d.active=true AND d.verified_at IS NOT NULL
     AND d.routed_at IS NOT NULL AND d.released_at IS NULL
     AND s.active=true AND s.deleted_at IS NULL AND s.rental_enabled=true
     AND COALESCE(s.suspended,false)=false AND u.active=true AND u.photographer_enabled=true
   LIMIT 1`,[hostname,row.shop_id,row.user_id]);
 return verified.rowCount?{userId:row.user_id,shopId:row.shop_id}:null;
}

// Only read the fixed, URL-encoded form payload used for a top-level HTTPS POST.
// The handoff ticket is never placed in a URL, log-worthy query string or cookie.
export async function readEquipmentHandoffPost(req){
 if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(String(req.headers['content-type']||'')))return null;
 let size=0;const chunks=[];
 for await(const c of req){size+=c.length;if(size>512)return null;chunks.push(c);}
 const params=new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
 return params.size===2?{ticket:params.get('ticket'),origin:params.get('origin')}:null;
}

/** A restrictive no-referrer policy can serialize Origin as "null".
 *  A valid single-use ticket is independently tied to the claimed, verified
 *  shop hostname; a concrete mismatching browser Origin still fails closed. */
export function equipmentHandoffOriginAllowed(browserOrigin,claimedOrigin){
 const origin=String(browserOrigin||'');
 return !origin||origin==='null'||origin===claimedOrigin;
}
