/**
 * 环境变量验证模块
 * 用于验证和提供默认值给环境变量
 */

interface EnvConfig {
  // Supabase 配置
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // AI 服务配置
  doubaoBaseUrl: string;
  doubaoApiKey: string;
  kimiApiKey: string;
  openaiApiKey: string;
  
  // 应用配置
  appName: string;
  appVersion: string;
  nodeEnv: 'development' | 'production' | 'test';
  
  // 功能开关
  enableMockData: boolean;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  errorReportUrl: string;
}

// 必需的环境变量列表
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

// 警告级别的环境变量（可选但建议配置）
const RECOMMENDED_ENV_VARS = [
  'VITE_DOUBAO_API_KEY',
  'VITE_KIMI_API_KEY',
  'VITE_OPENAI_API_KEY',
];

/**
 * 验证环境变量
 */
export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查必需的环境变量
  REQUIRED_ENV_VARS.forEach((envVar) => {
    if (!import.meta.env[envVar]) {
      errors.push(`缺少必需的环境变量: ${envVar}`);
    }
  });

  // 检查建议的环境变量
  RECOMMENDED_ENV_VARS.forEach((envVar) => {
    if (!import.meta.env[envVar]) {
      warnings.push(`缺少建议的环境变量: ${envVar}，相关功能可能不可用`);
    }
  });

  // 验证 URL 格式
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      new URL(supabaseUrl);
    } catch {
      errors.push(`VITE_SUPABASE_URL 格式无效: ${supabaseUrl}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * 获取环境变量配置
 */
export function getEnvConfig(): EnvConfig {
  return {
    // Supabase 配置
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    
    // AI 服务配置
    doubaoBaseUrl: import.meta.env.VITE_DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    doubaoApiKey: import.meta.env.VITE_DOUBAO_API_KEY || '',
    kimiApiKey: import.meta.env.VITE_KIMI_API_KEY || '',
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    
    // 应用配置
    appName: import.meta.env.VITE_APP_NAME || '津脉智坊',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    nodeEnv: (import.meta.env.MODE as 'development' | 'production' | 'test') || 'development',
    
    // 功能开关
    enableMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
    enableErrorReporting: !!import.meta.env.VITE_ERROR_REPORT_URL,
    errorReportUrl: import.meta.env.VITE_ERROR_REPORT_URL || '',
  };
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV === true;
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return import.meta.env.PROD === true;
}

/**
 * 检查功能是否启用
 */
export function isFeatureEnabled(featureName: string): boolean {
  const envVar = `VITE_ENABLE_${featureName.toUpperCase()}`;
  return import.meta.env[envVar] === 'true';
}

/**
 * 初始化环境验证
 * 在应用启动时调用
 */
export function initEnvValidation(): void {
  if (isDevelopment()) {
    const { valid, errors, warnings } = validateEnv();
    
    if (!valid) {
      console.error('[EnvValidation] 环境变量验证失败:');
      errors.forEach((err) => console.error(`  ❌ ${err}`));
    }
    
    if (warnings.length > 0) {
      console.warn('[EnvValidation] 环境变量警告:');
      warnings.forEach((warn) => console.warn(`  ⚠️ ${warn}`));
    }
    
    if (valid && warnings.length === 0) {
      console.log('[EnvValidation] ✅ 环境变量验证通过');
    }
  }
}

// 导出默认配置对象
export const envConfig = getEnvConfig();

export default envConfig;
