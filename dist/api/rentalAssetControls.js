import crypto from 'node:crypto';

const fail = (error, status = 409) => Object.assign(new Error(error), { status, error });
export async function rentalAssetPeakDemand(db, shopId, itemId) {
  // Reservations are pooled until handover. A unit may not be removed if doing
  // so would reduce the capacity already promised on any remaining booking day.
  const q = await db.query(`SELECT COALESCE(max(quantity),0)::int peak FROM (
    SELECT d.day,sum(bi.quantity) quantity FROM equipment_rental_booking_items bi
    JOIN equipment_rental_bookings b ON b.id=bi.booking_id
    CROSS JOIN LATERAL generate_series(GREATEST(b.rental_start,(now() AT TIME ZONE 'Asia/Tehran')::date)::timestamp,b.rental_end::timestamp,interval '1 day') d(day)
    WHERE b.shop_id=$1 AND bi.item_id=$2 AND (b.status IN ('payment_pending','reserved','picked_up') OR
      (b.status='returned' AND EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(b.handover_serials,'[]'::jsonb)) h WHERE h->>'itemId'=bi.item_id::text AND h->>'extendedToBookingId' IS NOT NULL)))
    AND NOT EXISTS(SELECT 1 FROM equipment_rental_accounting_entries r WHERE r.booking_id=b.id AND r.entry_type='booking_reversal')
    GROUP BY d.day) demand`, [shopId, itemId]);
  return Number(q.rows[0]?.peak || 0);
}
export async function rentalAssetGuard(db, shopId, asset) {
  const held = await db.query(`SELECT 1 FROM equipment_rental_booking_assets WHERE shop_id=$1 AND asset_id=$2 AND returned_at IS NULL LIMIT 1`, [shopId, asset.id]);
  if (held.rowCount) return 'asset_in_booking';
  if (asset.active) {
    const count = await db.query(`SELECT count(*)::int n FROM equipment_rental_assets WHERE shop_id=$1 AND item_id=$2 AND active=true AND deleted_at IS NULL`, [shopId, asset.item_id]);
    if (Number(count.rows[0].n) - 1 < await rentalAssetPeakDemand(db, shopId, asset.item_id)) return 'asset_reserved';
  }
  return null;
}
export async function changeRentalAsset(pool, { shopId, assetId, active, remove = false }) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`equipment-rental:${shopId}`]);
    const q = await db.query(`SELECT * FROM equipment_rental_assets WHERE id=$1 AND shop_id=$2 AND deleted_at IS NULL FOR UPDATE`, [assetId, shopId]);
    const asset = q.rows[0];
    if (!asset) throw fail('asset_not_found', 404);
    if (typeof active !== 'boolean' && !remove) throw fail('invalid_asset_status', 400);
    if (remove || (asset.active && !active)) {
      const reason = await rentalAssetGuard(db, shopId, asset);
      if (reason) throw fail(reason);
    }
    const updated = await db.query(`UPDATE equipment_rental_assets SET active=$3,deleted_at=CASE WHEN $4 THEN now() ELSE deleted_at END,updated_at=now() WHERE id=$1 AND shop_id=$2 RETURNING *`, [assetId, shopId, remove ? false : active, remove]);
    const stock = await db.query(`UPDATE equipment_rental_items SET stock_total=(SELECT count(*)::int FROM equipment_rental_assets WHERE item_id=$1 AND active=true AND deleted_at IS NULL),active=EXISTS(SELECT 1 FROM equipment_rental_assets WHERE item_id=$1 AND active=true AND deleted_at IS NULL),updated_at=now() WHERE id=$1 AND shop_id=$2 RETURNING stock_total,active`, [asset.item_id, shopId]);
    // Zero available units also hides the group from new bookings.
    await db.query('COMMIT');
    return { asset: updated.rows[0], stockTotal: stock.rows[0].stock_total, itemActive: stock.rows[0].active };
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { db.release(); }
}
export async function increaseRentalAssetStock(db, shopId, itemId, requested) {
  const q = await db.query(`SELECT stock_total FROM equipment_rental_items WHERE id=$1 AND shop_id=$2 AND deleted_at IS NULL FOR UPDATE`, [itemId, shopId]);
  if (!q.rowCount) throw fail('rental_item_not_found', 404);
  const current = Number(q.rows[0].stock_total);
  const next = requested === undefined ? current : Number(requested);
  if (!Number.isInteger(next) || next < 0 || next > 999) throw fail('invalid_asset_quantity', 400);
  if (next < current) throw fail('asset_quantity_decrease_requires_unit_delete');
  for (let n = current; n < next; n++) {
    await db.query(`INSERT INTO equipment_rental_assets(id,shop_id,item_id,system_code) VALUES($1,$2,$3,lpad(nextval('equipment_rental_asset_code_seq')::text,8,'0'))`, [crypto.randomUUID(), shopId, itemId]);
  }
  return next;
}
