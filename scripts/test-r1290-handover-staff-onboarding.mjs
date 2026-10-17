import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {addHandoverStaff, activateHandoverInvite, inspectHandoverInvite, listHandoverInvites, cancelHandoverInvite} from '../dist/api/handover-staff-onboarding.js';

function mockDb(initialUsers=[]) {
  const state={users:initialUsers.map(x=>({...x})), memberships:[], invitations:[]};
  const response=rows=>({rows,rowCount:rows.length});
  const db={
    state, async connect(){return {query:db.query,release(){}};},
    async query(sql,params=[]) {
      if(['BEGIN','COMMIT','ROLLBACK'].includes(sql))return response([]);
      if(sql.startsWith('SELECT id,name,mobile,active,platform_role FROM users')) {
        const matches=state.users.filter(x=>x.mobile.slice(-10)===String(params[0]).slice(-10)).slice(0,3);
        return response(matches);
      }
      if(sql.startsWith('SELECT shop_id,role FROM equipment_rental_shop_memberships')) return response(state.memberships.filter(x=>x.user_id===params[0] && x.active && ['shop_admin','handover_staff'].includes(x.role)));
      if(sql.startsWith('INSERT INTO equipment_rental_shop_memberships')) {
        const item={shop_id:params[0],user_id:params[1],role:'handover_staff',active:true};
        const old=state.memberships.find(x=>x.user_id===item.user_id&&x.shop_id===item.shop_id&&x.role===item.role);
        if(old)old.active=true;else state.memberships.push(item);
        return response([item]);
      }
      if(sql.startsWith('UPDATE equipment_rental_handover_staff_invitations SET status=\'cancelled\'')) {
        const matches=state.invitations.filter(x=>sql.includes('WHERE id=$1')?x.id===params[0]&&x.shop_id===params[1]:x.shop_id===params[0]&&x.mobile===params[1]);
        for(const x of matches)x.status='cancelled';return response(matches);
      }
      if(sql.startsWith('SELECT id,status,sent_at FROM equipment_rental_handover_staff_invitations'))return response(state.invitations.filter(x=>x.shop_id===params[0]&&x.mobile===params[1]));
      if(sql.startsWith('INSERT INTO equipment_rental_handover_staff_invitations')) {
        let old=state.invitations.find(x=>x.shop_id===params[0]&&x.mobile===params[1]);
        if(!old){old={id:crypto.randomUUID(),shop_id:params[0],mobile:params[1]};state.invitations.push(old);}
        Object.assign(old,{name:params[2],token_hash:params[3],status:'pending',expires_at:new Date(Date.now()+48*3600_000),sent_at:new Date(),redeemed_at:null});
        return response([{id:old.id}]);
      }
      if(sql.startsWith('DELETE FROM equipment_rental_handover_staff_invitations')) {
        state.invitations=state.invitations.filter(x=>!(x.shop_id===params[0]&&x.mobile===params[1]&&x.token_hash===params[2]&&x.status==='pending'));
        return response([]);
      }
      if(sql.startsWith('SELECT id,mobile,name,expires_at,sent_at,created_at FROM equipment_rental_handover_staff_invitations'))return response(state.invitations.filter(x=>x.shop_id===params[0]&&x.status==='pending'&&x.expires_at>Date.now()).map(x=>({...x})));
      if(sql.startsWith('SELECT i.name,i.mobile,i.expires_at,s.name shop_name'))return response(state.invitations.filter(x=>x.token_hash===params[0]&&x.status==='pending'&&x.expires_at>Date.now()).map(x=>({...x,shop_name:'فروشگاه تست'})));
      if(sql.startsWith('SELECT i.*,s.deleted_at'))return response(state.invitations.filter(x=>x.token_hash===params[0]).map(x=>({...x,deleted_at:null,shop_active:true,shop_suspended:false})));
      if(sql.startsWith('INSERT INTO users(')){
        const user={id:crypto.randomUUID(),name:params[0],mobile:params[1],password_hash:params[2],platform_role:'user',active:true,mobile_verified_at:new Date(),photographer_enabled:false};
        state.users.push(user);return response([{id:user.id}]);
      }
      if(sql.startsWith('UPDATE equipment_rental_handover_staff_invitations SET status=\'redeemed\'')) {
        const old=state.invitations.find(x=>x.id===params[0]);old.status='redeemed';old.redeemed_at=new Date();return response([old]);
      }
      throw Error('Unexpected SQL in test: '+sql.slice(0,100));
    }
  };
  return db;
}
const shop={id:'shop-a',name:'تجهیزات تست'};
const passHash=value=>'hashed:'+value;

