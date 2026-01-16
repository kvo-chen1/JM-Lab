
import { getDB, closeDB } from '../server/database.mjs';

async function listTables() {
  const db = await getDB();
  try {
    const res = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Current Tables:', res.rows.map(r => r.table_name));
    
    // Check columns for 'users'
    const usersCols = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
    `);
    console.log('Users Columns:', usersCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  } catch (err) {
    console.error(err);
  } finally {
    await closeDB();
  }
}

listTables();
