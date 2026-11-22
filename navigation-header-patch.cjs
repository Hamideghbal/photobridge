'use strict';
function patchNavigationHeader(source){
 source=source.replace("if(changed&&!matchMedia(", "if(changed&&!row.classList.contains('pb1174QueueNav')&&!matchMedia(");
 if(source.includes('PB1576 resolve startup sections'))return limitHeaderObserver(source);
 if(source.includes('PB1574 active secondary navigation'))return upgradeSectionAliases(source);
 const start="let nav=h.querySelector('.pb1147LabNav');if(!nav){",end='h.append(nav);';
 if(!source.includes('PB1572 reconcile header actions')&&source.includes(start)&&source.includes(end))source=source.replace(start,`/* PB1572 reconcile header actions */let nav=h.querySelector('.pb1147LabNav');const pb1572Signature=['.labPrintTopNav','.albumTopNav','.labArchiveHeaderBtn','.labFinanceHeaderBtn'].map(s=>Boolean(h.querySelector(s))).join('|');if(nav&&nav.dataset.pb1572Signature!==pb1572Signature){nav.remove();nav=null;}if(!nav){`).replace(end,'nav.dataset.pb1572Signature=pb1572Signature;h.append(nav);');
 const old="const source=queueRoute?document.querySelector('.labRoleWorkspace .mainQueueFilters'):(document.querySelector('.labSettingsSectionTabs')||(document.querySelector('.financeSectionTabs')?pb1372FinanceContext():null));";
 if(!source.includes(old))return source;
 source=source.replace('function secondary(h){',`/* PB1574 active secondary navigation */
function pb1574Source(selector){
 const root=document.querySelector('.labRoleWorkspace');
 return [...(root?.querySelectorAll(selector)||[])].find(node=>{
  const pane=node.closest('.labSettingsWorkspace,.financePage,.financeWorkspace,.stageQueueWorkspace');
  // Original navs themselves are intentionally hidden after header promotion.
  // Test the owning pane, never the hidden original nav, and ignore cached panes.
  return pane?pane.getClientRects().length>0:node.isConnected;
 })||null;
}
function secondary(h){`);
 source=source.replace(old,`const source=queueRoute?pb1574Source('.mainQueueFilters'):/^\\/lab\\/finance(?:\\/|$)/.test(location.pathname)?(pb1574Source('.financeSectionTabs')?pb1372FinanceContext():null):/^\\/lab\\/(?:settings(?:\\/|$)|wallet$)/.test(location.pathname)?pb1574Source('.labSettingsSectionTabs'):null;`);
 source=source.replace('if(row._source!==source||buttons().length!==originals.length){','if(buttons().length!==originals.length||row._source?.classList.contains("mainQueueFilters")!==source.classList.contains("mainQueueFilters")){');
 source=source.replace('row._source=source;','row._source=source;').replace('const isQueue=source.classList', 'row._source=source;const isQueue=source.classList');
 source=source.replace("new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true,characterData:true});","new MutationObserver(records=>{if(records.some(r=>r.type!=='attributes'||r.oldValue!==r.target.getAttribute(r.attributeName)))schedule();}).observe(document.getElementById('root')||document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeOldValue:true,attributeFilter:['class','style','hidden']});");
 return upgradeSectionAliases(source);
}
module.exports={patchNavigationHeader};
function patchThirdNavigation(source){
 if(source.includes('PB1576 visible promoted navigation'))return limitThirdObserver(source);
 if(source.includes('PB1574 active third navigation'))return upgradeThirdAliases(source);
 if(!source.includes('function buttonSource(root){'))return source;
 source=source.replace('function buttonSource(root){',`/* PB1574 active third navigation */
function pb1574ThirdSource(root,selector){return [...root.querySelectorAll(selector)].find(node=>{const pane=node.closest('.labSettingsWorkspace,.financePage,.financeWorkspace');return pane?pane.getClientRects().length>0:node.isConnected;})||null;}
function buttonSource(root){`);
 source=source.replace("const customers=root.querySelector('.labCustomerSubnav');","const customers=/^\\/lab\\/settings\\/(?:customers|walkin)(?:\\/|$)/.test(location.pathname)?pb1574ThirdSource(root,'.labCustomerSubnav'):null;");
 source=source.replace("const album=root.querySelector('.albumSettingsInnerTabs');","const album=/^\\/lab\\/settings\\/album(?:\\/|$)/.test(location.pathname)?pb1574ThirdSource(root,'.albumSettingsInnerTabs'):null;");
 source=source.replace("const pricing=root.querySelector('.labPrintPricingCard>.panelHead');","const pricing=/^\\/lab\\/settings\\/(?:prices|walkin-prices)(?:\\/|$)/.test(location.pathname)?pb1574ThirdSource(root,'.labPrintPricingCard>.panelHead'):null;");
 source=source.replace("const finance=root.querySelector('.financeSectionTabs');","const finance=/^\\/lab\\/finance(?:\\/|$)/.test(location.pathname)?pb1574ThirdSource(root,'.financeSectionTabs'):null;");
 source=source.replace("const live=root.querySelectorAll('.labCustomerSubnav>button')[index];","const live=native?.querySelectorAll(':scope>button')[index];");
 return upgradeThirdAliases(source);
}
module.exports.patchThirdNavigation=patchThirdNavigation;