test('existing photographer identity and password are preserved, with only handover role granted',async()=>{
  const user={id:'photographer-1',name:'عکاس موجود',mobile:'09123456789',active:true,platform_role:'user',password_hash:'original'};
  const pool=mockDb([user]);
  const result=await addHandoverStaff({pool,shop,mobile:user.mobile,name:'نام متفاوت',sendSms:()=>{throw Error('must not SMS existing account')},publicAppUrl:'https://photobridge.ir'});
  assert.equal(result.pending,false);
  assert.equal(pool.state.users.length,1);
  assert.equal(pool.state.users[0].password_hash,'original');
  assert.equal(pool.state.users[0].name,'عکاس موجود');
  assert.deepEqual(pool.state.memberships.map(x=>x.role),['handover_staff']);
});

test('unknown mobile receives link, never a password; token is hashed and redeemed once',async()=>{
  const pool=mockDb(),sms=[];
  const result=await addHandoverStaff({pool,shop,mobile:'09112223344',name:'اپراتور',publicAppUrl:'https://photobridge.ir',sendSms:async x=>sms.push(x)});
  assert.equal(result.pending,true);assert.equal(result.inviteSent,true);
  assert.equal(pool.state.users.length,0);
  assert.equal(sms.length,1);
  const link=sms[0].message.match(/https:\/\/photobridge\.ir\/rental\/staff-activate\?token=[A-Za-z0-9_-]{43}/)?.[0];
  assert.ok(link);
  const token=new URL(link).searchParams.get('token');
  assert.equal(pool.state.invitations[0].token_hash,crypto.createHash('sha256').update(token).digest('hex'));
  assert.equal(JSON.stringify(result).includes(token),false);
  const meta=await inspectHandoverInvite(pool,token);assert.equal(meta.shopName,'فروشگاه تست');
  const activation=await activateHandoverInvite({pool,token,password:'new-secure-password',confirmPassword:'new-secure-password',passwordHash:passHash});
  assert.deepEqual({ok:activation.ok,existing:activation.existingAccount},{ok:true,existing:false});
  assert.equal(pool.state.users[0].password_hash,'hashed:new-secure-password');
  assert.equal(pool.state.users[0].photographer_enabled,false);
  assert.equal(pool.state.memberships[0].role,'handover_staff');
  await assert.rejects(()=>activateHandoverInvite({pool,token,password:'other-password',confirmPassword:'other-password',passwordHash:passHash}),e=>e.message==='staff_invite_expired');
  await assert.rejects(()=>inspectHandoverInvite(pool,token),e=>e.message==='staff_invite_expired');
});

test('cancelled invitation no longer authorizes staff registration',async()=>{
  const pool=mockDb(),sms=[];
  const result=await addHandoverStaff({pool,shop,mobile:'09119998877',name:'اپراتور',publicAppUrl:'https://photobridge.ir',sendSms:async x=>sms.push(x)});
  const token=new URL(sms[0].message.match(/https:\/\/\S+/)[0]).searchParams.get('token');
  assert.equal((await listHandoverInvites(pool,shop.id)).length,1);
  assert.equal(await cancelHandoverInvite(pool,shop.id,result.inviteId),true);
  assert.equal((await listHandoverInvites(pool,shop.id)).length,0);
  await assert.rejects(()=>activateHandoverInvite({pool,token,password:'secure-password',confirmPassword:'secure-password',passwordHash:passHash}),e=>e.message==='staff_invite_expired');
});

test('failed SMS does not leave usable invitation and existing managers cannot be reassigned',async()=>{
  const pool=mockDb();
  await assert.rejects(()=>addHandoverStaff({pool,shop,mobile:'09110000001',sendSms:async()=>{throw Error('provider-down')}}),e=>e.message==='sms_send_failed');
  assert.equal(pool.state.invitations.length,0);
  const owner=mockDb([{id:'owner',name:'مدیر',mobile:'09120000000',active:true,platform_role:'user'}]);
  owner.state.memberships.push({shop_id:'other-shop',user_id:'owner',role:'shop_admin',active:true});
  await assert.rejects(()=>addHandoverStaff({pool:owner,shop,mobile:'09120000000',sendSms:async()=>{}}),e=>e.message==='staff_already_assigned');
});
