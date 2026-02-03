import fs from 'fs';

// 读取backup.json文件
console.log('=== 检查backup.json文件 ===');

try {
  const data = fs.readFileSync('server/data/backup.json', 'utf8');
  const jsonData = JSON.parse(data);
  console.log('文件内容:', jsonData);
  console.log('\n数据结构:');
  Object.keys(jsonData).forEach(key => {
    console.log(`- ${key}:`, Array.isArray(jsonData[key]) ? jsonData[key].length + ' 项' : typeof jsonData[key]);
  });
} catch (error) {
  console.error('读取文件时出错:', error.message);
}

console.log('\n=== 检查完成 ===');
