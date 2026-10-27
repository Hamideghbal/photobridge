import fs from 'node:fs';
const source=fs.readFileSync('scripts/r1493-mobile-session-resume.js','utf8');
for(const file of ['dist/web/index.html','dist/api/equipment-rental-portal.html']){
 let html=fs.readFileSync(file,'utf8');
 if(!html.includes('id="pb1493MobileSessionResume"')){
  const insertion='<style id="pb1493MobileSessionResumeStyle">@media(max-width:820px){@media(display-mode:standalone){html.pb1493SessionResumePending #root{visibility:hidden!important}}}</style><script id="pb1493MobileSessionResume">'+source.replaceAll('</script>','<\\/script>')+'</script>';
  const head=html.indexOf('</head>');if(head<0)throw Error('R1493 document head missing: '+file);
  html=html.slice(0,head)+insertion+html.slice(head);fs.writeFileSync(file,html);
 }
}
console.log('[R1493] Mobile PWA validates and resumes the last active lab, photographer or rental account.');
