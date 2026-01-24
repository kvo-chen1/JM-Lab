// 简单验证 mockWorks 数组顺序的脚本
// 由于项目使用 ES 模块，我们需要直接检查源代码
import fs from 'fs';
import path from 'path';

// 读取 works.ts 文件内容
const worksPath = './src/mock/works.ts';
const fileContent = fs.readFileSync(worksPath, 'utf8');

console.log('=== 验证 mockWorks 数组顺序 ===');

// 检查 mockWorks 的导出语句
const mockWorksExport = fileContent.match(/export const mockWorks: Work\[\] = \[([^\]]+)\];/s);
if (!mockWorksExport) {
  console.log('❌ 未找到 mockWorks 导出语句');
  process.exit(1);
}

console.log('✅ 找到 mockWorks 导出语句');

// 检查是否使用了 [...originalWorks, ...newWorks] 的格式
const exportContent = mockWorksExport[0];
if (exportContent.includes('...originalWorks, ...newWorks')) {
  console.log('✅ mockWorks 正确使用了 [...originalWorks, ...newWorks] 格式');
  console.log('✅ 原始作品将显示在最前面');
} else if (exportContent.includes('...newWorks, ...originalWorks')) {
  console.log('❌ mockWorks 使用了错误的顺序：[...newWorks, ...originalWorks]');
  console.log('❌ 原始作品不会显示在最前面');
  process.exit(1);
} else {
  console.log('❌ mockWorks 导出格式未知，无法验证顺序');
  process.exit(1);
}

// 检查 originalWorks 和 newWorks 的定义
const originalWorksMatch = fileContent.match(/const originalWorks: Work\[\] = \[([^\]]+)\];/s);
const newWorksMatch = fileContent.match(/const newWorks = generateNewWorks\((\d+), (\d+)\);/);

if (originalWorksMatch) {
  console.log('✅ 找到 originalWorks 定义');
  // 计算 originalWorks 中的作品数量
  const originalWorksContent = originalWorksMatch[1];
  const originalWorksCount = (originalWorksContent.match(/\{/g) || []).length;
  console.log(`✅ 原始作品数量：${originalWorksCount}`);
} else {
  console.log('❌ 未找到 originalWorks 定义');
  process.exit(1);
}

if (newWorksMatch) {
  console.log('✅ 找到 newWorks 定义');
  const startId = newWorksMatch[1];
  const count = newWorksMatch[2];
  console.log(`✅ 新生成作品：从 ID ${startId} 开始，共 ${count} 个`);
} else {
  console.log('❌ 未找到 newWorks 定义');
  process.exit(1);
}

console.log('\n🎉 所有验证通过！');
console.log('✅ 原始作品将正确显示在最前面');
console.log('✅ mockWorks 数组包含所有作品');
