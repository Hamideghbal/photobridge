        /* PB1431 receipt tracking marks: metadata only; no ledger/balance changes. */
        const pb1431MarkMatch=url.pathname.match(/^\/api\/lab\/finance\/receipt-marks\/(payment|discount)\/([0-9a-f-]{36})$/i);
        if (req.method==='PATCH'&&pb1431MarkMatch) {
            const kind=pb1431MarkMatch[1].toLowerCase(),id=pb1431MarkMatch[2],b=await bodyJson(req,40000);
            if (typeof b.recorded!=='boolean') return sendJson(res,400,{error:'invalid_recorded_state'});
            const sql=kind==='payment'?"SELECT id FROM finance_payments WHERE lab_id=$1 AND id=$2":"SELECT id FROM finance_customer_adjustments WHERE lab_id=$1 AND id=$2 AND kind='discount'";
            const owned=await pool.query(sql,[labId,id]);
            if (!owned.rowCount) return sendJson(res,404,{error:'receipt_not_found'});
            const receipt=await pb1431SetReceiptMark(labId,kind,id,b.recorded,a.userId);
            await audit(a.userId,labId,'finance.receipt_external_accounting_mark',kind,id,{recorded:b.recorded}).catch(()=>{});
            return sendJson(res,200,{ok:true,receipt});
        }
