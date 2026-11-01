'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {addReports:addForms}=require('../access-reports.cjs');
test('Access export builds grouped read-only reports with an unbound launcher',async()=>{
 const script=await fs.readFile(path.join(__dirname,'../access-reports.vbs'),'utf8');
 for(const name of ['معین آتلیه‌ها','فاکتورهای آتلیه‌ها','خلاصه بدهی آتلیه‌ها'])assert(script.includes(name));
 assert(script.includes('application.CreateReport()'));
 assert(script.includes('application.CreateGroupLevel(temp,"[" & groupField & "]",True,True)'));
 assert(script.includes('c.HyperlinkSubAddress="Report " & screen'));
 assert(script.includes('application.DoCmd.OpenReport name,5'));
 assert(script.includes('application.CurrentProject.AllReports(name)'));
 assert(script.includes('=First([مانده فعلی حساب])'));
 assert(script.includes('=Sum([بدهی])'));
 assert(script.includes('i.[مبلغ کل]+i.[مبلغ اصلاحیه]'));
 assert(!script.includes('acSubform'));
 assert(!script.includes('acTabCtl'));
});
test('native Windows Access reports replace only verified generated report, keep all backup data intact',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pb-forms-')),file=path.join(dir,'finance.accdb'),before=Buffer.from('original verified database');
 try{
  await fs.writeFile(file,before);
  let validated=false;
  const result=await addForms(file,{platform:'win32',
   runner:async(command,args,options)=>{assert.equal(command,'cscript.exe');assert(args.includes('//Nologo'));assert.equal(options.windowsHide,true);const staged=args[2];const script=await fs.readFile(args[1]);assert(script[0]===0xff&&script[1]===0xfe);await fs.appendFile(staged,' + readonly Access forms');return{stdout:'reports_created'};},
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
    runner:async()=>{if(failure==='not-installed')throw Error('access_not_installed');return{stdout:'reports_created'};},
    validate:async()=>{throw Error('validation_failed')}
   });
   assert.equal(result.created,false);assert.deepEqual(await fs.readFile(file),before);
   assert.deepEqual(await fs.readdir(dir),['finance.accdb']);
  }finally{await fs.rm(dir,{recursive:true,force:true})}
 }
});
test('native 1.0.74 stays based on true 1.0.68 backup/restore source and includes script in packaged payload',async()=>{
 const pkg=JSON.parse(await fs.readFile(path.join(__dirname,'../package.json'),'utf8'));
 assert.equal(pkg.version,'1.0.74');
 assert(pkg.build.files.includes('*.vbs'));
 const source=await fs.readFile(path.join(__dirname,'../data-backups.cjs'),'utf8');
 assert(source.includes('createDataSnapshot(this.store,database)'));
 assert(source.includes('verifyBackup(pending)'));
 assert(source.includes('accessReportsIncluded:result.reportsIncluded===true'));
 assert((await fs.readFile(path.join(__dirname,'../main.cjs'),'utf8')).includes("require('./data-backups.cjs')"));
});
test('report failure exposes the COM diagnostic while keeping the original backup',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pb-forms-diagnostic-')),file=path.join(dir,'finance.accdb');
 try{
  await fs.writeFile(file,'original');
  const result=await addForms(file,{platform:'win32',runner:async()=>{throw Object.assign(Error('Command failed'),{stdout:'access_form_build_failed:2465:Missing field'});}});
  assert.equal(result.created,false);assert.equal(result.reason,'access_form_build_failed:2465:Missing field');
  assert.equal(await fs.readFile(file,'utf8'),'original');
  assert.deepEqual(await fs.readdir(dir),['finance.accdb']);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('wide report columns fit the landscape canvas and monetary display preserves four decimal places',async()=>{
 const script=await fs.readFile(path.join(__dirname,'../access-reports.vbs'),'utf8');
 const widths=[...script.matchAll(/Array\((\d+(?:,\d+){4,})\)/g)].map(m=>m[1].split(',').map(Number));assert.equal(widths.length,3);
 for(const row of widths){assert(row.reduce((sum,width)=>sum+width,0)<=14800);assert(Math.min(...row)>=1500);}
 assert(script.includes('r.Printer.Orientation=2'));assert(script.includes('r.Width=15000'));assert(script.includes('۰۱۲۳۴۵۶۷۸۹'));assert(script.includes('#,##0.####;(#,##0.####);0'));assert(script.includes('c.CanGrow=Not money'));
});
