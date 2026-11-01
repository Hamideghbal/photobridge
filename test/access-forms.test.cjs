'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {addForms}=require('../access-forms.cjs');
test('Access form builder names the three data-bound forms and uses only read-only controls',async()=>{
 const script=await fs.readFile(path.join(__dirname,'../access-forms.vbs'),'utf8');
 for(const name of ['frmPBInvoices','frmPBReceipts','frmPBLedger'])assert(script.includes(name));
 for(const name of ['فاکتورها','دریافت‌ها','دفتر حسابداری','ردیف‌های حسابداری','بدهکار','بستانکار'])assert(script.includes(name));
 assert(script.includes('frm.AllowEdits=False'));
 assert(script.includes('frm.AllowAdditions=False'));
 assert(script.includes('frm.AllowDeletions=False'));
 assert(script.includes('frm.DefaultView=2'));
});
test('native Windows Access forms replace only verified generated report, keep all backup data intact',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pb-forms-')),file=path.join(dir,'finance.accdb'),before=Buffer.from('original verified database');
 try{
  await fs.writeFile(file,before);
  let validated=false;
  const result=await addForms(file,{platform:'win32',
   runner:async(command,args,options)=>{assert.equal(command,'cscript.exe');assert(args.includes('//Nologo'));assert.equal(options.windowsHide,true);const staged=args[2];const script=await fs.readFile(args[1]);assert(script[0]===0xff&&script[1]===0xfe);await fs.appendFile(staged,' + readonly Access forms');return{stdout:'forms_created'};},
   validate:async staged=>{validated=true;assert((await fs.readFile(staged,'utf8')).includes('readonly Access forms'))}
  });
  assert.equal(result.created,true);assert(validated);assert((await fs.readFile(file,'utf8')).includes('readonly Access forms'));
  assert(!(await fs.readdir(dir)).some(x=>x.includes('staging')));
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
test('Access missing or validation failure leaves original readable report byte-for-byte unchanged',async()=>{
 for(const failure of ['not-installed','failed-validate']){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pb-forms-')),file=path.join(dir,'finance.accdb'),before=Buffer.from('do not touch original');
  try{
   await fs.writeFile(file,before);
   const result=await addForms(file,{platform:'win32',
    runner:async()=>{if(failure==='not-installed')throw Error('access_not_installed');return{stdout:'forms_created'};},
    validate:async()=>{throw Error('validation_failed')}
   });
   assert.equal(result.created,false);assert.deepEqual(await fs.readFile(file),before);
   assert.deepEqual(await fs.readdir(dir),['finance.accdb']);
  }finally{await fs.rm(dir,{recursive:true,force:true})}
 }
});
test('native 1.0.69 stays based on true 1.0.68 backup/restore source and includes script in packaged payload',async()=>{
 const pkg=JSON.parse(await fs.readFile(path.join(__dirname,'../package.json'),'utf8'));
 assert.equal(pkg.version,'1.0.69');
 assert(pkg.build.files.includes('*.vbs'));
 const source=await fs.readFile(path.join(__dirname,'../data-backups.cjs'),'utf8');
 assert(source.includes('createDataSnapshot(this.store,database)'));
 assert(source.includes('verifyBackup(pending)'));
 assert(source.includes('accessFormsIncluded:result.formsIncluded===true'));
 assert((await fs.readFile(path.join(__dirname,'../main.cjs'),'utf8')).includes("require('./data-backups.cjs')"));
});
