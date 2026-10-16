// R1264: narrow, idempotent admin manager-contact patch.
// The login number and verified user membership are deliberately unchanged.
import fs from 'node:fs';
const file='dist/api/server.js';
let src=fs.readFileSync(file,'utf8');
const marker='/* PB_R1264_ADMIN_MANAGER_MOBILE_ONLY */';
if(!src.includes(marker)){
 const anchor="        const discountPercent = b.subscriptionDiscountPercent === undefined ? Number(current.subscription_discount_percent || 0) : entityDiscountPercent(b.subscriptionDiscountPercent);";
 if(src.split(anchor).length!==2)throw Error('[R1264] unique admin store PATCH anchor changed');
 const fragment=[
  '        /* PB_R1264_ADMIN_MANAGER_MOBILE_ONLY */',
  '        // Manager contact edits must never touch activation, subscription or memberships.',
  "        if(Object.keys(b).length===1&&Object.prototype.hasOwnProperty.call(b,'managerMobile')){",
  "            const mobile=normalizeMobile(String(b.managerMobile||''));",
  "            if(String(b.managerMobile||'').trim()&&!/^09\\d{9}$/.test(mobile))return sendJson(res,400,{error:'manager_mobile_invalid',message:'شماره موبایل مدیر باید با ۰۹ آغاز شود و ۱۱ رقم باشد.'});",
  '            try{',
  "                const updated=await pool.query('UPDATE equipment_rental_shops SET manager_mobile=$2,updated_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING manager_mobile',[current.id,mobile||null]);",
  "                if(!updated.rowCount)return sendJson(res,404,{error:'rental_shop_not_found'});",
  "                await audit(a.userId,undefined,'platform_admin.shop_manager_mobile_update','equipment_rental_shop',current.id,{mobileChanged:true}).catch(()=>{});",
  "                return sendJson(res,200,{ok:true,manager_mobile:updated.rows[0].manager_mobile});",
  "            }catch(e){",
  "                console.error('[admin-store-manager-mobile]',{shopId:current.id,code:String(e?.code||''),message:String(e?.message||'')});",
  "                return sendJson(res,500,{error:'manager_mobile_save_failed',diagnosticCode:String(e?.code||'')||undefined});",
  '            }',
  '        }',
  ''
 ].join('\n');
 src=src.replace(anchor,fragment+anchor);
 fs.writeFileSync(file,src);
 console.log('[PhotoBridge R1264] isolated admin manager mobile edit enabled');
}else console.log('[PhotoBridge R1264] isolated admin manager mobile edit already present');
