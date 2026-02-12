#!/usr/bin/env node
/**
 * 调试节点保存问题
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugNodes() {
  console.log('🔍 调试节点保存问题...\n');

  try {
    // 1. 获取所有脉络
    console.log('1️⃣ 获取所有脉络...');
    const { data: mindmaps, error: mindmapError } = await supabase
      .from('inspiration_mindmaps')
      .select('*')
      .order('created_at', { ascending: false });

    if (mindmapError) {
      console.log('   ❌ 获取脉络失败:', mindmapError.message);
      return;
    }

    console.log(`   ✅ 找到 ${mindmaps?.length || 0} 个脉络`);
    
    if (mindmaps && mindmaps.length > 0) {
      mindmaps.forEach((map, i) => {
        console.log(`   ${i + 1}. ${map.title} (ID: ${map.id})`);
        console.log(`      - 节点数: ${map.stats?.totalNodes || 0}`);
        console.log(`      - 创建时间: ${map.created_at}`);
      });

      // 2. 获取最新脉络的所有节点
      const latestMap = mindmaps[0];
      console.log(`\n2️⃣ 获取最新脉络 "${latestMap.title}" 的节点...`);
      
      const { data: nodes, error: nodesError } = await supabase
        .from('inspiration_nodes')
        .select('*')
        .eq('map_id', latestMap.id);

      if (nodesError) {
        console.log('   ❌ 获取节点失败:', nodesError.message);
      } else {
        console.log(`   ✅ 找到 ${nodes?.length || 0} 个节点`);
        
        if (nodes && nodes.length > 0) {
          nodes.forEach((node, i) => {
            console.log(`   ${i + 1}. ${node.title} (ID: ${node.id})`);
            console.log(`      - 类别: ${node.category}`);
            console.log(`      - 创建时间: ${node.created_at}`);
          });
        } else {
          console.log('   ⚠️ 该脉络没有节点');
        }
      }

      // 3. 检查 RLS 状态
      console.log('\n3️⃣ 检查 RLS 状态...');
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('exec_sql', {
          sql: `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('inspiration_mindmaps', 'inspiration_nodes');`
        });

      if (rlsError) {
        console.log('   ⚠️ 无法检查 RLS:', rlsError.message);
      } else {
        console.log('   RLS 状态:', rlsData);
      }

      // 4. 尝试添加测试节点
      console.log('\n4️⃣ 尝试添加测试节点...');
      const testNode = {
        map_id: latestMap.id,
        title: '调试测试节点',
        description: '这是一个调试用的测试节点',
        category: 'inspiration',
      };

      const { data: newNode, error: insertError } = await supabase
        .from('inspiration_nodes')
        .insert(testNode)
        .select()
        .single();

      if (insertError) {
        console.log('   ❌ 添加节点失败:', insertError.message);
        console.log('   错误详情:', insertError);
      } else {
        console.log('   ✅ 节点添加成功!');
        console.log('   节点 ID:', newNode.id);
        
        // 清理测试节点
        await supabase
          .from('inspiration_nodes')
          .delete()
          .eq('id', newNode.id);
        console.log('   ✅ 测试节点已清理');
      }
    } else {
      console.log('   ⚠️ 没有找到任何脉络');
    }

    console.log('\n✅ 调试完成！');

  } catch (error) {
    console.error('\n❌ 调试失败:', error.message);
  }
}

debugNodes();
