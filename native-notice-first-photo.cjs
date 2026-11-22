'use strict';

function patchNoticeFirstPhoto(source) {
  const start = source.indexOf('async function pb1450Download(');
  const end = source.indexOf('async function pb1450AllowStage(', start);
  if (start < 0 || end < 0) return source;
  let worker = source.slice(start, end);
  const verify = /report\s*=\s*(?:await (?:pb1908EmptyPreflight|pbNativeEmptyDownloadPreflight)\(detail,root,receipts\) \|\| )?await pb1450Verify\(detail,root,receipts,progress\);/;
  const fetch = 'response = await Ky(file.id)';
  const close = 'pb1450Flights.delete(id);';
  const photo = /async function Ky\(fileId\)(\{[\s\S]*?fetch\('\/api\/lab\/order-files\/'\+fileId\+'\/content\?download=1',\{credentials:'include',cache:'no-store',headers)\}/;
  const verifier = 'async function pb1450Verify(detail, root, receipts = {}, progress)';
  const extras = 'for (const {target,names} of groups.values())';
  const alreadySaved = 'if (!force && already.has(String(file.id))) continue;';
  if (!verify.test(worker) || !worker.includes(fetch) || !worker.includes(close) ||
      !worker.includes('report, root;') || !worker.includes(alreadySaved) ||
      !photo.test(source) || !source.includes(verifier) || !source.includes(extras)) return source;

  worker = worker.replace('report, root;', 'report, root, firstPhoto, firstPhotoAbort;')
    .replace(verify, match => `
    const freshNotice = options.silent === true && root?.__pbNative &&
      !old.startedAt && !detail.order.downloaded_at && !Object.keys(receipts).length &&
      detail.files?.length > 0 && detail.files.length === Number(detail.order.file_count);
    if (freshNotice) {
      firstPhotoAbort = new AbortController();
      firstPhoto = Ky(detail.files[0].id, firstPhotoAbort.signal).then(
        response => ({response}), error => ({error})
      );
      report = await pb1450Verify(detail,root,receipts,progress,{skipExtras:true});
    } else { ${match} }
    `)
    .replace(fetch, `response = firstPhoto && file === files[0]
        ? await firstPhoto.then(result => { if (result.error) throw result.error; return result.response; })
        : await Ky(file.id)`)
    .replace(alreadySaved, `if (!force && already.has(String(file.id))) {
        if (file === files[0]) firstPhotoAbort?.abort();
        continue;
      }`)
    .replace('} catch (error) {', '} catch (error) {\n    firstPhotoAbort?.abort();')
    .replace(close, 'firstPhotoAbort?.abort(); ' + close);

  return (source.slice(0, start) + worker + source.slice(end))
    .replace(photo, 'async function Ky(fileId, signal)$1,signal}')
    .replace(verifier, 'async function pb1450Verify(detail, root, receipts = {}, progress, options = {})')
    .replace(extras, 'if (!options.skipExtras) ' + extras);
}

module.exports = { patchNoticeFirstPhoto };
