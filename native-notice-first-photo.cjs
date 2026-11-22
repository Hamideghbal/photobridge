'use strict';

const directDownloadMarker = '/* PB native download: verify individual files without a folder scan */';

function noticeFileName(file, order, incoming = file.original_name) {
  return typeof pb1769DownloadName === 'function'
    ? pb1769DownloadName(file, incoming, order)
    : Ya(incoming, 'file');
}

function noticeManifest(detail, receipts) {
  const { order, files } = detail;
  if (!Array.isArray(files) || !files.length || files.length !== Number(order.file_count)) throw Error('download_manifest_incomplete');
  const ids = new Set();
  const paths = new Map();
  const key = (file, name) => JSON.stringify([Uy(detail,file).toLowerCase(),name.toLowerCase()]);
  for (const file of files) {
    if (!file.id || ids.has(String(file.id))) throw Error('download_manifest_incomplete');
    if (file.local_only) throw Error('local_only_order_manual_review');
    ids.add(String(file.id));
    const meta = pb1450Meta(file,receipts);
    const path = key(file,pbNativeNoticeFileName(file,order,meta.original_name));
    if (paths.has(path)) throw Error('local_download_incomplete');
    paths.set(path,file);
  }
  const claimed = new Set();
  return (file, dir, name) => {
    const owner = paths.get(key(file,name));
    const path = JSON.stringify([dir.rootId,dir.parts.map(part=>part.toLowerCase()),name.toLowerCase()]);
    if ((owner && owner !== file) || claimed.has(path)) throw Error('local_download_incomplete');
    claimed.add(path);
  };
}

async function noticeExistingFile(dir, name) {
  try {
    return await pb1450FileInfo(await dir.getFileHandle(name,{create:false}));
  } catch (error) {
    if (!pb1450Missing(error)) throw error;
    return null;
  }
}

function noticeReport(detail, root, confirmed) {
  const missing = detail.files.filter(file=>!confirmed.has(String(file.id))).map(file=>file.original_name);
  const photos = [...confirmed.values()];
  return {
    expected:detail.files.length, valid:photos.length, actual:photos.length, missing,
    invalid:[], extra:[], collisions:[], complete:!missing.length,
    rootName:root.displayPath || root.name || '', day:photos.at(-1)?.day || '',
    loadedBytes:photos.reduce((sum,photo)=>sum+photo.size,0), completedIds:[...confirmed.keys()],
  };
}

