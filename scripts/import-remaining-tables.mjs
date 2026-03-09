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

// 转换值
function convertValue(val, dataType) {
  if (val === '\\N' || val === '' || val === null || val === undefined) {
    return null;
  }
  
  // 处理数组类型
  if (val.startsWith('{') && val.endsWith('}')) {
    const content = val.slice(1, -1);
    if (content === '') return [];
    return content.split(',').map(v => v.trim());
  }
  
  // 处理布尔类型
  if (val === 't') return true;
  if (val === 'f') return false;
  
  // 处理整数类型
  if (dataType === 'bigint' || dataType === 'integer' || dataType === 'smallint') {
    const num = parseInt(val, 10);
    return isNaN(num) ? null : num;
  }
  
  // 处理数值类型
  if (dataType === 'numeric' || dataType === 'real' || dataType === 'double precision') {
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  }
  
  // 处理 JSON 类型
  if (dataType === 'json' || dataType === 'jsonb') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  
  return val;
}

async function importTable(tableName, sqlFiles) {
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
  
  // 获取数据库表结构
  const colRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = $1 AND table_schema = 'public'
    ORDER BY ordinal_position
  `, [tableName]);
  
  const dbColumns = colRes.rows.map(r => r.column_name);
  const columnTypes = Object.fromEntries(colRes.rows.map(r => [r.column_name, r.data_type]));
  
  console.log(`  📋 数据列: ${columns.length} 列`);
  console.log(`  📋 数据库列: ${dbColumns.length} 列`);
  
  // 找出共有的列
  const commonColumns = columns.filter(c => dbColumns.includes(c));
  console.log(`  📋 匹配列: ${commonColumns.length} 列`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // 构建 INSERT 语句
  const placeholders = commonColumns.map((_, i) => `$${i + 1}`).join(', ');
  const insertQuery = `INSERT INTO "${tableName}" (${commonColumns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  
  // 获取列在 COPY 数据中的索引
  const columnIndices = commonColumns.map(c => columns.indexOf(c));
  
  for (const line of allDataLines) {
    try {
      const values = parseCopyLine(line);
      if (!values) continue;
      
      // 提取并转换值
      const rowValues = columnIndices.map(idx => {
        const colName = commonColumns[columnIndices.indexOf(idx)];
        const dataType = columnTypes[colName];
        return convertValue(values[idx], dataType);
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
  return { success: successCount, failed: errorCount };
}

async function main() {
  console.log('🚀 开始导入剩余表数据...\n');
  
  await client.connect();
  console.log('✅ 数据库连接成功\n');
  
  const importDir = 'c:\\git-repo\\import_batches';
  const sqlFiles = fs.readdirSync(importDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => `${importDir}\\${f}`)
    .sort();
  
  // 导入剩余的表
  const tables = ['inspiration_nodes', 'audit_logs', 'hot_searches'];
  
  for (const table of tables) {
    await importTable(table, sqlFiles);
  }
  
  // 检查总数
  console.log('\n📊 最终统计:');
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
