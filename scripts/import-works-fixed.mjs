import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

const PSQL_PATH = 'C:\\postgresql\\pgsql\\bin';
process.env.PATH = `${process.env.PATH};${PSQL_PATH}`;

const targetHost = 'db.kizgwtrrsmkjeiddotup.supabase.co';
const targetPort = '5432';
const targetDb = 'postgres';
const targetUser = 'postgres';
const targetPass = 'csh200506207837';

const targetConn = `postgresql://${targetUser}:${targetPass}@${targetHost}:${targetPort}/${targetDb}`;
const env = { ...process.env, PGPASSWORD: targetPass };

const sqlFile = 'c:\\git-repo\\import_batches\\batch_006.sql';

console.log('🔄 正在提取并导入 works 数据...\n');

// 读取文件并提取 works 相关的内容
const fileStream = fs.createReadStream(sqlFile);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let worksSection = false;
let skipOtherSections = false;
let headerLine = '';
const dataLines = [];

for await (const line of rl) {
  // 检测 works COPY 开始
  if (line.includes('COPY public.works')) {
    worksSection = true;
    skipOtherSections = false;
    headerLine = line;
    continue;
  }
  
  // 检测其他 COPY 开始，跳过
  if (line.match(/COPY public\.(posts|products)/)) {
    worksSection = false;
    skipOtherSections = true;
    continue;
  }
  
  // 检测 COPY 结束标记
  if (line === '\\.') {
    if (worksSection) {
      // 找到结束标记，退出
      worksSection = false;
    }
    skipOtherSections = false;
    continue;
  }
  
  // 如果在 works section 中，保留该行
  if (worksSection) {
    dataLines.push(line);
  }
}

console.log(`✅ 提取完成，共 ${dataLines.length} 条 works 数据`);
console.log('⏳ 开始导入到数据库...\n');

// 构建完整的 SQL 内容
const sqlContent = `${headerLine}
${dataLines.join('\n')}
\\.`;

// 保存到临时文件
const tempFile = 'c:\\git-repo\\temp_works_import.sql';
fs.writeFileSync(tempFile, sqlContent, 'utf8');
console.log(`💾 临时 SQL 文件已保存: ${tempFile}`);

try {
  const result = execSync(
    `psql "${targetConn}" -f "${tempFile}"`,
    {
      env,
      encoding: 'utf-8',
      timeout: 300000,
      maxBuffer: 1024 * 1024 * 20
    }
  );

  console.log('✅ works 数据导入成功！');
  console.log(result);
  
  // 检查导入的记录数
  const countResult = execSync(
    `psql "${targetConn}" -c "SELECT COUNT(*) FROM works;"`,
    { env, encoding: 'utf-8', timeout: 10000 }
  );
  const count = countResult.match(/\d+/)?.[0] || '0';
  console.log(`📊 works 表记录数: ${count}`);

  // 删除临时文件
  fs.unlinkSync(tempFile);
  console.log('🗑️ 临时文件已清理');

} catch (error) {
  console.error('❌ 导入失败:', error.message);
  if (error.stderr) {
    console.error('错误详情:', error.stderr.substring(0, 1000));
  }
  if (error.stdout) {
    console.error('输出:', error.stdout.substring(0, 1000));
  }
  // 保留临时文件以便调试
  console.log(`💾 临时文件保留用于调试: ${tempFile}`);
}
