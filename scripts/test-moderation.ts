/**
 * 测试内容审核功能
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 测试用例
const testCases = [
  {
    name: '正常内容',
    title: '美丽的山水画作品',
    description: '这是一幅描绘春日山水的国画作品，展现了大自然的美丽风光。',
    shouldPass: true
  },
  {
    name: '包含违禁词-暴力',
    title: '暴力美学作品',
    description: '这个作品展现了暴力美学的设计理念。',
    shouldPass: false
  },
  {
    name: '包含违禁词-色情',
    title: '艺术作品',
    description: '这是一幅描绘人体的色情艺术作品。',
    shouldPass: false
  },
  {
    name: '垃圾内容-重复字符',
    title: '啊啊啊啊啊',
    description: '啊啊啊啊啊啊啊啊啊啊啊啊啊',
    shouldPass: false
  },
  {
    name: '文化相关-正面',
    title: '京剧脸谱设计',
    description: '这是基于中国传统京剧脸谱元素创作的现代设计作品，融合了传统文化与现代美学。',
    shouldPass: true
  }
];

async function testModeration() {
  console.log('🧪 开始测试内容审核功能...\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 测试: ${testCase.name}`);
    console.log(`   标题: ${testCase.title}`);
    console.log(`   描述: ${testCase.description.substring(0, 50)}...`);
    console.log(`   期望: ${testCase.shouldPass ? '通过' : '拒绝'}`);

    try {
      const { data, error } = await supabaseAdmin
        .rpc('moderate_content', {
          p_content_id: crypto.randomUUID(),
          p_content_type: 'work',
          p_title: testCase.title,
          p_description: testCase.description,
          p_user_id: null
        });

      if (error) {
        console.error(`   ❌ RPC调用失败:`, error);
        failed++;
        continue;
      }

      const result = data[0];
      const actuallyPassed = result.approved;
      const expectedPass = testCase.shouldPass;

      console.log(`   结果: ${actuallyPassed ? '✅ 通过' : '❌ 拒绝'}`);
      console.log(`   原因: ${result.reason || '无'}`);
      console.log(`   评分:`, result.scores);
      console.log(`   匹配词: ${result.matched_words?.join(', ') || '无'}`);

      if (actuallyPassed === expectedPass) {
        console.log(`   ✅ 测试通过`);
        passed++;
      } else {
        console.log(`   ❌ 测试失败 - 期望${expectedPass ? '通过' : '拒绝'}，实际${actuallyPassed ? '通过' : '拒绝'}`);
        failed++;
      }
    } catch (err) {
      console.error(`   ❌ 测试异常:`, err);
      failed++;
    }
  }

  console.log('\n========================================');
  console.log('🎉 测试完成！');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 成功率: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('========================================');
}

// 检查数据库表是否存在
async function checkTables() {
  console.log('🔍 检查数据库表...\n');

  const tables = ['forbidden_words', 'moderation_rules', 'moderation_logs'];

  for (const table of tables) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('count')
      .limit(1);

    if (error) {
      console.error(`❌ 表 ${table} 不存在或无法访问:`, error.message);
    } else {
      console.log(`✅ 表 ${table} 正常`);
    }
  }

  console.log('');
}

// 主函数
async function main() {
  await checkTables();
  await testModeration();
}

main().catch(console.error);
