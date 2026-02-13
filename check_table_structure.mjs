/**
 * 检查 event_submissions 表的实际结构
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
  console.log('🔍 检查表结构...\n');
  
  try {
    // 获取一条记录来查看结构
    const { data: record, error } = await supabase
      .from('event_submissions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ 查询失败:', error.message);
      return;
    }
    
    if (record && record.length > 0) {
      console.log('📋 event_submissions 表字段:');
      const fields = Object.keys(record[0]);
      fields.forEach(f => console.log(`  - ${f}`));
      
      console.log('\n📊 示例数据:');
      console.log(JSON.stringify(record[0], null, 2));
    }
    
    // 检查当前视图
    console.log('\n📋 检查当前 submission_with_stats 视图...');
    const { data: viewRecord, error: viewError } = await supabase
      .from('submission_with_stats')
      .select('*')
      .limit(1);
    
    if (viewError) {
      console.error('❌ 视图查询失败:', viewError.message);
    } else if (viewRecord && viewRecord.length > 0) {
      console.log('视图字段:');
      const viewFields = Object.keys(viewRecord[0]);
      viewFields.forEach(f => console.log(`  - ${f}`));
      
      console.log('\n视图示例数据:');
      console.log(JSON.stringify(viewRecord[0], null, 2));
    }
    
  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

checkStructure();
