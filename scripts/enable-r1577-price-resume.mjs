import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const roots=['dist/web','dist/web/lab-desktop-ui'];
for(const root of roots){
 const file=root+'/assets/index-UIRefine-v655-r84.js';let source=fs.readFileSync(file,'utf8');
 if(!source.includes('/* R1577 resume invoice after price */')){
  const start=source.indexOf('Nn=async le=>'),end=source.indexOf(';x.useEffect(()=>{const lab=t?.id;',start);if(start<0||end<start)throw Error('R1577 pricing callback anchor changed');
  const handler=`Nn=async saved=>{const selection=Se,order={...(selection?.order||{}),...(saved?.order||{})};if(!order.id)return;if(saved?.ready===false||saved?.missing?.length){P("قیمت همهٔ ردیف‌ها را تکمیل کنید.");return}Fe(null);C(order.id);if(saved?.order)f(rows=>rows.map(row=>row.id===order.id?{...row,...saved.order}:row));try{if(order.downloaded_at&&order.invoice_required!==false){P("قیمت ذخیره شد؛ در حال تکمیل فاکتور سفارش…");const result=await pb1568AfterManualDownload(order.id,order.lab_id||t.id);if(!result?.completed){P("قیمت ذخیره شد؛ تکمیل فاکتور نیازمند بررسی است.");return}const fresh=(await Me('/api/lab/orders/'+order.id)).order;if(fresh)f(rows=>rows.map(row=>row.id===order.id?{...row,...fresh}:row));if(typeof pb1568Save==='function')pb1568Save(order.lab_id||t.id,order.id,{phase:'complete',invoiceId:result.invoice?.id,attempts:0});P("قیمت‌گذاری تکمیل شد؛ فاکتور سفارش #"+V(order.number)+" آماده است.")}else P(saved?.invoice?"قیمت‌گذاری تکمیل شد؛ پیش‌فاکتور آماده است.":"قیمت‌گذاری سفارش ذخیره شد.")}catch(error){P("قیمت ذخیره شد، اما تکمیل فاکتور نیازمند تلاش دوباره است.");pb1547Notice(error?.message||"تکمیل فاکتور انجام نشد.",'warning')}finally{C("");void ye().catch(()=>{});if(h?.id===order.id)void Tt(order,false).catch(()=>{})}}`;
  source=source.slice(0,start)+handler+source.slice(end);
  if(source.split('if(!active||opening||Se)return').length!==2||source.split('},[t?.id,p,Se]);').length!==2)throw Error('R1577 pricing queue guard changed');
  source=source.replace('if(!active||opening||Se)return','if(!active||opening||Se||E)return').replace('},[t?.id,p,Se]);','},[t?.id,p,Se,E]);');
  const a=source.indexOf('async function pb1568AfterManualDownload('),b=source.indexOf('\n}\n',a);if(a<0||b<a)throw Error('R1577 verified download continuation missing');
  let helper=source.slice(a,b);const missing="   return;\n  }\n  throw error;";if(helper.split(missing).length!==2)throw Error('R1577 pricing result anchor changed');helper=helper.replace(missing,"   return {pricingRequired:true};\n  }\n  throw error;");helper+='\n return {completed:true,invoice:result.invoice};';source=source.slice(0,a)+helper+source.slice(b);
  source+='\n/* R1577 resume invoice after price */\n';fs.writeFileSync(file,source);
 }
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const html=root+'/index.html';fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&priceResume=r1577')?url:url+'&priceResume=r1577'));
}
const root=roots[1],path=root+'/manifest.json',m=JSON.parse(fs.readFileSync(path)),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');for(const name of ['assets/index-UIRefine-v655-r84.js','index.html'])m.files.find(row=>row.name===name).sha256=sha(fs.readFileSync(root+'/'+name));m.build=sha(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(path,JSON.stringify(m));
