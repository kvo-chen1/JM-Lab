import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
if (fs.existsSync(path.join(__dirname, '.env.local'))) {
  const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '.env.local')));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Missing Supabase service role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApiStats() {
  console.log('\n=== 模拟 API 返回的数据 ===\n');
  
  // 获取用户 kvo1 的 ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username')
    .eq('username', 'kvo1')
    .single();
  
  if (userError) {
    console.error('获取用户失败:', userError);
    return;
  }
  
  // 模拟 getWorkStats 的 SQL 查询
  // 注意：这里使用 Supabase 而不是直接 SQL，但逻辑相同
  const { data: works, error } = await supabase
    .from('works')
    .select('view_count, likes, comments, source')
    .eq('creator_id', user?.id);
  
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  // 模拟 SQL 中的过滤条件: AND (source = '津脉广场' OR source IS NULL)
  const filteredWorks = works?.filter(w => w.source === '津脉广场' || !w.source);
  
  console.log('所有作品数:', works?.length);
  console.log('过滤后作品数 (source = 津脉广场 或 null):', filteredWorks?.length);
  console.log('');
  
  const totalViewsAll = works?.reduce((sum, w) => sum + (w.view_count || 0), 0) || 0;
  const totalViewsFiltered = filteredWorks?.reduce((sum, w) => sum + (w.view_count || 0), 0) || 0;
  
  console.log('所有作品总浏览量:', totalViewsAll);
  console.log('过滤后作品总浏览量:', totalViewsFiltered);
  console.log('');
  
  // 显示被过滤掉的作品
  const excludedWorks = works?.filter(w => w.source && w.source !== '津脉广场');
  console.log('被过滤掉的作品:');
  excludedWorks?.forEach(w => {
    console.log(`  - ${w.title?.substring(0, 30)}: source=${w.source}, view_count=${w.view_count}`);
  });
}

checkApiStats().catch(console.error);
