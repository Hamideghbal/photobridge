'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),{initializeSettings,normalizeSettings,DEFAULTS}=require('../alert-settings.cjs'),{NativeAlerts}=require('../native-alerts.cjs');
test('missing persisted settings return null and still initialize the default audible alarm',()=>{
 const values=new Map(),store={get:key=>values.has(key)?values.get(key):null,set:(key,value)=>values.set(key,value)};
 assert.deepEqual(initializeSettings(store,'lab'),DEFAULTS);assert.deepEqual(values.get('nativeAlertSettings:lab'),DEFAULTS);
 for(const value of [null,undefined,'',42,[]])assert.deepEqual(normalizeSettings(value),DEFAULTS);
});
test('fresh real-store null semantics do not prevent automatic order polling',async()=>{
 const values=new Map(),shown=[],store={get:key=>values.has(key)?values.get(key):null,set:(key,value)=>values.set(key,value)};
 const alerts=new NativeAlerts({store,getAccount:()=> 'lab',notify:async notice=>shown.push(notice),open:async()=>{},request:async path=>({ok:true,json:async()=>path.startsWith('/api/lab/notifications?')?{notifications:[{id:'10000000-0000-4000-8000-000000000001',title:'سفارش جدید',message:'آزمایش'}]}:{seen:{}})});
 await alerts.poll();assert.equal(shown.length,1);assert.equal(shown[0].items[0].title,'سفارش جدید');assert.equal(store.get('nativeAlertSettings:lab').mode,'gentle');
});
