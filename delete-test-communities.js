import fs from 'fs';
import path from 'path';

// 检查并删除测试社群
console.log('=== 检查并删除测试社群 ===');

// JSON持久化路径
const JSON_DB_PATH = path.join(process.cwd(), 'server', 'data', 'backup.json');

// 测试社群名称
const TEST_COMMUNITY_NAMES = [
  '测试社群1770030488359',
  '测试社群1770029869992'
];

try {
  // 检查JSON文件是否存在
  if (fs.existsSync(JSON_DB_PATH)) {
    console.log('发现JSON数据库备份文件:', JSON_DB_PATH);
    
    // 读取数据
    const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
    console.log('当前社群数量:', data.communities?.length || 0);
    
    // 查找测试社群
    if (data.communities) {
      const testCommunities = data.communities.filter(c => 
        TEST_COMMUNITY_NAMES.includes(c.name)
      );
      
      console.log('找到测试社群:', testCommunities.length);
      testCommunities.forEach(c => {
        console.log('-', c.name, '(ID:', c.id, ')');
      });
      
      // 删除测试社群
      if (testCommunities.length > 0) {
        console.log('\n删除测试社群...');
        const updatedCommunities = data.communities.filter(c => 
          !TEST_COMMUNITY_NAMES.includes(c.name)
        );
        
        // 更新数据
        data.communities = updatedCommunities;
        
        // 保存回文件
        fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
        console.log('删除完成！');
        console.log('更新后社群数量:', updatedCommunities.length);
      } else {
        console.log('未找到测试社群，无需删除');
      }
    } else {
      console.log('未找到communities数组');
    }
  } else {
    console.log('未找到JSON数据库备份文件');
  }
} catch (error) {
  console.error('操作时出错:', error.message);
}

console.log('\n=== 操作完成 ===');
