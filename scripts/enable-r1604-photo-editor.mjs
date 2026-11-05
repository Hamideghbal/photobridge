import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1604 anchor changed '+a.slice(0,80));return s.replace(a,b)};
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const path=root+'/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(path,'utf8');
 if(root.endsWith('lab-desktop-ui'))s=once(s,'Math.max(0,1000-(Date.now()-pb1586LastWake))','0');
 const a=s.indexOf('function Uf('),b=s.indexOf('function vi(',a);let c=s.slice(a,b);
 c=once(c,'e.jsx(qu,{file,detail:y,onOpen:()=>re(y.files.findIndex(item=>item.id===file.id))})',`e.jsx(qu,{file,detail:y,onOpen:()=>re(y.files.findIndex(item=>item.id===file.id))},String(file.id)+':'+String(file.pb1604Revision||'')),(y.order.downloaded_at||y.order.recovered_from_order_id)&&e.jsx('button',{type:'button',className:'pb1604PhotoEdit',title:'ویرایش و کراپ عکس','aria-label':'ویرایش و کراپ عکس',onClick:()=>_a(file),children:'✎'})`);
 const start=c.indexOf('    e.jsxs("div",{className:"pb1180PhotoTools"'),end=c.indexOf('\n   ]},file.id)',start);if(start<0||end<start)throw Error('R1604 metadata anchor');
 c=c.slice(0,start)+`    e.jsxs('div',{className:'pb1604PhotoMeta',children:[e.jsx('span',{children:Da[file.print_type]||file.print_type||'لاستر'}),e.jsx('span',{children:'تعداد: '+V(file.print_copies||1)}),file.chassis&&e.jsx('span',{children:'شاسی دارد'}),file.frame&&e.jsx('span',{children:'قاب دارد'})]}),file.crop_handling==='lab'&&e.jsx('p',{className:'pb1604CropHelp',children:'نیاز به کراپ؛ برای اصلاح عکس روی دکمهٔ مداد گوشهٔ عکس کلیک کنید.'})`+c.slice(end);
 c=once(c,'{...Bt,...Jt,original_name:qt.original_name||le.file.name}','{...Bt,...Jt,pb1604Revision:Date.now(),original_name:qt.original_name||le.file.name}');
 const old='alert(Mt?"ویرایش ذخیره شد؛ نسخه ابری و فایل روی هارد هر دو به‌روزرسانی شدند.":"ویرایش داخل PhotoBridge ذخیره شد و فایل برای دانلود/چاپ آماده است.")';
 c=once(c,old,`pb1604EditNotice(Mt?'ویرایش ذخیره شد؛ نسخهٔ ابری و فایل روی هارد به‌روزرسانی شدند.':'ویرایش ذخیره شد و نسخهٔ تازهٔ عکس برای دانلود و چاپ آماده است.')`);
 s=s.slice(0,a)+c+s.slice(b)+'\n'+fs.readFileSync('scripts/r1604-edit-notice.js.txt','utf8');fs.writeFileSync(path,s);execFileSync(process.execPath,['--check',path]);
 const css='photobridge-r1604-photo-editor.css';fs.copyFileSync('scripts/r1604-photo-editor.css',root+'/'+css);const html=root+'/index.html';fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace('</head>',`<link rel="stylesheet" href="/${css}?v=r1604"></head>`));
}
const root='dist/web/lab-desktop-ui',path=root+'/manifest.json',m=JSON.parse(fs.readFileSync(path)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1604-photo-editor.css']){let item=m.files.find(x=>x.name===name);if(!item){item={name,url:'/lab-desktop-ui/'+name};m.files.push(item)}item.sha256=hash(fs.readFileSync(root+'/'+name))}m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(path,JSON.stringify(m));
