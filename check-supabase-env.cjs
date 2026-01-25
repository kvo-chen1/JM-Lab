// 使用CommonJS语法，确保在Node.js环境中可以运行
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// 加载.env文件中的环境变量
dotenv.config();

// 模拟环境变量加载
const loadEnv = () => {
  try {
    // 尝试从process.env加载环境变量（用于Node.js环境）
    if (process && process.env) {
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
      };
    }
  } catch (error) {
    console.error('Error loading process.env:', error);
  }
  
  return {};
};

const env = loadEnv();

console.log('环境变量配置:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置');
console.log('- VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? '已设置' : '未设置');
console.log('- VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置');
console.log('- SUPABASE_URL:', env.SUPABASE_URL ? '已设置' : '未设置');
console.log('- SUPABASE_ANON_KEY:', env.SUPABASE_ANON_KEY ? '已设置' : '未设置');

// 验证环境变量并创建客户端
let supabaseUrl = '';
let supabaseKey = '';

if (env.NEXT_PUBLIC_SUPABASE_URL) {
  supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/^[\s`']+|[\s`']+$/g, '');
} else if (env.VITE_SUPABASE_URL) {
  supabaseUrl = env.VITE_SUPABASE_URL.replace(/^[\s`']+|[\s`']+$/g, '');
} else if (env.SUPABASE_URL) {
  supabaseUrl = env.SUPABASE_URL.replace(/^[\s`']+|[\s`']+$/g, '');
}

if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/^[\s`']+|[\s`']+$/g, '');
} else if (env.VITE_SUPABASE_ANON_KEY) {
  supabaseKey = env.VITE_SUPABASE_ANON_KEY.replace(/^[\s`']+|[\s`']+$/g, '');
} else if (env.SUPABASE_ANON_KEY) {
  supabaseKey = env.SUPABASE_ANON_KEY.replace(/^[\s`']+|[\s`']+$/g, '');
}

console.log('\n处理后的配置:');
console.log('- URL:', supabaseUrl || '未设置');
console.log('- 密钥:', supabaseKey ? '已设置，长度: ' + supabaseKey.length : '未设置');

// 验证URL格式
if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  console.error('❌ Supabase URL格式不正确，必须以http://或https://开头:', supabaseUrl);
}

// 验证密钥格式
if (supabaseKey && supabaseKey.length < 30) {
  console.error('❌ Supabase密钥长度过短，可能是无效密钥:', supabaseKey);
}

// 尝试创建客户端
if (supabaseUrl && supabaseKey) {
  console.log('\n尝试创建Supabase客户端...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    console.log('✅ Supabase客户端创建成功');
    console.log('✅ Supabase auth对象:', typeof supabase.auth);
    console.log('✅ Supabase auth.signUp方法:', typeof supabase.auth.signUp);
    
    // 尝试检查连接
    console.log('\n尝试检查Supabase连接...');
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ 检查Supabase连接失败:', error);
        } else {
          console.log('✅ Supabase连接检查成功，session:', data.session ? '存在' : '不存在');
        }
      })
      .catch(error => {
        console.error('❌ 检查Supabase连接时发生异常:', error);
      });
  } catch (error) {
    console.error('❌ 创建Supabase客户端失败:', error);
  }
} else {
  console.error('❌ 无法创建Supabase客户端，环境变量不完整');
}