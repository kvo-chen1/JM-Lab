import pg from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const { Client } = pg;

// 需要优先导入的表（有外键依赖的先后顺序）
const PRIORITY_TABLES = [
  'users', 'communities', 'events', 'works', 'posts',
  'comments', 'likes', 'bookmarks', 'follows',
  'inspiration_nodes', 'ai_conversations', 'audit_logs',
  'works_likes', 'hot_searches'
];

const client = new Client({
  host: 'db.kizgwtrrsmkjeiddotup.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
});

// 解析 COPY 数据行（处理制表符分隔）
function parseCopyLine(line) {
  if (!line || line.trim() === '') return null;
  
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
    // 处理带引号的数组元素
    const elements = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        elements.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current) elements.push(current.trim());
    return elements;
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

// 从 SQL 文件中提取指定表的数据
async function extractTableData(sqlFile, tableName) {
  const fileStream = fs.createReadStream(sqlFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inTargetTable = false;
  let headerLine = '';
  const dataLines = [];
  let columns = [];

  for await (const line of rl) {
    // 检测目标表的 COPY 开始
    const copyMatch = line.match(new RegExp(`COPY public\\.${tableName}\\s*\\(([^)]+)\\)`));
    if (copyMatch) {
      inTargetTable = true;
      headerLine = line;
      columns = copyMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
      continue;
    }
    
    // 检测其他 COPY 开始，跳过
    if (line.match(/COPY public\.\w+/)) {
      inTargetTable = false;
      continue;
    }
    
    // 检测 COPY 结束标记
    if (line === '\\.') {
      inTargetTable = false;
      continue;
    }
    
    // 如果在目标表的 section 中，保留该行
    if (inTargetTable) {
      dataLines.push(line);
    }
  }

  return { columns, dataLines, headerLine };
}

// 导入单个表
async function importTable(tableName, sqlFiles) {
  console.log(`\n📥 正在导入表: ${tableName}`);
  
  let allDataLines = [];
  let columns = [];
  let headerLine = '';
  
  // 从所有 SQL 文件中收集数据
  for (const sqlFile of sqlFiles) {
    const result = await extractTableData(sqlFile, tableName);
    if (result.dataLines.length > 0) {
      allDataLines = allDataLines.concat(result.dataLines);
      if (result.columns.length > 0) {
        columns = result.columns;
        headerLine = result.headerLine;
      }
    }
  }
  
  if (allDataLines.length === 0) {
    console.log(`  ⚠️ 未找到 ${tableName} 的数据`);
    return { success: 0, failed: 0, skipped: true };
  }
  
  console.log(`  📊 找到 ${allDataLines.length} 条数据`);
  
  // 获取数据库中该表的实际列
  let dbColumns = [];
  let columnTypes = {};
  try {
    const colRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);
    dbColumns = colRes.rows.map(r => r.column_name);
    columnTypes = Object.fromEntries(colRes.rows.map(r => [r.column_name, r.data_type]));
  } catch (e) {
    console.log(`  ❌ 表 ${tableName} 不存在`);
    return { success: 0, failed: 0, error: true };
  }
  
  // 找出共有的列
  const commonColumns = columns.filter(c => dbColumns.includes(c));
  if (commonColumns.length === 0) {
    console.log(`  ❌ 没有匹配的列`);
    return { success: 0, failed: 0, error: true };
  }
  
  console.log(`  📋 匹配列数: ${commonColumns.length}/${columns.length}`);
  
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
      
      // 提取需要的列值
      const rowValues = columnIndices.map(idx => {
        const colName = commonColumns[columnIndices.indexOf(idx)];
        const dataType = columnTypes[colName];
        return convertValue(values[idx], dataType);
      });
      
      await client.query(insertQuery, rowValues);
      successCount++;
    } catch (e) {
      errorCount++;
      if (errorCount <= 2) {
        console.log(`  ⚠️ 行错误: ${e.message.substring(0, 80)}`);
      }
    }
  }
  
  console.log(`  ✅ 成功: ${successCount}, 失败: ${errorCount}`);
  return { success: successCount, failed: errorCount };
}

async function main() {
  console.log('🚀 开始批量导入数据...\n');
  
  await client.connect();
  console.log('✅ 数据库连接成功\n');
  
  // 获取所有 SQL 文件
  const importDir = 'c:\\git-repo\\import_batches';
  const sqlFiles = fs.readdirSync(importDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => path.join(importDir, f))
    .sort();
  
  console.log(`📁 找到 ${sqlFiles.length} 个 SQL 文件`);
  
  // 统计所有表
  const tableStats = {};
  
  // 先导入优先表
  for (const tableName of PRIORITY_TABLES) {
    const result = await importTable(tableName, sqlFiles);
    tableStats[tableName] = result;
  }
  
  // 显示最终统计
  console.log('\n📊 导入统计:');
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const [table, stats] of Object.entries(tableStats)) {
    if (stats.skipped) {
      console.log(`  ⚠️ ${table}: 无数据`);
    } else if (stats.error) {
      console.log(`  ❌ ${table}: 错误`);
    } else {
      console.log(`  ✅ ${table}: ${stats.success} 条`);
      totalSuccess += stats.success;
      totalFailed += stats.failed;
    }
  }
  
  console.log(`\n📈 总计: ${totalSuccess} 条成功, ${totalFailed} 条失败`);
  
  // 检查关键表的数据量
  console.log('\n🔍 关键表数据量检查:');
  for (const table of PRIORITY_TABLES) {
    try {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  ${table}: ${countRes.rows[0].count} 条`);
    } catch (e) {
      console.log(`  ${table}: 无法查询`);
    }
  }
  
  await client.end();
  console.log('\n✅ 导入完成！');
}

main().catch(console.error);
