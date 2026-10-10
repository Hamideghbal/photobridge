// R1093: an old Windows SQLite snapshot can still contain legacy demo rows.
// Read-only filter at API boundary. No database mutation or unsynced queue reset.
import fs from 'node:fs';
const filename='dist/api/equipment-rental-portal.html';
let source=fs.readFileSync(filename,'utf8');
const marker='/* PB_R1093_READONLY_INVENTORY_FILTER */';
if(!source.includes(marker)){
 const from="if(!r.ok)throw {status:r.status,...(d||{})};return d};";
 const to=[
  "if(!r.ok)throw {status:r.status,...(d||{})};",
  marker,
  "if(url==='/api/rental/overview'&&d&&typeof d==='object'){",
  " const liveInventory=rows=>Array.isArray(rows)?rows.filter(row=>{",
  "  const sku=String(row?.sku||'');",
  "  return !row?.deleted_at&&!/^SOFIA-DEMO-/i.test(sku);",
  " }):rows;",
  " d.items=liveInventory(d.items);",
  " d.saleItems=liveInventory(d.saleItems);",
  "}",
  "return d};"
 ].join('\n');
 if(source.split(from).length!==2)throw Error('[R1093] Rental portal API changed; not patching blindly');
 source=source.replace(from,to);
 fs.writeFileSync(filename,source,'utf8');
}
if(source.split(marker).length!==2)throw Error('[R1093] Duplicate or missing inventory filter');
console.log('[PhotoBridge R1093] demo/deleted rows filtered from stale Windows read cache');
