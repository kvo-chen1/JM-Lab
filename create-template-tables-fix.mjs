// 创建模板互动表修复脚本
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
console.log('创建模板互动表修复脚本');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createTables() {
  try {
    // 1. 检查 template_favorites 表是否存在
    console.log('📋 检查 template_favorites 表...');
    const { error: checkFavError } = await supabase
      .from('template_favorites')
      .select('count', { count: 'exact', head: true });
    
    if (checkFavError && checkFavError.code === '42P01') {
      console.log('   ⚠️ template_favorites 表不存在，需要创建');
    } else if (checkFavError) {
      console.log('   ⚠️ 检查表时出错:', checkFavError.message);
    } else {
      console.log('   ✅ template_favorites 表已存在');
    }

    // 2. 检查 template_likes 表是否存在
    console.log('\n📋 检查 template_likes 表...');
    const { error: checkLikeError } = await supabase
      .from('template_likes')
      .select('count', { count: 'exact', head: true });
    
    if (checkLikeError && checkLikeError.code === '42P01') {
      console.log('   ⚠️ template_likes 表不存在，需要创建');
    } else if (checkLikeError) {
      console.log('   ⚠️ 检查表时出错:', checkLikeError.message);
    } else {
      console.log('   ✅ template_likes 表已存在');
    }

    // 3. 使用 RPC 创建表（通过 Supabase 的 exec_sql 函数）
    console.log('\n🔧 尝试创建缺失的表...');
    
    // 创建 template_favorites 表
    const createFavoritesSQL = `
      CREATE TABLE IF NOT EXISTS template_favorites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, template_id)
      );
    `;
    
    const { error: createFavError } = await supabase.rpc('exec_sql', { sql: createFavoritesSQL });
    if (createFavError) {
      console.log('   ❌ 创建 template_favorites 表失败:', createFavError.message);
      // 尝试直接创建
      console.log('   🔄 尝试直接创建...');
    } else {
      console.log('   ✅ template_favorites 表创建成功');
    }

    // 创建 template_likes 表
    const createLikesSQL = `
      CREATE TABLE IF NOT EXISTS template_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, template_id)
      );
    `;
    
    const { error: createLikeError } = await supabase.rpc('exec_sql', { sql: createLikesSQL });
    if (createLikeError) {
      console.log('   ❌ 创建 template_likes 表失败:', createLikeError.message);
    } else {
      console.log('   ✅ template_likes 表创建成功');
    }

    // 4. 验证表是否创建成功
    console.log('\n✅ 验证表创建结果...');
    const { error: verifyFavError } = await supabase
      .from('template_favorites')
      .select('count', { count: 'exact', head: true });
    
    if (verifyFavError) {
      console.log('   ❌ template_favorites 表验证失败:', verifyFavError.message);
    } else {
      console.log('   ✅ template_favorites 表已可用');
    }

    const { error: verifyLikeError } = await supabase
      .from('template_likes')
      .select('count', { count: 'exact', head: true });
    
    if (verifyLikeError) {
      console.log('   ❌ template_likes 表验证失败:', verifyLikeError.message);
    } else {
      console.log('   ✅ template_likes 表已可用');
    }

    console.log('\n========================================');
    console.log('修复完成！');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ 执行过程中出错:', error.message);
    console.log('\n💡 建议：请手动在 Supabase Dashboard 中执行 SQL 迁移文件：');
    console.log('   supabase/migrations/20260209000000_create_template_interactions.sql');
  }
}

createTables();
