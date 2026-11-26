import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const {patch2060}=require('./r2060-finance-toolbar.cjs');
const {patchInlineBackup}=require('./r2059-inline-backup.cjs');
const extraCss=`
/* PB2066: independent full-size calendar; compact one-row statement toolbar. */
html body #root#root#root#root .labRoleWorkspace .financeWorkspace :is(.pb1176PaymentActions,.statementToolbar) .persianDateField {
 position:relative!important;overflow:visible!important;
}
html body #root#root#root#root .labRoleWorkspace .financeWorkspace :is(.pb1176PaymentActions,.statementToolbar) .persianDatePopover {
 position:absolute!important;top:calc(100% + 6px)!important;right:0!important;left:auto!important;bottom:auto!important;
 display:block!important;box-sizing:border-box!important;width:292px!important;min-width:292px!important;max-width:none!important;
 height:auto!important;min-height:0!important;max-height:none!important;padding:10px!important;margin:0!important;
 overflow:visible!important;z-index:2147483000!important;background:#fff!important;border:1px solid #d5deef!important;border-radius:12px!important;
}
html body #root#root#root#root .labRoleWorkspace .financeWorkspace :is(.pb1176PaymentActions,.statementToolbar) .persianDatePopover .calendarHead {
 display:grid!important;grid-template-columns:30px minmax(0,1fr) 30px!important;align-items:center!important;width:100%!important;min-width:0!important;gap:4px!important;margin:0 0 6px!important;
}
html body #root#root#root#root .labRoleWorkspace .financeWorkspace :is(.pb1176PaymentActions,.statementToolbar) .persianDatePopover :is(.calendarWeek,.calendarGrid) {
 display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;grid-auto-rows:auto!important;gap:4px!important;
 width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;direction:rtl!important;overflow:visible!important;
}
html body #root#root#root#root .labRoleWorkspace .financeWorkspace :is(.pb1176PaymentActions,.statementToolbar) .persianDatePopover .calendarWeek>span {
 display:block!important;width:auto!important;min-width:0!important;text-align:center!important;font-size:10px!important;line-height:20px!important;
}
html body #root#root#root#root .labRoleWorkspace .financeWorkspace :is(.pb1176PaymentActions,.statementToolbar) .persianDatePopover .calendarGrid>:is(button,.calendarEmpty) {
 box-sizing:border-box!important;display:grid!important;place-items:center!important;width:100%!important;min-width:0!important;max-width:none!important;
 height:32px!important;min-height:32px!important;max-height:32px!important;padding:0!important;margin:0!important;border-radius:7px!important;line-height:1!important;
}
html body #root#root#root#root .labRoleWorkspace .financeWorkspace :is(.pb1176PaymentActions,.statementToolbar) .persianDatePopover .calendarGrid button b {
 font-size:11px!important;line-height:1!important;
}
html body #root#root#root#root .labRoleWorkspace .financeWorkspace :is(.pb1176PaymentActions,.statementToolbar) .persianDatePopover .calendarHead>button {
 width:30px!important;min-width:30px!important;height:28px!important;min-height:28px!important;padding:0!important;margin:0!important;
}
html body #root#root#root#root .labRoleWorkspace .financeWorkspace :is(.pb1176PaymentActions,.statementToolbar) .persianDatePopover .calendarTodayBtn {
 display:block!important;width:100%!important;min-width:0!important;height:30px!important;min-height:30px!important;margin:7px 0 0!important;padding:0 6px!important;
}
@media(min-width:900px){
 html body #root#root#root#root .labRoleWorkspace .financeWorkspace .customerStatementWorkspace>.statementToolbar {
 display:flex!important;flex-flow:row nowrap!important;direction:rtl!important;align-items:center!important;justify-content:flex-start!important;
 gap:5px!important;width:100%!important;min-width:0!important;padding:4px 6px!important;box-sizing:border-box!important;height:auto!important;max-height:none!important;overflow:visible!important;
 }
 html body #root#root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar>.statementFilters {
 display:flex!important;flex:1 1 auto!important;flex-wrap:nowrap!important;align-items:center!important;gap:4px!important;width:auto!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important;
 }
 html body #root#root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar .pb2060Common {
 display:flex!important;flex:1 1 auto!important;flex-wrap:nowrap!important;align-items:center!important;gap:4px!important;width:auto!important;min-width:0!important;max-width:none!important;overflow:visible!important;
 }
 html body #root#root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar :is(.pb2060Common,.statementFilters)>.pb2051PickerFrame {
 flex:1 1 170px!important;width:170px!important;min-width:100px!important;max-width:220px!important;height:34px!important;
 }
 html body #root#root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar :is(.pb2060Date,.statementDateLabel,.statementDateControl) {
 flex:0 1 102px!important;width:102px!important;min-width:86px!important;max-width:116px!important;overflow:visible!important;
 }
 html body #root#root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar>.statementActions {
 display:flex!important;flex:0 0 auto!important;flex-flow:row nowrap!important;align-items:center!important;justify-content:flex-end!important;
 width:auto!important;min-width:0!important;max-width:none!important;gap:4px!important;margin:0!important;margin-inline-start:auto!important;padding:0!important;
 }
 html body #root#root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar :is(.statementFilters,.pb2060Common,.statementActions)>button {
 flex:0 0 auto!important;position:static!important;min-width:0!important;width:auto!important;max-width:none!important;white-space:nowrap!important;
 height:34px!important;min-height:34px!important;padding:4px 6px!important;margin:0!important;font-size:10.5px!important;
 }
}
@media(max-width:899px){
 html body #root#root#root#root .labRoleWorkspace .financeWorkspace :is(.pb1176PaymentActions,.statementToolbar) .persianDatePopover {
 width:min(292px,calc(100vw - 24px))!important;min-width:0!important;
 }
}
/* PB2065: keep statement dates and actions in normal layout; never overlap. */
html body #root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar {
 display:flex!important;flex-flow:row wrap!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;
 height:auto!important;min-height:42px!important;max-height:none!important;overflow:visible!important;box-sizing:border-box!important;
}
html body #root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar > .statementFilters,
html body #root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar > .statementActions {
 display:flex!important;position:relative!important;inset:auto!important;transform:none!important;translate:none!important;
 flex:0 1 auto!important;flex-wrap:wrap!important;align-items:center!important;gap:6px!important;min-width:0!important;max-width:100%!important;
 height:auto!important;max-height:none!important;margin:0!important;overflow:visible!important;
}
html body #root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar > .statementActions {margin-inline-start:auto!important;}
html body #root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar .pb2060Common {flex:0 1 auto!important;flex-wrap:wrap!important;gap:6px!important;min-width:0!important;max-width:100%!important;overflow:visible!important;}
html body #root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar :is(.statementDateLabel,.statementDateControl,.pb2060Date) {
 position:relative!important;inset:auto!important;transform:none!important;translate:none!important;flex:0 0 116px!important;width:116px!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;overflow:visible!important;
}
html body #root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar .persianDateField {width:100%!important;min-width:0!important;overflow:visible!important;}
html body #root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar :is(.statementFilters,.statementActions,.pb2060Common)>button {
 position:static!important;inset:auto!important;transform:none!important;translate:none!important;flex:0 0 auto!important;width:auto!important;max-width:100%!important;white-space:nowrap!important;margin:0!important;
}
html body #root#root#root .labRoleWorkspace .financeWorkspace .statementToolbar :is(button[data-pb163-statement-today],button[data-pb2060-range="today"]){display:none!important;}

html body #root#root#root .labRoleWorkspace .financeWorkspace .invoiceTableCard:has(.pb2060Common) .invoiceRangeToolbar{display:none!important}
html body #root#root#root .labRoleWorkspace .financeWorkspace .invoiceListToolbar:has(>.pb2060Common)>:not(.pb2060Common,.pb1176ManualOpen){display:none!important}
html body #root#root#root .labRoleWorkspace .financeWorkspace .pb1423InvoiceToolbar:not(.invoiceListToolbar):has(.pb2060Common)>.invoiceListToolbar{display:contents!important}
html body #root#root#root .labRoleWorkspace .financeWorkspace .pb1423InvoiceToolbar:has(.pb2060Common) .pb1176ManualOpen{display:inline-flex!important;margin-inline-start:auto!important;flex:0 0 auto!important}
html body #root#root#root .labRoleWorkspace .financeWorkspace .pb1423InvoiceToolbar:has(.pb2060Common){direction:rtl!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:6px!important;overflow:visible!important}
html body #root#root#root .labRoleWorkspace .financeWorkspace .statementFilters:has(>.pb2060Common)>:not(.pb2060Common){display:none!important}`;
const css="\n/* R2060 identical finance third row, right-hand filters and left-hand actions */\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common{display:flex!important;direction:rtl;align-items:center!important;gap:6px!important;flex:0 1 auto!important;min-width:0!important;max-width:100%;overflow:visible!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common>.pb2051PickerFrame{flex:0 1 220px!important;width:220px!important;min-width:140px!important;max-width:220px!important;height:34px!important;min-height:34px!important;padding:0!important;margin:0!important;box-sizing:border-box!important;overflow:visible!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common .pb2050CustomerPicker,html body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common .pbSelectSearchShell{width:100%!important;min-width:0!important;box-sizing:border-box!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common .pbSelectSearchShell{display:flex!important;height:34px!important;align-items:center!important;padding:0 8px!important;background:#fff!important;border:1px solid #d3def2!important;border-radius:8px!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common .pbSelectSearchInput{flex:1 1 0!important;width:0!important;min-width:0!important;border:0!important;background:transparent!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common .pbSelectSearchArrow{flex:0 0 24px!important;width:24px!important;border:0!important;background:transparent!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Date{flex:0 0 116px!important;width:116px!important;min-width:0!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Date .persianDateField{width:100%!important;min-width:0!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Date .persianDateTrigger{width:100%!important;height:34px!important;min-height:34px!important;box-sizing:border-box!important;padding:5px 8px!important;font-size:11px!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common>button.pb2060RangeButton{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;white-space:nowrap!important;height:34px!important;min-height:34px!important;padding:4px 9px!important;margin:0!important;border:1px solid #d5deef!important;border-radius:8px!important;background:#fff!important;color:#425675!important;box-shadow:none!important;font-size:11px!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common>button.pb2060RangeButton[aria-pressed=\"true\"]{background:#315efb!important;border-color:#315efb!important;color:#fff!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common>button.pb2060RangeButton:disabled{opacity:.55!important}\nhtml body #root#root#root .labRoleWorkspace .financeWorkspace .pb1423InvoiceToolbar:has(>.pb2060Common)>.invoiceRangeToolbar{display:none!important}\nhtml body #root#root#root .labRoleWorkspace .financeWorkspace .pb1423InvoiceToolbar:has(>.pb2060Common)>.invoiceListToolbar>:not(.pb1176ManualOpen){display:none!important}\nhtml body #root#root#root .labRoleWorkspace .financeWorkspace .pb1423InvoiceToolbar:has(>.pb2060Common)>.invoiceListToolbar{display:contents!important}\nhtml body #root#root#root .labRoleWorkspace .financeWorkspace .pb1423InvoiceToolbar:has(>.pb2060Common) .pb1176ManualOpen{display:inline-flex!important;margin-inline-start:auto!important;flex:0 0 auto!important}\nhtml body #root#root#root .labRoleWorkspace .financeWorkspace .pb1176PaymentActions:has(>.pb2060Common)>:is(select,.pb2051PickerFrame,.pb1427InvoiceCustomerSelect,.pb1177PaymentMetrics){display:none!important}\nhtml body #root#root#root .labRoleWorkspace .financeWorkspace .statementFilters:has(>.pb2060Common)>:not(.pb2060Common){display:none!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace :is(.pb1423InvoiceToolbar,.pb1176PaymentActions,.statementToolbar):has(.pb2060Common){direction:rtl!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:6px!important;overflow:visible!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb1176PaymentActions:has(>.pb2060Common)>button:first-of-type{margin-inline-start:auto!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .statementToolbar:has(.pb2060Common)>.statementFilters{display:flex!important;flex:0 1 auto!important;min-width:0!important;gap:6px!important;margin:0!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .statementToolbar:has(.pb2060Common)>.statementActions{display:flex!important;align-items:center!important;flex:0 0 auto!important;gap:6px!important;margin-inline-start:auto!important}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .statementToolbar:has(.pb2060Common)>.statementActions>button{white-space:nowrap!important;height:34px!important;min-height:34px!important;padding:4px 8px!important}\n@media(max-width:1150px){html body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common>.pb2051PickerFrame{width:160px!important;flex-basis:160px!important;min-width:120px!important}html body #root#root .labRoleWorkspace .financeWorkspace .pb2060Date{width:96px!important;flex-basis:96px!important}html body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common>button.pb2060RangeButton{padding-inline:6px!important}}\nhtml body #root#root .labRoleWorkspace .financeWorkspace .pb2060ReceiptMetrics{display:flex!important;gap:12px;flex-wrap:wrap;align-items:center;margin:0 0 10px;padding:8px 12px;background:#fff;border:1px solid #dce5f1;border-radius:10px}html body #root#root .labRoleWorkspace .financeWorkspace .pb2060ReceiptMetrics>span{flex:1 1 110px;min-width:0}\n@media(max-width:1000px){html body #root#root .labRoleWorkspace .financeWorkspace :is(.pb1423InvoiceToolbar,.pb1176PaymentActions,.statementToolbar):has(.pb2060Common){flex-wrap:wrap!important;height:auto!important;max-height:none!important}html body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common{flex:1 1 100%!important;flex-wrap:wrap!important}html body #root#root .labRoleWorkspace .financeWorkspace .pb2060Common>.pb2051PickerFrame{flex:1 1 100%!important;max-width:none!important;width:100%!important}html body #root#root .labRoleWorkspace .financeWorkspace .statementToolbar:has(.pb2060Common)>.statementFilters{flex:1 1 100%!important}html body #root#root .labRoleWorkspace .financeWorkspace .statementToolbar:has(.pb2060Common)>.statementActions{flex-wrap:wrap!important}}\n";
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const asset=root+'/assets/index-UIRefine-v655-r84.js',page=root+'/index.html';
 let ui=patch2060(fs.readFileSync(asset,'utf8'));
 // Web/PWA backup is same-origin export; installed 162 already owns its native backup panel.
 if(root==='dist/web')ui=patchInlineBackup(ui,false);
 fs.writeFileSync(asset,ui);
 let html=fs.readFileSync(page,'utf8');
 if(!html.includes('&sharedFinance=r2061')){const key='&labPrintFinance=r2047';if(html.split(key).length!==2)throw Error('R2061 finance cache marker');html=html.replace(key,'&sharedFinance=r2061'+key);}
 if(!html.includes('id="pb2060FinanceToolbarStyle"'))html=html.replace('</head>','<style id="pb2060FinanceToolbarStyle">'+css+extraCss+'</style></head>');
 if(!html.includes('&statementLayout=r2066'))html=html.replace('&sharedFinance=r2061','&statementLayout=r2066&sharedFinance=r2061');
 fs.writeFileSync(page,html);
 execFileSync(process.execPath,['--check',asset],{stdio:'inherit'});
}
console.log('[R2060] matching Lab invoice/receipt/statement control rows, web backup embedded');
