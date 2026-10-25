async function pb1431AttachReceiptMarks(db, labId, rows, kind) {
    if (!['payment','discount'].includes(kind)) throw new Error('invalid_receipt_kind');
    const eligible = rows.filter(row=>kind==='payment'||row.document_type==='discount');
    const ids = eligible.map(row=>String(row.id));
    if (!ids.length) return rows;
    await ensureExternalAccountingMarksSchema();
    const result = await db.query("SELECT document_id::text,recorded,recorded_at FROM external_accounting_marks WHERE owner_type='lab' AND owner_id=$1 AND document_type=$2 AND document_id=ANY($3::uuid[])",[labId,kind,ids]);
    const marks = new Map(result.rows.map(row=>[String(row.document_id),row]));
    return rows.map(row=>{
        if (kind==='discount'&&row.document_type!=='discount') return row;
        const mark=marks.get(String(row.id));
        return {...row,external_accounting_recorded:Boolean(mark?.recorded),external_accounting_recorded_at:mark?.recorded_at||null};
    });
}
async function pb1431SetReceiptMark(labId, kind, id, recorded, actorId) {
    if (!['payment','discount'].includes(kind)) throw new Error('invalid_receipt_kind');
    await ensureExternalAccountingMarksSchema();
    const result=await pool.query("INSERT INTO external_accounting_marks(owner_type,owner_id,document_type,document_id,recorded,recorded_at,recorded_by,updated_at) VALUES('lab',$1,$2,$3,$4,CASE WHEN $4 THEN now() ELSE NULL END,$5,now()) ON CONFLICT(owner_type,owner_id,document_type,document_id) DO UPDATE SET recorded=EXCLUDED.recorded,recorded_at=EXCLUDED.recorded_at,recorded_by=EXCLUDED.recorded_by,updated_at=now() RETURNING document_id::text id,recorded external_accounting_recorded,recorded_at external_accounting_recorded_at",[labId,kind,id,recorded,String(actorId)]);
    return result.rows[0];
}
