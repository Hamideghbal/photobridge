import fs from 'node:fs';
const patch=JSON.parse(fs.readFileSync('scripts/r100f91-release-patch.json','utf8'));
const path='dist/api/server.js';
let source=fs.readFileSync(path,'utf8');
if(!source.includes('platform_admin.shop_subscription_discount')){
 for(const [find,replacement] of patch.serverReplacements){
   const count=source.split(find).length-1;
   if(count!==1)throw new Error('Expected server patch exactly once; found '+count+': '+find.slice(0,100));
   source=source.replace(find,replacement);
 }
 fs.writeFileSync(path,source);console.log('Patched server: discount saving and free invite SMS');
}else console.log('Server patch already present');
for(const [path,css] of patch.htmlInserts){
 let s=fs.readFileSync(path,'utf8');
 const marker=path.includes('portal')?'pbR100F91OfficeMobile':'pbR100F91ShopperMobile';
 if(s.includes(marker)){console.log('Already patched: '+path);continue}
 const count=s.split('</body>').length-1;
 if(count!==1)throw new Error('Expected one body closing tag for '+path+', got '+count);
 s=s.replace('</body>',css+'\n</body>');fs.writeFileSync(path,s);
 console.log('Patched mobile UI '+path);
}
fs.writeFileSync('DEPLOY_REVISION.txt',patch.revision);
const final=fs.readFileSync('dist/api/server.js','utf8');
for(const x of ['platform_admin.shop_subscription_discount','platform_admin.lab_subscription_discount'])if(!final.includes(x))throw new Error('Missing isolated discount save route: '+x);
for(const x of ["chargeLabId: scope.labId, serviceKey: 'sms_customer_notification'","userId:a.userId,chargeRentalShopId:shop.id,serviceKey:'sms_customer_notification',referenceId:context"]){if(final.includes(x))throw new Error('Invite still debits SMS wallet: '+x)}
console.log('R100F91 patch validated.');
