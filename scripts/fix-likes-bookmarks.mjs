import pg from 'pg';
import fs from 'fs';
import readline from 'readline';

const { Client } = pg;

const client = new Client({
  host: 'db.kizgwtrrsmkjeiddotup.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
});

// 从 SQL 文件中提取表数据
async function extractTableData(sqlFile, tableName) {
  const fileStream = fs.createReadStream(sqlFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inTargetTable = false;
  const dataLines = [];
  let columns = [];

  for await (const line of rl) {
    const copyMatch = line.match(new RegExp(`COPY public\\.${tableName}\\s*\\(([^)]+)\\)`));
    if (copyMatch) {
      inTargetTable = true;
      columns = copyMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
      continue;
    }
    
    if (line.match(/COPY public\.\w+/)) {
      inTargetTable = false;
      continue;
    }
    
    if (line === '\\.') {
      inTargetTable = false;
      continue;
    }
    
    if (inTargetTable) {
      dataLines.push(line);
    }
  }

  return { columns, dataLines };
}

function parseCopyLine(line) {
  return line.split('\t');
}

async function importTableWithUUID(tableName, sqlFiles) {
  console.log(`\n📥 正在导入表: ${tableName}`);
  
  let allDataLines = [];
  let columns = [];
  
  for (const sqlFile of sqlFiles) {
    const result = await extractTableData(sqlFile, tableName);
    if (result.dataLines.length > 0) {
      allDataLines = allDataLines.concat(result.dataLines);
      if (result.columns.length > 0) {
        columns = result.columns;
      }
    }
  }
  
  if (allDataLines.length === 0) {
    console.log(`  ⚠️ 未找到 ${tableName} 的数据`);
    return { success: 0, failed: 0 };
  }
  
  console.log(`  📊 找到 ${allDataLines.length} 条数据`);
  console.log(`  📋 数据列: ${columns.join(', ')}`);
  
  // 获取数据库表结构
  const colRes = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = $1 AND table_schema = 'public'
    ORDER BY ordinal_position
  `, [tableName]);
  
  const dbColumns = colRes.rows.map(r => r.column_name);
  console.log(`  📋 数据库列: ${dbColumns.join(', ')}`);
  
  // 检查是否有 id 列且是非空的
  const idColumn = colRes.rows.find(r => r.column_name === 'id');
  const needsUUID = idColumn && idColumn.is_nullable === 'NO';
  
  if (needsUUID) {
    console.log(`  📝 需要为每行生成 UUID`);
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const line of allDataLines) {
    try {
      const values = parseCopyLine(line);
      
      let insertQuery;
      let rowValues;
      
      if (needsUUID) {
        // 如果有 id 列，生成 UUID
        const placeholders = dbColumns.map((_, i) => `$${i + 1}`).join(', ');
        insertQuery = `INSERT INTO "${tableName}" (${dbColumns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        
        // 生成 UUID 并构建值数组
        const uuid = crypto.randomUUID();
        rowValues = [uuid, ...values];
      } else {
        // 没有 id 列，使用数据中的列
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        insertQuery = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        rowValues = values;
      }
      
      await client.query(insertQuery, rowValues);
      successCount++;
    } catch (e) {
      errorCount++;
      if (errorCount <= 2) {
        console.log(`  ⚠️ 错误: ${e.message.substring(0, 80)}`);
      }
    }
  }
  
  console.log(`  ✅ 成功: ${successCount}, 失败: ${errorCount}`);
  return { success: successCount, failed: errorCount };
}

async function main() {
  console.log('🔄 开始修复 likes 和 bookmarks 表...\n');
  
  await client.connect();
  console.log('✅ 数据库连接成功\n');
  
  const importDir = 'c:\\git-repo\\import_batches';
  const sqlFiles = fs.readdirSync(importDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => `${importDir}\\${f}`)
    .sort();
  
  // 导入 likes
  const likesResult = await importTableWithUUID('likes', sqlFiles);
  
  // 导入 bookmarks
  const bookmarksResult = await importTableWithUUID('bookmarks', sqlFiles);
  
  // 检查总数
  console.log('\n📊 最终统计:');
  const likesCount = await client.query('SELECT COUNT(*) FROM likes');
  const bookmarksCount = await client.query('SELECT COUNT(*) FROM bookmarks');
  console.log(`  likes: ${likesCount.rows[0].count} 条`);
  console.log(`  bookmarks: ${bookmarksCount.rows[0].count} 条`);
  
  await client.end();
  console.log('\n✅ 完成！');
}

import crypto from 'node:crypto';
main().catch(console.error);
