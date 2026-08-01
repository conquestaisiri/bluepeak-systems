const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.env.USERPROFILE, '.local/share/opencode/opencode.db'), {readonly: true});
const tables = db.prepare('SELECT sql FROM sqlite_master WHERE type="table"').all();
tables.forEach(t => console.log(t.sql));