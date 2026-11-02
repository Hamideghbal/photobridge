const fs=require('node:fs');
for(const p of ['dist/web/assets/index-UIRefine-v655-r84.js','dist/api/server.js']){
 const s=fs.readFileSync(p,'utf8');
 const terms=p.includes('server')?['api/lab/print','print-sizes','print-types','album-settings','binding_price','bindingPrice','luster_price','lusterPrice','paper_type','paperType','lab_print_sizes','album_size','print_tariffs']:
 ['labPrintPricingCard','printSizeEditor','صحافی آلبومی','تعرفه‌های چاپ','تعرفه چاپ','bindingPrice','metallicPrice','lusterPrice','کاغذ','صحافی','albumBinding','printSizes','labPrint','paperOptions'];
 console.log('SOURCE',p,'LEN',s.length);
 for(const term of terms){
  let pos=-1,hits=0;
  while((pos=s.indexOf(term,pos+1))>=0&&hits<8){hits++;console.log(JSON.stringify({term,pos,context:s.slice(Math.max(0,pos-300),Math.min(s.length,pos+650))}));}
  if(!hits)console.log('NOT FOUND',term);
 }
}
