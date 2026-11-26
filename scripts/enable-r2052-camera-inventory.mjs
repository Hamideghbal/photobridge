import fs from 'node:fs';
const files={server:'dist/api/server.js',html:'dist/api/equipment-rental-portal.html'};
const edits=[
  [
    "server",
    "import {changeRentalAsset,rentalAssetPeakDemand,increaseRentalAssetStock} from './rentalAssetControls.js';",
    "import {changeRentalAsset,rentalAssetPeakDemand,increaseRentalAssetStock} from './rentalAssetControls.js';\nimport {ensureCameraInventoryOrder,cameraInventoryChange} from './cameraInventoryOrder.js';"
  ],
  [
    "server",
    "    await ensureEquipmentRentalAssetTrackingSchema();\n    const [shopQ, itemsQ, bookingsQ, membersQ, plansQ, renewalsQ, collaborationQ, saleItemsQ, saleOrdersQ, shortagesQ, returnShortagesQ]",
    "    await ensureEquipmentRentalAssetTrackingSchema();\n    await ensureCameraInventoryOrder(pool);\n    const [shopQ, itemsQ, bookingsQ, membersQ, plansQ, renewalsQ, collaborationQ, saleItemsQ, saleOrdersQ, shortagesQ, returnShortagesQ]"
  ],
  [
    "server",
    "ORDER BY active DESC,created_at DESC`, [shopId]),",
    "ORDER BY camera_display_order NULLS LAST,active DESC,created_at DESC`, [shopId]),"
  ],
  [
    "server",
    "ORDER BY i.active DESC,i.created_at DESC`, [shopId]),",
    "ORDER BY i.camera_display_order NULLS LAST,i.active DESC,i.created_at DESC`, [shopId]),"
  ],
  [
    "server",
    "    if (req.method === 'POST' && url.pathname === '/api/rental/items') {",
    "    // R2052 — authenticated camera merchant only, never frame/chassis or staff.\n    if(req.method==='POST'&&url.pathname==='/api/rental/camera-inventory-change'){\n      const shop=await equipmentRentalCurrentShop(a);if(!shop)return sendJson(res,401,{error:'rental_auth_required'});\n      const b=await bodyJson(req,10000);\n      try{await ensureEquipmentRentalAssetTrackingSchema();const out=await cameraInventoryChange(pool,shop,b);\n        await audit(a.userId,undefined,'equipment_inventory.'+b.action,'equipment_inventory',b.id,{shopId:shop.id,scope:b.scope}).catch(()=>{});\n        return sendJson(res,200,out);\n      }catch(e){if(e.status)return sendJson(res,e.status,{error:e.message});throw e}\n    }\n    if (req.method === 'POST' && url.pathname === '/api/rental/items') {"
  ],
  [
    "html",
    "function renderItems(){const rows=data.items||[];",
    "// R2052 camera inventory controls. The handle alone captures touch; scrolling elsewhere is unchanged.\nfunction pb2052Camera(){return Boolean(data?.shop&&!data.staffMode&&!['frame','chassis','frame_chassis'].includes(data.shop.business_category))}\nfunction pb2052Rows(rows){return pb2052Camera()?[...rows].sort((a,b)=>(a.camera_display_order??Infinity)-(b.camera_display_order??Infinity)||0):rows}\nfunction pb2052Controls(scope,id){if(!pb2052Camera())return '';return '<button type=\"button\" class=\"mini pb2052Handle\" style=\"touch-action:none;cursor:grab\" data-pb2052-handle=\"'+scope+'\" data-pb2052-id=\"'+esc(id)+'\" aria-label=\"جابه‌جایی تجهیز؛ کلید بالا یا پایین\" title=\"برای جابه‌جایی بکشید یا از کلیدهای بالا و پایین استفاده کنید\">⠿</button><button type=\"button\" class=\"mini v654Danger\" data-pb2052-delete=\"'+scope+'\" data-pb2052-id=\"'+esc(id)+'\">حذف کامل</button>'}\nlet pb2052Busy=false,pb2052Drag=null;\nfunction pb2052Card(el){return el?.closest?.('article[data-pb2052-card]')}\nfunction pb2052Render(scope){pb842RenderedTabs.delete(scope);if(scope==='items')renderItems();else renderSales();pb837MountHeaderFilters(scope)}\nasync function pb2052Change(scope,id,target,before){\n  if(pb2052Busy||!pb2052Camera())return;\n  pb2052Busy=true;\n  try{\n    const action=target?'move':'delete',key=scope==='items'?'items':'saleItems';\n    const row=(data[key]||[]).find(x=>String(x.id)===id);if(!row)return;\n    if(action==='delete'&&!await pb920Confirm('«'+(row.title||'این تجهیز')+'» و تمام واحدهای آن از فهرست حذف شوند؟ سوابق قبلی حفظ می‌شوند.'))return;\n    const out=await api('/api/rental/camera-inventory-change',{method:'POST',body:JSON.stringify({scope,id,target,before,action})});\n    if(action==='move'){\n      const rank=new Map(out.ids.map((v,i)=>[v,i+1]));\n      for(const x of data[key]||[])if(rank.has(x.id))x.camera_display_order=rank.get(x.id);\n      pb2052Render(scope);\n    }else{\n      data[key]=(data[key]||[]).filter(x=>String(x.id)!==id);\n      if(scope==='items'&&editingItemId===id)cancelItemEdit();\n      if(scope==='sales'&&editingSaleItemId===id)cancelSaleItemEdit();\n      pb2052Render(scope);\n      storeNotice('تجهیز از فهرست حذف شد.','حذف شد');\n    }\n  }catch(e){storeNotice(e.error==='inventory_item_in_use'?'این تجهیز سفارش یا رزرو باز دارد. ابتدا آن را تعیین تکلیف کنید.':'تغییر ذخیره نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.')}\n  finally{pb2052Busy=false}\n}\nfunction pb2052Target(e){\n  const d=pb2052Drag;if(!d)return;const card=pb2052Card(document.elementFromPoint(e.clientX,e.clientY));\n  if(d.target)d.target.style.removeProperty('outline');d.target=null;\n  if(!card||card===d.card||card.parentElement!==d.card.parentElement||card.hidden)return;\n  const rect=card.getBoundingClientRect(),from=d.card.getBoundingClientRect(),sameRow=Math.abs(rect.top-from.top)<Math.min(rect.height,from.height)/2;\n  d.before=sameRow?(getComputedStyle(card.parentElement).direction==='rtl'?e.clientX>rect.left+rect.width/2:e.clientX<rect.left+rect.width/2):e.clientY<rect.top+rect.height/2;\n  d.target=card;card.style.outline='2px solid #315efb';\n}\ndocument.addEventListener('pointerdown',e=>{\n  const handle=e.target.closest?.('[data-pb2052-handle]');if(!handle||!pb2052Camera()||pb2052Busy||e.button!==0)return;\n  const card=pb2052Card(handle);if(!card)return;\n  e.preventDefault();handle.focus();handle.setPointerCapture(e.pointerId);\n  pb2052Drag={handle,card,pointer:e.pointerId,scope:handle.dataset.pb2052Handle,id:handle.dataset.pb2052Id,target:null};card.style.opacity='.65';\n});\ndocument.addEventListener('pointermove',e=>{if(pb2052Drag?.pointer===e.pointerId)pb2052Target(e)});\nfunction pb2052End(e,commit){const d=pb2052Drag;if(!d||d.pointer!==e.pointerId)return;if(commit)pb2052Target(e);pb2052Drag=null;d.card.style.removeProperty('opacity');d.target?.style.removeProperty('outline');if(commit&&d.target)void pb2052Change(d.scope,d.id,d.target.dataset.pb2052Card,d.before)}\ndocument.addEventListener('pointerup',e=>pb2052End(e,true));document.addEventListener('pointercancel',e=>pb2052End(e,false));document.addEventListener('lostpointercapture',e=>pb2052End(e,false));\ndocument.addEventListener('keydown',e=>{const h=e.target.closest?.('[data-pb2052-handle]');if(!h||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const c=pb2052Card(h),cards=[...c.parentElement.querySelectorAll('article[data-pb2052-card]')].filter(x=>!x.hidden),up=e.key==='ArrowUp',target=cards[cards.indexOf(c)+(up?-1:1)];if(target)void pb2052Change(h.dataset.pb2052Handle,h.dataset.pb2052Id,target.dataset.pb2052Card,up)});\ndocument.addEventListener('click',e=>{const b=e.target.closest?.('[data-pb2052-delete]');if(b){e.preventDefault();void pb2052Change(b.dataset.pb2052Delete,b.dataset.pb2052Id)}});\nfunction renderItems(){const rows=pb2052Rows(data.items||[]);"
  ],
  [
    "html",
    "function renderSales(){const rows=data.saleItems||[],",
    "function renderSales(){const rows=pb2052Rows(data.saleItems||[]),"
  ],
  [
    "html",
    "<article class=\"saleCard rentalItemCard categoryFiltered\" data-category=",
    "<article class=\"saleCard rentalItemCard categoryFiltered\" data-pb2052-card=\"${esc(x.id)}\" data-category="
  ],
  [
    "html",
    "<article class=\"saleCard categoryFiltered\" data-category=",
    "<article class=\"saleCard categoryFiltered\" data-pb2052-card=\"${esc(x.id)}\" data-category="
  ],
  [
    "html",
    "<button class=\"mini\" onclick=\"editItem('${x.id}')\">ویرایش</button>",
    "<button class=\"mini\" onclick=\"editItem('${x.id}')\">ویرایش</button>${pb2052Controls('items',x.id)}"
  ],
  [
    "html",
    "<button class=\"mini v654Danger\" onclick=\"deleteSaleItem('${x.id}')\">حذف</button>",
    "${pb2052Camera()?pb2052Controls('sales',x.id):`<button class=\"mini v654Danger\" onclick=\"deleteSaleItem('${x.id}')\">حذف</button>`}"
  ]
];
const contents=Object.fromEntries(Object.entries(files).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));
if(contents.server.includes('R2052 — authenticated camera merchant only')&&contents.html.includes('function pb2052Camera()')){console.log('[R2052] already applied')}else{
for(const [key,anchor,replacement] of edits){if(contents[key].split(anchor).length!==2)throw Error('R2052 nonunique or missing anchor: '+key+' '+anchor.slice(0,100));contents[key]=contents[key].replace(anchor,()=>replacement)}
for(const [key,p] of Object.entries(files))fs.writeFileSync(p,contents[key]);console.log('[R2052] camera inventory controls ready')}
