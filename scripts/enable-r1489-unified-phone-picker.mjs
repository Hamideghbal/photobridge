import fs from 'node:fs';
const root='dist/web/',asset=root+'assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(asset,'utf8');
if(!ui.includes('/* PB1489 shared phone picker */')){
 const once=(old,next)=>{if(ui.split(old).length!==2)throw Error('R1489 missing/ambiguous anchor: '+old.slice(0,100));ui=ui.replace(old,next)};
 for(const cls of ['pb1427InvoiceCustomerSelect','pb1487ReceiptPicker','pb1421CustomerSelect'])once('className:"'+cls+' pb1487CustomerPicker",menuClassName:"pb1487CustomerMenu"','className:"pb1489UnifiedPicker pb1487CustomerPicker",menuClassName:"pb1487CustomerMenu"');
 const begin=ui.indexOf('function PB1437CustomerPrompt('),end=ui.indexOf('/* PB1438 photographer controls */',begin);if(begin<0||end<begin)throw Error('R1489 customer prompt anchor');let part=ui.slice(begin,end);
 const dialog="return e.jsxs(On,{title:'انتخاب عکاسی',onClose,children:";
 if(part.split(dialog).length!==2)throw Error('R1489 dialog anchor');part=part.replace(dialog,"return e.jsxs(On,{title:'انتخاب عکاسی',onClose,dialogClassName:pb1487PhonePicker()?'pb1489CustomerPrompt':'',children:");
 const select="e.jsx('select',{'aria-label':'انتخاب عکاسی برای ثبت',value:id,onChange:event=>setId(event.target.value),children:[e.jsx('option',{value:'',children:'انتخاب عکاسی'}),...(customers||[]).map(customer=>e.jsx('option',{value:String(customer.id),children:customer.name||customer.mobile||'عکاسی'},customer.id))]})";
 const replacement="(pb1487PhonePicker()?e.jsx(wn,{className:'pb1489PromptPicker',menuClassName:'pb1487CustomerMenu',ariaLabel:'انتخاب عکاسی برای ثبت',value:id,onChange:setId,options:[{value:'',label:'انتخاب عکاسی'},...(customers||[]).map(customer=>({value:String(customer.id),label:customer.name||customer.mobile||'عکاسی'}))]}):"+select+")";
 if(part.split(select).length!==2)throw Error('R1489 prompt select anchor');part=part.replace(select,replacement);ui=ui.slice(0,begin)+part+ui.slice(end);
 ui+='\n/* PB1489 shared phone picker */\n';fs.writeFileSync(asset,ui);
}
fs.copyFileSync('scripts/r1489-unified-phone-picker.css',root+'photobridge-r1489-unified-phone-picker.css');let html=fs.readFileSync(root+'index.html','utf8');const tag='<link rel="stylesheet" href="/photobridge-r1489-unified-phone-picker.css?v=r1489">';if(!html.includes(tag))html=html.replace('</head>',tag+'\n</head>');fs.writeFileSync(root+'index.html',html);
