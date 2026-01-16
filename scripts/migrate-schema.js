
import { getDB, closeDB } from '../server/database.mjs';

async function migrate() {
  console.log('Starting Schema Migration...');
  const db = await getDB();
  
  try {
    // 1. Drop tables with incorrect schema (Integer user_id)
    // We use CASCADE to drop dependent tables (comments, likes, post_tags) automatically
    console.log('Dropping tables with outdated schema...');
    await db.query('DROP TABLE IF EXISTS posts CASCADE');
    await db.query('DROP TABLE IF EXISTS comments CASCADE');
    await db.query('DROP TABLE IF EXISTS likes CASCADE');
    await db.query('DROP TABLE IF EXISTS favorites CASCADE');
    await db.query('DROP TABLE IF EXISTS post_tags CASCADE');
    
    console.log('Tables dropped.');

    // 2. Trigger Re-creation
    // Since we are already connected via getDB(), the init function ran once.
    // But createPostgreSQLTables is internal to database.mjs and runs on init.
    // We need to force it to run again, OR we can just exit and let the next app start handle it.
    // However, for this script to be complete, we should verify they are back.
    
    // Actually, getDB() initializes the pool and runs createTables ONCE per process.
    // If I want to trigger it again, I can't easily access the internal function.
    // BUT, I can just rely on the next run of the app or this script if I modify it to import the create function? No, it's not exported.
    
    // Alternative: Just run a new process or rely on "Perfect, now run check-tables".
    // But better: I'll just restart the process by finishing this script.
    // The NEXT time getDB() is called (e.g. by seed script), tables will be created.

    console.log('Migration step 1 complete (Drop). Next step: Run application or Seed script to recreate tables.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await closeDB();
  }
}

migrate();
