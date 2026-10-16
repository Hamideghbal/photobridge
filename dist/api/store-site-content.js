// Shop-specific public presentation. Rental, sales, stock, authentication and checkout stay in their existing flows.
const imageDefaults={hero:'/equipment-demo/canon-r6ii.png',feature:'/equipment-demo/sony-a7iv.png',gallery:'/equipment-demo/dji-rs3pro.png'};
export const STORE_SITE_IMAGES=imageDefaults;
export const STORE_SITE_SECTIONS=['features','steps','gallery','faq'];
export const STORE_SITE_FIELDS={
 tagline:100,heroTitle:180,heroText:500,heroButton:70,secondaryButton:70,
 featuresTitle:150,featuresText:400,feature1Title:100,feature1Text:260,feature2Title:100,feature2Text:260,feature3Title:100,feature3Text:260,
 stepsTitle:150,step1Title:100,step1Text:250,step2Title:100,step2Text:250,step3Title:100,step3Text:250,
 galleryTitle:150,galleryText:380,galleryCaption:250,faqTitle:150,faq1Q:200,faq1A:600,faq2Q:200,faq2A:600,
 aboutTitle:140,aboutText:700,footerText:220,phone:40,address:500,hours:200,metaTitle:100,metaDescription:250
};
export function defaultStoreSite(shop){
 const rental=shop.rental_enabled===true&&shop.sale_enabled===false;
 return {
 tagline:rental?'رزرو تجهیزات ویژهٔ عکاسان':'تجهیزات عکاسی و فیلم‌برداری',
 heroTitle:rental?'تجهیزات موردنیاز پروژه‌تان را رزرو کنید':'برای هر پروژه، ابزار درست را انتخاب کنید',
 heroText:rental?'تجهیزات قابل رزرو را ببینید و با حساب عکاسی، آفیش خود را ثبت کنید.':'تجهیزات عکاسی و فیلم‌برداری را بررسی کنید؛ محصولات فعال و قیمت فروش را در همین سایت ببینید و سفارش دهید.',
 heroButton:rental?'ورود و ثبت آفیش':'مشاهدهٔ تجهیزات',
 secondaryButton:rental?'دربارهٔ فروشگاه':'آفیش تجهیزات',
 featuresTitle:'همه‌چیز برای یک انتخاب آگاهانه',featuresText:'پیش از خرید یا رزرو، مشخصات و گزینه‌های فعال فروشگاه را بررسی کنید.',
 feature1Title:'دوربین و لنز',feature1Text:'مدل‌ها، قابلیت‌ها و گزینه‌های موجود را در فهرست تجهیزات ببینید.',
 feature2Title:'نور و تجهیزات جانبی',feature2Text:'ابزار موردنیاز پروژه را بر اساس موجودی و مشخصات فروشگاه انتخاب کنید.',
 feature3Title:'خرید و رزرو در یک مسیر',feature3Text:'خرید عمومی و آفیش عکاسان در بخش‌های مستقل انجام می‌شود.',
 stepsTitle:'از انتخاب تا ثبت درخواست',
 step1Title:'تجهیزات را انتخاب کنید',step1Text:'فهرست کالاهای فعال و مشخصات هر مورد را بررسی کنید.',
 step2Title:'قیمت و شرایط را ببینید',step2Text:'قیمت فروش وب‌سایت مستقل از قیمت داخل فوتوبریج است؛ آفیش مخصوص اعضای تأییدشده است.',
 step3Title:'سفارش یا آفیش را ثبت کنید',step3Text:'در خرید عمومی رسید پرداخت برای فروشگاه ارسال می‌شود؛ ثبت آفیش از حساب عکاس انجام می‌شود.',
 galleryTitle:'نگاهی به تجهیزات',galleryText:'تصاویر این بخش صرفاً نمایشی هستند؛ مدل‌ها و موجودی واقعی را از بخش محصولات یا آفیش بررسی کنید.',
 galleryCaption:'تصویر نمونه و نمایشی است و لزوماً نشان‌دهندهٔ موجودی فروشگاه نیست.',
 faqTitle:'سؤالات رایج',faq1Q:'برای خرید از سایت باید عضو فوتوبریج باشم؟',faq1A:'خیر. خرید عمومی به عضویت عکاس نیازی ندارد؛ مبلغ و جزئیات سفارش هنگام ثبت نمایش داده می‌شوند.',
 faq2Q:'برای آفیش تجهیزات چه حسابی لازم است؟',faq2A:'ثبت آفیش فقط با حساب عکاس و همکاری تأییدشده با همین فروشگاه امکان‌پذیر است.',
 aboutTitle:'دربارهٔ '+(shop.name||'فروشگاه'),aboutText:shop.description||'برای اطلاع از محصولات، خدمات و هماهنگی سفارش با فروشگاه تماس بگیرید.',
 footerText:'فروشگاه تجهیزات عکاسی و فیلم‌برداری',
 phone:shop.phone||'',address:shop.address||'',hours:'',
 metaTitle:'',metaDescription:'',
 primary:'#315efb',background:'#f7f9fd',ink:'#18283e',font:'Vazirmatn',fontSize:15,
 sections:[...STORE_SITE_SECTIONS],hidden:[],images:{...imageDefaults}
 };
}
export function mergeStoreSite(shop,saved={}){
 const out=defaultStoreSite(shop);
 if(!saved||typeof saved!=='object'||Array.isArray(saved))return out;
 for(const [key,max] of Object.entries(STORE_SITE_FIELDS))
  if(typeof saved[key]==='string')out[key]=saved[key].slice(0,max);
 for(const key of ['primary','background','ink'])if(/^#[a-f0-9]{6}$/i.test(saved[key]||''))out[key]=saved[key];
 if(['Vazirmatn','Tahoma','Arial'].includes(saved.font))out.font=saved.font;
 if(Number.isInteger(saved.fontSize)&&saved.fontSize>=14&&saved.fontSize<=20)out.fontSize=saved.fontSize;
 if(Array.isArray(saved.sections)&&saved.sections.length===STORE_SITE_SECTIONS.length&&new Set(saved.sections).size===STORE_SITE_SECTIONS.length&&saved.sections.every(x=>STORE_SITE_SECTIONS.includes(x)))out.sections=[...saved.sections];
 if(Array.isArray(saved.hidden))out.hidden=[...new Set(saved.hidden.filter(x=>STORE_SITE_SECTIONS.includes(x)))];
 for(const k of Object.keys(imageDefaults)){const image=saved.images?.[k];if(Object.values(imageDefaults).includes(image)||typeof image==='string'&&image.length<=600000&&/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(image))out.images[k]=image;}
 return out;
}
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export async function normalizeStoreSite(input,sharp){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('invalid_site_config');
 const out={};
 for(const [key,max] of Object.entries(STORE_SITE_FIELDS)){if(input[key]===undefined)continue;if(typeof input[key]!=='string'||input[key].length>max)fail('invalid_site_text');out[key]=input[key].trim();}
 if(input.heroTitle!==undefined&&!out.heroTitle)fail('site_title_required');
 if(out.phone&&!/^[+0-9۰-۹٠-٩()\s-]{5,40}$/.test(out.phone))fail('invalid_site_phone');
 for(const key of ['primary','background','ink'])if(input[key]!==undefined){if(!/^#[a-f0-9]{6}$/i.test(input[key]))fail('invalid_site_color');out[key]=input[key];}
 if(input.font!==undefined){if(!['Vazirmatn','Tahoma','Arial'].includes(input.font))fail('invalid_site_font');out.font=input.font;}
 if(input.fontSize!==undefined){if(!Number.isInteger(input.fontSize)||input.fontSize<14||input.fontSize>20)fail('invalid_site_font_size');out.fontSize=input.fontSize;}
 for(const key of ['sections','hidden'])if(input[key]!==undefined){const list=input[key];if(!Array.isArray(list)||list.some(x=>!STORE_SITE_SECTIONS.includes(x))||new Set(list).size!==list.length||(key==='sections'&&list.length!==STORE_SITE_SECTIONS.length))fail('invalid_site_sections');out[key]=[...list];}
 if(input.images!==undefined){
  if(!input.images||typeof input.images!=='object'||Array.isArray(input.images))fail('invalid_site_image');
  out.images={};
  for(const key of Object.keys(imageDefaults)){
   const image=input.images[key];if(image===undefined)continue;
   if(Object.values(imageDefaults).includes(image)){out.images[key]=image;continue;}
   if(typeof image!=='string'||image.length>600000||!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image))fail('invalid_site_image');
   const buffer=Buffer.from(image.split(',')[1],'base64');if(buffer.length>430000)fail('site_image_too_large');
   let optimized;try{optimized=await sharp(buffer,{limitInputPixels:20000000,animated:false}).rotate().resize({width:1400,height:1400,fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer();}catch{fail('invalid_site_image');}
   if(optimized.length>280000)fail('site_image_too_large');
   out.images[key]='data:image/webp;base64,'+optimized.toString('base64');
  }
 }
 return out;
}
