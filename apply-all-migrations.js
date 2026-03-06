import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 加载环境变量
dotenv.config({ path: '.env' });

const connectionString = process.env.NEON_DATABASE_URL || process.env.NEON_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const migrationsDir = './supabase/migrations';

async function applyMigrations() {
  const client = await pool.connect();
  
  try {
    // 获取所有 SQL 文件并按名称排序
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files`);
    
    // 创建迁移记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 获取已应用的迁移
    const appliedResult = await client.query('SELECT filename FROM _migrations');
    const appliedFiles = new Set(appliedResult.rows.map(r => r.filename));
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      if (appliedFiles.has(file)) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        skipCount++;
        continue;
      }
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        
        // 记录已应用的迁移
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        
        console.log(`✅ Applied ${file}`);
        successCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error applying ${file}: ${error.message}`);
        errorCount++;
        // 继续执行其他迁移
      }
    }
    
    console.log('\n=================================');
    console.log(`Migration Summary:`);
    console.log(`  ✅ Applied: ${successCount}`);
    console.log(`  ⏭️  Skipped: ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('=================================\n');
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigrations();
