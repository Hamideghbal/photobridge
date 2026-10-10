/* Show recorded possession, independent of the original sourcing request. */
(()=>{
 const style=document.createElement('style');
 style.textContent='.pbR1058SupplyChoice{display:grid;gap:5px;grid-column:1/-1;font:700 12px/1.6 Vazirmatn,Tahoma}.pbR1058SupplyChoice select{width:100%;min-width:0;padding:8px;border:1px solid #cdd6e5;border-radius:8px;background:#fff;color:#344054;font:inherit}.pbR1058Holders{margin-top:8px;padding:8px;border-radius:8px;background:#eff6ff;color:#1e40af;font:700 12px/1.8 Vazirmatn,Tahoma;white-space:pre-line}.pbR1058AssetHolder{color:#1e40af!important;font-weight:800!important}';
 style.textContent+=`@font-face{font-family:PhotoBridgeHandover;src:url("/assets/photobridge-handover-vazirmatn.woff2") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}
 .pbR1058SupplyChoice,.pbR1068SourcePicker{font-family:PhotoBridgeHandover,Vazirmatn,Tahoma,sans-serif!important;font-size:16px;font-weight:500;line-height:1.8}
 .pbR1058SupplyChoice>span{font-size:14px;font-weight:600;color:#475467}
 .pbR1068SourceTrigger{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;width:100%;padding:9px 14px;border:1px solid #d5dded;border-radius:12px;background:#fff;color:#344054;text-align:right;font:inherit;cursor:pointer;transition:border-color .15s,background .15s,transform .15s}
 .pbR1068SourceTrigger[aria-expanded=true]{border-color:#315efb;background:#f8faff}.pbR1068SourceTrigger:active{transform:scale(.99)}
 .pbR1068SourcePicker{position:fixed;inset:0;z-index:2147483647;direction:rtl;pointer-events:none}
 .pbR1068SourcePanel{position:fixed;box-sizing:border-box;background:#fff;border:1px solid #d9e2f2;border-radius:14px;padding:6px;box-shadow:0 14px 36px rgba(15,23,42,.16);pointer-events:auto;animation:pbR1068SourceEnter .16s ease-out}
 .pbR1068SourcePanel header{display:none}.pbR1063SourceOptions{display:grid;gap:4px}
 .pbR1063SourceOptions button{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:48px;box-sizing:border-box;padding:10px 12px;border:0;border-radius:9px;background:#fff;color:#344054;text-align:right;font:inherit;cursor:pointer;transition:background .15s,transform .15s}
 .pbR1063SourceOptions button b{font:inherit}.pbR1063SourceOptions button[aria-selected=true]{background:#eef3ff;color:#244edb}.pbR1063SourceOptions button:hover:not(:disabled){background:#f0f4ff}.pbR1063SourceOptions button:active:not(:disabled){transform:scale(.98)}.pbR1063SourceOptions button:disabled{opacity:.45;cursor:not-allowed}
 .pbR1068SourceTrigger:focus-visible,.pbR1068SourcePanel button:focus-visible{outline:2px solid #315efb;outline-offset:2px}
 .pbR1068SourcePicker.mobile{display:grid;place-items:center;box-sizing:border-box;padding:16px;background:rgba(15,23,42,.45);pointer-events:auto}
 .pbR1068SourcePicker.mobile .pbR1068SourcePanel{position:relative;width:min(420px,100%);padding:16px;border-radius:20px}
 .pbR1068SourcePicker.mobile header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.pbR1068SourcePanel h3{margin:0;color:#101828;font:600 18px/1.8 PhotoBridgeHandover,Vazirmatn,Tahoma,sans-serif}
 .pbR1068SourcePanel [data-source-close]{display:grid;place-items:center;flex-shrink:0;width:40px;height:40px;border:0;border-radius:10px;background:#f2f4f7;color:#475467;font:24px/1 Tahoma;cursor:pointer}
 .pbR1068SourcePicker.mobile .pbR1063SourceOptions{gap:8px}.pbR1068SourcePicker.mobile .pbR1063SourceOptions button{min-height:56px;border:1px solid #e4e9f3;padding:12px 14px}.pbR1068SourcePicker.mobile .pbR1063SourceOptions button[aria-selected=true]{border-color:#315efb}
 @media(max-width:700px){.pbR1068SourceTrigger,.pbR1063SourceOptions button{font-size:17px}}
 .pbR1069SourceChoices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .pbR1069SourceChoices button{display:flex;align-items:center;gap:10px;min-height:52px;padding:10px 14px;border:1px solid #d5dded;border-radius:12px;background:#fff;color:#344054;font:500 16px/1.8 PhotoBridgeHandover,Vazirmatn,Tahoma,sans-serif;text-align:right;cursor:pointer;transition:background .15s,border-color .15s,transform .15s}.pbR1069SourceChoices b{font:inherit}
 .pbR1069SourceChoices button[aria-checked=true]{border-color:#315efb;background:#eef3ff;color:#244edb}.pbR1069SourceChoices button:disabled{opacity:.45;cursor:not-allowed}.pbR1069SourceChoices button:active:not(:disabled){transform:scale(.98)}.pbR1069SourceChoices button:focus-visible{outline:2px solid #315efb;outline-offset:2px}
 .pbR1069SourceMark{display:grid;place-items:center;flex-shrink:0;box-sizing:border-box;width:21px;height:21px;border:2px solid #c4cddd;border-radius:50%;color:#fff;font:14px/1 Tahoma}.pbR1069SourceChoices [aria-checked=true] .pbR1069SourceMark{background:#315efb;border-color:#315efb}.pbR1069SourceChoices [aria-checked=true] .pbR1069SourceMark::after{content:'✓'}
 @media(prefers-reduced-motion:reduce){.pbR1069SourceChoices button{transition:none}}
 @keyframes pbR1068SourceEnter{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.pbR1068SourcePanel{animation:none}.pbR1068SourceTrigger,.pbR1063SourceOptions button{transition:none}}`;
 document.head.append(style);
 // Possession remains tracked by the API; item cards intentionally omit customer details.
 document.querySelectorAll('.pbR1058Holders,.pbR1058AssetHolder').forEach(el=>el.remove());
})();
