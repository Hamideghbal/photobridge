'use strict';
const text=v=>typeof v==='string'||typeof v==='number'?String(v).slice(0,240):'';
const first=(...values)=>values.map(text).find(Boolean)||'';
function records(value,depth=0){if(depth>4||!value)return[];if(Array.isArray(value))return value.flatMap(x=>records(x,depth+1));if(typeof value!=='object')return[];return[value,...['orders','invoices','customers','items','data','rows','payments'].flatMap(k=>records(value[k],depth+1))];}
function cached(store,url){try{const value=store.cached(url);return value?records(JSON.parse(Buffer.from(value.body,'base64').toString('utf8'))):[];}catch{return[];}}
const reasons={manual_invoice_customer_required:'نام مشتری فاکتور وارد نشده است.',invalid_manual_customer_mobile:'شمارهٔ همراه مشتری فاکتور معتبر نیست.',manual_invoice_items_required:'ردیف‌های فاکتور وارد نشده‌اند یا تعدادشان معتبر نیست.',invalid_manual_invoice_item:'شرح، تعداد یا قیمت یکی از ردیف‌های فاکتور معتبر نیست.',manual_invoice_total_required:'مبلغ کل فاکتور باید بیشتر از صفر باشد.',payment_exceeds_invoice_total:'مبلغ دریافتی از مبلغ فاکتور بیشتر است.',invalid_payment:'مبلغ یا مشتریِ دریافت وجه معتبر نیست.',invoice_not_found:'فاکتور مربوط پیدا نشده است.',order_not_found:'سفارش مربوط پیدا نشده است.',customer_not_found:'مشتری مربوط پیدا نشده است.',invalid_issued_at:'تاریخ صدور فاکتور معتبر نیست.'};
function describeConflict(row,store){
 const b=row.body&&typeof row.body==='object'&&!Array.isArray(row.body)?row.body:{},u=String(row.url||'').split('?')[0];
 const orderId=first(b.orderId,b.order_id,u.match(/\/orders\/([^/]+)/)?.[1],b.invoice?.orderId),invoiceId=first(b.invoiceId,b.invoice_id,u.match(/\/invoices\/(?!manual$)([^/]+)/)?.[1]);
 const orders=[...cached(store,'/api/lab/orders'),...cached(store,'/api/lab/archive')],invoices=cached(store,'/api/lab/invoices');
 const order=orderId?orders.find(x=>String(x.id||'')===orderId)||{}:{},invoice=invoiceId?invoices.find(x=>String(x.id||'')===invoiceId)||{}:{};
 const linkedOrder=order.id?order:orders.find(x=>String(x.id||'')===String(invoice.order_id||'')&&invoice.order_id)||{};
 const customerId=first(b.customerId,b.customer_id,linkedOrder.customer_id,invoice.customer_id);
 const customer=customerId?[...invoices,...orders,...cached(store,'/api/lab/customers')].find(x=>String(x.customer_id||x.id||'')===customerId)||{}:{};
 let title='تغییر اطلاعات',section='صفحهٔ اصلی لابراتوار',href='/lab',instruction='اطلاعات مربوط به این تغییر را در صفحهٔ اصلی بررسی کنید.';
 if(/\/invoices\//.test(u)){title=u.endsWith('/manual')?'ثبت فاکتور دستی':'تغییر فاکتور';section='مالی ← فاکتورها';href='/lab/finance/invoices';instruction='در فهرست فاکتورها، فاکتور این مشتری را با تاریخ، ردیف‌ها و مبلغ زیر تطبیق دهید.';}
 else if(u.endsWith('/invoice-pricing')){title='تأیید یا تغییر قیمت فاکتور سفارش';section='سفارش چاپ ← جزئیات سفارش ← فاکتور';href='/lab/orders';instruction='جزئیات سفارش زیر را باز کنید و قیمت‌ها و وضعیت تأیید فاکتور را بررسی کنید.';}
 else if(/\/finance\/payments/.test(u)){title='ثبت دریافت وجه';section='مالی ← دریافت‌ها';href='/lab/finance/payments';instruction='دریافت‌های این مشتری و پرداخت‌های فاکتور مربوط را با مبلغ زیر تطبیق دهید.';}
 else if(/\/finance\/expenses/.test(u)){title='ثبت هزینه';section='مالی ← هزینه‌ها';href='/lab/finance/expenses';instruction='هزینه‌های همان تاریخ را با مبلغ و شرح زیر بررسی کنید.';}
 else if(/\/finance\/(customer-adjustments|corrections)/.test(u)){title=u.includes('customer-adjustments')?'اصلاح بدهی یا اعتبار مشتری':'اصلاح عملیات مالی';section='مالی ← گردش حساب';href='/lab/finance/ledger';instruction='گردش حساب مشتری و سند اصلاحی مربوط را با مبلغ و شرح زیر بررسی کنید.';}
 else if(/\/orders(?:\/|$)|\/order-files\//.test(u)){const suffix=u.split('/').pop();const actions={status:'تغییر وضعیت سفارش',confirm:'تأیید سفارش',cancel:'لغو سفارش',deliver:'تحویل سفارش',files:'تغییر فایل‌های سفارش',quantity:'تغییر تعداد سفارش',copies:'تغییر تعداد چاپ'};title=actions[suffix]||(row.method==='POST'&&u.endsWith('/orders')?'ثبت سفارش جدید':'تغییر سفارش');section='سفارش چاپ ← جزئیات سفارش';href='/lab/orders';instruction='در سفارش‌های چاپ و در صورت نیاز آرشیو، سفارش زیر را پیدا و وضعیت، فایل‌ها و تغییر موردنظر را بررسی کنید.';}
 else if(/\/customers|\/customer-settings/.test(u)){title='تغییر اطلاعات مشتری';section='تنظیمات ← مشتریان';href='/lab/settings/customers';instruction='اطلاعات مشتری زیر را در تنظیمات مشتریان بررسی کنید.';}
 const fields=[];const add=(label,value)=>{const v=text(value);if(v)fields.push({label,value:v});};
 add('شمارهٔ سفارش',first(b.orderNumber,b.order_number,linkedOrder.number,invoice.order_number));add('شمارهٔ فاکتور',first(b.invoiceNumber,b.invoice_number,invoice.number));
 add('مشتری',first(b.customerName,b.customer_name,b.walkinCustomerName,b.customer?.name,linkedOrder.customer_name,invoice.customer_name,customer.customer_name,customer.name));
 add('همراه مشتری',first(b.customerMobile,b.customer_mobile,b.customer?.mobile,linkedOrder.customer_mobile,invoice.customer_mobile,customer.customer_mobile));
 add('عنوان سفارش',first(b.title,b.orderTitle,linkedOrder.title));add('نوع سفارش',({print:'چاپ عکس',album:'آلبوم'})[first(b.mode,linkedOrder.mode)]);
 add('وضعیت درخواستی',({pending:'در انتظار',printing:'در حال چاپ',ready:'آمادهٔ تحویل',delivered:'تحویل‌شده',cancelled:'لغوشده'})[text(b.status)]||text(b.status));
 add('مبلغ واردشده',first(b.amount,b.total,b.totalAmount));add('مبلغ پرداختی واردشده',b.paidAmount);add('تاریخ سند',first(b.issuedAt,b.paidAt,b.date));add('شرح',first(b.note,b.description));
 if(Array.isArray(b.items))for(const [i,item]of b.items.slice(0,5).entries())add('ردیف '+(i+1),[text(item.description||item.title),item.quantity!=null?'تعداد '+text(item.quantity):'',item.unitPrice!=null?'قیمت واحد '+text(item.unitPrice):''].filter(Boolean).join(' · '));
 if(!fields.length)add('اطلاعات قابل‌شناسایی','جزئیات قابل‌شناسایی در تغییر قدیمی ذخیره نشده است؛ زمان عملیات و جزئیات فنی را بررسی کنید.');
 const code=text(row.error?.error);return{title,section,href,instruction,fields,reason:code==='delivery_unknown'?'سرور پاسخی نرسانده؛ معلوم نیست این عملیات ثبت شده است یا نه.':reasons[code]||'سرور این تغییر را نپذیرفته است؛ علت دقیق‌تر در پاسخ ذخیره‌شده مشخص نیست.'};
}
module.exports={describeConflict};
