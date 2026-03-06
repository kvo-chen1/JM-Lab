// 测试API端点的脚本
import { generateToken } from './server/jwt.mjs';
import fetch from 'node-fetch';

// 手动设置JWT密钥为与服务器相同的值
process.env.JWT_SECRET = 'jinmai-secret-key-2026-02-04-abcdefghijklmnopqrstuvwxyz1234567890';

// 生成测试用的JWT token
const testToken = generateToken({ userId: 'test-user-id' });
console.log('测试用的JWT token:', testToken);

// 测试检查用户是否点赞了帖子的API端点
async function testCheckPostLiked() {
  try {
    const response = await fetch('http://localhost:3023/api/posts/1/liked', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    const data = await response.json();
    console.log('测试检查帖子点赞状态:', data);
  } catch (error) {
    console.error('测试检查帖子点赞状态失败:', error);
  }
}

// 测试检查用户是否关注了另一个用户的API端点
async function testCheckUserFollowing() {
  try {
    const response = await fetch('http://localhost:3023/api/follows/check?targetUserId=target-user-id', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    const data = await response.json();
    console.log('测试检查用户关注状态:', data);
  } catch (error) {
    console.error('测试检查用户关注状态失败:', error);
  }
}

// 运行测试
testCheckPostLiked();
testCheckUserFollowing();
