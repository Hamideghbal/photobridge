'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = path => fs.readFileSync(path, 'utf8');
const camera = ['equipment_rental','equipment_sale','equipment_rental_sale'];
const frames = ['frame','chassis','frame_chassis'];
const uid = '22222222-2222-4222-8222-222222222222';
const sid = '11111111-1111-4111-8111-111111111111';

test('R1825 edits only rental camera store API and portal; protects lab and frame source', () => {
  const src=read('scripts/enable-r1825-camera-store-staff-access.mjs');
  assert(src.includes("read('dist/api/server.js')"));
  assert(src.includes("read('dist/api/equipment-rental-portal.html')"));
  assert(!src.includes("write('dist/web/assets/"));
  assert(!src.includes("write('dist/web/photobridge-r1207-frame-store.js'"));
  assert(!src.includes("write('dist/web/lab-"));
  assert(!src.includes("write('dist/web/index.html'"));
  assert(src.includes("['equipment_rental','equipment_sale','equipment_rental_sale']"));
  const revisionNumber=Number(read('DEPLOY_REVISION.txt').match(/-r(\d+)-/)?.[1]);
  assert(Number.isInteger(revisionNumber)&&revisionNumber>=1825,'R1825 release must be present in the current or a newer deploy revision');
});

test('R1825 rental session: deleted camera store membership cannot override current staff; frame behavior preserved', () => {
  const src=read('dist/api/server.js'),p=src.indexOf("if (portal === 'rental') {",src.indexOf('async function auth(req)'));
  const q=src.indexOf("WHERE m.user_id=$1 AND m.role IN ('shop_admin','handover_staff') AND m.active=true",p);
  assert(q>p);
  const segment=src.slice(q,q+370);
  assert(segment.includes("AND (s.deleted_at IS NULL OR COALESCE(s.business_category,'equipment_rental_sale') IN ('frame','chassis','frame_chassis'))"));
  const select = ({deleted,category}) => !deleted || frames.includes(category);
  assert.equal(select({deleted:true,category:'equipment_sale'}),false);
  assert.equal(select({deleted:false,category:'equipment_sale'}),true);
  assert.equal(select({deleted:true,category:'frame'}),true,'frame legacy behavior remains as before');
});

test('R1825 staff add: old deleted manager can join camera store; active managers/staff cannot', async () => {
  const s=read('dist/api/server.js'),a=s.indexOf("if(req.method==='POST'&&url.pathname==='/api/rental/handover-staff'){"),b=s.indexOf("if(req.method==='DELETE'&&rentalHandoverStaffRoute?.[1])",a);
  assert(a>0&&b>a);
  const route=new Function('req','url','a','equipmentRentalCurrentShop','sendJson','res','bodyJson','normalizeMobile','pool','crypto','passwordHash','sendSms','audit','return (async()=>{'+s.slice(a,b)+'})()');
  async function run({category='equipment_sale',activeManager=false,staffElsewhere=false,deletedManager=false,platformAdmin=false}={}){
    const sql=[];const db={
      async query(q){
        sql.push(q);
        if(q.includes('SELECT id,name,mobile,platform_role FROM users'))return {rowCount:1,rows:[{id:uid,name:'حساب قدیمی',mobile:'09123456789',platform_role:platformAdmin?'platform_admin':'user'}]};
        if(q.includes('FROM equipment_rental_shops WHERE deleted_at IS NULL AND manager_mobile'))return {rowCount:activeManager?1:0,rows:activeManager?[{id:sid}]:[]};
        if(q.includes('SELECT m.shop_id,m.role FROM equipment_rental_shop_memberships'))return {rowCount:staffElsewhere?1:0,rows:staffElsewhere?[{shop_id:'other',role:'handover_staff'}]:[]};
        if(q.includes('SELECT shop_id,role FROM equipment_rental_shop_memberships'))return {rowCount:deletedManager||staffElsewhere?1:0,rows:staffElsewhere?[{shop_id:'other',role:'handover_staff'}]:[{shop_id:'deleted-old-shop',role:'shop_admin'}]};
        return {rowCount:1,rows:[]};
      },release(){}
    };
    const result=await route({method:'POST'},{pathname:'/api/rental/handover-staff'},{userId:sid},
      async()=>({id:sid,business_category:category,name:'فروشگاه دوربین'}),
      (res,status,body)=>({status,body}),null,async()=>({name:'کارمند',mobile:'09123456789'}),v=>v,
      {connect:async()=>db},{randomBytes:()=>({toString:()=> 'random-pass'})},()=>'',async()=>{},async()=>{});
    return {result,sql};
  }
  for(const category of camera){
    const x=await run({category,deletedManager:true});
    assert.equal(x.result.status,201,category);
    assert(x.sql.some(q=>q.includes('INSERT INTO equipment_rental_shop_memberships')));
    assert(x.sql.some(q=>q.includes('SELECT id FROM users WHERE id=$1 FOR UPDATE')));
  }
  for(const options of [{activeManager:true},{staffElsewhere:true},{activeManager:true,platformAdmin:true}]){
    const x=await run(options);
    assert.equal(x.result.status,409);
    assert(!x.sql.some(q=>q.includes('INSERT INTO equipment_rental_shop_memberships')));
  }
  // Do not make the same deleted-shop relaxation in the frame/chassis portals.
  for(const category of frames){
    const x=await run({category,deletedManager:true});
    assert.equal(x.result.status,409,category);
  }
});

