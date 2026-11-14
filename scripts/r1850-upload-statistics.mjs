export const uploadStatisticsSql = `
SELECT (sent_at AT TIME ZONE 'Asia/Tehran')::date::text AS day,lab_id::text,(array_agg(lab_name ORDER BY sent_at DESC))[1] AS lab_name,
 count(*)::text AS successful_orders,sum(file_count)::text AS files,sum(original_bytes)::text AS bytes,
 sum(unknown_size_files)::text AS unknown_size_files,
 count(*) FILTER (WHERE historical_snapshot)::text AS historical_orders
FROM upload_success_metrics
WHERE sent_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Tehran')
 AND sent_at < (($2::date+1)::timestamp AT TIME ZONE 'Asia/Tehran')
GROUP BY 1,2 ORDER BY 1 DESC,3 LIMIT 10000`;
export function statisticsRange(from, to, now = new Date()) {
 const end = new Date(now.toLocaleString('en-US',{timeZone:'Asia/Tehran'}));
 const localDay = [end.getFullYear(),String(end.getMonth()+1).padStart(2,'0'),String(end.getDate()).padStart(2,'0')].join('-');
 const today = to || localDay;
 const start = from || new Date(Date.parse(today+'T00:00:00Z')-29*86400000).toISOString().slice(0,10);
 const valid = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s+'T00:00:00Z')) && new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 if(!valid(start)||!valid(today)||Date.parse(today)-Date.parse(start)<0||Date.parse(today)-Date.parse(start)>89*86400000)throw Error('invalid_date_range');
 return [start,today];
}
