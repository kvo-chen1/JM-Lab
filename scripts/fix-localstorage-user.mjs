#!/usr/bin/env node
/**
 * 修复 localStorage 中的用户数据
 * 
 * 这个脚本输出一段 JavaScript 代码，可以在浏览器控制台中运行
 * 用于修复 localStorage 中缓存的错误用户名
 */

console.log('==========================================')
console.log('   修复 localStorage 用户数据')
console.log('==========================================\n')

console.log('请在浏览器控制台中运行以下代码：\n')
console.log('```javascript')
console.log('// 获取当前存储的用户数据')
console.log("const userStr = localStorage.getItem('user');")
console.log('if (userStr) {')
console.log('  const user = JSON.parse(userStr);')
console.log('  console.log("当前用户名:", user.username);')
console.log('  console.log("当前用户ID:", user.id);')
console.log('  ')
console.log('  // 如果用户名是 kvo7，但应该是 kvo1，则修复它')
console.log('  if (user.username === "kvo7" && user.id === "f3dedf79-5c5e-40fd-9513-d0fb0995d429") {')
console.log('    user.username = "kvo1";')
console.log("    localStorage.setItem('user', JSON.stringify(user));")
console.log('    console.log("✅ 用户名已修复为 kvo1");')
console.log('    location.reload(); // 刷新页面')
console.log('  } else {')
console.log('    console.log("用户名正确，无需修复");')
console.log('  }')
console.log('} else {')
console.log('  console.log("未找到用户数据");')
console.log('}')
console.log('```\n')

console.log('或者，直接清除 localStorage 并重新登录：\n')
console.log('```javascript')
console.log('localStorage.clear();')
console.log('location.reload();')
console.log('```')