test('R1825 staff revocation removes an ACTIVE camera membership and displays only active personnel', () => {
  const api=read('dist/api/server.js');
  const a=api.indexOf("if(req.method==='GET'&&url.pathname==='/api/rental/handover-staff'){"),b=api.indexOf("    // Store image uses existing settings storage",a);
  assert(a>0&&b>a);
  const part=api.slice(a,b);
  assert(part.includes("AND m.active=true ORDER BY m.created_at DESC"));
  assert(part.includes("AND active=true RETURNING id,user_id"));
  assert(part.includes("const q=await pool.query(['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(shop.business_category||''))?"));
  assert(!part.includes('DELETE FROM sessions'),'do not log out other portals or user accounts');
  const ui=read('dist/api/equipment-rental-portal.html');
  assert(ui.includes('window.pbR100F9RemoveStaff=async function(id)'));
  assert(ui.includes('دسترسی این پرسنل لغو شد'));
  assert(ui.includes('حذف دسترسی انجام نشد'));
});

test('R1825 camera manager activation and signup cannot promote active personnel; old deleted stores ignored', () => {
  const server=read('dist/api/server.js');
  const f=server.indexOf('async function equipmentRentalBindManagerAccess('),end=server.indexOf('async function equipmentRentalEnsurePhotographerLink(',f);
  assert(f>0&&end>f);
  const functionSrc=server.slice(f,end);
  assert(functionSrc.includes('pb1825CameraManager'));
  assert(functionSrc.includes('s.deleted_at IS NULL FOR UPDATE OF m'));
  assert(functionSrc.includes("fail('manager_staff_conflict')"));
  const signupStart=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/public/equipment-rental-trial')");
  const verifyStart=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/public/equipment-rental-trial/verify')",signupStart);
  const after=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/public/",verifyStart);
  assert(signupStart>0&&verifyStart>signupStart);
  const pre=server.slice(signupStart,verifyStart),post=server.slice(verifyStart,after>verifyStart?after:verifyStart+7000);
  assert(pre.includes("error:'rental_staff_cannot_be_manager'"));
  assert(post.includes("new Error('rental_staff_cannot_be_manager')"));
  assert(pre.includes("if(pb1825CameraTrial)"));
  assert(post.includes("if(pb1825CameraTrial)"));
  assert(post.includes("SELECT id,mobile,active FROM users WHERE id=$1 FOR UPDATE"));
});

test('R1825 build order is after existing PhotoBridge and camera-store releases', () => {
  const build=read('scripts/liara-fast-build.mjs');
  assert(build.indexOf("deployStep('./enable-r1825-camera-store-staff-access.mjs')")>build.indexOf("deployStep('./enable-r1824-camera-store-only.mjs')"));
  assert(build.includes("scripts/test-r1825-camera-store-staff-access.cjs"));
});

