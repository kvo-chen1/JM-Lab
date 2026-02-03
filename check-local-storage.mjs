// 检查前端本地存储中的社群数据
import fs from 'fs';
import path from 'path';

// 模拟localStorage
const localStorage = {
  getItem: function(key) {
    try {
      const data = fs.readFileSync(path.join(process.cwd(), 'localStorage.json'), 'utf-8');
      const storage = JSON.parse(data);
      return storage[key];
    } catch (error) {
      return null;
    }
  },
  setItem: function(key, value) {
    try {
      let storage = {};
      if (fs.existsSync(path.join(process.cwd(), 'localStorage.json'))) {
        const data = fs.readFileSync(path.join(process.cwd(), 'localStorage.json'), 'utf-8');
        storage = JSON.parse(data);
      }
      storage[key] = value;
      fs.writeFileSync(path.join(process.cwd(), 'localStorage.json'), JSON.stringify(storage, null, 2));
    } catch (error) {
      console.error('写入localStorage失败:', error.message);
    }
  }
};

// 本地存储键名
const STORAGE_KEYS = {
  JOINED_COMMUNITIES: 'jmzf_joined_communities',
  FAVORITED_THREADS: 'jmzf_favorited_threads'
};

console.log('检查前端本地存储中的社群数据...');

// 检查加入的社群
const joinedCommunitiesStr = localStorage.getItem(STORAGE_KEYS.JOINED_COMMUNITIES);
if (joinedCommunitiesStr) {
  try {
    const joinedCommunities = JSON.parse(joinedCommunitiesStr);
    console.log('\n加入的社群:');
    joinedCommunities.forEach(community => {
      console.log(`- ${community.name} (ID: ${community.id})`);
    });

    // 检查测试社群
    const testCommunities = joinedCommunities.filter(c => 
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
  } catch (error) {
    console.error('解析joinedCommunities失败:', error.message);
  }
} else {
  console.log('\n没有找到加入的社群数据');
}

console.log('\n检查完成');
