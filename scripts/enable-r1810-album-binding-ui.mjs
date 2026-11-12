
/* R1810: two independent album-binding modals; never replace the print-only tariff columns. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const one=(s,a,b,name)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1810 UI] '+name+' anchor '+n);return s.replace(a,b)};
const region=(s,start,end,patch,name)=>{
 const a=s.indexOf(start),b=a<0?-1:s.indexOf(end,a+start.length);
 if(a<0||b<=a)throw Error('[R1810 UI] '+name+' boundaries');
 return s.slice(0,a)+patch(s.slice(a,b))+s.slice(b);
};
const asset='assets/index-UIRefine-v655-r84.js';
const style='photobridge-r1810-album-tariff-modal.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 let src=read(root+'/'+asset);
 src=region(src,'function tw(','function Na(t)',s=>{
  s=one(s,'[p,f]=x.useState(!1),[pb1777Edit,','[p,f]=x.useState(!1),[pb1810Open,pb1810SetOpen]=x.useState(!1),[pb1777Edit,','colleague modal state');
  const oldBindingCreate=/,pb1539\\.albumPricingMode!=="combined"&&e\\.jsx\\("button",\\{className:"pbActionButton secondary",type:"button",onClick:\\(\\)=>pb1539Create\\(\\),children:"(?:\\+ مدل )?صحافی جدید"\\}\\)/g;
  const removedBindingCreate=[...s.matchAll(oldBindingCreate)];
  if(removedBindingCreate.length!==1)throw Error('[R1810 UI] colleague model creation button count '+removedBindingCreate.length);
  // Create/rename/archive binding models has moved to the modal, not the main grid toolbar.
  s=s.replace(oldBindingCreate,'');
  s=one(s,'e.jsx("button",{className:"pbActionButton secondary",onClick:T,children:"چاپ تعرفه"}),',
    'e.jsx("button",{type:"button",className:"pbActionButton secondary pb1810BindingOpen",onClick:()=>pb1810SetOpen(!0),children:"ثبت قیمت صحافی"}),e.jsx("button",{className:"pbActionButton secondary",onClick:T,children:"چاپ تعرفه"}),',
    'colleague header modal button');
  const edit='pb1777Edit&&e.jsx(PB1777FrameModelEditor,{model:pb1777Edit,onClose:()=>pb1777SetEdit(null),onSaved:pb1539Reload})';
  s=one(s,edit,edit+',pb1810Open&&e.jsx(PB1810AlbumBindingPriceModal,{audience:"colleague",catalog:pb1539,rows:o,onClose:()=>pb1810SetOpen(!1),onSaved:async()=>{await Promise.resolve(a());await pb1539Reload()}})','colleague render');
  s=one(s,
    'قیمت چاپ، صحافی آلبوم و موجودی‌های هر سایز را همین‌جا مدیریت کن. اگر «صحافی آلبوم» خالی یا صفر باشد، آن سایز در بخش جلد آلبوم نمایش داده نمی‌شود.',
    'قیمت چاپ عکس بدون صحافی، شاسی و قاب را اینجا ثبت کن. برای قیمت صحافی از دکمه «ثبت قیمت صحافی» استفاده کن.',
    'colleague help text');
  return s;
 },root+' colleague tariffs');
 src=region(src,'function Qj(','function Zj(',s=>{
  s=one(s,'[c,m]=x.useState(void 0),','[c,m]=x.useState(void 0),[pb1810Open,pb1810SetOpen]=x.useState(!1),','walk-in modal state');
  s=one(s,'pb1777Fields=pb1800TariffFields(PB1437TariffFields().flatMap(',
    'pb1777Fields=pb1810BindingFields(pb1800TariffFields(PB1437TariffFields().flatMap(',
    'walk-in binding column removal open');
  s=one(s,']),pb1777Catalog.types||[]),pb1777Value=',
    ']),pb1777Catalog.types||[]),pb1777Catalog),pb1777Value=',
    'walk-in binding column removal close');
  s=one(s,'e.jsx("button",{className:"pbActionButton secondary",onClick:h,children:"چاپ تعرفه"}),',
    'e.jsx("button",{type:"button",className:"pbActionButton secondary pb1810BindingOpen",onClick:()=>pb1810SetOpen(!0),children:"ثبت قیمت صحافی"}),e.jsx("button",{className:"pbActionButton secondary",onClick:h,children:"چاپ تعرفه"}),',
    'walk-in header modal button');
  const edit='pb1777Edit&&e.jsx(PB1777FrameModelEditor,{model:pb1777Edit,onClose:()=>pb1777SetEdit(null),onSaved:g})';
  s=one(s,edit,edit+',pb1810Open&&e.jsx(PB1810AlbumBindingPriceModal,{audience:"walkin",catalog:pb1777Catalog,rows:s,onClose:()=>pb1810SetOpen(!1),onSaved:g})','walk-in render');
  return s;
 },root+' walk-in tariffs');
 src+='\n'+read('scripts/r1810-album-binding-modal.js.txt');
 write(root+'/'+asset,src);
 execFileSync(process.execPath,['--check',root+'/'+asset],{stdio:'inherit'});
 const htmlFile=root+'/index.html',html=read(htmlFile);
 write(htmlFile,one(html,'</head>','<link rel="stylesheet" href="/'+style+'?v=r1810"></head>',root+' stylesheet'));
}
fs.copyFileSync('dist/web/'+style,'dist/web/lab-desktop-ui/'+style);
const native='dist/web/lab-desktop-ui',mf=native+'/manifest.json',manifest=JSON.parse(read(mf));
const hash=name=>crypto.createHash('sha256').update(fs.readFileSync(native+'/'+name)).digest('hex');
for(const name of [asset,style,'index.html']){
 const row=manifest.files.find(x=>x.name===name);
 if(row)row.sha256=hash(name);else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:hash(name)});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
manifest.generatedAt=new Date().toISOString();
write(mf,JSON.stringify(manifest));
console.log('[R1810] independent colleague/walk-in album binding modals and vertical 1-4 form; web/native synced');
