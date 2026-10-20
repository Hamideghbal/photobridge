const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const server = fs.readFileSync('dist/api/server.js', 'utf8');
const start = server.indexOf("    if (req.method === 'POST' && url.pathname === '/api/photographer-invites/send-sms') {");
const end = server.indexOf('    const photographerInvitePatch', start);
assert(start > 0 && end > start, 'Invite route must exist');
const handler = server.slice(start, end);
async function send(fail, reuse = false) {
  const userId = '11111111-1111-4111-8111-111111111111';
  const invite = { id:'22222222-2222-4222-8222-222222222222',code:'PB-TEST',target_mobile:'09123456789' };
  let sent = 0, inserted = 0;
  const ctx = {
    requestPortal: () => 'photographer', inviteIssuerScope: () => ({type:'photographer',labId:null}),
    bodyJson: async () => ({mobile:'09123456789'}), normalizeMobile: x => x,
    mobileAlreadyRegistered: async () => false,
    pool:{query:async sql => {
      if(sql.includes('SELECT name FROM users')) return {rows:[{name:'Photographer'}],rowCount:1};
      if(sql.includes('INSERT INTO photographer_invites')){inserted++;return {rows:[invite],rowCount:1};}
      if(sql.includes('SELECT * FROM photographer_invites'))return {rows:reuse?[invite]:[],rowCount:reuse?1:0};
      throw Error('Unexpected SQL '+sql.slice(0,55));
    }},
    newPhotographerInviteCode: () => 'PB-TEST',
    photographerInviteMobileBinding: () => 'binding',
    PUBLIC_APP_URL: 'https://photobridge.ir', PUBLIC_GUIDE_URL:'https://photobridge.ir/guide',
    sendSms: async args => {
      sent++; assert.equal(args.mobile,'09123456789');assert(args.message.includes('PB-TEST'));
      if(fail) throw Object.assign(new Error(fail),{status:422,responseText:'PRIVATE-PROVIDER-DIAGNOSTIC'});
      return {reference:'ref-1'};
    },
    audit:async()=>{},photographerInviteByCode:async()=>invite,photographerInvitePublicView:x=>x,
    sendJson:(_res,status,data)=>({status,data}),
    console:{error:()=>{}},JSON,Math,Number,String,encodeURIComponent
  };
  vm.createContext(ctx);
  vm.runInContext('this.callInvite=async(req,res,url,a)=>{'+handler+'}',ctx);
  const result = await ctx.callInvite({method:'POST'},{},{pathname:'/api/photographer-invites/send-sms'},{userId});
  return {result,sent,inserted};
}
test('new invitation sends one SMS',async()=>{
  const {result,sent,inserted}=await send();
  assert.equal(result.status,200);assert.equal(result.data.sms.sent,true);
  assert.equal(sent,1);assert.equal(inserted,1);
});
test('existing targeted invitation is reused',async()=>{
  const {result,inserted}=await send(null,true);
  assert.equal(result.status,200);assert.equal(result.data.reused,true);assert.equal(inserted,0);
});
test('provider rejection returns safe actionable diagnostic and keeps invite',async()=>{
  const {result,sent}=await send('sms_provider_rejected');
  assert.equal(result.status,502);assert.equal(result.data.error,'sms_provider_rejected');
  assert.equal(result.data.inviteCreated,true);assert.equal(result.data.canRetry,true);
  assert.equal(result.data.sms,undefined);assert.equal(result.data.providerStatus,422);
  assert.equal(result.data.providerResponse,undefined);assert.equal(sent,1);
});
test('missing gateway is a 503, not a false successful SMS',async()=>{
  const {result}=await send('sms_not_configured');
  assert.equal(result.status,503);assert.equal(result.data.inviteCreated,true);
});
test('desktop cards span page width but compact header remains bounded',()=>{
  const css=fs.readFileSync('dist/web/photobridge-r1318-gallery-cards.css','utf8');
  const layout=fs.readFileSync('dist/web/photobridge-r1310-layout.css','utf8');
  const a=fs.readFileSync('scripts/enable-r1318-photographer-gallery.mjs','utf8');
  const b=fs.readFileSync('scripts/enable-r1310-gallery-mobile-layout.mjs','utf8');
  assert(css.includes('@media (min-width:821px)'));
  assert(css.includes('grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))'));
  assert(css.includes('max-width:760px!important'));
  assert(css.includes('.clientGalleryCards>.clientGalleryCard'));
  assert(layout.includes('.clientGalleryWorkspace{width:100%!important;max-width:none!important'));
  assert(a.includes('gallery-cards.css?v=r1328') || a.includes('css}?v=r1328'));
  assert(b.includes('layout.css?v=r1328'));
  assert.equal(fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim(),
   '2026-10-20-r1329-photographer-gallery-invite-chooser');
});
