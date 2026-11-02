const fs=require('fs'),server=fs.readFileSync('dist/api/server.js','utf8'),ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const queries=[
["SERVER","paperCounts",server],["SERVER","paperType",server],["SERVER","printType",server],["SERVER","print_type",server],
["SERVER","albumOrderSnapshot",server],["SERVER","albumInvoiceLineItems",server],["SERVER","invoicePrintTypeLabel",server],["SERVER","albumBinding",server],["SERVER","paper_type",server],
["SERVER","/api/lab/order-files",server],["SERVER","paper_invalid",server],["SERVER","invalid_paper",server],["SERVER","luster, silk, metallic",server],
["CLIENT","paperOptions",ui],["CLIENT","printType",ui],["CLIENT","paperType",ui],["CLIENT","لستر",ui],["CLIENT","لاستر",ui],
["INTAKE","paperOptions",intake],["INTAKE","paperCounts",intake],["INTAKE","albumMode",intake]
];
for(const [area,q,source] of queries){let pos=-1,all=[];while((pos=source.indexOf(q,pos+1))>=0){all.push(pos);if(all.length>500)break};const selected=all.length>5?[...all.slice(0,3),...all.slice(-2)]:all;console.log(JSON.stringify({area,q,count:all.length,positions:selected,matches:selected.map(p=>source.slice(Math.max(0,p-150),p+330))}));}
