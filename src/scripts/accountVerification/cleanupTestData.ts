// 清理测试数据脚本
// 用于清理本地存储中的测试数据，确保每次测试都从干净的环境开始

// 定义需要清理的localStorage键
const TEST_DATA_KEYS = [
  'user',
  'token',
  'refreshToken',
  'isAuthenticated',
  'SECURE_TOKEN',
  'SECURE_REFRESH_TOKEN',
  'SECURE_USER',
  'jmzf_user_actions',
  'jmzf_user_preferences',
  'jmzf_recommendations',
  'jmzf_user_similarities',
  'jmzf_recommendation_feedback',
  'jmzf_offline_data',
  'POINTS_RECORDS',
  'CREATIVE_TASKS',
  'CHECKIN_RECORDS',
  'jmzf_favs',
  // LLM相关数据也需要清理，避免影响测试
  'LLM_CONFIG',
  'LLM_CURRENT_MODEL',
  'LLM_ROLES',
  'LLM_CURRENT_ROLE_ID',
  'LLM_CONVERSATION_SESSIONS',
  'LLM_CURRENT_SESSION_ID',
];

/**
 * 清理指定的localStorage键
 */
export function cleanupLocalStorage(keys: string[] = TEST_DATA_KEYS): void {
  console.log('开始清理测试数据...');
  
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`已清理: ${key}`);
    } catch (error) {
      console.error(`清理${key}失败:`, error);
    }
  });
  
  console.log('测试数据清理完成！');
}

/**
 * 清理所有测试数据
 */
export function cleanupAllTestData(): void {
  cleanupLocalStorage();
}

/**
 * 验证清理结果
 */
export function verifyCleanup(): boolean {
  console.log('验证清理结果...');
  
  let allClean = true;
  TEST_DATA_KEYS.forEach(key => {
    if (localStorage.getItem(key)) {
      console.error(`清理失败: ${key} 仍然存在`);
      allClean = false;
    } else {
      console.log(`验证通过: ${key} 已清理`);
    }
  });
  
  return allClean;
}

// 如果直接运行脚本，则执行清理
if (typeof window !== 'undefined') {
  // 在浏览器环境中运行
  cleanupAllTestData();
  verifyCleanup();
} else {
  // 在Node.js环境中运行，输出使用说明
  console.log('清理测试数据脚本');
  console.log('使用方法:');
  console.log('1. 在浏览器控制台中运行:');
  console.log('   cleanupAllTestData()');
  console.log('2. 或在代码中导入使用:');
  console.log('   import { cleanupAllTestData } from \'./cleanupTestData\'');
  console.log('   cleanupAllTestData()');
}
