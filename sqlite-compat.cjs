'use strict';
// One SQLite file/schema on every supported Windows release. No export/import,
// reset or queue migration is performed when opening an existing installation.
const SQLite=require('better-sqlite3');
class DatabaseSync {
 constructor(file,options={}){this.native=new SQLite(file,{readonly:options.readOnly===true});}
 exec(sql){this.native.exec(sql);return this;}
 prepare(sql){return this.native.prepare(sql);}
 close(){this.native.close();}
}
async function backup(db,file){return db.native.backup(file);}
module.exports={DatabaseSync,backup};
