        const labFilePreview = url.pathname.match(/^\/api\/lab\/order-files\/([0-9a-f-]+)\/preview$/);
        if (labFilePreview && req.method === 'GET') {
            const q = await pool.query(`SELECT * FROM order_files WHERE id=$1 AND lab_id=$2 /* R1326 preview */`, [labFilePreview[1], labId]);
            if (!q.rowCount) return sendJson(res,404,{error:'not_found'});
            const row=q.rows[0], thumbnail=await bestEffortPrintThumbnail(row);
            if (!thumbnail && row.original_state==='deleted') return sendJson(res,410,{error:'preview_expired'});
            const chosen=thumbnail ? {key:thumbnail,available:true,fallback:false} : typeof pb1182Choose==='function' ? await pb1182Choose(row) : {key:row.print_object_key||row.object_key,available:true,fallback:!row.print_object_key};
            if(!chosen.available)return sendJson(res,404,{error:'file_not_found'});
            const fileName=thumbnail?'thumbnail.jpg':chosen.fallback?row.original_name:(row.print_name||row.original_name);
            const fileType=thumbnail?'image/jpeg':chosen.fallback?row.content_type:(row.print_content_type||row.content_type);
            if (!String(fileType||'').startsWith('image/')) return sendJson(res,415,{error:'preview_unavailable'});
            if (String(chosen.key||'').startsWith('client-local-recovery/')) return sendJson(res,409,{error:'local_file_only'});
            const token=crypto.randomBytes(24).toString('base64url');
            if (String(chosen.key||'').startsWith('local/')) {
                const filePath=localPathForKey(chosen.key);
                if(!fs.existsSync(filePath))return sendJson(res,404,{error:'file_not_found'});
                downloadTokens.set(token,{kind:'local',path:filePath,name:fileName,expires:Date.now()+5*60*1000,contentType:fileType,inline:true});
            } else {
                if(!storageConfigured)return sendJson(res,503,{error:'storage_not_configured'});
                downloadTokens.set(token,{kind:'s3',key:chosen.key,name:fileName,expires:Date.now()+5*60*1000,contentType:fileType,inline:true});
            }
            return sendJson(res,200,{url:`/api/public-download/${token}`,expiresIn:300});
        }
