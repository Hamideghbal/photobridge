import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1454 anchor '+a.slice(0,110));return s.replace(a,b)};
const serverFile='dist/api/server.js',uiFile='dist/web/assets/index-UIRefine-v655-r84.js';let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('/* PB1454 album sample category */')){
 server=once(server,'custom.push({ key, name, imageData, paletteStorage: sanitizeAlbumCoverPaletteStorage(row?.paletteStorage) });',"custom.push({ key, name, imageData, category:row?.category==='package'?'package':'cover', paletteStorage: sanitizeAlbumCoverPaletteStorage(row?.paletteStorage) });");
 server=once(server,'{ ...d, name: row.name || d.name, paletteStorage:', '{ ...d, name: row.name || d.name, category:row.category, paletteStorage:');
 server=once(server,'map(x => ({ ...x, builtIn: defaults.has(x.key) }))','map(x => ({ ...x, category:x.category===\'package\'?\'package\':\'cover\', builtIn: defaults.has(x.key) }))');
 server+='\n/* PB1454 album sample category */\n';fs.writeFileSync(serverFile,server);
}
let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('/* PB1454 album samples and admin layout */')){
 ui=once(ui,'function g0(){','function PB1454LegacyCoverPresets(){');
 ui=once(ui,'!He&&(I==="photographers"?', '!He&&["labs","photographers","renewals","finance"].includes(I)&&(I==="photographers"?');
 // Keep all original handlers and direct children: older admin extensions and mobile navigation use them.
 const a=ui.indexOf('e.jsxs("div",{className:"adminTabs adminTabsUnified",children:['),end=ui.indexOf(']}),e.jsxs("div",{className:"adminInternalScrollArea',a);if(a<0||end<0)throw Error('R1454 admin nav');
 const start=a+'e.jsxs("div",{className:"adminTabs adminTabsUnified",children:['.length,raw=ui.slice(start,end);
 const parts=[];let depth=0,quote='',escaped=false,last=0;
 for(let i=0;i<raw.length;i++){const c=raw[i];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if('([{'.includes(c))depth++;else if(')]}'.includes(c))depth--;else if(c===','&&depth===0){parts.push(raw.slice(last,i));last=i+1}}parts.push(raw.slice(last));
 const byKey=new Map(parts.map(p=>[p.match(/I==="([^"]+)"/)?.[1]||(p.includes('/admin/domain-orders')?'domain':p.includes('PB771OpenAppearance')?'appearance':''),p]));
 const groups=[['حساب‌ها',['labs','photographers']],['مالی',['renewals','plans','finance','services']],['آلبوم',['cover-presets','lab-defaults']],['عملیات',['storage','sms','guides']],['هوش مصنوعی',['public-ai','ai']],['سایت',['domain','contact','appearance']],['مدیریت',['account']]];
 const keys=groups.flatMap(g=>g[1]);if(parts.length!==keys.length||keys.some(key=>!byKey.has(key)))throw Error('R1454 admin nav handlers');
 const entries=groups.flatMap(([title,keys])=>['e.jsx("span",{className:"pb1454NavGroup",children:'+JSON.stringify(title)+'})',...keys.map(key=>byKey.get(key).replace('children:"مدل‌های پیش‌فرض جلد"','children:"نمونه‌های جلد و کیف"'))]);
 ui=ui.slice(0,start)+entries.join(',')+ui.slice(end);
 ui=once(ui,"e.jsxs('label',{className:'pb1384GalleryAdd',children:",`e.jsx(PB1454SampleChooser,{disabled:loading||photos.length>=12,onChoose:async row=>{if(loadingRef.current)return;if(photos.length>=12)throw Error('در هر گالری حداکثر ۱۲ عکس اضافه کنید.');loadingRef.current=true;setLoading(true);setError('');try{const image=await PB1454SampleImage(row);setPhotos(old=>old.includes(image)?old:[...old,image]);}finally{loadingRef.current=false;setLoading(false)}}}),e.jsxs('label',{className:'pb1384GalleryAdd',children:`);
 ui+='\n/* PB1454 album samples and admin layout */\n'+fs.readFileSync('scripts/r1454-album-samples.js','utf8');fs.writeFileSync(uiFile,ui);
}
for(const [name,source]of [['photobridge-r1454-admin-layout.css','scripts/r1454-admin-layout.css'],['photobridge-r1454-admin-navigation.js','scripts/r1454-admin-navigation.js']])fs.copyFileSync(source,'dist/web/'+name);
let html=fs.readFileSync('dist/web/index.html','utf8');if(!html.includes('photobridge-r1454-admin-layout.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1454-admin-layout.css?v=r1454"><script defer src="/photobridge-r1454-admin-navigation.js?v=r1454"></script></head>');html=html.replaceAll('downloadRepair=r1453','downloadRepair=r1454');fs.writeFileSync('dist/web/index.html',html);
for(const file of [uiFile,serverFile,'dist/web/photobridge-r1454-admin-navigation.js'])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});console.log('[R1454] Shared cover/package sample picker and scrollable grouped admin prepared.');
