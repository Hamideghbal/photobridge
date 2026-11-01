'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const run=promisify(execFile);
async function exportAccess(model,output,{java,resources=__dirname,timeout=120000}={}){
 const artifactRoot=__dirname.replace(/app\.asar$/, 'app.asar.unpacked');const helper=await fs.readFile(path.join(artifactRoot,'assets','photobridge-access-export.jar'));if(crypto.createHash('sha256').update(helper).digest('hex')!==(await fs.readFile(path.join(__dirname,'access-helper.sha256'),'utf8')).trim())throw Error('access_helper_integrity_failed');
 const manifest=require('./access-libraries.json');for(const lib of manifest){const bytes=await fs.readFile(path.join(artifactRoot,'assets','access-libs',lib.name));if(crypto.createHash('sha256').update(bytes).digest('hex')!==lib.sha256)throw Error('access_library_integrity_failed');}
 const executable=java||require('./access-runtime-path.cjs').runtimeJava(resources);
 try{await fs.access(executable);}catch{throw Object.assign(Error('موتور خروجی اکسس در بستهٔ برنامه موجود نیست؛ نسخهٔ کامل برنامه را نصب کنید.'),{code:'access_runtime_missing'});}
 const input=output+'.input.json';await fs.writeFile(input,JSON.stringify(model),{flag:'wx',mode:0o600});
 try{const cp=[path.join(artifactRoot,'assets','photobridge-access-export.jar'),path.join(artifactRoot,'assets','access-libs','*')].join(path.delimiter);const result=await run(executable,['-Xmx256m','-cp',cp,'PhotoBridgeAccess',input,output],{timeout,windowsHide:true,maxBuffer:1024*1024});const counts=JSON.parse(result.stdout.trim());for(const table of model.tables)if(counts[table.name]!==table.rows.length)throw Error('access_row_count_mismatch');return counts;}catch(error){throw Object.assign(Error(error.killed?'ساخت خروجی اکسس بیش از مهلت تعیین‌شده طول کشید.':'ساخت خروجی اکسس ناموفق بود؛ فضای خالی و دسترسی مسیر ذخیره را بررسی کنید.'),{code:error.killed?'access_export_timeout':'access_export_failed',cause:error});}finally{await fs.unlink(input).catch(()=>{});}
}
module.exports={exportAccess};
