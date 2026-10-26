function PB1462RatioNotice(count){
 document.querySelector('.pb1462RatioNotice')?.remove();
 const dialog=document.createElement('dialog');dialog.className='pb1452ArchiveDialog pb1462RatioNotice';dialog.dir='rtl';dialog.setAttribute('aria-labelledby','pb1462RatioTitle');
 const header=document.createElement('header'),copy=document.createElement('div'),brand=document.createElement('small'),title=document.createElement('h3'),body=document.createElement('div'),footer=document.createElement('footer'),close=document.createElement('button');
 brand.textContent='فوتوبریج · چاپ عکس';title.id='pb1462RatioTitle';title.textContent='نیاز به تنظیم برش در لابراتوار';copy.append(brand,title);header.append(copy);
 body.className='pb1452DialogMessage';body.textContent=V(count)+' فایل با سایز چاپ انتخاب‌شده هماهنگ نیست. فایل‌ها برای لابراتوار ارسال می‌شوند؛ لابراتوار باید قاب‌بندی را تنظیم کند و برش لازم را انجام دهد.';
 close.type='button';close.className='primary';close.textContent='متوجه شدم';close.onclick=()=>dialog.close();footer.append(close);
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.append(header,body,footer);document.body.append(dialog);dialog.showModal();
}
