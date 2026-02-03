import fs from 'fs';
import path from 'path';

// 检查服务器端的社群数据
console.log('=== 检查服务器端社群数据 ===');

// 检查server目录
const serverDir = path.join('server');
try {
  if (fs.existsSync(serverDir)) {
    console.log('发现server目录:', serverDir);
    const files = fs.readdirSync(serverDir);
    console.log('Server文件:', files);
    
    // 检查local-api.mjs文件
    const apiFile = path.join(serverDir, 'local-api.mjs');
    if (fs.existsSync(apiFile)) {
      console.log('\n发现local-api.mjs文件');
      const content = fs.readFileSync(apiFile, 'utf8');
      
      // 搜索communities相关内容
      const communitiesMatch = content.match(/communities[^}]+}/gs);
      if (communitiesMatch) {
        console.log('找到communities相关代码片段');
        communitiesMatch.forEach((match, index) => {
          console.log(`\n片段${index + 1}:`, match.substring(0, 500) + '...');
        });
      }
      
      // 搜索测试社群相关内容
      const testCommunityMatch = content.match(/测试社群[^,]+/g);
      if (testCommunityMatch) {
        console.log('\n找到测试社群相关内容:', testCommunityMatch);
      }
    }
  } else {
    console.log('未找到server目录');
  }
} catch (error) {
  console.error('检查服务器数据时出错:', error.message);
}

console.log('\n=== 检查完成 ===');
