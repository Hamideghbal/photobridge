// Automatic cleanup must never consume the only copy before a completed download.
export function canDeleteLabOriginal(row, now, retentionDays) {
  const downloaded = new Date(row.first_downloaded_at || '').getTime();
  if (!Number.isFinite(downloaded)) return false;
  const scheduled = row.original_delete_after ? new Date(row.original_delete_after).getTime() : 0;
  const deadline = Math.max(Number.isFinite(scheduled) ? scheduled : 0, downloaded + Math.max(0,Number(retentionDays)||0)*86400000);
  return row.original_state === 'ready_for_deletion' && now >= deadline;
}
