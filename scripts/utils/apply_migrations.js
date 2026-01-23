#!/usr/bin/env node

/**
 * 迁移应用脚本
 * 用于将本地迁移文件部署到Supabase数据库
 * 
 * 使用说明：
 * 1. 确保已安装Supabase CLI
 * 2. 确保已登录Supabase：supabase login
 * 3. 确保已链接项目：supabase link --project-ref <your-project-ref>
 * 4. 运行此脚本：node apply_migrations.js
 */

import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { resolve } from 'path';

try {
  console.log('=== Supabase迁移部署脚本 ===\n');

  // 1. 检查Supabase CLI是否已安装
  console.log('1. 检查Supabase CLI安装情况...');
  try {
    execSync('supabase --version', { stdio: 'ignore' });
    console.log('✓ Supabase CLI已安装');
  } catch (error) {
    console.error('✗ Supabase CLI未安装，请先安装：https://github.com/supabase/cli#install-the-cli');
    process.exit(1);
  }

  // 2. 检查当前目录是否为Supabase项目
  const supabaseDir = resolve(process.cwd(), 'supabase');
  try {
    readdirSync(supabaseDir);
    console.log('✓ 当前目录包含supabase文件夹，是Supabase项目');
  } catch (error) {
    console.error('✗ 当前目录不是Supabase项目，请在项目根目录运行此脚本');
    process.exit(1);
  }

  // 3. 列出本地迁移文件
  const migrationsDir = resolve(supabaseDir, 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`\n2. 本地迁移文件（共${migrationFiles.length}个）：`);
  migrationFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });

  // 4. 检查项目链接状态
  console.log('\n3. 检查项目链接状态...');
  try {
    const linkStatus = execSync('supabase status', { encoding: 'utf-8' });
    console.log('✓ 项目已链接');
    console.log(linkStatus);
  } catch (error) {
    console.error('✗ 项目未链接，请先链接项目：');
    console.error('  supabase link --project-ref <your-project-ref>');
    console.error('  或使用环境变量：SUPABASE_ACCESS_TOKEN=<token> supabase link --project-ref <ref>');
    process.exit(1);
  }

  // 5. 应用迁移
  console.log('\n4. 开始应用迁移到线上数据库...');
  try {
    const migrateOutput = execSync('supabase db push', { encoding: 'utf-8' });
    console.log('✓ 迁移应用成功！');
    console.log(migrateOutput);
  } catch (error) {
    console.error('✗ 迁移应用失败：');
    console.error(error.stdout?.toString() || error.message);
    process.exit(1);
  }

  // 6. 验证迁移状态
  console.log('\n5. 验证迁移状态...');
  try {
    const migrateList = execSync('supabase migration list', { encoding: 'utf-8' });
    console.log('✓ 迁移状态验证成功！');
    console.log(migrateList);
  } catch (error) {
    console.error('✗ 迁移状态验证失败：');
    console.error(error.stdout?.toString() || error.message);
  }

  console.log('\n=== 迁移部署完成 ===');
  console.log('\n下一步建议：');
  console.log('1. 登录Supabase Studio检查数据库状态');
  console.log('2. 运行应用测试确保功能正常');
  console.log('3. 监控数据库性能和日志');

} catch (error) {
  console.error('\n❌ 脚本执行出错：', error.message);
  process.exit(1);
}
