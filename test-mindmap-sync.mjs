// 测试创作脉络同步功能
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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
const SUPABASE_ANON_KEY = envConfig.VITE_SUPABASE_ANON_KEY;

console.log('========================================');
console.log('创作脉络同步测试');
console.log('========================================\n');

// 创建 Supabase 客户端（使用 anon key，模拟前端）
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testMindMapSync() {
  console.log('🔍 开始测试...\n');

  // 1. 检查表是否存在
  console.log('1️⃣ 检查津脉脉络相关表是否存在...');
  try {
    const { data: mindmaps, error: mindmapError } = await supabase
      .from('inspiration_mindmaps')
      .select('count', { count: 'exact', head: true });
    
    if (mindmapError) {
      console.log('   ❌ inspiration_mindmaps 表查询失败:', mindmapError.message);
    } else {
      console.log('   ✅ inspiration_mindmaps 表存在');
    }

    const { data: nodes, error: nodeError } = await supabase
      .from('inspiration_nodes')
      .select('count', { count: 'exact', head: true });
    
    if (nodeError) {
      console.log('   ❌ inspiration_nodes 表查询失败:', nodeError.message);
    } else {
      console.log('   ✅ inspiration_nodes 表存在');
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 2. 获取当前用户
  console.log('\n2️⃣ 获取当前登录用户...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('   ❌ 未登录或获取用户失败:', userError?.message || '无用户');
    console.log('   ⚠️  请确保在浏览器中已登录，或使用正确的认证方式');
    return;
  }
  
  console.log('   ✅ 当前用户:', user.id);
  console.log('   邮箱:', user.email);

  // 3. 检查用户的脉络
  console.log('\n3️⃣ 检查用户的创作脉络...');
  try {
    const { data: mindMaps, error: mindMapError } = await supabase
      .from('inspiration_mindmaps')
      .select('*')
      .eq('user_id', user.id);
    
    if (mindMapError) {
      console.log('   ❌ 查询脉络失败:', mindMapError.message);
    } else if (!mindMaps || mindMaps.length === 0) {
      console.log('   ⚠️  用户没有创作脉络');
    } else {
      console.log('   ✅ 找到', mindMaps.length, '个创作脉络:');
      mindMaps.forEach(m => {
        console.log(`      - ${m.title} (ID: ${m.id})`);
      });
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 4. 检查脉络节点
  console.log('\n4️⃣ 检查脉络节点...');
  try {
    const { data: mindMaps } = await supabase
      .from('inspiration_mindmaps')
      .select('id, title')
      .eq('user_id', user.id);
    
    if (mindMaps && mindMaps.length > 0) {
      for (const map of mindMaps) {
        const { data: nodes, error: nodeError } = await supabase
          .from('inspiration_nodes')
          .select('*')
          .eq('map_id', map.id);
        
        if (nodeError) {
          console.log(`   ❌ 查询节点失败 (${map.title}):`, nodeError.message);
        } else {
          console.log(`   ✅ ${map.title}: ${nodes?.length || 0} 个节点`);
          if (nodes && nodes.length > 0) {
            nodes.slice(0, 3).forEach(n => {
              console.log(`      - ${n.title} (${n.category})`);
            });
            if (nodes.length > 3) {
              console.log(`      ... 还有 ${nodes.length - 3} 个节点`);
            }
          }
        }
      }
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 5. 尝试创建测试脉络
  console.log('\n5️⃣ 尝试创建测试脉络...');
  try {
    const { data: newMap, error: createError } = await supabase
      .from('inspiration_mindmaps')
      .insert({
        user_id: user.id,
        title: '测试脉络-' + Date.now(),
        description: '自动创建的测试脉络',
        layout_type: 'tree',
        settings: {
          layoutType: 'tree',
          theme: 'tianjin',
          autoSave: true,
          showGrid: true,
          snapToGrid: false,
          gridSize: 20,
        },
        stats: {
          totalNodes: 0,
          maxDepth: 0,
          aiGeneratedNodes: 0,
          cultureNodes: 0,
          lastActivityAt: Date.now(),
        },
        tags: [],
        is_public: false,
      })
      .select()
      .single();
    
    if (createError) {
      console.log('   ❌ 创建脉络失败:', createError.message);
      console.log('   错误码:', createError.code);
    } else {
      console.log('   ✅ 测试脉络创建成功:', newMap.id);
      
      // 尝试添加测试节点
      console.log('\n6️⃣ 尝试添加测试节点...');
      const { data: newNode, error: nodeError } = await supabase
        .from('inspiration_nodes')
        .insert({
          map_id: newMap.id,
          title: '测试节点',
          description: '自动创建的测试节点',
          category: 'ai_generate',
          content: {
            type: 'image',
            thumbnail: 'https://example.com/test.jpg',
            prompt: '测试提示词',
          },
          tags: ['测试'],
          version: 1,
          history: [{
            version: 1,
            timestamp: new Date().toISOString(),
            action: 'create',
            changes: ['创建节点'],
          }],
        })
        .select()
        .single();
      
      if (nodeError) {
        console.log('   ❌ 添加节点失败:', nodeError.message);
        console.log('   错误码:', nodeError.code);
      } else {
        console.log('   ✅ 测试节点添加成功:', newNode.id);
      }
      
      // 清理测试数据
      console.log('\n7️⃣ 清理测试数据...');
      const { error: deleteError } = await supabase
        .from('inspiration_mindmaps')
        .delete()
        .eq('id', newMap.id);
      
      if (deleteError) {
        console.log('   ⚠️  清理测试数据失败:', deleteError.message);
      } else {
        console.log('   ✅ 测试数据已清理');
      }
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

testMindMapSync();