function patchNoticeFirstPhoto(source) {
  const start = source.indexOf('async function pb1450Download(');
  const end = source.indexOf('async function pb1450AllowStage(', start);
  if (start < 0 || end < 0) return source;
  let worker = source.slice(start, end);
  const verify = /report\s*=\s*((?:await (?:pb1908EmptyPreflight|pbNativeEmptyDownloadPreflight)\(detail,root,receipts\) \|\| )?await pb1450Verify\(detail,root,receipts,progress\));/g;
  const recover = 'report = await pb1450Verify(detail,root,receipts);';
  const validatedWrite = "if (!saved.size || expected > 0 && saved.size !== expected) throw Error('download_size_mismatch');";
  const transfer = /const target\s*=\s*await pb1450Target\(root,\s*detail,\s*file,\s*targets\),\s*response\s*=\s*await Ky\(file\.id\);/;
  const nameLine = /const name\s*=\s*[^;\n]+,\s*expected\s*=\s*Number\([^;\n]+\);/;
  const rootCheck = /root\s*=\s*await pb1450Root\([^;\n]+\);/;
  const close = 'pb1450Flights.delete(id);';
  const photo = /async function Ky\(fileId\)(\{[\s\S]*?fetch\('\/api\/lab\/order-files\/'\+fileId\+'\/content\?download=1',\{credentials:'include',cache:'no-store',headers)\}/;
  if (!rootCheck.test(worker) || [...worker.matchAll(verify)].length !== 2 ||
      !worker.includes(recover) || !worker.includes(validatedWrite) ||
      !transfer.test(worker) || !nameLine.test(worker) || !worker.includes(close) ||
      !worker.includes('report, root;') || !photo.test(source)) return source;

  let initial = true;
  worker = worker.replace('report, root;', 'report, root, firstPhotoAbort, confirmedPhotos;')
    .replace('} catch (error) {', '} catch (error) {\n    firstPhotoAbort?.abort();')
    .replace(rootCheck, match => `
    ${directDownloadMarker}
    const downloadStarted = Date.now();
    const traceDownload = stage => {
      try { window.pbDesktopEvents?.downloadTrace?.({orderId:id,stage,elapsedMs:Date.now()-downloadStarted}); } catch {}
    };
    traceDownload('root_check_start');
    const checkpoint = yc(id) || {};
    const noticePaths = options.silent === true && options.force !== true &&
      window.pbNativeStorage && !detail.order.downloaded_at
      ? pbNativeNoticeManifest(detail,receipts) : null;
    let firstPhoto;
    if (noticePaths && !Object.keys(receipts).length &&
        (!checkpoint.startedAt || checkpoint.pathLayout === 'order-v2')) {
      firstPhotoAbort = new AbortController();
      traceDownload('photo_requested');
      firstPhoto = Ky(detail.files[0].id,firstPhotoAbort.signal).then(
        response => { traceDownload('photo_headers'); return {response}; },
        error => ({error})
      );
    }
    ${match}
    traceDownload('root_check_passed');
    const claimNoticePath = root?.__pbNative ? noticePaths : null;
    if (claimNoticePath) confirmedPhotos = new Map();
    else firstPhotoAbort?.abort();
    `)
    .replace(verify, (match, read) => {
      if (!initial) return 'report = confirmedPhotos ? pbNativeNoticeReport(detail,root,confirmedPhotos) : '+read+';';
      initial = false;
      return `
    if (confirmedPhotos) {
      report = {valid:0,loadedBytes:0,completedIds:[],collisions:[]};
    } else { traceDownload('initial_verification_started'); ${match} }
    `;
    })
    .replace(recover, 'report = confirmedPhotos ? pbNativeNoticeReport(detail,root,confirmedPhotos) : await pb1450Verify(detail,root,receipts);')
    .replace(transfer, `
      const earlyResponse = claimNoticePath && file === files[0] ? firstPhoto : null;
      const target = await pb1450Target(root,detail,file,targets);
      let noticeName;
      if (claimNoticePath) {
        const meta = pb1450Meta(file,receipts);
        noticeName = pbNativeNoticeFileName(file,detail.order,meta.original_name);
        const current = await pbNativeNoticeExistingFile(target.dir,noticeName);
        if (current?.size && (!Number(meta.bytes) || current.size === Number(meta.bytes))) {
          claimNoticePath(file,target.dir,noticeName);
          if (earlyResponse) firstPhotoAbort.abort();
          already.add(String(file.id));
          confirmedPhotos.set(String(file.id),{size:current.size,day:target.day});
          done++;
          bytes += current.size;
          continue;
        }
      }
      if (!earlyResponse && file === files[0]) traceDownload('photo_requested');
      const response = earlyResponse
        ? await earlyResponse.then(result => { if (result.error) throw result.error; return result.response; })
        : await Ky(file.id);
      if (!earlyResponse && file === files[0]) traceDownload('photo_headers');
    `)
    .replace(nameLine, match => `${match}
      if (claimNoticePath) {
        const storedName = pbNativeNoticeFileName(file,detail.order,response.pbDownloadName || file.original_name);
        try {
          claimNoticePath(file,target.dir,storedName);
          if (storedName.toLowerCase() !== noticeName.toLowerCase() &&
              await pbNativeNoticeExistingFile(target.dir,storedName)) throw Error('local_download_incomplete');
        } catch (error) {
          void response.body?.cancel().catch(()=>{});
          throw error;
        }
      }
    `)
    .replace('await pb1445WriteDownload(target.dir,name,response,',
      "if (file === files[0]) traceDownload('first_photo_write_started');\n      $&")
    .replace(validatedWrite, validatedWrite +
      '\n      confirmedPhotos?.set(String(file.id),{size:saved.size,day:target.day});')
    .replace(close, 'firstPhotoAbort?.abort(); ' + close);

  return (source.slice(0, start) + worker + source.slice(end))
    .replace(photo, 'async function Ky(fileId, signal)$1,signal}') + '\n' +
    noticeFileName.toString().replace('function noticeFileName','function pbNativeNoticeFileName') + '\n' +
    noticeManifest.toString().replace('function noticeManifest','function pbNativeNoticeManifest') + '\n' +
    noticeExistingFile.toString().replace('function noticeExistingFile','function pbNativeNoticeExistingFile') + '\n' +
    noticeReport.toString().replace('function noticeReport','function pbNativeNoticeReport') + '\n';
}

module.exports = { patchNoticeFirstPhoto, directDownloadMarker };
