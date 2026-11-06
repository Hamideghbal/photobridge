'use strict';
// Only run on the fully compiled, post-R1504 + post-R1571 manual-intake helper.
// Never patch scripts/r1466-intake-move.js: R1504 must consume its original anchors.
const marker='/* PB1642 late intake verification optimization */';
function replaceOne(source,before,after,label){
 const count=source.split(before).length-1;
 if(count!==1)throw Error('R1642 '+label+' anchor count '+count);
 return source.replace(before,after);
}
function patchManualIntakeVerification(source){
 if(source.includes(marker))return source;
 if(!source.includes('/* PB1504 per-photo source mode */')||
    !source.includes('/* R1571 browser photo copy compatibility */'))
   throw Error('R1642 requires the R1504 source modes and Windows 7 picker first.');
 source=replaceOne(source,
   'const sources=new WeakMap(),directHandles=[];',
   'const sources=new WeakMap(),directHandles=[],pb1642SelectedHashes=new WeakMap(),pb1642VerifiedTargets=new WeakSet();',
   'helper state');
 source=replaceOne(source,
   "const digest=async file=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('');",
   `// Source File snapshots are immutable; never cache fresh destination or live move-source reads.
 const digest=async(file,cache=false)=>{
  if(!cache)return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('');
  let result=pb1642SelectedHashes.get(file);
  if(!result){
   result=digest(file,false);pb1642SelectedHashes.set(file,result);
   result.catch(()=>pb1642SelectedHashes.delete(file));
  }
  return result;
 };`,
   'selected source digest');
 source=replaceOne(source,
   "if(source.action!=='move'||source.copyOnly)return digest(group.files[0]);",
   "if(source.action!=='move'||source.copyOnly)return digest(group.files[0],true);",
   'non-destructive copy digest');
 source=replaceOne(source,
   "if(hash!==await digest(selected))throw fail('source_changed')",
   "if(hash!==await digest(selected,true))throw fail('source_changed')",
   'selected snapshot consistency');
 source=replaceOne(source,
   "for(const group of selected){const hash=await original(group);for(const target of group.targets){let existing;",
   "for(const group of selected){const hash=group.source.action==='move'&&!group.source.copyOnly?await original(group):null;for(const target of group.targets){let existing;",
   'avoid pre-copy hash without an existing destination');
 source=replaceOne(source,
   "if(await digest(await existing.getFile())!==hash)throw fail('destination_exists');",
   "if(await digest(await existing.getFile())!==(hash||await original(group)))throw fail('destination_exists');",
   'existing destination collision check');
 source=replaceOne(source,
   "async function verify(targets){for(const group of groups(targets)){if(group.source.deleted)continue;const hash=await original(group);for(const target of group.targets){const saved=await destination(target,hash);if(group.source.handle&&await saved.isSameEntry(group.source.handle))throw fail('same_file');}}}",
   "async function verify(targets){for(const group of groups(targets)){if(group.source.deleted)continue;const hash=await original(group);for(const target of group.targets){const saved=await destination(target,hash);if(group.source.handle&&await saved.isSameEntry(group.source.handle))throw fail('same_file');}}for(const target of targets)pb1642VerifiedTargets.add(target);}",
   'successful verification checkpoint');
 source=replaceOne(source,
   "let selected;try{selected=groups(targets);await verify(targets);}catch(error){",
   "// A move must ALWAYS inspect live source and destination before deletion.\n  let selected;try{selected=groups(targets);if(selected.some(group=>group.source.action==='move'&&!group.source.copyOnly)||targets.some(target=>!pb1642VerifiedTargets.has(target)))await verify(targets);}catch(error){",
   'finish copy-only short circuit');
 return source+'\n'+marker+'\n';
}
module.exports={patchManualIntakeVerification};
