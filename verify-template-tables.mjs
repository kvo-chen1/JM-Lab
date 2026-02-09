// 验证模板互动表是否创建成功
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
console.log('验证模板互动表');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyTables() {
  const tables = ['template_favorites', 'template_likes'];
  
  for (const table of tables) {
    console.log(`\n📋 检查表: ${table}`);
    console.log('-'.repeat(50));
    
    try {
      // 尝试查询表
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ 表访问失败: ${error.message}`);
        console.log(`   错误码: ${error.code}`);
      } else {
        console.log(`   ✅ 表存在且可访问`);
        console.log(`   当前数据条数: ${data.length} 条`);
        
        // 获取表结构信息
        const { data: columns, error: colError } = await supabase
          .rpc('get_table_columns', { table_name: table });
        
        if (!colError && columns) {
          console.log(`   字段: ${columns.map(c => c.column_name).join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`   ❌ 异常: ${e.message}`);
    }
  }
  
  // 测试插入数据
  console.log('\n\n📋 测试插入功能');
  console.log('-'.repeat(50));
  
  // 先获取一个存在的用户和模板
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    
    const { data: template } = await supabase
      .from('tianjin_templates')
      .select('id')
      .limit(1)
      .single();
    
    if (user && template) {
      console.log(`   找到用户: ${user.id.substring(0, 8)}...`);
      console.log(`   找到模板: ${template.id}`);
      
      // 测试插入收藏
      const { error: favError } = await supabase
        .from('template_favorites')
        .insert({
          user_id: user.id,
          template_id: template.id
        })
        .select();
      
      if (favError) {
        if (favError.code === '23505') {
          console.log('   ✅ 收藏表: 唯一约束正常（已存在相同记录）');
        } else {
          console.log(`   ⚠️ 收藏表插入测试: ${favError.message}`);
        }
      } else {
        console.log('   ✅ 收藏表: 插入功能正常');
      }
      
      // 测试插入点赞
      const { error: likeError } = await supabase
        .from('template_likes')
        .insert({
          user_id: user.id,
          template_id: template.id
        })
        .select();
      
      if (likeError) {
        if (likeError.code === '23505') {
          console.log('   ✅ 点赞表: 唯一约束正常（已存在相同记录）');
        } else {
          console.log(`   ⚠️ 点赞表插入测试: ${likeError.message}`);
        }
      } else {
        console.log('   ✅ 点赞表: 插入功能正常');
      }
    } else {
      console.log('   ⚠️ 未找到测试用户或模板');
    }
  } catch (e) {
    console.log(`   ⚠️ 测试插入失败: ${e.message}`);
  }
  
  console.log('\n========================================');
  console.log('验证完成！');
  console.log('========================================');
}

verifyTables();
