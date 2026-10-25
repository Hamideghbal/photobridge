// Serialize native status reads with selection so a late status(oldRoot) cannot restore it.
let pb1451Selection = null;
const pb1451RootReads = new Set();
function pb1451InstallRootGuard() {
  const native = window.pbNativeFolder;
  if (!native || native.pb1451Guarded) return;
  const root = native.root.bind(native);
  native.pb1451RawRoot = root;
  native.root = async () => {
    if (pb1451Selection) await pb1451Selection;
    const read = root();pb1451RootReads.add(read);
    try { return await read; } finally { pb1451RootReads.delete(read); }
  };
  native.pb1451Guarded = true;
}
async function pb1451ChooseFolder(work) {
  pb1451InstallRootGuard();
  if (pb1451Selection) throw Error('انتخاب مسیر دیگری هنوز در حال انجام است.');
  let release;
  pb1451Selection = new Promise(resolve=>{release=resolve});
  try {
    await Promise.allSettled([...pb1451RootReads]);
    const result = await work();
    if (window.pbNativeFolder?.pb1451RawRoot) {
      const saved = await window.pbNativeFolder.pb1451RawRoot();
      if (!saved || !await saved.isSameEntry(result.root)) throw Error('مسیر جدید در برنامه ذخیره نشد؛ دوباره انتخاب کنید.');
      if (await pb1395FolderId(saved) !== result.state.folderId) throw Error('شناسه مسیر ذخیره‌شده با سرور یکسان نیست؛ دوباره مسیر را ثبت کنید.');
    }
    return result;
  } finally { pb1451Selection=null;release(); }
}
function pb1451StorageController({read,choose,apply,error}) {
  let revision=0,selecting=false,alive=true;
  return {
    activate(){alive=true;++revision},
    async refresh() {
      if (!alive || selecting) return;
      const version=++revision;
      try { const value=await read();if(alive&&!selecting&&version===revision)apply(value); }
      catch(err){if(alive&&!selecting&&version===revision)error(err);}
    },
    async choose() {
      if(selecting)return;
      selecting=true;++revision;
      try{const value=await choose();if(alive)apply(value);return value}
      catch(err){if(alive&&err.name!=='AbortError')error(err);throw err}
      finally{selecting=false}
    },
    dispose(){alive=false;++revision}
  };
}
pb1451InstallRootGuard();
