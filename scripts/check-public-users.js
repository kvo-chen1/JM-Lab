
import { getDB, closeDB } from '../server/database.mjs';

async function checkPublicUsers() {
  const db = await getDB();
  try {
    const usersCols = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
    `);
    console.log('Public.Users Columns:', usersCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  } catch (err) {
    console.error(err);
  } finally {
    await closeDB();
  }
}

checkPublicUsers();
