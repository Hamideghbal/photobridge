// R1326: Independent invoice thumbnails have no automatic expiry.
// Never shorten original retention into data loss when thumbnail persistence fails.
const printThumbnailJobs = new Map();
async function ensurePermanentPrintThumbnail(row) {
    if (!row?.id) throw new Error('thumbnail_file_required');
    if (printThumbnailJobs.has(row.id)) return printThumbnailJobs.get(row.id);
    const job = (async () => {
        const previous = String(row.thumbnail_key || '');
        if (previous && previous !== row.object_key && previous !== row.print_object_key) {
            try { await readAiObject(previous); return previous; } catch { /* retry from surviving original */ }
        }
        if (row.original_state === 'deleted') throw new Error('thumbnail_original_already_deleted');
        const source = String(row.print_object_key || row.object_key || '');
        if (!source || source.startsWith('client-local-recovery/')) throw new Error('thumbnail_source_unavailable');
        const input = await readAiObject(source);
        let thumbnail;
        for (const [edge, quality] of [[320,55],[256,45],[192,35],[128,30],[80,25]]) {
            thumbnail = await sharp(input, { sequentialRead:true }).rotate().resize({width:edge,height:edge,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality,mozjpeg:true}).toBuffer();
            if (thumbnail.length <= 10 * 1024) break;
        }
        if (!thumbnail || thumbnail.length > 10 * 1024) throw new Error('thumbnail_too_large');
        const rel = `labs/${row.lab_id}/order-thumbnails/${row.id}.jpg`;
        let key;
        if (storageConfigured && s3) {
            key = storageKey(rel);
            await s3.send(new PutObjectCommand({Bucket:S3_BUCKET,Key:key,Body:thumbnail,ContentType:'image/jpeg'}));
        } else if (LOCAL_UPLOAD_FALLBACK) {
            key = localStorageObjectKey(rel);
            const target = localPathForKey(key);
            await fs.promises.mkdir(path.dirname(target),{recursive:true});
            await fs.promises.writeFile(target,thumbnail);
        } else throw new Error('storage_not_configured');
        await pool.query('UPDATE order_files SET thumbnail_key=$2 WHERE id=$1',[row.id,key]);
        return key;
    })();
    printThumbnailJobs.set(row.id, job);
    try { return await job; } finally { printThumbnailJobs.delete(row.id); }
}
async function bestEffortPrintThumbnail(row) {
    try { return await ensurePermanentPrintThumbnail(row); }
    catch (error) { console.warn('Print thumbnail pending',row.id,error?.message); return null; }
}
