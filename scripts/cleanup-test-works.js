#!/usr/bin/env node
/**
 * 清理测试/模拟作品数据脚本
 * 删除标题为简单数字、描述为空或缩略图为空的作品
 *
 * 运行方式:
 *   node scripts/cleanup-test-works.js
 *
 * 预览模式（不实际删除）:
 *   node scripts/cleanup-test-works.js --preview
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.development' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('错误: 缺少 Supabase 配置');
  console.error('请确保 .env.development 文件中包含 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 检查是否是预览模式
const isPreview = process.argv.includes('--preview');

async function cleanupTestWorks() {
  console.log(isPreview ? '\n=== 预览模式（不会实际删除数据）===' : '\n=== 开始清理测试作品数据 ===');
  console.log(`数据库: ${SUPABASE_URL}\n`);

  try {
    // 1. 获取删除前的统计
    const { count: totalBefore, error: countError } = await supabase
      .from('works')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    console.log(`删除前作品总数: ${totalBefore}`);

    // 2. 查找标题为纯数字的作品
    const { data: numericTitleWorks, error: numericError } = await supabase
      .from('works')
      .select('id, title, description, thumbnail, creator_id, created_at')
      .not('title', 'is', null)
      .filter('title', '~', '^[0-9]+$');  // PostgreSQL regex

    if (numericError) {
      console.log('正则查询失败，尝试备用方案...');
      // 备用：获取所有作品然后过滤
      const { data: allWorks, error: allError } = await supabase
        .from('works')
        .select('id, title, description, thumbnail, creator_id, created_at');

      if (allError) throw allError;

      const numericWorks = allWorks.filter(w => /^[0-9]+$/.test(w.title));
      console.log(`\n找到 ${numericWorks.length} 个标题为纯数字的作品:`);
      numericWorks.forEach(w => {
        console.log(`  - ID: ${w.id}, 标题: "${w.title}", 创建时间: ${w.created_at}`);
      });

      if (!isPreview && numericWorks.length > 0) {
        const idsToDelete = numericWorks.map(w => w.id);
        const { error: deleteError } = await supabase
          .from('works')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;
        console.log(`✓ 已删除 ${idsToDelete.length} 个标题为纯数字的作品`);
      }
    } else {
      console.log(`\n找到 ${numericTitleWorks?.length || 0} 个标题为纯数字的作品:`);
      (numericTitleWorks || []).forEach(w => {
        console.log(`  - ID: ${w.id}, 标题: "${w.title}", 创建时间: ${w.created_at}`);
      });

      if (!isPreview && numericTitleWorks && numericTitleWorks.length > 0) {
        const idsToDelete = numericTitleWorks.map(w => w.id);
        const { error: deleteError } = await supabase
          .from('works')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;
        console.log(`✓ 已删除 ${idsToDelete.length} 个标题为纯数字的作品`);
      }
    }

    // 3. 查找标题为测试词的作品
    const testTitles = ['cs', 'test', '测试', 'ceshi', 'temp', 'tmp'];
    const { data: testWorks, error: testError } = await supabase
      .from('works')
      .select('id, title, description, thumbnail, creator_id, created_at')
      .in('title', testTitles);

    if (testError) throw testError;

    console.log(`\n找到 ${testWorks?.length || 0} 个标题为测试词的作品:`);
    (testWorks || []).forEach(w => {
      console.log(`  - ID: ${w.id}, 标题: "${w.title}"`);
    });

    if (!isPreview && testWorks && testWorks.length > 0) {
      const idsToDelete = testWorks.map(w => w.id);
      const { error: deleteError } = await supabase
        .from('works')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;
      console.log(`✓ 已删除 ${idsToDelete.length} 个标题为测试词的作品`);
    }

    // 4. 查找标题和描述都为空的作品
    const { data: emptyWorks, error: emptyError } = await supabase
      .from('works')
      .select('id, title, description, thumbnail, creator_id, created_at')
      .is('title', null)
      .is('description', null);

    if (emptyError) throw emptyError;

    console.log(`\n找到 ${emptyWorks?.length || 0} 个标题和描述都为空的作品`);

    if (!isPreview && emptyWorks && emptyWorks.length > 0) {
      const idsToDelete = emptyWorks.map(w => w.id);
      const { error: deleteError } = await supabase
        .from('works')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;
      console.log(`✓ 已删除 ${idsToDelete.length} 个标题和描述都为空的作品`);
    }

    // 5. 获取删除后的统计
    if (!isPreview) {
      const { count: totalAfter, error: afterError } = await supabase
        .from('works')
        .select('*', { count: 'exact', head: true });

      if (afterError) throw afterError;
      console.log(`\n=== 清理完成 ===`);
      console.log(`删除后作品总数: ${totalAfter}`);
      console.log(`共删除: ${totalBefore - totalAfter} 个作品`);
    } else {
      console.log(`\n=== 预览结束 ===`);
      console.log('提示: 去掉 --preview 参数即可实际执行删除操作');
    }

    // 6. 显示当前作品统计
    const { data: stats, error: statsError } = await supabase
      .from('works')
      .select('status, thumbnail');

    if (!statsError && stats) {
      const published = stats.filter(w => w.status === 'published').length;
      const draft = stats.filter(w => w.status === 'draft').length;
      const missingThumbnail = stats.filter(w => !w.thumbnail || w.thumbnail === '').length;

      console.log(`\n当前作品状态统计:`);
      console.log(`  - 已发布: ${published}`);
      console.log(`  - 草稿: ${draft}`);
      console.log(`  - 缺少缩略图: ${missingThumbnail}`);
    }

  } catch (error) {
    console.error('\n错误:', error.message);
    process.exit(1);
  }
}

// 运行清理
cleanupTestWorks();
