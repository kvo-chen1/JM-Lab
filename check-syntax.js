import fs from 'fs';
import vm from 'vm';

// 读取文件内容
const content = fs.readFileSync('src/contexts/authContext.tsx', 'utf8');

// 尝试解析文件内容
try {
  // 移除 TypeScript 类型注解、导入语句和导出语句，只保留 JavaScript 语法
  const jsContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
    .replace(/\/\/.*$/gm, '') // 移除单行注释
    .replace(/^import.*$/gm, '') // 移除导入语句
    .replace(/^export.*$/gm, '') // 移除导出语句
    .replace(/:\s*[A-Z][a-zA-Z0-9<>\[\]|]+/g, '') // 移除类型注解
    .replace(/\?\s*:/g, ':') // 移除可选属性标记
    .replace(/\[\s*\]/g, '') // 移除数组类型标记
    .replace(/\b(interface|type|enum|namespace|module)\b[\s\S]*?\{[\s\S]*?\}/g, '') // 移除接口和类型定义
    .replace(/\b(async)\s+\(/g, '(') // 移除 async 关键字
    .replace(/\bPromise<[^>]+>/g, 'Promise') // 移除 Promise 类型
    .replace(/\bArray<[^>]+>/g, 'Array') // 移除 Array 类型
    .replace(/\bany\b/g, '') // 移除 any 类型
    .replace(/\bconst\b/g, 'var') // 将 const 替换为 var
    .replace(/\blet\b/g, 'var'); // 将 let 替换为 var

  // 尝试执行代码
  const context = vm.createContext({});
  vm.runInContext(jsContent, context);
  console.log('文件语法正确！');
} catch (error) {
  console.error('语法错误:', error.message);
  console.error('错误位置:', error.stack);
}
