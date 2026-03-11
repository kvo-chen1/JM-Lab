#!/usr/bin/env node
/**
 * 清理测试/模拟作品数据脚本
 * 删除标题为"作品 XX"、纯数字、描述为空或缩略图为空的作品
 *
 * 运行方式:
 *   node scripts/cleanup-test-works.mjs
 *
 * 预览模式（不实际删除）:
 *   node scripts/cleanup-test-works.mjs --preview
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量（使用 .env 文件，与服务器一致）
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

// 检查是否是预览模式
const isPreview = process.argv.includes('--preview');

// 获取数据库连接字符串
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!DATABASE_URL) {
  console.error('错误: 缺少 DATABASE_URL 环境变量');
  console.error('请确保 .env 文件中包含 DATABASE_URL');
  process.exit(1);
}

console.log('数据库配置:');
console.log('  连接:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // 隐藏密码

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanupTestWorks() {
  console.log(isPreview ? '\n=== 预览模式（不会实际删除数据）===' : '\n=== 开始清理测试作品数据 ===');
  console.log(`数据库: Supabase PostgreSQL\n`);

  const client = await pool.connect();

  try {
    // 测试连接
    console.log('正在测试数据库连接...');
    await client.query('SELECT 1');
    console.log('✓ 数据库连接成功\n');

    // 1. 获取删除前的统计
    const countResult = await client.query('SELECT COUNT(*) as count FROM works');
    const totalBefore = parseInt(countResult.rows[0].count);
    console.log(`删除前作品总数: ${totalBefore}`);

    // 2. 查找标题为"作品 XX"格式的作品（模拟数据）
    const zuopinResult = await client.query(`
      SELECT id, title, description, thumbnail, creator_id, created_at, status
      FROM works
      WHERE title LIKE '作品%'
    `);
    const zuopinWorks = zuopinResult.rows;

    console.log(`\n找到 ${zuopinWorks.length} 个标题为"作品 XX"的作品:`);
    zuopinWorks.forEach(w => {
      console.log(`  - ID: ${w.id}, 标题: "${w.title}"`);
    });

    // 3. 查找标题为纯数字的作品
    const numericResult = await client.query(`
      SELECT id, title, description, thumbnail, creator_id, created_at, status
      FROM works
      WHERE title ~ '^[0-9]+$'
    `);
    const numericWorks = numericResult.rows;

    console.log(`\n找到 ${numericWorks.length} 个标题为纯数字的作品:`);
    numericWorks.forEach(w => {
      console.log(`  - ID: ${w.id}, 标题: "${w.title}"`);
    });

    // 4. 查找标题为测试词的作品
    const testTitles = ['cs', 'test', '测试', 'ceshi', 'temp', 'tmp', 'a', 'b', 'c', 'd', 'e'];
    const testResult = await client.query(`
      SELECT id, title, description, thumbnail, creator_id, created_at, status
      FROM works
      WHERE LOWER(title) = ANY($1)
    `, [testTitles]);
    const testWorks = testResult.rows;

    console.log(`\n找到 ${testWorks.length} 个标题为测试词的作品:`);
    testWorks.forEach(w => {
      console.log(`  - ID: ${w.id}, 标题: "${w.title}"`);
    });

    // 5. 查找标题和描述都为空的作品
    const emptyResult = await client.query(`
      SELECT id, title, description, thumbnail, creator_id, created_at, status
      FROM works
      WHERE (title IS NULL OR title = '')
        AND (description IS NULL OR description = '')
    `);
    const emptyWorks = emptyResult.rows;

    console.log(`\n找到 ${emptyWorks.length} 个标题和描述都为空的作品`);

    // 合并所有要删除的作品（去重）
    const allWorksToDelete = [...zuopinWorks, ...numericWorks, ...testWorks, ...emptyWorks];
    const uniqueWorksToDelete = allWorksToDelete.filter((work, index, self) =>
      index === self.findIndex(w => w.id === work.id)
    );

    console.log(`\n========================================`);
    console.log(`总共找到 ${uniqueWorksToDelete.length} 个需要删除的测试作品`);
    console.log(`========================================`);

    if (isPreview) {
      console.log('\n=== 预览结束 ===');
      console.log('提示: 去掉 --preview 参数即可实际执行删除操作');
      
      // 显示统计信息
      const statsResult = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
          COUNT(CASE WHEN thumbnail IS NULL OR thumbnail = '' THEN 1 END) as missing_thumbnail
        FROM works
      `);
      const stats = statsResult.rows[0];
      console.log(`\n当前作品状态统计:`);
      console.log(`  - 总作品数: ${stats.total}`);
      console.log(`  - 已发布: ${stats.published}`);
      console.log(`  - 草稿: ${stats.draft}`);
      console.log(`  - 缺少缩略图: ${stats.missing_thumbnail}`);
      
      return;
    }

    if (uniqueWorksToDelete.length === 0) {
      console.log('\n没有找到需要删除的测试作品');
      return;
    }

    // 执行删除
    console.log('\n开始删除...');
    let deletedCount = 0;

    for (const work of uniqueWorksToDelete) {
      try {
        // 先删除关联数据（忽略不存在的表错误）
        try {
          await client.query('DELETE FROM works_likes WHERE work_id = $1', [work.id]);
        } catch (e) {
          if (!e.message.includes('does not exist')) throw e;
        }
        try {
          await client.query('DELETE FROM works_bookmarks WHERE work_id = $1', [work.id]);
        } catch (e) {
          if (!e.message.includes('does not exist')) throw e;
        }
        try {
          await client.query('DELETE FROM works_comments WHERE work_id = $1', [work.id]);
        } catch (e) {
          if (!e.message.includes('does not exist')) throw e;
        }

        // 删除作品
        await client.query('DELETE FROM works WHERE id = $1', [work.id]);

        console.log(`✓ 已删除: ID=${work.id}, 标题="${work.title}"`);
        deletedCount++;
      } catch (error) {
        console.error(`✗ 删除失败: ID=${work.id}, 错误=${error.message}`);
      }
    }

    // 获取删除后的统计
    const afterResult = await client.query('SELECT COUNT(*) as count FROM works');
    const totalAfter = parseInt(afterResult.rows[0].count);

    console.log(`\n=== 清理完成 ===`);
    console.log(`删除后作品总数: ${totalAfter}`);
    console.log(`共删除: ${totalBefore - totalAfter} 个作品`);

    // 显示当前作品统计
    const statsResult = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN thumbnail IS NULL OR thumbnail = '' THEN 1 END) as missing_thumbnail
      FROM works
    `);

    const stats = statsResult.rows[0];
    console.log(`\n当前作品状态统计:`);
    console.log(`  - 总作品数: ${stats.total}`);
    console.log(`  - 已发布: ${stats.published}`);
    console.log(`  - 草稿: ${stats.draft}`);
    console.log(`  - 缺少缩略图: ${stats.missing_thumbnail}`);

  } catch (error) {
    console.error('\n错误:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行清理
cleanupTestWorks();
