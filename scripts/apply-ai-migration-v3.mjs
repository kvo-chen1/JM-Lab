/**
 * AI助手功能数据库迁移脚本 V3
 * 使用 Supabase 客户端直接创建表
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少 Supabase 配置');
  process.exit(1);
}

console.log('🚀 开始应用 AI 助手数据库迁移...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  console.log('📋 步骤 1: 创建基础表...\n');

  // 1. 创建 ai_conversations 表
  try {
    const { error } = await supabase.from('ai_conversations').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      // 表不存在，需要创建
      console.log('  📝 ai_conversations 表不存在，需要手动创建');
    } else {
      console.log('  ✅ ai_conversations 表已存在');
    }
  } catch (e) {
    console.log('  📝 ai_conversations 表需要创建');
  }

  // 2. 创建 ai_messages 表
  try {
    const { error } = await supabase.from('ai_messages').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      console.log('  📝 ai_messages 表不存在，需要手动创建');
    } else {
      console.log('  ✅ ai_messages 表已存在');
    }
  } catch (e) {
    console.log('  📝 ai_messages 表需要创建');
  }

  // 3. 创建 ai_user_memories 表
  try {
    const { error } = await supabase.from('ai_user_memories').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      console.log('  📝 ai_user_memories 表不存在，需要手动创建');
    } else {
      console.log('  ✅ ai_user_memories 表已存在');
    }
  } catch (e) {
    console.log('  📝 ai_user_memories 表需要创建');
  }

  // 4. 创建 ai_platform_knowledge 表
  try {
    const { error } = await supabase.from('ai_platform_knowledge').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      console.log('  📝 ai_platform_knowledge 表不存在，需要手动创建');
    } else {
      console.log('  ✅ ai_platform_knowledge 表已存在');
    }
  } catch (e) {
    console.log('  📝 ai_platform_knowledge 表需要创建');
  }

  // 5. 创建 ai_user_settings 表
  try {
    const { error } = await supabase.from('ai_user_settings').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      console.log('  📝 ai_user_settings 表不存在，需要手动创建');
    } else {
      console.log('  ✅ ai_user_settings 表已存在');
    }
  } catch (e) {
    console.log('  📝 ai_user_settings 表需要创建');
  }

  console.log('\n📋 步骤 2: 插入平台知识库数据...\n');

  // 插入平台知识库数据
  const knowledgeData = [
    {
      category: 'navigation',
      question: '如何进入创作中心？',
      answer: '您可以通过以下方式进入创作中心：',
      related_pages: ['/create', '/creation-workshop'],
      keywords: ['创作', '开始', '新建', '制作'],
      steps: [
        { step: 1, action: '点击左侧导航栏的创作中心', detail: '或点击首页的「开始创作」按钮' },
        { step: 2, action: '选择创作类型', detail: '图文、视频、设计等' },
        { step: 3, action: '开始您的创作', detail: '使用AI辅助工具或手动创作' }
      ],
      priority: 9
    },
    {
      category: 'navigation',
      question: '津脉广场在哪里？',
      answer: '津脉广场是平台的社区中心，您可以在这里发现热门作品和创作者。',
      related_pages: ['/square'],
      keywords: ['广场', '社区', '发现', '热门'],
      steps: [
        { step: 1, action: '点击左侧导航栏的「津脉广场」', detail: '或访问 /square 路径' },
        { step: 2, action: '浏览推荐内容', detail: '查看热门作品和创作者' },
        { step: 3, action: '互动参与', detail: '点赞、评论、关注感兴趣的内容' }
      ],
      priority: 9
    },
    {
      category: 'operation',
      question: '如何发布作品？',
      answer: '发布作品非常简单，只需几个步骤：',
      related_pages: ['/create', '/my-works'],
      keywords: ['发布', '上传', '分享', '提交'],
      steps: [
        { step: 1, action: '完成创作', detail: '在创作中心完成您的作品' },
        { step: 2, action: '点击「发布」按钮', detail: '位于编辑器右上角' },
        { step: 3, action: '填写作品信息', detail: '标题、描述、标签、封面等' },
        { step: 4, action: '选择发布范围', detail: '公开、仅粉丝或私密' },
        { step: 5, action: '确认发布', detail: '点击「确认发布」即可' }
      ],
      priority: 10
    },
    {
      category: 'operation',
      question: '如何使用AI生成功能？',
      answer: '平台提供强大的AI生成能力，包括文本、图像、视频生成。',
      related_pages: ['/create', '/neo'],
      keywords: ['AI', '生成', '人工智能', '创作'],
      steps: [
        { step: 1, action: '进入创作中心', detail: '点击左侧导航栏的创作中心' },
        { step: 2, action: '选择AI工具', detail: '文本生成、图像生成或视频生成' },
        { step: 3, action: '输入提示词', detail: '描述您想要生成的内容' },
        { step: 4, action: '调整参数', detail: '风格、尺寸、数量等' },
        { step: 5, action: '生成并保存', detail: '等待生成完成后保存到作品' }
      ],
      priority: 10
    },
    {
      category: 'feature',
      question: '文创市集是什么？',
      answer: '文创市集是平台的电商模块，您可以购买或销售文创产品。',
      related_pages: ['/marketplace'],
      keywords: ['市集', '购买', '销售', '文创', '商品'],
      steps: [
        { step: 1, action: '进入文创市集', detail: '点击左侧导航栏的文创市集' },
        { step: 2, action: '浏览商品', detail: '按分类筛选感兴趣的产品' },
        { step: 3, action: '购买或开店', detail: '购买心仪商品或申请成为卖家' }
      ],
      priority: 7
    },
    {
      category: 'guide',
      question: '新手如何快速上手？',
      answer: '欢迎加入津脉智坊！以下是新手指南：',
      related_pages: ['/'],
      keywords: ['新手', '入门', '开始', '教程'],
      steps: [
        { step: 1, action: '完善个人资料', detail: '设置头像、昵称、简介' },
        { step: 2, action: '浏览平台功能', detail: '了解创作中心、广场、市集等模块' },
        { step: 3, action: '尝试AI创作', detail: '使用灵感引擎生成第一个作品' },
        { step: 4, action: '参与社区互动', detail: '关注创作者，点赞评论作品' },
        { step: 5, action: '发布您的作品', detail: '分享给社区，获得反馈' }
      ],
      priority: 10
    },
    {
      category: 'faq',
      question: '忘记密码怎么办？',
      answer: '您可以通过以下方式重置密码：',
      related_pages: ['/settings'],
      keywords: ['密码', '忘记', '重置', '找回'],
      steps: [
        { step: 1, action: '点击登录页面的「忘记密码」', detail: '进入密码重置流程' },
        { step: 2, action: '输入注册邮箱或手机号', detail: '验证您的身份' },
        { step: 3, action: '获取验证码', detail: '通过邮件或短信接收' },
        { step: 4, action: '设置新密码', detail: '设置安全的新密码' }
      ],
      priority: 9
    }
  ];

  // 尝试插入知识库数据
  try {
    const { error } = await supabase.from('ai_platform_knowledge').insert(knowledgeData);
    if (error) {
      if (error.code === '23505') {
        console.log('  ⚠️  知识库数据已存在，跳过插入');
      } else if (error.code === 'PGRST116') {
        console.log('  ❌ ai_platform_knowledge 表不存在，请先创建表');
      } else {
        console.log('  ❌ 插入知识库数据失败:', error.message);
      }
    } else {
      console.log(`  ✅ 成功插入 ${knowledgeData.length} 条知识库数据`);
    }
  } catch (e) {
    console.log('  ❌ 插入知识库数据异常:', e.message);
  }

  console.log('\n📋 步骤 3: 验证表结构...\n');

  // 验证表是否存在
  const tables = ['ai_conversations', 'ai_messages', 'ai_user_memories', 'ai_platform_knowledge', 'ai_user_settings'];
  let existingTables = 0;

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (!error || error.code !== 'PGRST116') {
        console.log(`  ✅ ${table} 表已就绪`);
        existingTables++;
      } else {
        console.log(`  ❌ ${table} 表不存在`);
      }
    } catch (e) {
      console.log(`  ❌ ${table} 表检查失败`);
    }
  }

  console.log(`\n📊 结果: ${existingTables}/${tables.length} 个表已就绪`);

  if (existingTables < tables.length) {
    console.log('\n⚠️  部分表未创建，请手动执行 SQL 迁移文件:');
    console.log('   supabase/migrations/20260219000000_create_ai_assistant_tables.sql');
    console.log('\n💡 您可以通过以下方式执行:');
    console.log('   1. 登录 Supabase Dashboard');
    console.log('   2. 进入 SQL Editor');
    console.log('   3. 粘贴迁移文件内容并执行');
  } else {
    console.log('\n🎉 所有表已就绪！');
  }
}

// 主函数
async function main() {
  // 测试连接
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ 数据库连接失败:', error.message);
      process.exit(1);
    }
    console.log('✅ 数据库连接成功\n');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }

  await createTables();
}

main().catch(console.error);
