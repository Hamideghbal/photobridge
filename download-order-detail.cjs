'use strict';

// Older Lab detail responses supply the exact order-file rows but omit the
// count provided by the list endpoint. Keep an explicit count authoritative.
function normalizeDownloadOrderDetail(data, requestedId) {
  const order = data?.order;
  const files = data?.files;
  if (String(order?.id || '') !== requestedId || order.file_count != null ||
      !['sent','received'].includes(order.status) || !Array.isArray(files) || !files.length) return data;
  const ids = new Set(files.map(file=>String(file?.id || '')));
  if (ids.has('') || ids.size !== files.length) return data;
  return {...data,order:{...order,file_count:files.length}};
}

module.exports = { normalizeDownloadOrderDetail };
