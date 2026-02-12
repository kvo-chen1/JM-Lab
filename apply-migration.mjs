#!/usr/bin/env node
/**
 * 应用数据库迁移
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 应用数据库迁移...\n');

  try {
    // 读取迁移文件
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260220000003_add_last_active_to_community_members.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('迁移文件内容:');
    console.log(migrationSql);
    console.log('\n---\n');

    // 执行迁移
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });

    if (error) {
      console.error('❌ 迁移失败:', error.message);
      
      // 尝试直接执行
      console.log('\n尝试直接执行...');
      
      // 检查字段是否存在
      const { data: columns, error: checkError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'community_members')
        .eq('column_name', 'last_active');
      
      if (checkError) {
        console.error('检查字段失败:', checkError.message);
        return;
      }
      
      if (columns && columns.length > 0) {
        console.log('✅ last_active 字段已存在');
      } else {
        console.log('⚠️ last_active 字段不存在，需要手动添加');
        console.log('请在 Supabase Dashboard 中执行以下 SQL:');
        console.log('\n' + migrationSql);
      }
    } else {
      console.log('✅ 迁移成功！');
    }

    // 验证字段是否存在
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('*')
      .limit(1);

    if (membersError) {
      console.error('验证失败:', membersError.message);
    } else if (members && members.length > 0) {
      console.log('\n验证字段:');
      console.log('字段列表:', Object.keys(members[0]).join(', '));
      if (members[0].last_active !== undefined) {
        console.log('✅ last_active 字段存在');
      } else {
        console.log('❌ last_active 字段不存在');
      }
    }

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
  }
}

applyMigration();
