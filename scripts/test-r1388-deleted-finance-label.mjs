import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../dist/api/server.js',import.meta.url),'utf8');
const match=source.match(/function labFinanceCustomerNameSql\(\) \{[\s\S]*?\n\}/);
assert.ok(match);
const sql=vm.runInNewContext(match[0]+';labFinanceCustomerNameSql()');
const {PGlite}=await import(process.env.PB_PGLITE_MODULE || '@electric-sql/pglite');
test('deleted, suspended, active and rejoined identities remain distinguishable without changing balances',async()=>{
 const db=new PGlite();
 await db.exec(`CREATE TABLE users(id text,name text,account_deleted_at timestamptz);
 CREATE TABLE photographer_profiles(user_id text);
 CREATE TABLE audit_log(entity_type text,entity_id text,action text,data jsonb,created_at timestamptz DEFAULT now());
 CREATE TABLE balances(user_id text,amount int);
 INSERT INTO users VALUES ('old','ماندگاران',null),('new','ماندگاران',null),('suspended','تعلیق',null),('walkin','حضوری',null),('legacy','قدیمی',now()),('rejoined','بازگشته',null);
 INSERT INTO photographer_profiles VALUES ('new'),('suspended'),('rejoined');
 INSERT INTO audit_log(entity_type,entity_id,action,data) VALUES
 ('user','old','platform_admin.photographer_delete','{"name":"عکاسی ماندگاران"}'),
 ('user','rejoined','platform_admin.photographer_delete','{"name":"نام قبلی"}');
 INSERT INTO balances VALUES ('old',120),('new',35);`);
 const before=await db.query('SELECT * FROM balances ORDER BY user_id');
 const q=await db.query('SELECT u.id,'+sql+' name FROM users u ORDER BY u.id');
 const names=Object.fromEntries(q.rows.map(r=>[r.id,r.name]));
 assert.equal(names.old,'عکاسی ماندگاران (حساب حذف‌شده)');
 assert.equal(names.new,'ماندگاران');
 assert.equal(names.suspended,'تعلیق');
 assert.equal(names.walkin,'حضوری');
 assert.equal(names.legacy,'قدیمی (حساب حذف‌شده)');
 assert.equal(names.rejoined,'بازگشته');
 assert.deepEqual(await db.query('SELECT * FROM balances ORDER BY user_id'),before);
 assert.equal((await db.query("SELECT name FROM users WHERE id='old'")).rows[0].name,'ماندگاران');
 await db.close();
});
