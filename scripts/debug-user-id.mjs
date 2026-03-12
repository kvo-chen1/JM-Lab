/**
 * 调试用户ID
 */

// 模拟浏览器环境获取 localStorage
const fs = require('fs');
const path = require('path');

// 读取 localStorage 文件（如果在 Node 环境中模拟）
console.log('🔍 调试用户ID获取...\n');

// 检查常见的用户ID存储方式
console.log('检查 localStorage 中的 user 项:');
console.log('在浏览器控制台运行以下命令查看:');
console.log('  localStorage.getItem("user")');
console.log('  JSON.parse(localStorage.getItem("user"))?.id');
console.log('');
console.log('检查 supabase 用户:');
console.log('  await supabase.auth.getUser()');
