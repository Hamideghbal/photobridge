#!/usr/bin/env node
// R1839 — remove three public service promotions from HOME ONLY; keep features/routes.
import fs from 'node:fs';
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
const index='dist/web/index.html';
const server='dist/api/server.js';
const backupDir='.photobridge-home-trim-backup';
const mark='/* PB_HOME_TRIM_R1839 */';
const read=p=>fs.readFileSync(p,'utf8');
function assert(v,m){if(!v)throw Error('R1839 '+m)}
function once(s,from,to,label){const i=s.indexOf(from);assert(i>=0,label+' missing');assert(s.indexOf(from,i+from.length)<0,label+' repeated');return s.slice(0,i)+to+s.slice(i+from.length)}
const files=[bundle,index,server],old={};
try{
 for(const p of files){assert(fs.existsSync(p),'missing '+p);old[p]=read(p)}
 if(old[bundle].startsWith(mark)){console.log('[R1839] already applied');process.exit(0)}
 let js=old[bundle],html=old[index],api=old[server];
 const start=js.indexOf('function Ff(){'),end=js.indexOf('function fh({challengeId',start);
 assert(start>=0&&end>start,'homepage component not found');
 let home=js.slice(start,end);
 home=once(home,'e.jsx("a",{className:"publicFeatureLink",href:"/album-design",children:"طراحی آلبوم"}),','','album nav link');
 home=once(home,'e.jsx("a",{className:"publicFeatureLink",href:"/retouch-photo",children:"روتوش عکس"}),','','retouch nav link');
 home=once(home,'PhotoBridge؛ از سفارش چاپ تا گالری خصوصی و ابزارهای هوش مصنوعی','PhotoBridge؛ مدیریت چاپ، گالری خصوصی و ارتباط عکاسان','home title');
 home=once(home,'روتوش عکس، طراحی آلبوم و طراحی محتوای اینستاگرام برای عموم بدون عضویت در دسترس است؛ پرداخت هر خروجی مستقیم انجام می‌شود. عکاسان عضو همان ابزارها را با تعرفه حرفه‌ای پایین‌تر استفاده می‌کنند.','PhotoBridge سفارش چاپ، گالری خصوصی مشتری و ارتباط مستقیم عکاسان، لابراتوارها و فروشگاه‌های تجهیزات را در یک مجموعه فراهم می‌کند.','home introduction');
 home=once(home,'e.jsx("a",{className:"primary",href:"/ai",children:"روتوش صورت با AI"}),','e.jsx("a",{className:"primary",href:"/photo-selection-gallery",children:"گالری انتخاب عکس"}),','hero action');
 home=once(home,'e.jsx("b",{children:"هوش مصنوعی PhotoBridge"}),e.jsx("small",{children:"روتوش عمومی با پرداخت آنلاین هر سفارش؛ ابزار حرفه‌ای عکاس با تعرفه جدا."})','e.jsx("b",{children:"سفارش چاپ عکس"}),e.jsx("small",{children:"ثبت سفارش، پیگیری مراحل چاپ و ارتباط مستقیم با لابراتوار."})','hero service card');
 home=once(home,'حساب مستقل بساز، کیف پولت را شارژ کن و فعلاً از دو سرویس اصلی PhotoBridge استفاده کن.','حساب مستقل عکاسی بساز و سفارش‌ها و گالری مشتری را از یک پنل مدیریت کن.','photographer intro');
 home=once(home,'e.jsxs("li",{children:[e.jsx("b",{children:"هوش مصنوعی"})," برای پردازش و ترمیم عکس"]}),','','photographer AI item');
 home=once(home,'روتوش، انتخاب عکس، طراحی آلبوم و محتوای اینستاگرام برای عکاسان','گالری انتخاب عکس و چاپ لابراتوار برای عکاسان','service heading');
 home=once(home,'هر خدمت صفحه مستقل دارد تا عکاس یا مشتری مستقیم وارد موضوع موردنیازش شود؛ از روتوش حرفه‌ای و گالری انتخاب عکس تا طراحی آلبوم ژورنالی، پست اینستاگرام و چاپ لابراتوار.','از گالری خصوصی انتخاب عکس مشتری تا سفارش چاپ، خدمات مرتبط در دسترس عکاسان و لابراتوارهاست.','service explanation');
 const cardsStart=home.indexOf('className:"publicSeoHomeCards"');
 const cardsEnd=home.indexOf('e.jsxs("footer",{className:"publicFooter"',cardsStart);
 assert(cardsStart>=0&&cardsEnd>cardsStart,'homepage cards not found');
 let cards=home.slice(cardsStart,cardsEnd);
 const removed=[];
 cards=cards.replace(/e\.jsxs\("a",\{href:"\/(?:ai|album-design\/start|instagram-post-design\/start)",children:\[e\.jsx\("b",\{children:"(?:روتوش عکس حرفه‌ای|طراحی آلبوم آنلاین|طراحی پست اینستاگرام)"\}\)[\s\S]*?\]\}\),/g,m=>{removed.push(m);return ''});
 assert(removed.length===3,'expected exactly three service cards; got '+removed.length);
 home=home.slice(0,cardsStart)+cards+home.slice(cardsEnd);
 js=mark+'\n'+js.slice(0,start)+home+js.slice(end);
 const guard='<script id="pbR1839HomeOnly">if(location.pathname==="/")document.documentElement.classList.add("pbR1839HomeOnly")</script>\n'+
 '<style id="pbR1839HomeOnlyStyle">html.pbR1839HomeOnly a[href="/ai"],html.pbR1839HomeOnly a[href^="/retouch-photo"],html.pbR1839HomeOnly a[href^="/album-design"],html.pbR1839HomeOnly a[href^="/instagram-post-design"]{display:none!important}html.pbR1839HomeOnly .pbMobilePrimaryActions{display:none!important}</style>\n';
 html=once(html,'<head>','<head>\n'+guard,'head injection');
 html=once(html,'/assets/index-UIRefine-v655-r84.js?v=r1159','/assets/index-UIRefine-v655-r84.js?v=r1159&home=r1839','main JS cache bust');
 const changes=[
 ['PhotoBridge | روتوش عکس، گالری انتخاب عکس و طراحی حرفه‌ای عکاسان','PhotoBridge | گالری انتخاب عکس، سفارش چاپ و مدیریت عکاسی'],
 ['PhotoBridge؛ روتوش عکس حرفه‌ای، گالری انتخاب عکس مشتری، طراحی آلبوم ژورنالی، طراحی پست اینستاگرام و چاپ لابراتوار برای عکاسان و آتلیه‌ها.','PhotoBridge؛ گالری انتخاب عکس مشتری، سفارش چاپ لابراتوار و ارتباط عکاسان، مشتریان و فروشگاه‌های تجهیزات.'],
 ['روتوش عکس، گالری انتخاب عکس، طراحی آلبوم و پست اینستاگرام، چاپ و ابزارهای حرفه‌ای عکاسان در یک پلتفرم تخصصی.','گالری انتخاب عکس، سفارش چاپ لابراتوار و مدیریت ارتباط عکاس و مشتری در یک پلتفرم تخصصی.'],
 ['روتوش عکس، انتخاب عکس مشتری، طراحی آلبوم و محتوای اینستاگرام برای عکاسان و آتلیه‌ها.','گالری انتخاب عکس مشتری، سفارش چاپ و ارتباط عکاسان و لابراتوارها.']
 ];
 for(const [from,to] of changes)html=html.split(from).join(to);
 const seoStart=api.indexOf("const SEO_PUBLIC_PAGES = {"),seoNext=api.indexOf("    '/album-design': {",seoStart);
 assert(seoStart>=0&&seoNext>seoStart,'homepage SEO entry not found');
 let seo=api.slice(seoStart,seoNext);
 seo=once(seo,'PhotoBridge | روتوش عکس، گالری انتخاب عکس و طراحی حرفه‌ای عکاسان','PhotoBridge | گالری انتخاب عکس، سفارش چاپ و مدیریت عکاسی','SEO title');
 seo=once(seo,'PhotoBridge ابزار حرفه‌ای عکاسان و آتلیه‌ها برای روتوش عکس آنلاین، گالری انتخاب عکس مشتری، طراحی آلبوم ژورنالی، طراحی پست اینستاگرام و سفارش چاپ لابراتوار است.','PhotoBridge برای گالری انتخاب عکس مشتری، سفارش چاپ لابراتوار و ارتباط عکاسان، مشتریان و فروشگاه‌های تجهیزات است.','SEO description');
 seo=once(seo,'PhotoBridge؛ روتوش عکس، انتخاب عکس و طراحی آنلاین برای عکاسان','PhotoBridge؛ گالری انتخاب عکس و سفارش چاپ برای عکاسان','SEO heading');
 seo=once(seo,'روتوش حرفه‌ای عکس، گالری انتخاب عکس مشتری، طراحی آلبوم، طراحی پست اینستاگرام و چاپ لابراتوار در یک جریان کاری برای عکاسان.','گالری انتخاب عکس مشتری، سفارش چاپ لابراتوار و همکاری با فروشگاه تجهیزات در یک جریان کاری برای عکاسان.','SEO body');
 api=api.slice(0,seoStart)+seo+api.slice(seoNext);
 fs.mkdirSync(backupDir,{recursive:true});
 for(const p of files)fs.copyFileSync(p,backupDir+'/'+p.replaceAll('/','_'));
 fs.writeFileSync(bundle,js);fs.writeFileSync(index,html);fs.writeFileSync(server,api);
 console.log('[R1839] homepage links/cards removed; inner feature routes preserved; release JS cache busted; SEO updated');
}catch(error){
 for(const p of files)if(old[p]!==undefined)fs.writeFileSync(p,old[p]);
 console.error('[R1839] failed and restored:',error.stack||error);
 process.exitCode=1;
}
