import fs from 'node:fs';
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
const one=(a,b,why)=>{const n=s.split(a).length-1;if(n!==1)throw Error(why+': expected one anchor; saw '+n);s=s.replace(a,b)};
if(!s.includes('r1250_sms_ready_marker')){
 one('SELECT enabled,booking_approved_enabled,invite_enabled,booking_status_enabled,updated_at FROM equipment_rental_sms_settings','SELECT enabled,booking_approved_enabled,invite_enabled,booking_status_enabled,ready_enabled,updated_at FROM equipment_rental_sms_settings','snapshot query');
 one('inviteEnabled:settings.invite_enabled !== false','inviteEnabled:true, readyEnabled:settings.ready_enabled !== false','wallet snapshot');
 one('SELECT enabled,booking_approved_enabled,invite_enabled,booking_status_enabled FROM equipment_rental_sms_settings','SELECT enabled,booking_approved_enabled,invite_enabled,booking_status_enabled,ready_enabled FROM equipment_rental_sms_settings','auto query');
 const a=s.indexOf('async function equipmentRentalSmsAutoAllowed(shopId, kind)'),b=s.indexOf('async function equipmentRentalNotifyBookingStatusSms',a);
 if(a<0||b<0)throw Error('policy bounds missing');
 let policy=s.slice(a,b);
 policy=policy.replace("    if (r.enabled === false) return false;","    if (kind==='invite') return true;\n    if (r.enabled === false) return false;");
 policy=policy.replace("    if (kind==='invite') return r.invite_enabled !== false;","    if (kind==='production_ready') return r.ready_enabled !== false;");
 if(!policy.includes("kind==='production_ready'"))throw Error('policy not updated');
 s=s.slice(0,a)+policy+s.slice(b);
 one('UPDATE equipment_rental_sms_settings SET enabled=$2,booking_approved_enabled=$3,invite_enabled=$4,booking_status_enabled=$5,updated_at=now()','UPDATE equipment_rental_sms_settings SET enabled=$2,booking_approved_enabled=$3,invite_enabled=true,booking_status_enabled=$4,ready_enabled=$5,updated_at=now()','settings update');
 one('[shop.id, Boolean(b.enabled), Boolean(b.bookingApprovedEnabled), Boolean(b.inviteEnabled), b.bookingStatusEnabled !== false]','[shop.id, Boolean(b.enabled), Boolean(b.bookingApprovedEnabled), b.bookingStatusEnabled !== false, b.readyEnabled !== false]','settings params');
 one('inviteEnabled:Boolean(b.inviteEnabled) }).catch','inviteEnabled:true, readyEnabled:b.readyEnabled !== false }).catch','settings audit');
 const chargeStart="    let charge = null;\n    if (args.chargeRentalShopId && args.serviceKey) {";
 const chargeBody=[
 "    let charge = null;",
 "    // r1250_sms_ready_marker: only a verified platform-admin-owned TEST store.",
 "    let adminTestNoCharge=false;",
 "    if(args.chargeRentalShopId&&args.userId){",
 "      const q=await pool.query('SELECT '+testAccountSql('shop','s')+' AS test_shop FROM equipment_rental_shops s JOIN users actor ON actor.id=$2 AND actor.platform_role=\\'platform_admin\\' AND actor.active=true WHERE s.id=$1 LIMIT 1',[args.chargeRentalShopId,args.userId]);",
 "      adminTestNoCharge=q.rows[0]?.test_shop===true;",
 "    }",
 "    if (args.chargeRentalShopId && args.serviceKey && !adminTestNoCharge) {"
 ].join('\n');
 one(chargeStart,chargeBody,'test SMS bypass guard');
 one("const title = rejected ? 'درخواست آفیش تجهیزات شما رد شد.' : 'رزرو تجهیزات شما توسط فروشگاه لغو شد.';","const title = rejected ? 'سفارش تجهیزات شما رد شد.' : 'سفارش تجهیزات شما توسط فروشگاه لغو شد.';","cancel order SMS");
 one('برای مشاهده وضعیت، بخش آفیش‌های تجهیزات را باز کنید.','برای مشاهده وضعیت، بخش سفارش‌های تجهیزات را باز کنید.','SMS landing copy');
 const code='$'+'{bookingId.slice(0,8).toUpperCase()}';
 one('کد رزرو: '+code,'کد سفارش: '+code,'SMS tracking label');
 one('وضعیت رزرو در پنل تجهیزات در دسترس است.','وضعیت سفارش در پنل تجهیزات در دسترس است.','SMS order status');
 const start=s.indexOf("        let sms=null;if(b.action==='ready'&&result.buyer_mobile)try{");
 const end=s.indexOf('        await audit(a.userId,undefined,',start);
 if(start<0||end<0)throw Error('frame action notification bounds missing');
 const block=[
 "        let sms=null;",
 "        if(result.buyer_mobile&&['confirm','cancel','ready'].includes(b.action)){",
 "          const kind=b.action==='ready'?'production_ready':b.action==='confirm'?'booking_approved':'booking_status';",
 "          const allowed=await equipmentRentalSmsAutoAllowed(shop.id,kind);",
 "          if(allowed)try{",
 "            const n=String(shop.name||'فروشگاه قاب و شاسی');",
 "            const message=b.action==='ready'?'PhotoBridge: سفارش قاب و شاسی شما در «'+n+'» آماده است. '+(result.delivery_method==='courier'?'برای ارسال با پیک پیگیری کنید.':'برای دریافت حضوری مراجعه کنید.'):b.action==='confirm'?'PhotoBridge\\nسفارش قاب و شاسی شما در «'+n+'» تأیید شد.\\nشماره سفارش: '+String(result.id).slice(0,8).toUpperCase():'PhotoBridge\\nسفارش قاب و شاسی شما در «'+n+'» لغو شد.\\nشماره سفارش: '+String(result.id).slice(0,8).toUpperCase();",
 "            const purpose=b.action==='ready'?'rental_production_ready':b.action==='confirm'?'frame_order_approved':'frame_order_cancelled';",
 "            const eventKey=b.action==='ready'?'production_ready':b.action==='confirm'?'booking_approved':'booking_cancelled';",
 "            const out=await sendSms({chargeRentalShopId:shop.id,serviceKey:'sms_customer_notification',userId:a.userId,mobile:result.buyer_mobile,message,purpose,eventKey,referenceId:result.id,metadata:{shopId:shop.id,orderId:result.id}});",
 "            sms={sent:true,reference:out?.reference||null};",
 "          }catch(e){sms={sent:false,error:e.message};console.error('[frame-order-sms]',{orderId:result.id,action:b.action,message:e.message});}",
 "          else sms={sent:false,skipped:true,reason:'disabled'};",
 "        }",
 ""
 ].join('\n');
 s=s.slice(0,start)+block+s.slice(end);
 fs.writeFileSync(file,s);
}
console.log('r1250 server SMS patch ready');
