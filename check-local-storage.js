// 检查本地存储中的作品数据
import fs from 'fs';
import path from 'path';

// 模拟localStorage
class LocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  clear() {
    this.store = {};
  }
}

// 设置全局localStorage
global.localStorage = new LocalStorage();

// 读取可能的本地存储文件
const possiblePaths = [
  path.join(__dirname, 'localStorage.json'),
  path.join(__dirname, 'src', 'localStorage.json')
];

let storageData = {};

for (const filePath of possiblePaths) {
  if (fs.existsSync(filePath)) {
    try {
      storageData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`从 ${filePath} 读取本地存储数据`);
      break;
    } catch (error) {
      console.log(`读取 ${filePath} 失败:`, error.message);
    }
  }
}

// 初始化localStorage
for (const [key, value] of Object.entries(storageData)) {
  localStorage.setItem(key, JSON.stringify(value));
}

// 检查作品数据
const postsData = localStorage.getItem('jmzf_posts');
if (postsData) {
  try {
    const posts = JSON.parse(postsData);
    console.log(`本地存储中的作品数量: ${posts.length} 条`);
    console.log('\n作品列表:');
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`);
      console.log(`   ID: ${post.id}`);
      console.log(`   作者: ${typeof post.author === 'object' ? post.author.username : post.author}`);
      console.log(`   日期: ${post.date}`);
      console.log(`   分类: ${post.category}`);
      console.log(`   标签: ${post.tags.join(', ')}`);
      console.log('---');
    });
  } catch (error) {
    console.log('解析作品数据失败:', error.message);
  }
} else {
  console.log('本地存储中没有作品数据');
}

// 检查用户数据
const userData = localStorage.getItem('user');
if (userData) {
  try {
    const user = JSON.parse(userData);
    console.log('\n当前用户信息:');
    console.log(`ID: ${user.id}`);
    console.log(`用户名: ${user.username}`);
    console.log(`邮箱: ${user.email}`);
  } catch (error) {
    console.log('解析用户数据失败:', error.message);
  }
} else {
  console.log('\n本地存储中没有用户数据');
}
