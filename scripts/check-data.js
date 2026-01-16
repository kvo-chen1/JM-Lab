
import { getDB, closeDB } from '../server/database.mjs';

async function checkData() {
  const db = await getDB();
  try {
    const postsCount = await db.query('SELECT count(*) FROM posts');
    console.log('Posts count:', postsCount.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    await closeDB();
  }
}

checkData();
