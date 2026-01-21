// 检查当前环境变量中的数据库配置
console.log('=== 数据库配置检查 ===');
console.log('环境变量 DB_TYPE:', process.env.DB_TYPE);
console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Supabase Anon Key:', process.env.SUPABASE_ANON_KEY);
console.log('PostgreSQL URL:', process.env.POSTGRES_URL);
console.log('PostgreSQL Host:', process.env.POSTGRES_HOST);
console.log('PostgreSQL Database:', process.env.POSTGRES_DATABASE);

// 检查邮件服务相关环境变量
console.log('\n=== 邮件服务环境变量检查 ===');
console.log('Email Host:', process.env.EMAIL_HOST);
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email From:', process.env.EMAIL_FROM);