function browserSection(){
 const params=new URLSearchParams(location.search);
 if(location.pathname==='/lab/wallet'||params.has('walletPayment')||location.hash==='#wallet')return 'wallet';
 if(params.has('payment'))return 'subscription';
 const section=location.pathname.split('/')[3];
 if(section)return section==='windowsAlert'?'desktop':section==='resolution'?'general':section;
 if(/^#customers(?:-|$)/.test(location.hash))return 'customers';
 return 'general';
}
function upgradeSectionAliases(source){
 if(source.includes('PB1576 resolve startup sections'))return limitHeaderObserver(source);
 if(!source.includes('function render(){scheduled=false;')||!source.includes("const section=location.pathname.split('/')[3]||'general';"))return source;
 const resolver=browserSection.toString().replace('browserSection','pb1576Section');
 source=source.replace('function render(){scheduled=false;', '/* PB1576 resolve startup sections */'+resolver+'\n'+layoutObserverSource()+'\nfunction render(){scheduled=false;');
 source=source.replace("const section=location.pathname.split('/')[3]||'general';",'const section=pb1576Section();');
 source=source.replace("const h=document.querySelector('.labRoleWorkspace .labSingleHeader');","pb1576ObserveLayout();const h=document.querySelector('.labRoleWorkspace .labSingleHeader');");
 return limitHeaderObserver(source.replace("addEventListener('popstate',schedule);","addEventListener('popstate',schedule);addEventListener('hashchange',schedule);addEventListener('load',schedule);addEventListener('pageshow',schedule);document.fonts?.ready.then(schedule);"));
}
function upgradeThirdAliases(source){
 if(source.includes('PB1576 visible promoted navigation'))return limitThirdObserver(source);
 source=source.replace('function buttonSource(root){','/* PB1576 visible promoted navigation */'+layoutObserverSource()+'\nfunction buttonSource(root){');
 source=source.replace("const header=root.querySelector('.labSingleHeader')","pb1576ObserveLayout();const header=root.querySelector('.labSingleHeader')");
 // Source ownership already excludes cached hidden panes. Route-only checks
 // discard a visible customer panel entered through the supported #customers
 // startup aliases, leaving the retired two-button intermediate row visible.
 source=source.replace(/const customers=[^;]+pb1574ThirdSource\(root,'\.labCustomerSubnav'\):null;/,"const customers=pb1574ThirdSource(root,'.labCustomerSubnav');");
 for(const [variable,selector]of [['album','.albumSettingsInnerTabs'],['pricing','.labPrintPricingCard>.panelHead'],['finance','.financeSectionTabs']]){
  const start=source.indexOf('const '+variable+'='),end=source.indexOf(';',start);
  if(start>=0&&source.slice(start,end).includes('pb1574ThirdSource'))source=source.slice(0,start)+"const "+variable+"=pb1574ThirdSource(root,'"+selector+"')"+source.slice(end);
 }
 source=source.replace("if(customers||new RegExp('^/lab/settings/(?:customers|walkin)(?:/|$)').test(location.pathname))","if(customers||new RegExp('^/lab/settings/(?:customers|walkin)(?:/|$)').test(location.pathname)||/^#customers(?:-|$)/.test(location.hash))");
 return limitThirdObserver(source.replace("addEventListener('popstate',schedule);","addEventListener('popstate',schedule);addEventListener('hashchange',schedule);addEventListener('load',schedule);addEventListener('pageshow',schedule);document.fonts?.ready.then(schedule);"));
}

function browserObserveLayout(){
 if(typeof ResizeObserver==='undefined')return;
 const root=document.querySelector('.labRoleWorkspace');if(!root)return;
 const nodes=[...root.querySelectorAll('.labSingleHeader,.labSettingsWorkspace,.financePage,.financeWorkspace,.stageQueueWorkspace')];
 const state=browserObserveLayout.state||={observer:new ResizeObserver(()=>schedule()),nodes:[]};
 if(nodes.length===state.nodes.length&&nodes.every((node,i)=>node===state.nodes[i]))return;
 state.observer.disconnect();state.nodes=nodes;nodes.forEach(node=>state.observer.observe(node));
}
function layoutObserverSource(){return browserObserveLayout.toString().replaceAll('browserObserveLayout','pb1576ObserveLayout');}

function browserNavigationChanged(records, includeSecondary) {
 const controls = '.labSingleHeader,.mainQueueFilters,.labSettingsSectionTabs,.financeSectionTabs,.financeSectionTools,.labCustomerSubnav,.albumSettingsInnerTabs,.labPrintPricingCard>.panelHead,.pb1379AlbumMenuToggle,.labQueueQuickAccessV464,.labQueueQuickIntroV464';
 const generated = '.pb1147LabNav,.pb1148SecondaryHeader,.pb1372ThirdHeader';
 return records.some(record=>{
  const target=record.target.nodeType===1?record.target:record.target.parentElement;
  if(target?.closest(generated))return false;
  if(record.type==='attributes'&&record.oldValue===target.getAttribute(record.attributeName))return false;
  if(target?.closest(controls))return true;
  if(record.type!=='childList')return false;
  return [...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&(
    (includeSecondary&&node.matches('.pb1148SecondaryHeader'))||
    (!node.matches(generated)&&(node.matches(controls)||node.querySelector(controls)))));
 });
}

function limitHeaderObserver(source){
 const observer="new MutationObserver(records=>{if(records.some(r=>r.type!=='attributes'||r.oldValue!==r.target.getAttribute(r.attributeName)))schedule();})";
 if(!source.includes(observer))return source;
 return source.replace(observer,"new MutationObserver(records=>{if(browserNavigationChanged(records,false))schedule();})")
  .replace("attributeFilter:['class','style','hidden']","attributeFilter:['class','style','hidden','disabled','aria-selected']")
  .replace('button.disabled=original.disabled;','if(button.disabled!==original.disabled)button.disabled=original.disabled;')
  .replace('function start(){schedule();',browserNavigationChanged.toString()+'\nfunction start(){schedule();');
}

function limitThirdObserver(source){
 const observer="new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','aria-selected']})";
 if(!source.includes(observer))return source;
 return source.replace(observer,"new MutationObserver(records=>{if(browserNavigationChanged(records,true))schedule();}).observe(document.getElementById('root')||document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeOldValue:true,attributeFilter:['class','disabled','aria-selected']})")
  .replace('button.disabled=original.disabled;','if(button.disabled!==original.disabled)button.disabled=original.disabled;')
  .replace('function start(){new MutationObserver',browserNavigationChanged.toString()+'\nfunction start(){new MutationObserver');
}
