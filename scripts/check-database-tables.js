import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else {
  dotenv.config();
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Missing DATABASE_URL in environment variables');
  process.exit(1);
}

async function checkTables() {
  // Remove sslmode from connection string
  let connectionString = dbUrl;
  try {
    const urlObj = new URL(dbUrl);
    urlObj.searchParams.delete('sslmode');
    connectionString = urlObj.toString();
  } catch (e) {
    // ignore
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 1. 检查所有表格
    console.log('📋 检查数据库表格...');
    console.log('=' .repeat(80));
    
    const tablesQuery = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname IN ('public', 'auth')
      ORDER BY schemaname, tablename;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    console.log('\n📊 表格列表：');
    console.log('-'.repeat(80));
    console.log(`${'Schema'.padEnd(15)} ${'Table Name'.padEnd(40)} ${'Size'.padEnd(15)}`);
    console.log('-'.repeat(80));
    
    for (const row of tablesResult.rows) {
      console.log(`${row.schemaname.padEnd(15)} ${row.tablename.padEnd(40)} ${row.size.padEnd(15)}`);
    }
    console.log('-'.repeat(80));
    console.log(`总计: ${tablesResult.rows.length} 个表格\n`);

    // 2. 检查关键表格的列信息
    const criticalTables = [
      'users', 'communities', 'community_members', 'posts', 
      'replies', 'messages', 'favorites', 'follows',
      'friend_requests', 'friends', 'user_status', 'scheduled_posts'
    ];
    
    console.log('\n🔍 检查关键表格结构...');
    console.log('=' .repeat(80));
    
    for (const tableName of criticalTables) {
      const columnQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position;
      `;
      
      const columnResult = await client.query(columnQuery, [tableName]);
      
      if (columnResult.rows.length === 0) {
        console.log(`\n⚠️  表格 '${tableName}' 不存在或没有列`);
        continue;
      }
      
      console.log(`\n✅ 表格: ${tableName} (${columnResult.rows.length} 列)`);
      console.log('-'.repeat(80));
      console.log(`${'Column'.padEnd(25)} ${'Type'.padEnd(25)} ${'Nullable'.padEnd(12)} ${'Default'}`);
      console.log('-'.repeat(80));
      
      for (const col of columnResult.rows) {
        const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
        const defaultVal = col.column_default ? col.column_default.substring(0, 30) : '';
        console.log(`${col.column_name.padEnd(25)} ${col.data_type.padEnd(25)} ${nullable.padEnd(12)} ${defaultVal}`);
      }
    }

    // 3. 检查外键约束
    console.log('\n\n🔗 检查外键约束...');
    console.log('=' .repeat(80));
    
    const fkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `;
    
    const fkResult = await client.query(fkQuery);
    
    if (fkResult.rows.length === 0) {
      console.log('没有发现外键约束');
    } else {
      console.log(`\n发现 ${fkResult.rows.length} 个外键约束:\n`);
      console.log(`${'Table'.padEnd(25)} ${'Column'.padEnd(20)} ${'References'.padEnd(35)}`);
      console.log('-'.repeat(80));
      
      for (const fk of fkResult.rows) {
        const ref = `${fk.foreign_table_name}(${fk.foreign_column_name})`;
        console.log(`${fk.table_name.padEnd(25)} ${fk.column_name.padEnd(20)} ${ref.padEnd(35)}`);
      }
    }

    // 4. 检查索引
    console.log('\n\n📇 检查索引...');
    console.log('=' .repeat(80));
    
    const indexQuery = `
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const indexResult = await client.query(indexQuery);
    
    console.log(`\n发现 ${indexResult.rows.length} 个索引:\n`);
    console.log(`${'Table'.padEnd(30)} ${'Index Name'.padEnd(40)}`);
    console.log('-'.repeat(80));
    
    for (const idx of indexResult.rows) {
      console.log(`${idx.tablename.padEnd(30)} ${idx.indexname.padEnd(40)}`);
    }

    // 5. 检查表格行数
    console.log('\n\n📈 检查表格行数...');
    console.log('=' .repeat(80));
    
    const publicTables = tablesResult.rows
      .filter(r => r.schemaname === 'public')
      .map(r => r.tablename);
    
    console.log(`\n${'Table'.padEnd(35)} ${'Row Count'.padEnd(15)}`);
    console.log('-'.repeat(80));
    
    for (const tableName of publicTables) {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
        const countResult = await client.query(countQuery);
        const count = countResult.rows[0].count;
        console.log(`${tableName.padEnd(35)} ${count.padEnd(15)}`);
      } catch (err) {
        console.log(`${tableName.padEnd(35)} ${'ERROR'.padEnd(15)}`);
      }
    }

    // 6. 检查 RLS (Row Level Security)
    console.log('\n\n🔒 检查行级安全 (RLS)...');
    console.log('=' .repeat(80));
    
    const rlsQuery = `
      SELECT
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND rowsecurity = true;
    `;
    
    const rlsResult = await client.query(rlsQuery);
    
    if (rlsResult.rows.length === 0) {
      console.log('\n没有启用 RLS 的表格');
    } else {
      console.log(`\n发现 ${rlsResult.rows.length} 个启用 RLS 的表格:\n`);
      for (const row of rlsResult.rows) {
        console.log(`  - ${row.tablename}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ 数据库表格检查完成！');

  } catch (err) {
    console.error('❌ 数据库检查失败:', err.message);
  } finally {
    await client.end();
  }
}

checkTables().catch(err => {
  console.error('Unhandled error:', err);
});
