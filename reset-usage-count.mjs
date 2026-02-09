// 重置所有模板的 usage_count 为 0
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
console.log('重置模板使用次数');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function resetUsageCount() {
  // 先查看当前数据
  console.log('📊 当前使用次数:');
  const { data: before, error: beforeError } = await supabase
    .from('tianjin_templates')
    .select('id, name, usage_count')
    .order('id');
  
  if (beforeError) {
    console.log('❌ 查询失败:', beforeError.message);
    return;
  }
  
  before.forEach(t => {
    console.log(`   ${t.name}: ${t.usage_count}`);
  });
  
  const totalBefore = before.reduce((sum, t) => sum + t.usage_count, 0);
  console.log(`\n   总使用次数: ${totalBefore}`);
  
  // 重置为 0
  console.log('\n🔄 重置所有 usage_count 为 0...');
  const { error: updateError } = await supabase
    .from('tianjin_templates')
    .update({ usage_count: 0 })
    .neq('id', 0); // 更新所有记录
  
  if (updateError) {
    console.log('❌ 重置失败:', updateError.message);
    return;
  }
  
  console.log('✅ 重置成功');
  
  // 验证重置结果
  console.log('\n📊 重置后使用次数:');
  const { data: after, error: afterError } = await supabase
    .from('tianjin_templates')
    .select('id, name, usage_count')
    .order('id');
  
  if (afterError) {
    console.log('❌ 查询失败:', afterError.message);
    return;
  }
  
  after.forEach(t => {
    console.log(`   ${t.name}: ${t.usage_count}`);
  });
  
  const totalAfter = after.reduce((sum, t) => sum + t.usage_count, 0);
  console.log(`\n   总使用次数: ${totalAfter}`);
  
  console.log('\n========================================');
  console.log('重置完成！');
  console.log('========================================');
}

resetUsageCount();
