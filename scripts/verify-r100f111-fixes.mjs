// Regression guards for store/lab discounts, free invitation SMS, and mobile office.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const server=read('dist/api/server.js');
const store=read('dist/web/photobridge-v904r19-admin-stores.js');
const lab=read('dist/web/photobridge-r100f90-entity-discount-activation.js');
const portal=read('dist/api/equipment-rental-portal.html');
const assertIncludes=(s,part,msg)=>assert.ok(s.includes(part),msg);
const adminPaths=[
  "/api/admin/equipment-rental/shops/",
  "/api/admin/labs/"
];
for(const path of adminPaths){
  assertIncludes(server,path.includes('equipment-rental')?'adminRentalShopDiscount':'adminLabDiscount', 'Missing discount-only backend route for '+path);
}
assertIncludes(server,'subscription_discount_amount=0,updated_at=now() WHERE id=$1 RETURNING subscription_discount_percent','Store percent should clear prior fixed discount without touching store profile');
assertIncludes(server,'subscription_discount_enabled=($2::numeric>0),subscription_discount_amount=0','Lab percent should replace old fixed discount');
assertIncludes(store,"'/subscription-discount'",'Store admin must use discount-only route');
assertIncludes(lab,"'/subscription-discount'",'Lab admin must use discount-only route');
assertIncludes(lab,"actual.subscription_discount_percent",'Lab save must verify actual persisted value');
assertIncludes(store,'Number(saved.subscriptionDiscountPercent)!==p','Store save must verify server acknowledgement');
const free=['rental_photographer_invite','rental_manual_office','lab_photographer_permanent_invite','lab_invitation'];
for(const purpose of free)assertIncludes(server,"'"+purpose+"'",'Missing free invite purpose: '+purpose);
assertIncludes(server,'if (!freeInvitationSms && args.chargeRentalShopId && args.serviceKey)','Store SMS charges should skip invites only');
assertIncludes(server,'else if (!freeInvitationSms && args.chargeLabId && args.serviceKey)','Lab SMS charges should skip invites only');
assertIncludes(server,"purpose:'rental_birthday_greeting'",'Non-invitation store messages retain billable purpose');
assertIncludes(server,"purpose:'lab_birthday_greeting'",'Non-invitation lab messages retain billable purpose');
assertIncludes(portal,'pb1011MobileOfficeSubmitVisibility','Mobile modal footer style must be bundled');
assertIncludes(portal,'#bookingForm>.pb920BookingFooter{position:sticky!important;bottom:0!important','Mobile submit footer should remain inside modal viewport');
assertIncludes(portal,'#bookingForm>.actions{position:sticky!important;bottom:0!important','Legacy booking footer must also remain accessible');
assert.ok(portal.lastIndexOf('pb1011MobileOfficeSubmitVisibility')>portal.lastIndexOf('pbR91ManualOfficeInnerScroll'), 'Mobile patch must override previous layout CSS');
console.log('R100F111 regression checks passed (admin discount write/read, SMS charge separation, mobile modal footer).');
