// 检查内存数据库中的社群数据
import fs from 'fs';
import path from 'path';

// 模拟内存存储结构
const memoryStore = {
  users: [],
  favorites: [],
  video_tasks: [],
  friend_requests: [],
  friends: [],
  messages: [],
  user_status: [],
  posts: [],
  comments: [],
  likes: [],
  tags: [],
  post_tags: [],
  communities: [],
  community_members: []
};

// 检查备份文件
const JSON_DB_PATH = path.join(process.cwd(), 'server', 'data', 'backup.json');

console.log('检查社群数据...');

if (fs.existsSync(JSON_DB_PATH)) {
  try {
    const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
    Object.assign(memoryStore, data);
    console.log('从备份文件加载数据成功');
  } catch (error) {
    console.error('加载备份文件失败:', error.message);
  }
}

// 检查社群数据
console.log('\n社群列表:');
if (memoryStore.communities && memoryStore.communities.length > 0) {
  memoryStore.communities.forEach(community => {
    console.log(`- ${community.name} (ID: ${community.id})`);
  });
} else {
  console.log('没有找到社群数据');
}

// 检查是否存在测试社群
const testCommunities = memoryStore.communities.filter(c => 
  c.name.includes('测试社群') || c.name.includes('test community')
);

console.log('\n测试社群:');
if (testCommunities.length > 0) {
  testCommunities.forEach(community => {
    console.log(`- ${community.name} (ID: ${community.id})`);
  });
} else {
  console.log('没有找到测试社群');
}

console.log('\n检查完成');
