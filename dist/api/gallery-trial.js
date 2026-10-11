// Trial receipts survive gallery deletion and share the creation transaction.
export const GALLERY_TRIAL_LIMIT = 3;
const action = 'client_gallery.free_trial_create';
export async function galleryTrialRemaining(db, userId) {
 const result = await db.query(`SELECT count(*)::int AS used FROM (SELECT 1 FROM audit_log WHERE actor_id=$1 AND action=$2 LIMIT 3) receipts`, [userId, action]);
 return Math.max(0, GALLERY_TRIAL_LIMIT - Number(result.rows[0]?.used || 0));
}
export async function galleryCreationOffer(db, userId, {unlimited, standardFee, lock = false}) {
 // Every create, including a free one, locks the same existing wallet row.
 const wallet = await db.query(`SELECT balance FROM photographer_service_wallets WHERE user_id=$1${lock ? ' FOR UPDATE' : ''}`, [userId]);
 if (!wallet.rows.length) throw new Error('gallery_wallet_missing');
 const freeGalleriesRemaining = unlimited ? 0 : await galleryTrialRemaining(db, userId);
 return {balance: Number(wallet.rows[0].balance), freeGalleriesRemaining, freeGalleryLimit: GALLERY_TRIAL_LIMIT, trial: !unlimited && freeGalleriesRemaining > 0, fee: unlimited || freeGalleriesRemaining > 0 ? 0 : standardFee};
}
export async function recordGalleryTrial(db, userId, labId, galleryId) {
 await db.query(`INSERT INTO audit_log(actor_id,lab_id,action,entity_type,entity_id,data) VALUES($1,$2,$3,'photographer_client_gallery',$4,$5::jsonb)`, [userId,labId,action,galleryId,JSON.stringify({limit:GALLERY_TRIAL_LIMIT})]);
}
