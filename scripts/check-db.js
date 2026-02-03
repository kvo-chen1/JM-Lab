
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'app.db');
const db = new Database(dbPath);

try {
  const rows = db.prepare('SELECT * FROM communities').all();
  console.log(JSON.stringify(rows, null, 2));
} catch (e) {
  console.error(e);
}
