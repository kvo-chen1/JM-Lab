import fs from 'fs';

// 检查前端本地存储中的社群数据
console.log('=== 检查前端本地存储 ===');

// 模拟localStorage的键名
const STORAGE_KEYS = {
  JOINED_COMMUNITIES: 'jmzf_joined_communities',
  FAVORITED_THREADS: 'jmzf_favorited_threads'
};

console.log('可能的存储键名:');
Object.values(STORAGE_KEYS).forEach(key => {
  console.log('-', key);
});

console.log('\n注意：在Node.js环境中无法直接访问浏览器localStorage');
console.log('请在浏览器开发者工具的Application/Storage选项卡中检查localStorage');
console.log('查找包含社群数据的键值对');

// 检查是否有其他可能的存储文件
try {
  const dataDir = 'src/data';
  if (fs.existsSync(dataDir)) {
    console.log('\n发现src/data目录');
    const files = fs.readdirSync(dataDir);
    console.log('Data文件:', files);
  }
} catch (error) {
  console.error('检查数据目录时出错:', error.message);
}

console.log('\n=== 检查完成 ===');
