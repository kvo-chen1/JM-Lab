// 环境变量检查 API - 用于诊断线上配置问题
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 检查 AI API 密钥
  const aiConfig = {
    dashscope: {
      configured: !!(process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY),
      keyPrefix: (process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY) 
        ? (process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY).substring(0, 10) + '...'
        : null
    },
    kimi: {
      configured: !!(process.env.KIMI_API_KEY || process.env.VITE_KIMI_API_KEY),
      keyPrefix: (process.env.KIMI_API_KEY || process.env.VITE_KIMI_API_KEY)
        ? (process.env.KIMI_API_KEY || process.env.VITE_KIMI_API_KEY).substring(0, 10) + '...'
        : null
    }
  };

  // 检查数据库配置
  const dbConfig = {
    postgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
    databaseUrl: !!process.env.DATABASE_URL,
    postgresUrl: !!process.env.POSTGRES_URL,
    hasAnyDbUrl: !!(process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL)
  };

  // 检查 Supabase 配置
  const supabaseConfig = {
    url: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    jwtSecret: !!process.env.SUPABASE_JWT_SECRET
  };

  // 检查 JWT 配置
  const jwtConfig = {
    secret: !!process.env.JWT_SECRET,
    hasAnySecret: !!(process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET)
  };

  // 环境信息
  const envInfo = {
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    nodeEnv: process.env.NODE_ENV || 'unknown',
    region: process.env.VERCEL_REGION || 'unknown'
  };

  // 确定状态
  const isHealthy = aiConfig.dashscope.configured && dbConfig.hasAnyDbUrl && supabaseConfig.url && supabaseConfig.anonKey;

  const status = {
    healthy: isHealthy,
    timestamp: new Date().toISOString(),
    environment: envInfo,
    checks: {
      ai: {
        status: aiConfig.dashscope.configured ? 'ok' : 'missing',
        details: aiConfig
      },
      database: {
        status: dbConfig.hasAnyDbUrl ? 'ok' : 'missing',
        details: dbConfig
      },
      supabase: {
        status: (supabaseConfig.url && supabaseConfig.anonKey) ? 'ok' : 'missing',
        details: supabaseConfig
      },
      jwt: {
        status: jwtConfig.hasAnySecret ? 'ok' : 'missing',
        details: jwtConfig
      }
    },
    missing: []
  };

  // 列出缺失的配置
  if (!aiConfig.dashscope.configured) {
    status.missing.push('DASHSCOPE_API_KEY (通义千问 API 密钥)');
  }
  if (!dbConfig.hasAnyDbUrl) {
    status.missing.push('DATABASE_URL 或 POSTGRES_URL (数据库连接)');
  }
  if (!supabaseConfig.url) {
    status.missing.push('SUPABASE_URL (Supabase 项目 URL)');
  }
  if (!supabaseConfig.anonKey) {
    status.missing.push('SUPABASE_ANON_KEY (Supabase 匿名密钥)');
  }

  const statusCode = isHealthy ? 200 : 503;
  
  return res.status(statusCode).json(status);
}
