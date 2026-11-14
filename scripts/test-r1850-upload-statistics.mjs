import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import pg from 'pg';
import {statisticsRange,uploadStatisticsSql} from './r1850-upload-statistics.mjs';
test('validates calendar dates and bounded Tehran reporting range',()=>{assert.deepEqual(statisticsRange('2026-11-01','2026-11-14'),['2026-11-01','2026-11-14']);for(const range of [['2026-02-30','2026-03-01'],['2025-01-01','2026-01-01'],['2026-11-20','2026-11-14']])assert.throws(()=>statisticsRange(...range));});
test('durable success snapshots survive retries, operational deletion and rollback; Tehran daily bytes are correct',async()=>{
 if(!process.env.PB_UPLOAD_METRICS_TEST_DATABASE_URL)throw Error('local test database required');
 const client=new pg.Client({connectionString:process.env.PB_UPLOAD_METRICS_TEST_DATABASE_URL});await client.connect();
 try{await client.query('BEGIN');await client.query('CREATE SCHEMA r1850_metrics_test');await client.query('SET LOCAL search_path TO r1850_metrics_test,public');
 await client.query(`CREATE TABLE labs(id uuid PRIMARY KEY,name text);CREATE TABLE orders(id uuid PRIMARY KEY,lab_id uuid,mode text);CREATE TABLE order_files(id uuid PRIMARY KEY,order_id uuid,original_state text,bytes bigint);CREATE TABLE order_status_events(id bigserial,order_id uuid,status text,created_at timestamptz DEFAULT now());`);
 const lab='00000000-0000-0000-0000-000000000001',order='00000000-0000-0000-0000-000000000002',second='00000000-0000-0000-0000-000000000003';
 await client.query('INSERT INTO labs VALUES($1,$2)',[lab,'Lab A']);await client.query("INSERT INTO orders VALUES($1,$2,'print'),($3,$2,'album')",[order,lab,second]);
 await client.query(`INSERT INTO order_files VALUES(gen_random_uuid(),$1,'active',10),(gen_random_uuid(),$1,'deleted',20),(gen_random_uuid(),$1,'pending',999),(gen_random_uuid(),$2,'active',40),(gen_random_uuid(),$2,'active',NULL)`,[order,second]);
 await client.query("INSERT INTO order_status_events(order_id,status,created_at)VALUES($1,'sent','2026-11-14T20:29:00Z')",[order]);
 const migration=await fs.readFile('migrations/198_upload_success_metrics.sql','utf8');await client.query(migration);await client.query(migration);
 await client.query("INSERT INTO order_status_events(order_id,status,created_at)VALUES($1,'sent','2026-11-14T20:31:00Z'),($1,'sent','2026-11-15T20:31:00Z')",[second]);
 let rows=(await client.query(uploadStatisticsSql,['2026-11-14','2026-11-16'])).rows;
 assert.equal(rows.length,2);assert.equal(rows[0].day,'2026-11-15');assert.equal(rows[0].successful_orders,'1');assert.equal(rows[0].files,'2');assert.equal(rows[0].bytes,'40');assert.equal(rows[0].unknown_size_files,'1');assert.equal(rows[1].bytes,'30');assert.equal(rows[1].historical_orders,'1');
 await client.query('SAVEPOINT submit_attempt');await client.query("INSERT INTO orders VALUES('00000000-0000-0000-0000-000000000004',$1,'print')",[lab]);await client.query("INSERT INTO order_files VALUES(gen_random_uuid(),'00000000-0000-0000-0000-000000000004','active',100)");await client.query("INSERT INTO order_status_events(order_id,status)VALUES('00000000-0000-0000-0000-000000000004','sent')");assert.equal((await client.query('SELECT count(*) FROM upload_success_metrics')).rows[0].count,'3');await client.query('ROLLBACK TO SAVEPOINT submit_attempt');assert.equal((await client.query('SELECT count(*) FROM upload_success_metrics')).rows[0].count,'2');
 await client.query('DELETE FROM order_files; DELETE FROM orders; DELETE FROM labs;');rows=(await client.query(uploadStatisticsSql,['2026-11-14','2026-11-16'])).rows;assert.equal(rows.length,2);assert.equal(rows.reduce((sum,r)=>sum+Number(r.bytes),0),70);
 }finally{await client.query('ROLLBACK');await client.end();}
});
