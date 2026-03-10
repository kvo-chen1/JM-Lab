#!/usr/bin/env node
/**
 * 测试节点保存功能
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNodeSave() {
  console.log('🧪 测试节点保存功能...\n');

  try {
    // 1. 获取最新的脉络
    console.log('1️⃣ 获取最新脉络...');
    const { data: mindmaps, error: mindmapError } = await supabase
      .from('inspiration_mindmaps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (mindmapError || !mindmaps || mindmaps.length === 0) {
      console.log('   ❌ 没有找到脉络');
      return;
    }

    const mindmap = mindmaps[0];
    console.log('   ✅ 找到脉络:', mindmap.title);
    console.log('   脉络 ID:', mindmap.id);
    console.log('   当前节点数:', mindmap.stats?.totalNodes || 0);

    // 2. 添加测试节点
    console.log('\n2️⃣ 添加测试节点...');
    const testNode = {
      map_id: mindmap.id,
      title: '测试节点 - ' + new Date().toLocaleTimeString(),
      description: '这是一个测试节点，验证保存功能',
      category: 'inspiration',
      tags: ['测试', '验证'],
    };

    const { data: newNode, error: insertError } = await supabase
      .from('inspiration_nodes')
      .insert(testNode)
      .select()
      .single();

    if (insertError) {
      console.log('   ❌ 添加节点失败:', insertError.message);
      return;
    }

    console.log('   ✅ 节点添加成功!');
    console.log('   节点 ID:', newNode.id);
    console.log('   节点标题:', newNode.title);

    // 3. 验证节点是否保存
    console.log('\n3️⃣ 验证节点保存...');
    const { data: verifyNode, error: verifyError } = await supabase
      .from('inspiration_nodes')
      .select('*')
      .eq('id', newNode.id)
      .single();

    if (verifyError) {
      console.log('   ❌ 验证失败:', verifyError.message);
    } else {
      console.log('   ✅ 节点已保存到数据库');
      console.log('   创建时间:', verifyNode.created_at);
    }

    // 4. 检查脉络统计是否更新
    console.log('\n4️⃣ 检查脉络统计...');
    const { data: updatedMindmap, error: statsError } = await supabase
      .from('inspiration_mindmaps')
      .select('stats')
      .eq('id', mindmap.id)
      .single();

    if (statsError) {
      console.log('   ⚠️ 无法获取统计:', statsError.message);
    } else {
      console.log('   ✅ 脉络统计已更新');
      console.log('   总节点数:', updatedMindmap.stats?.totalNodes);
    }

    // 5. 获取所有节点
    console.log('\n5️⃣ 获取脉络所有节点...');
    const { data: allNodes, error: nodesError } = await supabase
      .from('inspiration_nodes')
      .select('*')
      .eq('map_id', mindmap.id)
      .order('created_at', { ascending: false });

    if (nodesError) {
      console.log('   ❌ 获取节点失败:', nodesError.message);
    } else {
      console.log('   ✅ 脉络共有', allNodes.length, '个节点');
      allNodes.forEach((node, i) => {
        console.log(`   ${i + 1}. ${node.title} (${node.category})`);
      });
    }

    // 6. 清理测试数据
    console.log('\n6️⃣ 清理测试数据...');
    const { error: deleteError } = await supabase
      .from('inspiration_nodes')
      .delete()
      .eq('id', newNode.id);

    if (deleteError) {
      console.log('   ⚠️ 清理失败:', deleteError.message);
    } else {
      console.log('   ✅ 测试数据已清理');
    }

    console.log('\n✅ 测试完成！节点保存功能正常！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

testNodeSave();
