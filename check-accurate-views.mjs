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

async function checkAccurateViews() {
  console.log('\n=== 精确检查 kvo1 的浏览量 ===\n');
  
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
  
  console.log('kvo1 用户ID:', user?.id);
  console.log('');
  
  // 1. 查询所有作品（不限制 creator_id）
  const { data: allWorks, error: error1 } = await supabase
    .from('works')
    .select('id, title, view_count, creator_id')
    .order('view_count', { ascending: false });
  
  if (error1) {
    console.error('查询所有作品失败:', error1);
    return;
  }
  
  console.log('所有作品总浏览量:', allWorks?.reduce((sum, w) => sum + (w.view_count || 0), 0) || 0);
  console.log('所有作品总数:', allWorks?.length || 0);
  console.log('');
  
  // 2. 只查询 kvo1 的作品
  const { data: kvo1Works, error: error2 } = await supabase
    .from('works')
    .select('id, title, view_count, creator_id')
    .eq('creator_id', user?.id)
    .order('view_count', { ascending: false });
  
  if (error2) {
    console.error('查询 kvo1 作品失败:', error2);
    return;
  }
  
  console.log('kvo1 作品总浏览量:', kvo1Works?.reduce((sum, w) => sum + (w.view_count || 0), 0) || 0);
  console.log('kvo1 作品总数:', kvo1Works?.length || 0);
  console.log('');
  
  // 3. 显示 kvo1 的每个作品浏览量
  console.log('kvo1 各作品浏览量:');
  kvo1Works?.forEach((w, i) => {
    console.log(`  ${i + 1}. ${w.title?.substring(0, 30)}: ${w.view_count}`);
  });
  console.log('');
  
  // 4. 检查是否有 creator_id 为空的作品
  const { data: nullCreatorWorks, error: error3 } = await supabase
    .from('works')
    .select('id, title, view_count, creator_id')
    .is('creator_id', null);
  
  if (error3) {
    console.error('查询空 creator_id 作品失败:', error3);
  } else {
    console.log('creator_id 为空的作品数:', nullCreatorWorks?.length || 0);
    console.log('creator_id 为空的作品总浏览量:', nullCreatorWorks?.reduce((sum, w) => sum + (w.view_count || 0), 0) || 0);
  }
  
  // 5. 按 creator_id 统计
  console.log('\n按 creator_id 统计:');
  const creatorMap = {};
  allWorks?.forEach(w => {
    const cid = w.creator_id || 'null';
    if (!creatorMap[cid]) {
      creatorMap[cid] = { count: 0, views: 0 };
    }
    creatorMap[cid].count++;
    creatorMap[cid].views += (w.view_count || 0);
  });
  
  Object.entries(creatorMap).forEach(([cid, stats]) => {
    const isKvo1 = cid === user?.id;
    console.log(`  ${cid.substring(0, 8)}...: ${stats.count} 个作品, ${stats.views} 次浏览 ${isKvo1 ? '(kvo1)' : ''}`);
  });
}

checkAccurateViews().catch(console.error);
