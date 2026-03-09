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

// 将毫秒时间戳转换为 ISO 日期字符串
function msToTimestamp(ms) {
  if (!ms || ms === '\\N' || ms === '') return null;
  const num = parseInt(ms, 10);
  if (isNaN(num)) return null;
  return new Date(num).toISOString();
}

async function extractEventsData() {
  const sqlFile = 'c:\\git-repo\\import_batches\\batch_005.sql';
  const fileStream = fs.createReadStream(sqlFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inEventsSection = false;
  const dataLines = [];
  let columns = [];

  for await (const line of rl) {
    if (line.includes('COPY public.events')) {
      inEventsSection = true;
      const match = line.match(/COPY public\.events\s*\(([^)]+)\)/);
      if (match) {
        columns = match[1].split(',').map(c => c.trim().replace(/"/g, ''));
      }
      continue;
    }
    
    if (line.match(/COPY public\.\w+/) && !line.includes('COPY public.events')) {
      inEventsSection = false;
      continue;
    }
    
    if (line === '\\.') {
      inEventsSection = false;
      continue;
    }
    
    if (inEventsSection) {
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

async function main() {
  console.log('🔄 开始修复 events 表数据导入...\n');
  
  await client.connect();
  console.log('✅ 数据库连接成功');
  
  // 获取表结构
  const colRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'events' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  
  const dbColumns = colRes.rows.map(r => r.column_name);
  const columnTypes = Object.fromEntries(colRes.rows.map(r => [r.column_name, r.data_type]));
  
  console.log(`📋 表列数: ${dbColumns.length}`);
  
  // 提取数据
  const { columns, dataLines } = await extractEventsData();
  console.log(`📊 找到 ${dataLines.length} 条 events 数据`);
  
  // 找出共有的列
  const commonColumns = columns.filter(c => dbColumns.includes(c));
  console.log(`📋 匹配列数: ${commonColumns.length}/${columns.length}`);
  
  // 找出需要转换的时间戳列
  const timestampColumns = commonColumns.filter(c => {
    const type = columnTypes[c];
    return type === 'timestamp with time zone' || type === 'timestamp without time zone';
  });
  console.log(`⏰ 时间戳列: ${timestampColumns.join(', ')}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // 构建 INSERT 语句
  const placeholders = commonColumns.map((_, i) => `$${i + 1}`).join(', ');
  const insertQuery = `INSERT INTO events (${commonColumns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  
  // 获取列在 COPY 数据中的索引
  const columnIndices = commonColumns.map(c => columns.indexOf(c));
  
  for (const line of dataLines) {
    try {
      const values = parseCopyLine(line);
      if (!values) continue;
      
      // 提取并转换值
      const rowValues = columnIndices.map(idx => {
        const colName = commonColumns[columnIndices.indexOf(idx)];
        const dataType = columnTypes[colName];
        const val = values[idx];
        
        if (val === '\\N' || val === '' || val === null || val === undefined) {
          return null;
        }
        
        // 转换时间戳
        if (timestampColumns.includes(colName)) {
          return msToTimestamp(val);
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
        
        // 处理 JSON 类型
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
    } catch (e) {
      errorCount++;
      if (errorCount <= 3) {
        console.log(`  ⚠️ 错误: ${e.message.substring(0, 100)}`);
      }
    }
  }
  
  console.log(`\n✅ 导入完成！成功: ${successCount}, 失败: ${errorCount}`);
  
  // 检查总数
  const countRes = await client.query('SELECT COUNT(*) FROM events');
  console.log(`📊 events 表总记录数: ${countRes.rows[0].count}`);
  
  await client.end();
}

main().catch(console.error);
