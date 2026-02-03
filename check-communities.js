// 检查当前的社群数据
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检查localStorage中的社群数据
console.log('=== 检查社群数据 ===');

// 检查是否有相关的本地存储文件
try {
  // 检查src/stores目录是否存在
  const storesDir = path.join(__dirname, 'src', 'stores');
  if (fs.existsSync(storesDir)) {
    console.log('发现stores目录:', storesDir);
    const files = fs.readdirSync(storesDir);
    console.log('Stores文件:', files);
  } else {
    console.log('未找到stores目录');
  }
  
  // 检查src/hooks目录
  const hooksDir = path.join(__dirname, 'src', 'hooks');
  if (fs.existsSync(hooksDir)) {
    console.log('\n发现hooks目录:', hooksDir);
    const files = fs.readdirSync(hooksDir);
    console.log('Hooks文件:', files);
  }
  
  // 检查src/services目录
  const servicesDir = path.join(__dirname, 'src', 'services');
  if (fs.existsSync(servicesDir)) {
    console.log('\n发现services目录:', servicesDir);
    const files = fs.readdirSync(servicesDir);
    console.log('Services文件:', files);
  }
  
  // 检查src/pages/Community.tsx文件
  const communityPagePath = path.join(__dirname, 'src', 'pages', 'Community.tsx');
  if (fs.existsSync(communityPagePath)) {
    console.log('\n发现Community.tsx文件');
  }
  
} catch (error) {
  console.error('检查文件时出错:', error.message);
}

console.log('\n=== 检查完成 ===');

