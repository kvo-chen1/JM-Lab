// 简单测试认证系统核心逻辑
import { userActions, authActions } from './server/auth/neon-auth.js';

// 测试配置
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123456';
const TEST_NAME = 'Test User';

// 测试注册功能
async function testRegister() {
  console.log('\n=== 测试注册功能 ===');
  
  try {
    // 检查用户是否已存在
    const existingUser = await userActions.findUserByEmail(TEST_EMAIL);
    if (existingUser) {
      console.log('用户已存在，跳过注册测试');
      return existingUser.id;
    }
    
    // 创建新用户
    const newUser = await userActions.createUser({ 
      email: TEST_EMAIL, 
      password: TEST_PASSWORD, 
      name: TEST_NAME 
    });
    
    console.log('✅ 注册成功，用户ID:', newUser.id);
    return newUser.id;
  } catch (error) {
    console.error('❌ 注册失败:', error);
    return null;
  }
}

// 测试登录功能
async function testLogin() {
  console.log('\n=== 测试登录功能 ===');
  
  try {
    // 查找用户
    const user = await userActions.findUserByEmail(TEST_EMAIL);
    if (!user) {
      console.log('❌ 用户不存在，无法登录');
      return null;
    }
    
    // 验证密码
    const isPasswordValid = await authActions.verifyPassword(user.password_hash, TEST_PASSWORD);
    if (!isPasswordValid) {
      console.log('❌ 密码验证失败');
      return null;
    }
    
    // 生成JWT令牌
    const token = await authActions.generateToken(user.id);
    console.log('✅ 登录成功，令牌:', token.substring(0, 50) + '...');
    return token;
  } catch (error) {
    console.error('❌ 登录失败:', error);
    return null;
  }
}

// 测试验证令牌功能
async function testVerifyToken(token) {
  console.log('\n=== 测试验证令牌功能 ===');
  
  try {
    // 验证令牌
    const decoded = await authActions.verifyToken(token);
    if (!decoded) {
      console.log('❌ 令牌验证失败');
      return false;
    }
    
    console.log('✅ 令牌验证成功，用户ID:', decoded.userId);
    return true;
  } catch (error) {
    console.error('❌ 验证令牌失败:', error);
    return false;
  }
}

// 测试通过ID查找用户
async function testFindUserById(userId) {
  console.log('\n=== 测试通过ID查找用户 ===');
  
  try {
    const user = await userActions.findUserById(userId);
    if (!user) {
      console.log('❌ 用户不存在');
      return false;
    }
    
    console.log('✅ 查找用户成功，邮箱:', user.email);
    return true;
  } catch (error) {
    console.error('❌ 查找用户失败:', error);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试认证系统核心逻辑...');
  
  try {
    // 运行测试
    const userId = await testRegister();
    
    if (userId) {
      await testFindUserById(userId);
      const token = await testLogin();
      
      if (token) {
        await testVerifyToken(token);
      }
    }
    
    console.log('\n=== 测试完成 ===');
    console.log('所有测试已执行');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 运行测试
runTests();