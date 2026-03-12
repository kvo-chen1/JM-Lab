// 调试API - 检查环境变量和数据库连接
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 收集环境变量信息（隐藏敏感信息）
  const envInfo = {
    // 数据库相关
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasPostgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : null,
    
    // Supabase相关
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasNextPublicSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasNextPublicSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    
    // Vercel环境
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION,
  };

  // 尝试连接数据库
  let dbStatus = 'not_configured';
  let dbError = null;
  
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as time, version() as version');
      client.release();
      await pool.end();
      
      dbStatus = 'connected';
      envInfo.dbTime = result.rows[0].time;
      envInfo.dbVersion = result.rows[0].version;
    } catch (error) {
      dbStatus = 'error';
      dbError = error.message;
    }
  }

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envInfo,
    databaseStatus: dbStatus,
    databaseError: dbError,
    message: dbStatus === 'not_configured' 
      ? '数据库未配置，请在Vercel环境变量中设置 DATABASE_URL 或 POSTGRES_URL'
      : dbStatus === 'connected'
      ? '数据库连接正常'
      : '数据库连接失败: ' + dbError
  });
}
