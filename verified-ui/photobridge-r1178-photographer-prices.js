(function init(){
if(window.pb1178ShowLabPrices)return;
const paper=[["luster","لاستر"],["silk","سیلک"],["metallic","متالیک"],["chassis","شاسی"],["frame","قاب"]];
const format=v=>v==null||v===""?"—":Number.isFinite(Number(v))?Number(v).toLocaleString("fa-IR"):"—";
const elt=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
window.pb1178ShowLabPrices=data=>{
 const previous=document.querySelector(".pb1178TariffDialog");if(previous){previous.close();previous.remove();}
 const modal=elt("dialog","pb1178TariffDialog");modal.dir="rtl";modal.setAttribute("aria-label","تعرفه چاپ لابراتوار");
 const heading=elt("header","pb1178TariffHead");
 const title=elt("div");title.append(elt("h2",null,"تعرفه‌های چاپ "+String(data?.lab?.name||"لابراتوار انتخاب‌شده")),elt("p",null,"قیمت‌های لابراتوار فعال برای سفارش چاپ شما، به تومان"));
 const close=elt("button","pb1178TariffClose","×");close.type="button";close.setAttribute("aria-label","بستن");close.onclick=()=>modal.close();heading.append(title,close);modal.append(heading);
 const wrap=elt("div","pb1178TariffScroll"),table=elt("table","pb1178TariffTable"),thead=elt("thead"),tr=elt("tr");
 tr.append(elt("th",null,"سایز چاپ"));for(const [,label] of paper)tr.append(elt("th",null,label));thead.append(tr);table.append(thead);
 const body=elt("tbody");const prices=Array.isArray(data?.prices)?data.prices:[];
 for(const row of prices){const line=elt("tr");line.append(elt("th",null,String(row.label||"سایز چاپ")));for(const [key] of paper){const val=row[key],cell=elt("td",val==null?"unpriced":"",format(val));line.append(cell)}body.append(line);}
 table.append(body);if(prices.length)wrap.append(table);else wrap.append(elt("p","pb1178TariffEmpty","برای این لابراتوار هنوز تعرفه‌ای جهت نمایش دریافت نشده است."));
 modal.append(wrap);const footer=elt("p","pb1178TariffFoot","مبلغ نهایی با توجه به کاغذ، تعداد چاپ و خدمات انتخابی محاسبه می‌شود.");modal.append(footer);
 document.body.append(modal);modal.addEventListener("close",()=>modal.remove(),{once:true});modal.addEventListener("click",e=>{if(e.target===modal)modal.close()});modal.showModal();
};
})();
