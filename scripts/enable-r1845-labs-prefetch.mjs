import fs from 'node:fs';
const index='dist/web/index.html',chooser='dist/web/photobridge-v904r99-lab-chooser.js';
let html=fs.readFileSync(index,'utf8'),js=fs.readFileSync(chooser,'utf8');
if(!html.includes('id="pb1845LabsPrefetch"')){
 if(!/<head\b[^>]*>/i.test(html))throw Error('R1845 head missing');
 html=html.replace(/<head\b[^>]*>/i,head=>head+'\n<script id="pb1845LabsPrefetch">'+fs.readFileSync('scripts/r1845-labs-prefetch.js','utf8')+'</script>');
}
if(!js.includes('const early=window.__PBLabsEarly;')){
 const anchor="const data=await api('/api/customer/labs');";
 if(js.split(anchor).length!==2)throw Error('R1845 labs call missing or ambiguous');
 js=js.replace(anchor,"const early=window.__PBLabsEarly;delete window.__PBLabsEarly;\n      const data=(early?await early:null)??await api('/api/customer/labs');");
}
fs.writeFileSync(index,html);fs.writeFileSync(chooser,js);
console.log('R1845: labs request starts in head, consumed once with existing API fallback');
