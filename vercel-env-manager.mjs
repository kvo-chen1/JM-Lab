#!/usr/bin/env node
/**
 * Vercel 环境变量管理脚本
 * 用于检查和修复 Vercel 项目的环境变量
 */

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const PROJECT_ID = 'prj_8NtaMGWvSP2vifnHYLLjGrEYi1ZF';

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function checkVercelAuth() {
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

async function listEnvVars() {
  try {
    console.log('📋 正在获取环境变量列表...\n');
    const result = execSync('vercel env ls', { encoding: 'utf-8', cwd: 'C:\\git-repo' });
    console.log(result);
  } catch (error) {
    console.error('❌ 获取环境变量失败:', error.message);
    if (error.message.includes('token is not valid')) {
      console.log('\n💡 请先运行: vercel login');
    }
  }
}

async function removeEnvVar(name) {
  try {
    console.log(`🗑️  正在删除环境变量: ${name}...`);
    execSync(`vercel env rm ${name} production -y`, { stdio: 'inherit', cwd: 'C:\\git-repo' });
    console.log(`✅ 已删除 ${name}`);
  } catch (error) {
    console.error(`❌ 删除 ${name} 失败:`, error.message);
  }
}

async function addEnvVar(name, value) {
  try {
    console.log(`➕ 正在添加环境变量: ${name}...`);
    execSync(`echo "${value}" | vercel env add ${name} production`, { stdio: 'inherit', cwd: 'C:\\git-repo' });
    console.log(`✅ 已添加 ${name}`);
  } catch (error) {
    console.error(`❌ 添加 ${name} 失败:`, error.message);
  }
}

async function main() {
  console.log('🚀 Vercel 环境变量管理工具\n');
  console.log('项目ID:', PROJECT_ID);
  console.log('');

  // 检查是否已登录
  const isAuthenticated = await checkVercelAuth();
  if (!isAuthenticated) {
    console.log('⚠️  你尚未登录 Vercel CLI');
    console.log('请运行以下命令登录:');
    console.log('  vercel login\n');
    rl.close();
    return;
  }

  console.log('✅ 已登录 Vercel CLI\n');

  // 显示菜单
  console.log('请选择操作:');
  console.log('1. 查看当前环境变量');
  console.log('2. 删除错误的 DATABASE_URL');
  console.log('3. 添加正确的 DATABASE_URL (使用 Pooler 连接)');
  console.log('4. 一键修复所有数据库环境变量');
  console.log('5. 重新部署项目');
  console.log('0. 退出\n');

  const choice = await question('输入选项 (0-5): ');

  switch (choice.trim()) {
    case '1':
      await listEnvVars();
      break;

    case '2':
      await removeEnvVar('DATABASE_URL');
      break;

    case '3':
      const dbUrl = 'postgres://postgres.kizgwtrrsmkjeiddotup:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';
      await addEnvVar('DATABASE_URL', dbUrl);
      break;

    case '4':
      console.log('🔧 开始修复环境变量...\n');
      await removeEnvVar('DATABASE_URL');
      console.log('');
      const correctUrl = 'postgres://postgres.kizgwtrrsmkjeiddotup:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';
      await addEnvVar('DATABASE_URL', correctUrl);
      console.log('\n✅ 环境变量修复完成！');
      console.log('请重新部署项目以应用更改。');
      break;

    case '5':
      try {
        console.log('🚀 正在重新部署...');
        execSync('vercel --prod', { stdio: 'inherit', cwd: 'C:\\git-repo' });
      } catch (error) {
        console.error('❌ 部署失败:', error.message);
      }
      break;

    case '0':
      console.log('👋 再见！');
      break;

    default:
      console.log('❌ 无效选项');
  }

  rl.close();
}

main().catch(console.error);
