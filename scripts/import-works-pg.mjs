import pg from 'pg';
import fs from 'fs';
import readline from 'readline';

const { Client } = pg;

const sqlFile = 'c:\\git-repo\\import_batches\\batch_006.sql';

console.log('🔄 正在提取 works 数据...\n');

// 读取文件并提取 works 相关的内容
const fileStream = fs.createReadStream(sqlFile);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let worksSection = false;
const dataLines = [];

for await (const line of rl) {
  // 检测 works COPY 开始
  if (line.includes('COPY public.works')) {
    worksSection = true;
    continue;
  }
  
  // 检测其他 COPY 开始，跳过
  if (line.match(/COPY public\.(posts|products)/)) {
    worksSection = false;
    continue;
  }
  
  // 检测 COPY 结束标记
  if (line === '\\.') {
    worksSection = false;
    continue;
  }
  
  // 如果在 works section 中，保留该行
  if (worksSection) {
    dataLines.push(line);
  }
}

console.log(`✅ 提取完成，共 ${dataLines.length} 条 works 数据`);
console.log('⏳ 开始导入到数据库...\n');

const client = new Client({
  host: 'db.kizgwtrrsmkjeiddotup.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
});

// 解析 COPY 数据行
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
      // 检查是否是转义的引号
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // 跳过下一个引号
      } else {
        inQuotes = !inQuotes;
      }
    } else {
      current += char;
    }
  }
  
  // 添加最后一列
  columns.push(current);
  return columns;
}

// 转换值
function convertValue(val, type) {
  if (val === '\\N' || val === '') {
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
  
  // 处理整数
  if (type === 'int' || type === 'bigint') {
    return parseInt(val, 10);
  }
  
  return val;
}

try {
  await client.connect();
  console.log('✅ 数据库连接成功');
  
  let successCount = 0;
  let errorCount = 0;
  
  // 获取表结构
  const columnsRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'works' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  
  const columns = columnsRes.rows.map(r => r.column_name);
  console.log(`📋 works 表列数: ${columns.length}`);
  
  // 开始插入数据
  for (const line of dataLines) {
    try {
      const values = parseCopyLine(line);
      
      // 构建 INSERT 语句
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO works (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
      
      // 转换值
      const convertedValues = values.map((v, i) => {
        const colType = columnsRes.rows[i]?.data_type;
        if (colType === 'bigint' || colType === 'integer') {
          return convertValue(v, 'bigint');
        }
        if (colType === 'boolean') {
          return convertValue(v, 'boolean');
        }
        if (colType === 'ARRAY') {
          return convertValue(v, 'array');
        }
        return convertValue(v, 'text');
      });
      
      await client.query(query, convertedValues);
      successCount++;
      
      if (successCount % 10 === 0) {
        process.stdout.write(`\r📊 已导入: ${successCount}/${dataLines.length}`);
      }
    } catch (e) {
      errorCount++;
      if (errorCount <= 3) {
        console.error(`\n❌ 行导入失败:`, e.message.substring(0, 100));
      }
    }
  }
  
  console.log(`\n✅ 导入完成！成功: ${successCount}, 失败: ${errorCount}`);
  
  // 检查总数
  const countRes = await client.query('SELECT COUNT(*) FROM works');
  console.log(`📊 works 表总记录数: ${countRes.rows[0].count}`);
  
} catch (error) {
  console.error('❌ 导入失败:', error.message);
} finally {
  await client.end();
}
