import fs from 'node:fs';
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error(label+': expected 1 anchor got '+n);return s.replace(a,b)};
const file='dist/api/equipment-rental-portal.html';let p=fs.readFileSync(file,'utf8');
if(!p.includes('photobridge-r1250-owner-settings.js')){
 p=one(p,'<label class="smsToggle"><input id="smsBookingApproved" type="checkbox"/>پیامک بعد از تأیید رزرو</label>','<label class="smsToggle"><input id="smsBookingApproved" type="checkbox"/>پیامک تأیید سفارش</label>','SMS approval label');
 p=one(p,'<label class="smsToggle"><input id="smsBookingStatus" type="checkbox"/>پیامک رد یا لغو آفیش</label>','<label class="smsToggle"><input id="smsBookingStatus" type="checkbox"/>پیامک رد یا لغو سفارش</label>','SMS cancellation label');
 p=one(p,'<label class="smsToggle"><input id="smsInviteEnabled" type="checkbox"/><span class="pbR1084InviteCopy">پیامک دعوت عکاس<small id="smsInviteCreditHint">برای پیامک‌های دعوت عکاس، از اعتبار پیامکی شما کسر نمی‌شود.</small></span></label>','<label class="smsToggle"><input id="smsReadyEnabled" type="checkbox"/>پیامک آماده‌شدن سفارش</label><div class="smsAlwaysEnabled"><b>دعوت عکاس همیشه فعال است</b><small>هزینه دعوت از اعتبار سامانه پرداخت می‌شود.</small></div>','SMS invite/ready controls');
 p=one(p,"$('#smsInviteEnabled').checked=st.inviteEnabled!==false;","$('#smsReadyEnabled').checked=st.readyEnabled!==false;","SMS ready snapshot");
 p=one(p,"bookingStatusEnabled:$('#smsBookingStatus').checked,inviteEnabled:$('#smsInviteEnabled').checked","bookingStatusEnabled:$('#smsBookingStatus').checked,readyEnabled:$('#smsReadyEnabled').checked","SMS ready save");
 const old='<option value="equipment_rental">اجاره تجهیزات عکاسی</option><option value="equipment_sale">فروش تجهیزات عکاسی</option><option value="equipment_rental_sale">فروش و اجاره تجهیزات عکاسی</option><option value="frame">فروش و تولید قاب</option><option value="chassis">فروش و تولید شاسی</option><option value="frame_chassis">فروش و تولید قاب و شاسی</option>';
 const activity='<option value="frame_chassis">فروش و تولید قاب و شاسی</option><option value="equipment_rental_sale">فروش و اجاره تجهیزات عکاسی و فیلمبرداری</option>';
 p=one(p,old,activity,'two editable shop categories');
 const categoryMarker="if(f.elements.businessCategory)f.elements.businessCategory.value=s.business_category||'equipment_rental_sale';";
 const categoryFix="if(f.elements.businessCategory){f.elements.businessCategory.disabled=false;f.elements.businessCategory.value=['frame','chassis','frame_chassis'].includes(s.business_category)?'frame_chassis':'equipment_rental_sale';}";
 p=one(p,categoryMarker,categoryFix,'restore selection of legacy shop categories');
 p=one(p,'"equipment_rental_sale": "فروش و اجاره تجهیزات عکاسی"','"equipment_rental_sale": "فروش و اجاره تجهیزات عکاسی و فیلمبرداری"','shop type display name');
 const closing='</body></html>',position=p.lastIndexOf(closing);if(position<0)throw Error('owner document closing tags missing');p=p.slice(0,position)+'<link rel="stylesheet" href="/photobridge-r1250-owner-settings.css?v=r1250"><script defer src="/photobridge-r1250-owner-settings.js?v=r1250"></script>'+p.slice(position);
 p=p.replace('/photobridge-r1242-frame-payments.js?v=r1249','/photobridge-r1242-frame-payments.js?v=r1250');
 fs.writeFileSync(file,p);
}
const bookFile='dist/api/equipment-rental-book.html';let book=fs.readFileSync(bookFile,'utf8');
if(!book.includes('r1250-assets')){
 book=one(book,'/photobridge-r1249-customer-activity-polish.css?v=r1249','/photobridge-r1249-customer-activity-polish.css?v=r1250','store CSS');
 book=one(book,'/photobridge-r1249-camera-category.js?v=r1249','/photobridge-r1249-camera-category.js?v=r1250','customer category JS');
 book=one(book,'/photobridge-r1242-frame-payments.js?v=r1249','/photobridge-r1242-frame-payments.js?v=r1250','payment JS');
 book=book.replace('/photobridge-r1126-desktop-navigation.js?v=r1249','/photobridge-r1126-desktop-navigation.js?v=r1250');
 book=one(book,'</body>\n</html>','<!--r1250-assets-->\n</body>\n</html>','book revision marker');
 fs.writeFileSync(bookFile,book);
}
console.log('r1250 storefront owner and customer portal patch ready');
