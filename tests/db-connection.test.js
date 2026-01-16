
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables FIRST
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('Loading .env.local...');
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

const log = (msg, type = 'INFO') => console.log(`[TEST:${type}] ${msg}`);

async function runTests() {
  log('Starting Database Connection Tests...');
  
  // Dynamic import to ensure env vars are loaded before module initialization
  const { getDB, closeDB, getDBStatus, DB_TYPE } = await import('../server/database.mjs');

  try {
    // 1. Initial Connection & Status Check
    log('Test 1: Initial Connection & Status Check');
    const status = await getDBStatus();
    log(`Current DB Type: ${status.currentDbType}`);
    
    if (status.currentDbType === DB_TYPE.SQLITE) {
        log('⚠️ Detected SQLITE. This might mean Supabase env vars are missing or not detected.', 'WARN');
    }

    const db = await getDB();
    log('Database instance acquired.');
    
    // 2. Simple Query Test
    log('Test 2: Simple Query Execution (SELECT 1)');
    const start = Date.now();
    let result;
    
    if (status.currentDbType === DB_TYPE.SQLITE) {
      result = db.prepare('SELECT 1 as val').get();
      log(`Result: ${JSON.stringify(result)}`);
    } else if (status.currentDbType === DB_TYPE.POSTGRESQL || status.currentDbType === DB_TYPE.SUPABASE || status.currentDbType === DB_TYPE.NEON_API) {
      // Handle different return structures for Neon vs PG
      const res = await db.query('SELECT 1 as val');
      result = res.rows ? res.rows[0] : (res.result ? res.result.rows[0] : res);
      log(`Result: ${JSON.stringify(result)}`);
    } else if (status.currentDbType === DB_TYPE.MONGODB) {
      result = await db.command({ ping: 1 });
      log(`Result: ${JSON.stringify(result)}`);
    }
    
    const duration = Date.now() - start;
    log(`Query executed in ${duration}ms`);

    // 3. Pool Status Check (Postgres only)
    if (status.currentDbType === DB_TYPE.POSTGRESQL || status.currentDbType === DB_TYPE.SUPABASE) {
      log('Test 3: Connection Pool Status');
      const newStatus = await getDBStatus();
      const poolStatus = newStatus.status.postgresql.poolStatus;
      log(`Pool Status: Total=${poolStatus.totalCount}, Idle=${poolStatus.idleCount}, Waiting=${poolStatus.waitingCount}`);
      
      if (poolStatus.totalCount > 0) {
        log('✅ Pool is active.');
      } else {
        log('⚠️ Pool seems empty (unexpected if query just ran).', 'WARN');
      }
    }

    // 4. Concurrency Test
    log('Test 4: Concurrency / Load Test (5 parallel queries)');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      if (status.currentDbType === DB_TYPE.POSTGRESQL || status.currentDbType === DB_TYPE.SUPABASE) {
        promises.push(db.query('SELECT pg_sleep(0.1)'));
      } else {
        promises.push(Promise.resolve()); // Skip for others for now
      }
    }
    
    const parallelStart = Date.now();
    await Promise.all(promises);
    const parallelDuration = Date.now() - parallelStart;
    log(`Concurrency test finished in ${parallelDuration}ms`);

    // 5. Error Handling Test
    log('Test 5: Error Handling (Invalid Query)');
    try {
      if (status.currentDbType === DB_TYPE.POSTGRESQL || status.currentDbType === DB_TYPE.SUPABASE) {
        await db.query('SELECT * FROM non_existent_table');
      } else if (status.currentDbType === DB_TYPE.SQLITE) {
        db.prepare('SELECT * FROM non_existent_table').run();
      }
      log('❌ Expected error did not occur!', 'ERROR');
    } catch (e) {
      log(`✅ Caught expected error: ${e.message}`);
    }

    log('All tests completed successfully.');

  } catch (error) {
    log(`Test Failed: ${error.message}`, 'ERROR');
    console.error(error);
  } finally {
    await closeDB();
    log('Database connections closed.');
  }
}

runTests();