test('R1825 admin camera-store creation/edit cannot register an active staff phone as manager',()=>{
 const server=read('dist/api/server.js');
 const create=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/admin/equipment-rental/shops')");
 const manager=server.indexOf('const managerAccessRoute=',create);
 assert(create>0&&manager>create);
 const section=server.slice(create,manager);
 assert(section.includes('const pb1825ManagerMobile=normalizeMobile'));
 assert(section.includes("shop.deleted_at IS NULL"));
 assert(section.includes("m.role='handover_staff' AND m.active=true"));
 assert(section.includes("error:'rental_staff_cannot_be_manager'"));
 const edit=server.indexOf("if (req.method === 'PATCH' && adminRentalShop)");
 const end=server.indexOf("if (req.method === 'DELETE' && adminRentalShop)",edit);
 assert(edit>0&&end>edit);
 const patch=server.slice(edit,end);
 assert(patch.includes("['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(current.business_category||'equipment_rental_sale'))"));
 assert(patch.includes("b.managerMobile!==undefined"));
 assert(patch.includes("shop.deleted_at IS NULL"));
 assert(patch.includes("error:'rental_staff_cannot_be_manager'"));
});


test('R1827: camera OTP signup patch works after signup SMS identity rewrite without changing frame or lab',async()=>{
  const installer=read('scripts/enable-r1825-camera-store-staff-access.mjs');
  const start=installer.indexOf('const pb1825TrialAddBefore ='),end=installer.indexOf('const pb1825TrialVerifyBefore',start);
  assert(start>0&&end>start,'isolated rental signup patch block');
  const onlySignupPatch=installer.slice(start,end);
  const apply=new Function('s','camera','once',onlySignupPatch+'\nreturn s;');
  const anchor="            const challenge = await createSignupMobileChallenge('equipment_rental_trial', mobile, ";
  const identityUpgraded="if (req.method === 'POST' && url.pathname === '/api/public/equipment-rental-trial') {\n"+
    "        let existing;try{existing=signupSmsIdentity(credentialRecords)}catch(error){}\n"+
    "        try {\n"+anchor+"shopPayload);\n        }\n    }\n"+
    "if (req.method === 'POST' && url.pathname === '/api/public/lab-trial') {const challenge = await createSignupMobileChallenge('lab_trial', mobile, shopPayload);}";
  const once=(s,from,to,label)=>{
    assert.equal(s.split(from).length,2,label);
    return s.replace(from,to);
  };
  const updated=apply(identityUpgraded,"['equipment_rental','equipment_sale','equipment_rental_sale']",once);
  assert(updated.includes("if(pb1825CameraTrial)"));
  assert(updated.includes("shop.deleted_at IS NULL"));
  assert(updated.includes("m.role IN ('shop_admin','handover_staff')"));
  assert(updated.includes("rental_staff_cannot_be_manager"));
  assert(updated.includes("rental_admin_already_exists"));
  assert(updated.includes("createSignupMobileChallenge('lab_trial', mobile, shopPayload)"));
  assert.equal(updated.split("const pb1825CameraTrial=").length-1,1);
  const guard=updated.slice(updated.indexOf("            const pb1825CameraTrial"),updated.indexOf(anchor));
  const check=new Function('businessCategory','existing','pool','sendJson','res','return (async()=>{'+guard+'return {ok:true}})()');
  const call=async(category,role)=>{
    const queries=[];
    const pool={query:async(sql)=>{
      queries.push(sql);
      return {rows:role==='deleted'||!role?[]:[{role}]};
    }};
    const out=await check(category,{id:'test-user'},pool,(_res,status,body)=>({status,...body}),null);
    return {out,queries};
  };
  assert.equal((await call('equipment_sale','shop_admin')).out.error,'rental_admin_already_exists');
  assert.equal((await call('equipment_rental','handover_staff')).out.error,'rental_staff_cannot_be_manager');
  assert.equal((await call('equipment_sale','deleted')).out.ok,true,'deleted manager is eligible');
  for(const category of ['frame','chassis','frame_chassis']){
    const x=await call(category,'handover_staff');
    assert.equal(x.out.ok,true,category);
    assert.equal(x.queries.length,0,category+' never enters the camera role guard');
  }
  const legacy="        if (existing) {\n"+
    "            const mq = await pool.query(\`SELECT 1 FROM equipment_rental_shop_memberships WHERE user_id=$1 AND role='shop_admin' AND active=true LIMIT 1\`, [existing.id]);\n"+
    "            if (mq.rowCount) return sendJson(res, 409, { error: 'rental_admin_already_exists' });\n"+
    "        }\n";
  const legacyPatched=apply(legacy+anchor,"['equipment_rental','equipment_sale','equipment_rental_sale']",once);
  assert(legacyPatched.includes('if(pb1825CameraTrial)'),'legacy signup path also receives camera protections');
});


