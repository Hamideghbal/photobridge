'use strict';

// Existing/partial files still go through the normal verifier and recovery path.
async function emptyDownloadPreflight(detail, root, receipts) {
  const order = detail?.order, files = detail?.files;
  if (!root?.__pbNative || !order || order.downloaded_at || !Array.isArray(files) || !files.length ||
      Number(order.file_count) !== files.length || Object.keys(receipts || {}).length) return null;

  const targets = new Map(), folders = new Map(), missing = [];
  let day = '';
  try {
    for (const file of files) {
      const { dir, day: targetDay } = await pb1450Target(root, detail, file, targets);
      if (!dir?.__pbNative || !dir.rootId || !Array.isArray(dir.parts)) return null;
      const key = JSON.stringify([dir.rootId, dir.parts.map(part => part.toLocaleLowerCase('en-US'))]);
      let folder = folders.get(key);
      if (!folder) {
        folder = { dir, names: new Set() };
        folders.set(key, folder);
      }
      const name = pb1769DownloadName(file, file.original_name, order).toLocaleLowerCase('en-US');
      if (folder.names.has(name)) return null;
      folder.names.add(name);
      missing.push(file.original_name);
      day = targetDay || day;
    }
    for (const { dir } of folders.values()) {
      for await (const _entry of dir.entries()) return null;
    }
  } catch {
    return null;
  }
  return { expected: files.length, valid: 0, actual: 0, missing, invalid: [], extra: [], collisions: [],
    complete: false, rootName: root.displayPath || root.name || '', day, loadedBytes: 0, completedIds: [] };
}

function patchEmptyDownloadPreflight(source) {
  const start = source.indexOf('async function pb1450Download(');
  const end = source.indexOf('async function pb1450AllowStage(', start);
  if (start < 0 || end < start || !source.includes('async function pb1450Target(')) return source;
  const worker = source.slice(start, end);
  const probe = /report\s*=\s*await\s+pb1450Verify\(detail\s*,\s*root\s*,\s*receipts\s*,\s*progress\)\s*;/g;
  const calls = [...worker.matchAll(probe)];
  if (calls.length < 2) return source;
  return source.slice(0, start) + worker.replace(probe, (match, offset) =>
    offset === calls[0].index ? 'report = await pbNativeEmptyDownloadPreflight(detail,root,receipts) || await pb1450Verify(detail,root,receipts,progress);' : match
  ) + source.slice(end) + '\n' + emptyDownloadPreflight.toString().replace('function emptyDownloadPreflight','function pbNativeEmptyDownloadPreflight') + '\n';
}

module.exports = { emptyDownloadPreflight, patchEmptyDownloadPreflight };
