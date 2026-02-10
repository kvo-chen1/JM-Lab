#!/usr/bin/env node
/**
 * 修复 points_leaderboard 视图
 * 添加缺失的 username, avatar_url, total_earned 字段
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ 错误: 未设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.log('请确保 .env.local 或 .env 文件中包含 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const fixedViewSQL = `
-- 修复积分排行榜视图
DROP VIEW IF EXISTS public.points_leaderboard;

CREATE OR REPLACE VIEW public.points_leaderboard AS
SELECT 
    upb.user_id,
    u.username,
    u.avatar_url,
    upb.balance,
    upb.total_earned,
    RANK() OVER (ORDER BY upb.balance DESC) as rank
FROM public.user_points_balance upb
JOIN public.users u ON upb.user_id = u.id
WHERE upb.balance > 0
ORDER BY upb.balance DESC;

-- 授予权限
GRANT SELECT ON public.points_leaderboard TO anon;
GRANT SELECT ON public.points_leaderboard TO authenticated;
GRANT SELECT ON public.points_leaderboard TO service_role;
`;

async function fixView() {
  console.log('🔧 开始修复 points_leaderboard 视图...\n');

  try {
    // 执行修复 SQL
    const { error } = await supabase.rpc('exec_sql', { sql: fixedViewSQL });
    
    if (error) {
      console.log('⚠️  通过 RPC 执行失败，尝试直接查询...');
      
      // 如果 RPC 不存在，尝试直接执行
      const { error: directError } = await supabase.from('_temp').select('*').limit(1);
      
      // 直接执行 SQL（需要服务角色权限）
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          query: fixedViewSQL
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    }

    // 验证修复结果
    console.log('✅ 视图修复成功，验证数据...\n');
    
    const { data, error: verifyError } = await supabase
      .from('points_leaderboard')
      .select('*')
      .limit(5);

    if (verifyError) {
      throw verifyError;
    }

    console.log('📊 排行榜数据（前5条）:');
    console.table(data);

    // 检查字段完整性
    if (data && data.length > 0) {
      const firstRecord = data[0];
      const hasUsername = 'username' in firstRecord;
      const hasAvatarUrl = 'avatar_url' in firstRecord;
      const hasTotalEarned = 'total_earned' in firstRecord;

      console.log('\n📋 字段检查:');
      console.log(`  username: ${hasUsername ? '✅' : '❌'}`);
      console.log(`  avatar_url: ${hasAvatarUrl ? '✅' : '❌'}`);
      console.log(`  total_earned: ${hasTotalEarned ? '✅' : '❌'}`);

      if (hasUsername && hasAvatarUrl && hasTotalEarned) {
        console.log('\n🎉 视图修复成功！所有字段都已正确添加。');
      } else {
        console.log('\n⚠️  视图可能仍有问题，请手动检查。');
      }
    } else {
      console.log('\nℹ️  暂无排行榜数据（可能积分表为空）');
    }

  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    console.log('\n💡 请手动执行以下 SQL:');
    console.log(fixedViewSQL);
    process.exit(1);
  }
}

fixView();
