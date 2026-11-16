import crypto from 'node:crypto';
const paths=['/customer-crm.html?portal=photographer','/customer-crm.html?portal=lab','/customer-crm.html?portal=photographer&pbDesktopContent=1','/customer-crm-ui.js?v=r1864','/customer-calendar.js?v=r1865'];
for(const path of paths){
 const response=await fetch('https://photobridge.ir'+path,{signal:AbortSignal.timeout(20000),headers:{'cache-control':'no-cache'}});
 const body=await response.text();
 console.log(JSON.stringify({path,status:response.status,type:response.headers.get('content-type'),cache:response.headers.get('cache-control'),age:response.headers.get('age'),revision:response.headers.get('x-photobridge-deploy-revision'),sha256:crypto.createHash('sha256').update(body).digest('hex'),calendar:body.includes('id="cal-days"'),consent:body.includes('id="marketing-consent"'),back:body.includes('id="back"'),duplicateHeaders:(body.match(/<header\b/g)||[]).length}));
 if(!response.ok)throw new Error('CRM request failed: '+path);
}
