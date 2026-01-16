
import { getDB, closeDB } from '../server/database.mjs';

async function checkPosts() {
  const db = await getDB();
  try {
    const postsCols = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'posts'
    `);
    console.log('Posts Columns:', postsCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  } catch (err) {
    console.error(err);
  } finally {
    await closeDB();
  }
}

checkPosts();
