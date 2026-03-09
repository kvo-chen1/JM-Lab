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
  const columns = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '\t') {
      if (!inQuotes) {
        columns.push(current);
        current = '';
      } else {
        current += char;
      }
    } else if (char === '"') {
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else {
      current += char;
    }
  }
  
  columns.push(current);
  return columns;
}

// 导入 inspiration_nodes（跳过 position 列）
async function importInspirationNodes(sqlFiles) {
  console.log('\n📥 正在导入表: inspiration_nodes');
  
  let allDataLines = [];
  let columns = [];
  
  for (const sqlFile of sqlFiles) {
    const result = await extractTableData(sqlFile, 'inspiration_nodes');
    if (result.dataLines.length > 0) {
      allDataLines = allDataLines.concat(result.dataLines);
      if (result.columns.length > 0) {
        columns = result.columns;
      }
    }
  }
  
  if (allDataLines.length === 0) {
    console.log('  ⚠️ 未找到数据');
    return;
  }
  
  console.log(`  📊 找到 ${allDataLines.length} 条数据`);
  
  // 获取数据库表结构
  const colRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'inspiration_nodes' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  
  const dbColumns = colRes.rows.map(r => r.column_name);
  const columnTypes = Object.fromEntries(colRes.rows.map(r => [r.column_name, r.data_type]));
  
  // 找出共有的列（排除 position）
  const commonColumns = columns.filter(c => dbColumns.includes(c) && c !== 'position');
  console.log(`  📋 匹配列: ${commonColumns.length} 列`);
  
  let successCount = 0;
  let errorCount = 0;
  
  const placeholders = commonColumns.map((_, i) => `$${i + 1}`).join(', ');
  const insertQuery = `INSERT INTO "inspiration_nodes" (${commonColumns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  
  const columnIndices = commonColumns.map(c => columns.indexOf(c));
  
  for (const line of allDataLines) {
    try {
      const values = parseCopyLine(line);
      if (!values) continue;
      
      const rowValues = columnIndices.map(idx => {
        const colName = commonColumns[columnIndices.indexOf(idx)];
        const dataType = columnTypes[colName];
        const val = values[idx];
        
        if (val === '\\N' || val === '' || val === null || val === undefined) {
          return null;
        }
        
        if (val.startsWith('{') && val.endsWith('}')) {
          const content = val.slice(1, -1);
          if (content === '') return [];
          return content.split(',').map(v => v.trim());
        }
        
        if (val === 't') return true;
        if (val === 'f') return false;
        
        if (dataType === 'bigint' || dataType === 'integer') {
          const num = parseInt(val, 10);
          return isNaN(num) ? null : num;
        }
        
        if (dataType === 'json' || dataType === 'jsonb') {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        
        return val;
      });
      
      await client.query(insertQuery, rowValues);
      successCount++;
      
      if (successCount % 50 === 0) {
        process.stdout.write(`\r  📊 已导入: ${successCount}/${allDataLines.length}`);
      }
    } catch (e) {
      errorCount++;
      if (errorCount <= 2) {
        console.log(`\n  ⚠️ 错误: ${e.message.substring(0, 100)}`);
      }
    }
  }
  
  if (successCount >= 50) process.stdout.write('\n');
  console.log(`  ✅ 成功: ${successCount}, 失败: ${errorCount}`);
}

// 导入 audit_logs（修复 JSON 格式）
async function importAuditLogs(sqlFiles) {
  console.log('\n📥 正在导入表: audit_logs');
  
  let allDataLines = [];
  let columns = [];
  
  for (const sqlFile of sqlFiles) {
    const result = await extractTableData(sqlFile, 'audit_logs');
    if (result.dataLines.length > 0) {
      allDataLines = allDataLines.concat(result.dataLines);
      if (result.columns.length > 0) {
        columns = result.columns;
      }
    }
  }
  
  if (allDataLines.length === 0) {
    console.log('  ⚠️ 未找到数据');
    return;
  }
  
  console.log(`  📊 找到 ${allDataLines.length} 条数据`);
  
  // 获取数据库表结构
  const colRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  
  const dbColumns = colRes.rows.map(r => r.column_name);
  const columnTypes = Object.fromEntries(colRes.rows.map(r => [r.column_name, r.data_type]));
  
  const commonColumns = columns.filter(c => dbColumns.includes(c));
  console.log(`  📋 匹配列: ${commonColumns.length} 列`);
  
  let successCount = 0;
  let errorCount = 0;
  
  const placeholders = commonColumns.map((_, i) => `$${i + 1}`).join(', ');
  const insertQuery = `INSERT INTO "audit_logs" (${commonColumns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  
  const columnIndices = commonColumns.map(c => columns.indexOf(c));
  
  for (const line of allDataLines) {
    try {
      const values = parseCopyLine(line);
      if (!values) continue;
      
      const rowValues = columnIndices.map(idx => {
        const colName = commonColumns[columnIndices.indexOf(idx)];
        const dataType = columnTypes[colName];
        const val = values[idx];
        
        if (val === '\\N' || val === '' || val === null || val === undefined) {
          return null;
        }
        
        // 处理 JSON 列
        if (dataType === 'json' || dataType === 'jsonb') {
          if (!val || val === '\\N') return null;
          try {
            // 尝试解析 JSON
            return JSON.parse(val);
          } catch (e) {
            // 如果解析失败，返回 null
            return null;
          }
        }
        
        if (val === 't') return true;
        if (val === 'f') return false;
        
        if (dataType === 'bigint' || dataType === 'integer') {
          const num = parseInt(val, 10);
          return isNaN(num) ? null : num;
        }
        
        return val;
      });
      
      await client.query(insertQuery, rowValues);
      successCount++;
    } catch (e) {
      errorCount++;
      if (errorCount <= 2) {
        console.log(`  ⚠️ 错误: ${e.message.substring(0, 100)}`);
      }
    }
  }
  
  console.log(`  ✅ 成功: ${successCount}, 失败: ${errorCount}`);
}

// 导入 hot_searches（修复列映射）
async function importHotSearches(sqlFiles) {
  console.log('\n📥 正在导入表: hot_searches');
  
  let allDataLines = [];
  let columns = [];
  
  for (const sqlFile of sqlFiles) {
    const result = await extractTableData(sqlFile, 'hot_searches');
    if (result.dataLines.length > 0) {
      allDataLines = allDataLines.concat(result.dataLines);
      if (result.columns.length > 0) {
        columns = result.columns;
      }
    }
  }
  
  if (allDataLines.length === 0) {
    console.log('  ⚠️ 未找到数据');
    return;
  }
  
  console.log(`  📊 找到 ${allDataLines.length} 条数据`);
  console.log(`  📋 数据列: ${columns.join(', ')}`);
  
  // 获取数据库表结构
  const colRes = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'hot_searches' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  
  const dbColumns = colRes.rows.map(r => r.column_name);
  console.log(`  📋 数据库列: ${dbColumns.join(', ')}`);
  
  // 数据列: id, query, search_count, unique_searchers, trend_score, category, is_active, last_searched_at, created_at, updated_at
  // 数据库可能需要: id, keyword, search_count...
  
  // 检查是否有 keyword 列
  const hasKeyword = dbColumns.includes('keyword');
  const hasQuery = dbColumns.includes('query');
  
  let insertQuery;
  let useColumns;
  
  if (hasKeyword && !hasQuery) {
    // 需要将 query 映射到 keyword
    useColumns = dbColumns.filter(c => columns.includes(c) || c === 'keyword');
    insertQuery = `INSERT INTO "hot_searches" (${useColumns.map(c => `"${c}"`).join(', ')}) VALUES (${useColumns.map((_, i) => `$${i + 1}`).join(', ')}) ON CONFLICT DO NOTHING`;
  } else {
    const commonColumns = columns.filter(c => dbColumns.includes(c));
    insertQuery = `INSERT INTO "hot_searches" (${commonColumns.map(c => `"${c}"`).join(', ')}) VALUES (${commonColumns.map((_, i) => `$${i + 1}`).join(', ')}) ON CONFLICT DO NOTHING`;
    useColumns = commonColumns;
  }
  
  console.log(`  📋 使用列: ${useColumns.join(', ')}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const line of allDataLines) {
    try {
      const values = parseCopyLine(line);
      if (!values) continue;
      
      const rowValues = useColumns.map(colName => {
        let idx = columns.indexOf(colName);
        if (idx === -1 && colName === 'keyword') {
          idx = columns.indexOf('query'); // 映射 query 到 keyword
        }
        if (idx === -1) return null;
        
        const val = values[idx];
        if (val === '\\N' || val === '' || val === null || val === undefined) {
          return null;
        }
        
        if (val === 't') return true;
        if (val === 'f') return false;
        
        return val;
      });
      
      await client.query(insertQuery, rowValues);
      successCount++;
    } catch (e) {
      errorCount++;
      if (errorCount <= 2) {
        console.log(`  ⚠️ 错误: ${e.message.substring(0, 100)}`);
      }
    }
  }
  
  console.log(`  ✅ 成功: ${successCount}, 失败: ${errorCount}`);
}

async function main() {
  console.log('🚀 开始修复导入剩余表...\n');
  
  await client.connect();
  console.log('✅ 数据库连接成功\n');
  
  const importDir = 'c:\\git-repo\\import_batches';
  const sqlFiles = fs.readdirSync(importDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => `${importDir}\\${f}`)
    .sort();
  
  await importInspirationNodes(sqlFiles);
  await importAuditLogs(sqlFiles);
  await importHotSearches(sqlFiles);
  
  // 检查总数
  console.log('\n📊 最终统计:');
  const tables = ['inspiration_nodes', 'audit_logs', 'hot_searches'];
  for (const table of tables) {
    try {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  ${table}: ${countRes.rows[0].count} 条`);
    } catch (e) {
      console.log(`  ${table}: 无法查询`);
    }
  }
  
  await client.end();
  console.log('\n✅ 完成！');
}

main().catch(console.error);
