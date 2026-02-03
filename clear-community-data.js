// 清空社区数据的脚本
import fs from 'fs';
import path from 'path';

// JSON持久化路径
const JSON_DB_PATH = path.join(process.cwd(), 'server', 'data', 'backup.json');

// 内存数据库存储结构
const emptyMemoryStore = {
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
  communities: [], // 清空社区数据
  community_members: [], // 清空社区成员数据
  works: []
};

console.log('正在清空社区数据...');

try {
  // 写入空的内存数据库
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(emptyMemoryStore, null, 2));
  console.log('✅ 社区数据已清空');
  console.log('✅ 备份文件已更新:', JSON_DB_PATH);
  console.log('\n提示: 请重启本地 API 服务器以应用更改');
} catch (error) {
  console.error('❌ 清空社区数据失败:', error.message);
}
