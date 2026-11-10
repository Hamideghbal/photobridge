// Runs inside the Lab bundle, sharing the existing authenticated transport and folder adapter.
async function pb1445WriteDownload(dir, name, response, progress, expectedBytes, exactName = false) {
  const expected = Number(expectedBytes || response.pbDownloadBytes || response.headers?.get('content-length') || 0);
  const writer = await (await dir.getFileHandle(exactName ? name : Ya(name, 'file'), {create:true})).createWritable();
  let received = 0, reader;
  const accept = async bytes => {
    received += bytes.byteLength;
    if (expected > 0 && received > expected) throw Error('download_size_mismatch');
    await writer.write(bytes);
    progress?.(bytes.byteLength);
  };
  try {
    if (response.body) {
      reader = response.body.getReader();
      for (;;) { const chunk = await reader.read(); if (chunk.done) break; if (chunk.value?.byteLength) await accept(chunk.value); }
    } else { await accept(new Uint8Array(await (await response.blob()).arrayBuffer())); }
    // Validate BEFORE close: the Windows adapter atomically renames its temporary file here.
    if (!received || expected > 0 && received !== expected) throw Error('download_size_mismatch');
    await writer.close();
  } catch (error) {
    try { await reader?.cancel(); } catch {}
    try { await writer.abort(); } catch {}
    throw error;
  } finally { try { reader?.releaseLock(); } catch {} }
  return received;
}
async function pb1445DownloadFile(detail, file, progress) {
  const target = await el(detail, file), response = await Ky(file.id);
  const name = response.pbDownloadName || file.original_name;
  const expected = Number(response.pbDownloadBytes || file.bytes || 0);
  await pb1445WriteDownload(target.dir, name, response, progress, expected);
  const saved = await (await target.dir.getFileHandle(Ya(name,'file'),{create:false})).getFile();
  if (!saved.size || expected > 0 && saved.size !== expected) throw Error('download_size_mismatch');
  return {rootName:target.root.name,day:target.day,size:saved.size,downloadName:name,fallbackOriginal:!!response.pbFallbackOriginal};
}
function pb1445ValidLocal(file, meta) {
  const expected = Number(meta.bytes || 0);
  return !!file && file.size > 0 && (!expected || file.size === expected) && Ya(file.name,'file') === Ya(meta.original_name,'file');
}
async function pb1445ReadArchive(detail, progress) {
  if (!ai()) return null;
  const root = await qs();
  if (!root) return null;
  if (!await Vs(root)) throw Error('folder_permission_denied');
  const result = [], missing = [];
  for (const meta of detail.files || []) {
    progress?.({done:result.length,total:detail.files.length,current:meta.original_name});
    let file;
    try { const local = await tl(detail,meta); if (pb1445ValidLocal(local.file,meta)) file = local.file; }
    catch (error) { if (error?.name !== 'NotFoundError') throw error; }
    if (!file) { const found = await Eg(root,detail,meta); if (pb1445ValidLocal(found,meta)) file = found; }
    if (!file) {
      try {
        // Refill missing/short local files BEFORE creating a reprint order.
        const response = await Ky(meta.id), blob = await response.blob();
        const expected = Number(response.pbDownloadBytes || meta.bytes || 0);
        if (!blob.size || expected > 0 && blob.size !== expected) throw Error('download_size_mismatch');
        file = new File([blob],meta.original_name,{type:blob.type || meta.content_type || 'application/octet-stream'});
        const target = await el(detail,meta);
        await jc(target.dir,meta.original_name,file);
        const saved = await (await target.dir.getFileHandle(Ya(meta.original_name,'file'),{create:false})).getFile();
        if (saved.size !== file.size) throw Error('download_size_mismatch');
      } catch (error) {
        const code = String(error?.data?.error || error?.message || '');
        if (!['local_file_only','file_not_found','file_storage_unavailable','download_http_404'].includes(code)) throw error;
        missing.push(meta.original_name);
        continue;
      }
    }
    result.push({meta,file});
  }
  if (missing.length) throw Object.assign(Error('local_archive_incomplete'),{missing,localArchiveConfigured:true});
  return result;
}
