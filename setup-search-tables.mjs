/**
 * 设置搜索功能数据库表
 * 使用 Supabase REST API 创建表
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('🔧 设置搜索功能数据库表...\n');

  // 1. 创建用户搜索历史表
  console.log('1️⃣ 创建 user_search_history 表...');
  try {
    const { error } = await supabase.from('user_search_history').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      console.log('   表不存在，需要手动在 Supabase Dashboard 中创建');
    } else if (error) {
      console.log('   检查表时出错:', error.message);
    } else {
      console.log('   ✅ 表已存在');
    }
  } catch (err) {
    console.log('   ⚠️', err.message);
  }

  // 2. 创建热门搜索表
  console.log('2️⃣ 创建 hot_searches 表...');
  try {
    const { error } = await supabase.from('hot_searches').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      console.log('   表不存在，需要手动在 Supabase Dashboard 中创建');
    } else if (error) {
      console.log('   检查表时出错:', error.message);
    } else {
      console.log('   ✅ 表已存在');
    }
  } catch (err) {
    console.log('   ⚠️', err.message);
  }

  // 3. 创建搜索建议表
  console.log('3️⃣ 创建 search_suggestions 表...');
  try {
    const { error } = await supabase.from('search_suggestions').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      console.log('   表不存在，需要手动在 Supabase Dashboard 中创建');
    } else if (error) {
      console.log('   检查表时出错:', error.message);
    } else {
      console.log('   ✅ 表已存在');
    }
  } catch (err) {
    console.log('   ⚠️', err.message);
  }

  // 4. 创建用户搜索偏好表
  console.log('4️⃣ 创建 user_search_preferences 表...');
  try {
    const { error } = await supabase.from('user_search_preferences').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      console.log('   表不存在，需要手动在 Supabase Dashboard 中创建');
    } else if (error) {
      console.log('   检查表时出错:', error.message);
    } else {
      console.log('   ✅ 表已存在');
    }
  } catch (err) {
    console.log('   ⚠️', err.message);
  }

  // 5. 创建搜索行为跟踪表
  console.log('5️⃣ 创建 search_behavior_tracking 表...');
  try {
    const { error } = await supabase.from('search_behavior_tracking').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      console.log('   表不存在，需要手动在 Supabase Dashboard 中创建');
    } else if (error) {
      console.log('   检查表时出错:', error.message);
    } else {
      console.log('   ✅ 表已存在');
    }
  } catch (err) {
    console.log('   ⚠️', err.message);
  }

  console.log('\n📋 请按照以下步骤手动创建表:');
  console.log('   1. 登录 Supabase Dashboard');
  console.log('   2. 进入 SQL Editor');
  console.log('   3. 复制并执行 supabase/migrations/20260211000002_create_search_tables.sql 文件中的 SQL');
  console.log('\n📁 迁移文件路径:');
  console.log('   supabase/migrations/20260211000002_create_search_tables.sql');
}

// 插入默认搜索建议数据
async function insertDefaultSuggestions() {
  console.log('\n📝 插入默认搜索建议数据...');

  const defaultSuggestions = [
    { keyword: '国潮设计', category: 'design', weight: 100, is_hot: true, is_recommended: true },
    { keyword: '纹样设计', category: 'design', weight: 95, is_hot: true, is_recommended: true },
    { keyword: '品牌设计', category: 'design', weight: 90, is_hot: true, is_recommended: true },
    { keyword: '非遗传承', category: 'culture', weight: 85, is_hot: true, is_recommended: true },
    { keyword: '插画设计', category: 'design', weight: 80, is_hot: true, is_recommended: true },
    { keyword: '工艺创新', category: 'design', weight: 75, is_hot: true, is_recommended: false },
    { keyword: '老字号品牌', category: 'brand', weight: 70, is_hot: true, is_recommended: false },
    { keyword: 'IP设计', category: 'design', weight: 65, is_hot: true, is_recommended: true },
    { keyword: '包装设计', category: 'design', weight: 60, is_hot: true, is_recommended: false },
    { keyword: '海报设计', category: 'design', weight: 55, is_hot: false, is_recommended: true },
    { keyword: '字体设计', category: 'design', weight: 50, is_hot: false, is_recommended: false },
    { keyword: '标志设计', category: 'design', weight: 45, is_hot: false, is_recommended: false },
    { keyword: 'VI设计', category: 'design', weight: 40, is_hot: false, is_recommended: false },
    { keyword: 'UI设计', category: 'design', weight: 35, is_hot: false, is_recommended: true },
    { keyword: '平面设计', category: 'design', weight: 30, is_hot: false, is_recommended: false },
    { keyword: '文创产品', category: 'product', weight: 85, is_hot: true, is_recommended: true },
    { keyword: '天津文化', category: 'culture', weight: 80, is_hot: true, is_recommended: true },
    { keyword: '民俗艺术', category: 'culture', weight: 75, is_hot: false, is_recommended: false },
    { keyword: '传统手工艺', category: 'culture', weight: 70, is_hot: false, is_recommended: false },
    { keyword: '现代设计', category: 'design', weight: 65, is_hot: false, is_recommended: true }
  ];

  try {
    const { error } = await supabase
      .from('search_suggestions')
      .upsert(defaultSuggestions, { onConflict: 'keyword' });

    if (error) {
      console.log('   ⚠️ 插入数据失败:', error.message);
    } else {
      console.log('   ✅ 已插入/更新', defaultSuggestions.length, '条搜索建议');
    }
  } catch (err) {
    console.log('   ⚠️', err.message);
  }
}

// 插入默认热门搜索数据
async function insertDefaultHotSearches() {
  console.log('\n🔥 插入默认热门搜索数据...');

  const defaultHotSearches = [
    { query: '国潮设计', search_count: 1250, trend_score: 95.5, category: 'design' },
    { query: '纹样设计', search_count: 980, trend_score: 88.2, category: 'design' },
    { query: '品牌设计', search_count: 856, trend_score: 82.1, category: 'design' },
    { query: '非遗传承', search_count: 743, trend_score: 76.8, category: 'culture' },
    { query: '插画设计', search_count: 692, trend_score: 72.3, category: 'design' },
    { query: '文创产品', search_count: 621, trend_score: 68.5, category: 'product' },
    { query: '天津文化', search_count: 580, trend_score: 65.2, category: 'culture' },
    { query: 'IP设计', search_count: 534, trend_score: 61.8, category: 'design' }
  ];

  try {
    const { error } = await supabase
      .from('hot_searches')
      .upsert(defaultHotSearches, { onConflict: 'query' });

    if (error) {
      console.log('   ⚠️ 插入数据失败:', error.message);
    } else {
      console.log('   ✅ 已插入/更新', defaultHotSearches.length, '条热门搜索');
    }
  } catch (err) {
    console.log('   ⚠️', err.message);
  }
}

async function main() {
  await setupTables();
  
  // 尝试插入默认数据（如果表已存在）
  await insertDefaultSuggestions();
  await insertDefaultHotSearches();
  
  console.log('\n✅ 设置完成！');
}

main().catch(console.error);