test('R1828: OTP verify compatibility handles exact and reformatted manager gate without changing labs or frame stores', async () => {
  const installer=read('scripts/enable-r1825-camera-store-staff-access.mjs');
  const a=installer.indexOf('const pb1825TrialVerifyBefore'),b=installer.indexOf('// Even a profile-only',a);
  assert(a>0&&b>a);
  const apply=new Function('s','camera','once',installer.slice(a,b)+'\nreturn s;');
  const once=(s,from,to,label)=>{assert.equal(s.split(from).length,2,label);return s.replace(from,to)};
  const open="if (req.method === 'POST' && url.pathname === '/api/public/equipment-rental-trial/verify') {";
  const end="if (req.method === 'POST' && url.pathname === '/api/public/lab-trial') {";
  const legacyCheck="if (mq.rowCount) throw Object.assign(new Error('rental_admin_already_exists'), { status: 409 });";
  const fixture=open+"\n"+
    "  const businessCategory='equipment_sale',userId='existing';\n"+
    "  const uq=await c.query(\`SELECT id,mobile,active FROM users WHERE id=$1 FOR UPDATE\`,[userId]);\n"+
    "                const mq = await c.query(\`SELECT 1 FROM equipment_rental_shop_memberships WHERE user_id=$1 AND role='shop_admin' AND active=true LIMIT 1\`, [userId]);\n"+
    "                "+legacyCheck+"\n"+
    "}\n"+end+"/* original laboratory block must stay intact */}";
  const versions=[
    fixture,
    fixture.replace(legacyCheck,"if( mq.rowCount )\n throw Object.assign( new Error( 'rental_admin_already_exists' ), { status : 409 } );"),
    fixture.replace(legacyCheck,"if( mq.rowCount )\n throw Object.assign( new Error( 'rental_admin_already_exists' ), { status : 409 } );")
      .replace('const mq = await c.query','const mq=await c.query').replace("role='shop_admin'","role = 'shop_admin'")
  ];
  for(const source of versions){
    const output=apply(source,"['equipment_rental','equipment_sale','equipment_rental_sale']",once);
    assert.equal(output.slice(output.indexOf(end)),source.slice(source.indexOf(end)),'lab route unchanged');
    const verify=output.slice(output.indexOf(open),output.indexOf(end));
    assert(verify.includes('const pb1825CameraTrial='));
    assert(verify.includes('if(pb1825CameraTrial)'));
    assert(verify.includes("new Error('rental_staff_cannot_be_manager')"));
    assert(verify.includes("s.deleted_at IS NULL"),'deleted managers excluded');
    const p=verify.indexOf('const pb1825CameraTrial=');
    const e=verify.indexOf('\n',verify.indexOf('if(pb1825CameraTrial)',p));
    const guard=verify.slice(p,e<0?verify.length:e);
    const check=new Function('businessCategory','userId','mq','c','return (async()=>{'+guard+'\nreturn "allowed"})()');
    const call=(category,legacyCount,roles)=>check(category,'existing',{rowCount:legacyCount},{
      query:async sql=>{
        const q=String(sql);
        if(q.includes('s.deleted_at IS NULL')){
          const active=q.includes("m.role='shop_admin'")?roles.filter(x=>x==='shop_admin'):
            q.includes("m.role='handover_staff'")?roles.filter(x=>x==='handover_staff'):roles;
          return {rowCount:active.length,rows:active.map(role=>({role}))};
        }
        return {rowCount:legacyCount,rows:[]};
      }
    });
    assert.equal(await call('equipment_sale',1,[]),'allowed','deleted camera manager can return');
    await assert.rejects(()=>call('equipment_rental',1,['shop_admin']),/rental_admin_already_exists/);
    await assert.rejects(()=>call('equipment_sale',0,['handover_staff']),/rental_staff_cannot_be_manager/);
    await assert.rejects(()=>call('frame',1,[]),/rental_admin_already_exists/);
    assert.equal(await call('frame',0,['handover_staff']),'allowed','frame legacy behavior unchanged');
  }
});
