'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const modulePath=pathToFileURL(path.resolve('dist/api/print-addon-selection.js'));
const read=p=>fs.readFileSync(p,'utf8');

test('R1779 saves the exact active model name and selected available frame colour',async()=>{
 const {snapshotPrintAddons}=await import(modulePath);
 const catalog={types:[
  {id:'chassis',kind:'chassis',name:'شاسی',active:true},
  {id:'frame',kind:'frame',name:'قاب',active:true},
  {id:'c1',kind:'chassis',name:'شاسی 4000',active:true},
  {id:'c2',kind:'chassis',name:'شاسی 8000',active:true},
  {id:'f1',kind:'frame',name:'قاب چوبی',active:true,colors:[
   {id:'walnut',name:'گردویی',available:true},
   {id:'gold',name:'طلایی',available:true},
   {id:'white',name:'سفید',available:false}]}
 ]};
 const result=snapshotPrintAddons(catalog,{chassis:true,frame:true,chassisModelId:'c2',frameModelId:'f1',frameColorId:'gold',
  chassisModelName:'متن جعلی',frameModelName:'نام جعل‌شده'});
 assert.deepEqual(result,{chassis:{id:'c2',name:'شاسی 8000'},frame:{id:'f1',name:'قاب چوبی',colorId:'gold',colorName:'طلایی'}});
 assert.throws(()=>snapshotPrintAddons(catalog,{frame:true,frameModelId:'f1',frameColorId:'white'}),/invalid_frame_color/);
 assert.throws(()=>snapshotPrintAddons(catalog,{frame:true,frameModelId:'f1'}),/invalid_frame_color/);
 assert.throws(()=>snapshotPrintAddons(catalog,{chassis:true,chassisModelId:'nonexistent'}),/invalid_chassis_model/);
 assert.deepEqual(snapshotPrintAddons(catalog,{chassis:true}),{chassis:{id:'chassis',name:'شاسی'}});
 assert.deepEqual(snapshotPrintAddons(catalog,{chassis:false,frame:false}),{});
});
test('R1779 DB has a non-destructive JSONB model snapshot while old orders use an empty object',()=>{
 const sql=read('migrations/197_order_files_addon_selection.sql');
 assert(sql.includes("ADD COLUMN IF NOT EXISTS addon_selection jsonb NOT NULL DEFAULT '{}'::jsonb"));
 assert(sql.includes("jsonb_typeof(addon_selection)='object'"));
});
test('R1779 downloader and Lab cards use a stored snapshot instead of current tariff name',()=>{
 const download=read('scripts/r1450-download-workflow.js');
 const installer=read('scripts/enable-r1778-photo-addon-filename-markers.mjs');
 assert(download.includes('file?.addon_selection||file?.addonSelection||{}'));
 assert(download.includes("data.name||data.modelName"));
 assert(download.includes('data.colorName||data.color_name'));
 assert(installer.includes('file?.addon_selection?.frame?.name'));
 assert(installer.includes('file?.addon_selection?.chassis?.name'));
});
test('R1779 server retains exact names in both upload routes and exposes snapshots in file detail',()=>{
 const server=read('dist/api/server.js');
 const builder=read('scripts/enable-r1779-addon-selection-snapshot.mjs');
 assert(server.includes('/* PB1779 ORDER-IMMUTABLE ADDON SNAPSHOT */'));
 assert(server.includes("import {snapshotPrintAddons} from './print-addon-selection.js'"));
 assert(server.includes('JSON.stringify(pb1779AddonSelection)'));
 assert(server.includes('f.frame,f.addon_selection,f.crop_handling'));
 assert(server.includes("$19::jsonb,'pending'"));
 assert(server.includes("$18::jsonb,'pending'"));
 assert(builder.includes('photographer route'));
 assert(builder.includes('walkin route'));
});

