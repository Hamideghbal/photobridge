const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../dist/api/server.js'),'utf8');
test('server commitment prints Jalali registration date with Tehran midnight boundary',async()=>{
 const start=source.indexOf('function equipmentRentalCommitmentDateFa('),end=source.indexOf('async function equipmentRentalAssetsSnapshot(',start);
 const routeStart=source.indexOf('    const commitmentRoute='),routeEnd=source.indexOf('    const rentalBookingRoute',routeStart);
 let document='';const context=vm.createContext({Date,Intl,Number,String,Set,Map,JSON,Array,
  req:{method:'GET'},url:new URL('https://print.test/api/rental/bookings/00000000-0000-0000-0000-000000000001/commitment'),a:{},
  equipmentRentalHandoverShop:async()=>({id:'shop',name:'Seven'}),ensureEquipmentRentalAssetTrackingSchema:async()=>{},
  pool:{query:async sql=>({rowCount:1,rows:sql.includes('SELECT b.*')?[{handover_serials_recorded_at:'2026-03-20T21:00:00Z',handover_serials:[],photographer_name:'Customer'}]:[{system_code:'CAM-1',item_title:'Camera'}]})},
  res:{writeHead(){},end(value){document=value}}
 });
 vm.runInContext(source.slice(start,end)+'\nasync function render(){'+source.slice(routeStart,routeEnd)+'}',context);await context.render();assert.match(document,/تاریخ ثبت سیستم: ۱۴۰۵\/۰۱\/۰۱, ۰۰:۳۰/);assert(!document.includes('2026-03-20T21:00:00Z'));assert.equal(context.equipmentRentalCommitmentDateFa('invalid'),'—');
});
