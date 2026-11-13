/* R1829: camera-equipment store scrollbar and stable Windows list refresh.
   Only the camera-store portal and the store desktop hot-update are affected. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/api/equipment-rental-portal.html';
let html=fs.readFileSync(file,'utf8');
const from="&&['bookings','sales','items'].includes(tab));const paintToken=++pb853TabPaintToken;";
const to="&&['bookings','sales','items','photographers'].includes(tab));const paintToken=++pb853TabPaintToken;";
if(html.split(from).length!==2)throw Error('[R1829] camera-only scrollbar tab gate changed');
html=html.replace(from,to);
if(!html.includes('/* R1829: a styled scrollbar alone does not restore the actual scroll viewport. */'))throw Error('[R1829] camera scrollbar overflow styles missing');
if(!html.includes("['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(data?.shop?.business_category||''))"))throw Error('[R1829] camera category guard missing');
fs.writeFileSync(file,html);
execFileSync(process.execPath,['--check','apps/store-desktop/desktop-overlay.js'],{stdio:'inherit'});
console.log('[R1829] camera-only page scrollbar includes photographers; stable native list refresh validated');
