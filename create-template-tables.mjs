// 使用 Supabase 创建模板互动表
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// 加载环境变量
const envLocal = readFileSync('.env.local', 'utf-8');
const envConfig = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envConfig[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('创建模板互动表');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createTables() {
  // 使用 supabase 的 pg 扩展执行原始 SQL
  const sqlStatements = [
    // 创建模板收藏表
    `CREATE TABLE IF NOT EXISTS template_favorites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, template_id)
    )`,
    
    // 创建模板点赞表
    `CREATE TABLE IF NOT EXISTS template_likes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, template_id)
    )`,
    
    // 创建索引
    `CREATE INDEX IF NOT EXISTS idx_template_favorites_user_id ON template_favorites(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_template_favorites_template_id ON template_favorites(template_id)`,
    `CREATE INDEX IF NOT EXISTS idx_template_likes_user_id ON template_likes(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_template_likes_template_id ON template_likes(template_id)`,
    
    // 启用 RLS
    `ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE template_likes ENABLE ROW LEVEL SECURITY`,
  ];

  for (const sql of sqlStatements) {
    console.log('执行:', sql.substring(0, 60) + '...');
    
    try {
      // 尝试使用 supabase 的 rpc 执行 SQL
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.log('  ⚠️ RPC 失败:', error.message);
        console.log('  尝试使用 REST API...');
        
        // 使用 REST API 直接查询
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ query: sql })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('  ❌ 失败:', errorText.substring(0, 100));
        } else {
          console.log('  ✅ 成功');
        }
      } else {
        console.log('  ✅ 成功');
      }
    } catch (e) {
      console.log('  ❌ 异常:', e.message);
    }
  }
}

// 检查表是否创建成功
async function verifyTables() {
  console.log('\n========================================');
  console.log('验证表创建结果');
  console.log('========================================\n');
  
  const tables = ['template_favorites', 'template_likes'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: 表已存在，可以正常访问`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
}

createTables().then(() => {
  setTimeout(verifyTables, 1000);
});
