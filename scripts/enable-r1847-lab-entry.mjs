import fs from 'node:fs';
const index='dist/web/index.html',chooser='dist/web/photobridge-v904r99-lab-chooser.js',bundle='dist/web/assets/index-UIRefine-v655-r84.js',core='dist/web/photobridge-v904r100f37-store-header-core.js';
let html=fs.readFileSync(index,'utf8'),js=fs.readFileSync(chooser,'utf8'),app=fs.readFileSync(bundle,'utf8'),header=fs.readFileSync(core,'utf8');
function replaceOnce(text,before,after,label){if(text.split(before).length!==2)throw Error('R1847 missing/ambiguous '+label);return text.replace(before,()=>after)}
if(!html.includes('id="pb1847LabEntry"')){
 html=replaceOnce(html,'<head>','<head>\n<script id="pb1847LabEntry">'+fs.readFileSync('scripts/r1847-lab-entry.js','utf8')+'</script>','head');
 html=replaceOnce(html,"if((t&&Date.now()-t<12000)||q.get('pbEntryDone')==='lab')","if(!window.__PB1847EntryUI&&((t&&Date.now()-t<12000)||q.get('pbEntryDone')==='lab'))",'legacy cover');
}
if(!js.includes('photobridge:r1847:entry-lab')){
 js=replaceOnce(js,"await api('/api/customer/labs/'+encodeURIComponent(id)+'/select',{method:'POST',body:'{}'});sessionStorage.setItem(SESSION_KEY,id);", "const selected=await api('/api/customer/labs/'+encodeURIComponent(id)+'/select',{method:'POST',body:'{}'});try{sessionStorage.setItem('photobridge:r1847:entry-lab',JSON.stringify({id,name:selected?.lab?.name||'',at:Date.now()}))}catch{}sessionStorage.setItem(SESSION_KEY,id);",'selected lab hint');
 js=replaceOnce(js,"document.documentElement.classList.add('pbR100F37LabEnterBoot');const selected=await api","const selected=await api",'keep chooser visible during select');
 js=replaceOnce(js,"try{sessionStorage.setItem('photobridge:r1847:entry-lab'","document.documentElement.classList.add('pbR100F37LabEnterBoot');try{sessionStorage.setItem('photobridge:r1847:entry-lab'",'cover only after selection');
 const oldPoll=js.includes("},window.matchMedia?.('(max-width:820px)')?.matches?30000:8000)")?"},window.matchMedia?.('(max-width:820px)')?.matches?30000:8000)":"},8000)";
 js=replaceOnce(js,oldPoll,"},30000)",'chooser poll');
}
if(!app.includes('async function PB1847OriginalApi('))app=replaceOnce(app,'async function Me(t,a={}){',fs.readFileSync('scripts/r1847-entry-api.js.txt','utf8')+'async function PB1847OriginalApi(t,a={}){','API prefetch consumption');
if(!header.includes('window.__PB1847EntryUI'))header=replaceOnce(header,'function settleBoot(){',"function settleBoot(){if(typeof window!=='undefined'&&window.__PB1847EntryUI){window.__PB1847EntryUI.check();return}",'legacy readiness');
const polish='dist/web/photobridge-v904r100f40-mobile-polish.js';
let polishJs=fs.readFileSync(polish,'utf8');
if(!polishJs.includes('window.__PB1847EntryUI'))polishJs=replaceOnce(polishJs,'function settleBoot(){',"function settleBoot(){if(typeof window!=='undefined'&&window.__PB1847EntryUI){window.__PB1847EntryUI.check();return}",'polish readiness');
fs.writeFileSync(polish,polishJs);
fs.writeFileSync(index,html);fs.writeFileSync(chooser,js);fs.writeFileSync(bundle,app);fs.writeFileSync(core,header);
console.log('R1847: parallel home/orders prefetch, bounded entry skeleton, 30s chooser poll');
