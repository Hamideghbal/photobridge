/* PhotoBridge R1868 – unified RTL service selectors for CRM and appointment calendar. */
(()=>{
'use strict';
const VERSION='r1868-crm-services';
const ids=['session-type','template-type','cal-customer','cal-duration','cal-status'];
const items=new Map();
const $=id=>document.getElementById(id);
const notify=(message,error=false)=>{
  if(typeof toast==='function')toast(message,error);
  else {const status=$('status');if(status){status.textContent=message;status.className='status '+(error?'error':'success');}}
};
let currentlyOpen=null;
function closePopup(){
  if(!currentlyOpen)return;
  currentlyOpen.popup.hidden=true;
  currentlyOpen.button.setAttribute('aria-expanded','false');
  currentlyOpen=null;
}
function placePopup(record){
  const box=record.button.getBoundingClientRect();
  const w=Math.min(Math.max(180,box.width),innerWidth-24);
  const below=innerHeight-box.bottom-13;
  const above=box.top-13;
  const opensUp=below<190&&above>below;
  record.popup.style.width=w+'px';
  record.popup.style.left=Math.max(12,Math.min(innerWidth-w-12,box.left))+'px';
  record.popup.style.maxHeight=Math.min(300,Math.max(0,opensUp?above:below))+'px';
  record.popup.style.top=opensUp?'auto':(box.bottom+5)+'px';
  record.popup.style.bottom=opensUp?(innerHeight-box.top+5)+'px':'auto';
}
function optionRows(record){
  const options=[...record.native.options].filter(o=>!o.disabled&&o.value);
  record.popup.replaceChildren();
  if(!options.length){
    const empty=document.createElement('p');empty.className='pb1868Empty';empty.textContent='موردی برای انتخاب ثبت نشده است.';record.popup.append(empty);
  }
  for(const option of options){
    const row=document.createElement('button');row.type='button';row.className='pb1868Option';
    row.setAttribute('role','option');row.setAttribute('aria-selected',String(option.selected));
    row.dataset.value=option.value;row.textContent=option.textContent;
    row.onclick=()=>{
      record.native.value=option.value;
      record.native.dispatchEvent(new Event('change',{bubbles:true}));
      record.native.dispatchEvent(new Event('input',{bubbles:true}));
      closePopup();record.button.focus();
    };
    record.popup.append(row);
  }
  if(['session-type','template-type'].includes(record.native.id)){
    const add=document.createElement('button');add.type='button';add.className='pb1868Option pb1868Add';add.textContent='＋ افزودن نوع خدمات';
    add.onclick=()=>{
      closePopup();
      record.button.focus();
      showNewService(service=>{
        record.native.value=service.id;
        record.native.dispatchEvent(new Event('change',{bubbles:true}));
      });
    };
    record.popup.append(add);
  }
}
function refresh(record){
  const option=record.native.selectedOptions?.[0];
  const label=option?.value?option.textContent:'انتخاب کنید…';
  record.button.textContent=label;
  record.button.disabled=record.native.disabled;
  if(record.button.disabled&&currentlyOpen===record)closePopup();
  record.button.classList.toggle('pb1868Placeholder',!option?.value);
  if(currentlyOpen===record){optionRows(record);placePopup(record);}
}
function openPopup(record){
  if(currentlyOpen===record){closePopup();return}
  closePopup();optionRows(record);record.popup.hidden=false;currentlyOpen=record;
  record.button.setAttribute('aria-expanded','true');placePopup(record);
}
function mountSelect(native){
  if(!native||items.has(native.id))return;
  const wrapper=document.createElement('span');wrapper.className='pb1868Select';
  native.parentNode.insertBefore(wrapper,native);wrapper.append(native);
  native.classList.add('pb1868Native');
  native.tabIndex=-1;
  native.setAttribute('aria-hidden','true');
  const button=document.createElement('button');button.type='button';button.className='pb1868Trigger';
  button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
  const label=document.querySelector('label[for="'+native.id+'"]')||native.parentElement?.closest('.field')?.querySelector('label');
  if(label){
    label.id||=native.id+'-label';
    button.id=native.id+'-trigger';
    button.setAttribute('aria-labelledby',label.id+' '+button.id);
    label.addEventListener('click',event=>{event.preventDefault();button.focus();});
  }
  wrapper.append(button);
  const popup=document.createElement('div');popup.className='pb1868Popup';popup.hidden=true;popup.setAttribute('role','listbox');
  popup.id=native.id+'-options';
  button.setAttribute('aria-controls',popup.id);
  if(label)popup.setAttribute('aria-labelledby',label.id);
  // Modal dialogs use the top layer. Attach the list to the dialog, not the document body.
  (native.closest('dialog')||document.body).append(popup);
  const record={native,button,popup};items.set(native.id,record);
  button.onclick=()=>openPopup(record);
  button.onkeydown=e=>{
    if(['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){
      e.preventDefault();if(currentlyOpen!==record)openPopup(record);
      const choices=[...popup.querySelectorAll('.pb1868Option')];
      if(!choices.length)return;
      const active=choices.indexOf(document.activeElement);
      const index=e.key==='ArrowUp'?(active<=0?choices.length-1:active-1):active<0?0:(active+1)%choices.length;
      if(e.key==='Enter'||e.key===' '){if(active>=0)choices[active].click();else choices[0].focus();}
      else choices[index].focus();
    }
  };
  popup.onkeydown=e=>{
    const choices=[...popup.querySelectorAll('.pb1868Option')];
    const index=choices.indexOf(document.activeElement);
    if(e.key==='Escape'){e.preventDefault();closePopup();button.focus();}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();const next=e.key==='ArrowDown'?Math.min(choices.length-1,index+1):Math.max(0,index-1);
      choices[next]?.focus();
    }
  };
  native.addEventListener('change',()=>refresh(record));
  native.form?.addEventListener('reset',()=>queueMicrotask(()=>refresh(record)));
  native.closest('dialog')?.addEventListener('close',()=>{if(currentlyOpen===record)closePopup();});
  native.addEventListener('invalid',e=>{e.preventDefault();button.focus();notify('لطفاً '+(label?.textContent?.trim()||'گزینه موردنظر')+' را انتخاب کنید.',true)});
  new MutationObserver(()=>refresh(record)).observe(native,{childList:true,subtree:true,attributes:true,characterData:true});
  refresh(record);
}
function servicePicker(){
  const input=$('cal-service'),data=$('cal-service-options');if(!input||!data)return;
  input.removeAttribute('list');input.setAttribute('autocomplete','off');
  const pop=document.createElement('div');pop.className='pb1868Popup pb1868Suggest';pop.hidden=true;pop.setAttribute('role','listbox');
  const dialog=input.closest('dialog');(dialog||document.body).append(pop);
  let expanded=false;
  const draw=()=>{
    if(!expanded)return;
    pop.replaceChildren();
    const names=[...data.options].map(x=>x.value).filter(Boolean);
    const q=input.value.trim().toLocaleLowerCase('fa-IR');
    for(const name of names.filter(n=>!q||n.toLocaleLowerCase('fa-IR').includes(q)).slice(0,15)){
      const row=document.createElement('button');row.type='button';row.className='pb1868Option';row.textContent=name;row.setAttribute('role','option');
      row.onclick=()=>{input.focus();input.value=name;input.dispatchEvent(new Event('input',{bubbles:true}));hide();};
      pop.append(row);
    }
    const add=document.createElement('button');add.type='button';add.className='pb1868Option pb1868Add';add.textContent='＋ افزودن نوع خدمات';
    add.onclick=()=>{
      hide();
      showNewService(service=>{
        input.value=service.name;
        input.dispatchEvent(new Event('input',{bubbles:true}));
        hide();
      });
    };
    pop.append(add);
    pop.hidden=false;
    placePopup({button:input,popup:pop});
  };
  const hide=()=>{expanded=false;pop.hidden=true;};
  dialog?.addEventListener('close',hide);
  input.addEventListener('focus',()=>{expanded=true;closePopup();draw()});
  input.addEventListener('input',()=>{if(document.activeElement===input)expanded=true;draw();});
  input.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&expanded){event.preventDefault();hide();}
    if(event.key==='ArrowDown'){
      event.preventDefault();
      expanded=true;closePopup();draw();
      pop.querySelector('button')?.focus();
    }
  });
  pop.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();input.focus();hide();}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();
      const target=event.key==='ArrowDown'?event.target.nextElementSibling:event.target.previousElementSibling;
      target?.focus();
    }
  });
  new MutationObserver(draw).observe(data,{childList:true,subtree:true});
  document.addEventListener('pointerdown',event=>{
    if(!pop.contains(event.target)&&event.target!==input)hide();
  },true);
  document.addEventListener('focusin',event=>{
    if(!pop.contains(event.target)&&event.target!==input)hide();
  });
  const reposition=()=>{if(expanded)placePopup({button:input,popup:pop});};
  addEventListener('resize',reposition);
  document.addEventListener('scroll',reposition,true);
}
let serviceDialog=null;
let serviceSaved;
function showNewService(afterSave){
  if(!serviceDialog){
    serviceDialog=document.createElement('dialog');serviceDialog.id='pb1868CreateDialog';serviceDialog.dir='rtl';
    serviceDialog.innerHTML='<form id="pb1868CreateForm"><h3>افزودن نوع خدمات</h3><p>عنوان خدمت عکاسی، فیلم‌برداری یا هر خدمت دیگری را ثبت کنید.</p><label for="pb1868ServiceName">عنوان خدمات</label><input id="pb1868ServiceName" name="serviceName" maxlength="100" required placeholder="مثلاً فیلم‌برداری مراسم"><div id="pb1868ServiceError" role="alert"></div><div class="pb1868Actions"><button type="button" id="pb1868Cancel">انصراف</button><button class="primary" id="pb1868Save" type="submit">افزودن خدمات</button></div></form>';
    document.body.append(serviceDialog);
    $('pb1868Cancel').onclick=()=>serviceDialog.close();
    serviceDialog.addEventListener('cancel',event=>{if($('pb1868Save').disabled)event.preventDefault();});
    $('pb1868CreateForm').addEventListener('submit',async e=>{
      e.preventDefault();const input=$('pb1868ServiceName'),name=input.value.trim(),save=$('pb1868Save'),error=$('pb1868ServiceError');
      error.textContent='';
      if(!name||name.length>100){error.textContent='عنوان باید بین ۱ تا ۱۰۰ نویسه باشد.';return}
      const existing=state.shootTypes.find(type=>type.name===name);
      if(existing){serviceDialog.close();serviceSaved(existing);notify('این خدمات قبلاً ثبت شده است.');return;}
      if(save.disabled)return;
      const cancel=$('pb1868Cancel');
      save.disabled=cancel.disabled=true;
      try{
        const {id}=await request('types','POST',{name});
        const service={id,name};
        state.shootTypes.push(service);
        renderTypes();
        $('cal-service-options').append(new Option(name,name));
        serviceDialog.close();
        serviceSaved(service);
        notify('نوع خدمات جدید اضافه شد.');
      }catch(ex){error.textContent=ex.message||'افزودن خدمات ناموفق بود.';}
      finally{save.disabled=cancel.disabled=false;}
    });
  }
  serviceSaved=afterSave;const input=$('pb1868ServiceName'),error=$('pb1868ServiceError');
  input.value='';error.textContent='';serviceDialog.showModal();input.focus();
}
function init(){
  for(const id of ids)mountSelect($(id));
  servicePicker();
  document.addEventListener('pointerdown',e=>{
    if(currentlyOpen&&!currentlyOpen.popup.contains(e.target)&&e.target!==currentlyOpen.button)closePopup();
  },true);
  addEventListener('resize',()=>{if(currentlyOpen)placePopup(currentlyOpen)});
  document.addEventListener('scroll',()=>{if(currentlyOpen)placePopup(currentlyOpen)},true);
  document.addEventListener('focusin',e=>{
    if(currentlyOpen&&!currentlyOpen.popup.contains(e.target)&&e.target!==currentlyOpen.button)closePopup();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&currentlyOpen){e.preventDefault();closePopup();}
  });
  document.documentElement.dataset.pbCrmServiceMenus=VERSION;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
