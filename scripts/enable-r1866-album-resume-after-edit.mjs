// R1866: Resume only server-verified album pages, allow stopped-draft edits,
// and start a new order after the last page is removed. Build-time web + Windows patch.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const asset='assets/index-UIRefine-v655-r84.js';
const once=(s,a,b,label)=>{
  const n=s.split(a).length-1;
  if(n!==1)throw Error('[R1866] '+label+' anchor count '+n);
  return s.replace(a,b);
};
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const file=root+'/'+asset;
  let source=fs.readFileSync(file,'utf8');
  const start=source.indexOf('function Kv('),end=source.indexOf('function ',start+12);
  if(start<0||end<=start)throw Error('[R1866] album editor unavailable '+root);
  let kv=source.slice(start,end);
  kv=once(kv,'dt=x.useRef(0),Pt=x.useRef(!1)',
    'dt=x.useRef(0),pb1866Reset=x.useRef(Promise.resolve()),Pt=x.useRef(!1)',
    root+' serialized local reset');
  kv=once(kv,'P=async($e=!1,gt)=>{const ht=gt||ce.current;',
    'P=async($e=!1,gt)=>{await pb1866Reset.current;const ht=gt||ce.current;',
    root+' cache reset synchronization');

  // A cache's progress is NOT authority: validate persisted IDs against the
  // active files owned by this exact existing order. Never infer completion
  // from a locally cached 100%, nor from a same-name/different-file match.
  const btStart=kv.indexOf('Bt=async($e,gt)=>{');
  const btEnd=kv.indexOf(',pb1865Cancel=()=>',btStart);
  if(btStart<0||btEnd<=btStart)throw Error('[R1866] server recovery anchor missing '+root);
  const bt=String.raw`Bt=async($e,gt)=>{
    const ht=await Me("/api/customer/orders/"+$e);
    if(String(ht?.order?.id||"").toLowerCase()!==String($e).toLowerCase()||
       String(ht?.order?.status||"")!=="uploading"||String(ht?.order?.mode||"")!=="album")
      throw Object.assign(new Error("album_draft_not_found"),{data:{error:"album_draft_not_found"}});
    const Lt=(Array.isArray(ht?.files)?ht.files:[]).filter(row=>["active","pending"].includes(String(row.original_state)));
    const pn=new Set(),Kt=[];
    const active=Lt.filter(row=>row.original_state==='active');
    const jn=gt.map(Yt=>{
      const sn=String(Yt?.file?.name||"");
      const ta=String(Yt?.path||sn).replace(/\\/g,"/");
      const explicit=String(Yt.serverFileId||"").toLowerCase();
      const matchesPaper=row=>String(row.print_type||"")===String(tt(Yt));
      const matchesLegacy=row=>{
        const path=String(row.relative_path||row.original_name||"").replace(/\\/g,"/");
        return String(row.original_name||"")===sn &&
          Number(row.bytes||0)===Number(Yt?.file?.size||0) &&
          (path===ta||path.endsWith("/"+sn));
      };
      const Ln=!Yt.needsReupload && (explicit
        ? active.find(row=>String(row.id).toLowerCase()===explicit&&matchesPaper(row))
        : (Yt.legacyCompleted||Number(Yt.progress||0)>=100?active.find(row=>!pn.has(String(row.id))&&matchesPaper(row)&&matchesLegacy(row)):null));
      if(Ln){
        pn.add(String(Ln.id));
        return {...Yt,progress:100,serverFileId:String(Ln.id),needsReupload:false,legacyCompleted:false};
      }
      const pending=Lt.find(row=>String(row.original_state)==="pending"&&!Kt.includes(String(row.id))&&
        (explicit?String(row.id).toLowerCase()===explicit:matchesLegacy(row)));
      if(pending)Kt.push(String(pending.id));
      return {...Yt,progress:0,serverFileId:null,needsReupload:Boolean(Yt.needsReupload||explicit)};
    });
    for(const id of Kt)await Me("/api/customer/uploads/"+id,{method:"DELETE"}).catch(()=>{});
    ce.current=jn;pt(jn);
    return jn;
  }`;
  kv=kv.slice(0,btStart)+bt+kv.slice(btEnd);

  // Reopen: show "not yet reverified" until the exact active server rows
  // have been checked. Errors must not silently trigger a full resend.
  kv=once(kv,'progress:Number(Yt.progress||0)}));ht.sizeId',
    'progress:gt.order?.id?0:Number(Yt.progress||0),legacyCompleted:Boolean(Yt.legacyCompleted||Number(Yt.progress||0)>=100)}));ht.sizeId',
    root+' no optimistic verified status');
  const recovery='pe("ارسال نیمه‌کاره بازیابی شد؛ فایل‌های کامل حفظ شده‌اند. بعد از وصل‌شدن اینترنت «ادامه ارسال» را بزن.")';
  kv=once(kv,recovery,
    recovery+',void Bt(String(jn.id),pn).catch(()=>pe("بررسی فایل‌های قبلی از سرور انجام نشد؛ برای ادامه، اتصال را بررسی کرده و دوباره تلاش کنید."))',
    root+' verification on restoration');

  // Editing print paper makes the server's old upload metadata stale. Keep
  // its original bytes for support; send the revised file and let R1865's
  // consent-gated reconciliation exclude the old order-file row.
  const paperStart=kv.indexOf('qt=($e,gt)=>pt(ht=>ht.map(');
  const paperEnd=kv.indexOf(',Jt=we&&ee?',paperStart);
  if(paperStart<0||paperEnd<=paperStart)throw Error('[R1866] paper edit anchor missing '+root);
  const paper=String.raw`qt=($e,gt)=>{
    const chosen=R.some(row=>row.value===gt)?gt:Nt||"luster";
    const rows=ce.current.map(row=>String(row.id)===String($e)&&String(row.paperOverride||Nt)!==chosen
      ? {...row,paperOverride:chosen,progress:0,serverFileId:null,needsReupload:true,legacyCompleted:false}
      :row);
    ce.current=rows;pt(rows);
    void P(!1,rows).catch(()=>{});
  }`;
  kv=kv.slice(0,paperStart)+paper+kv.slice(paperEnd);

  // Allow editing and bulk removal after STOP/error, not during a transfer.
  kv=once(kv,'nt=()=>{if(je||Y!=="idle"||!ot.size)return;',
    'nt=()=>{if(je||!ot.size)return;',root+' bulk remove while stopped');
  kv=once(kv,'disabled:je||Y!=="idle"||!ot.size,onClick:nt',
    'disabled:je||!ot.size,onClick:nt',root+' bulk delete button');

  const lastRemoved=':(Pt.current=!1,Tu(Xe))';
  if(kv.split(lastRemoved).length-1!==2)
    throw Error('[R1866] expected two all-pages-removed branches '+root);
  kv=kv.split(lastRemoved).join(':(he.current=null,st.current="",A(0),Re("idle"),pe(""),Pt.current=!1,pb1866Reset.current=Tu(Xe))');

  // The upload loop's server-proven 100% must reset the paper-edit flag.
  kv=once(kv,
    'ce.current=ce.current.map(fn=>fn.id===Yn.id?{...fn,progress:100,serverFileId:String(An.fileId)}:fn),pt(ce.current)',
    'ce.current=ce.current.map(fn=>fn.id===Yn.id?{...fn,progress:100,serverFileId:String(An.fileId)}:fn),ce.current=ce.current.map(fn=>fn.id===Yn.id?{...fn,needsReupload:false}:fn),pt(ce.current)',
    root+' edited file completed');

  // One send/continue action, placed at the bottom of the quote panel.
  kv=once(kv,'e.jsx("button",{type:"button",onClick:()=>void xe(),children:"↻ ادامه ارسال"})',
    'e.jsx("span",{className:"pb1866ResumeHint",children:"برای ادامه ارسال از دکمه پایینِ ریزقیمت استفاده کنید."})',
    root+' remove duplicate upper action');
  kv=once(kv,
    'je?"در حال ارسال…":Q?"ثبت سایز آزاد و ارسال آلبوم":"ثبت و ارسال سفارش آلبوم"',
    'je?"در حال ارسال…":Y==="error"?"ادامه ارسال":Q?"ثبت سایز آزاد و ارسال آلبوم":"ثبت و ارسال سفارش آلبوم"',
    root+' bottom continue label');

  source=source.slice(0,start)+kv+source.slice(end);
  fs.writeFileSync(file,source);
  execFileSync(process.execPath,['--check',file],{stdio:'inherit'});

  const html=root+'/index.html';
  let page=fs.readFileSync(html,'utf8');
  page=once(page,'</head>','<meta name="pb-album-resume-fix" content="r1866"></head>',root+' asset marker');
  page=page.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,
    url=>url.includes('&albumResume=r1866')?url:url+'&albumResume=r1866');
  fs.writeFileSync(html,page);
}
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const name of [asset,'index.html']){
  const row=manifest.files.find(x=>x.name===name);
  if(!row)throw Error('[R1866] Windows manifest missing '+name);
  row.sha256=sha(fs.readFileSync(native+'/'+name));
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=sha(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1866] verified album resume, editable stopped uploads and clean new-order reset');
