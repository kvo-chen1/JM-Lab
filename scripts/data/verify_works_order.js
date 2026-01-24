import { mockWorks } from './src/mock/works.js';

// 检查前20个作品的id，应该从1开始递增
console.log('前20个作品的ID：');
mockWorks.slice(0, 20).forEach((work, index) => {
  console.log(`${index + 1}. ID: ${work.id}, 标题: ${work.title}`);
});

// 检查最后20个作品的id，应该是较大的数字
console.log('\n最后20个作品的ID：');
mockWorks.slice(-20).forEach((work, index) => {
  console.log(`${mockWorks.length - 20 + index + 1}. ID: ${work.id}, 标题: ${work.title}`);
});

// 检查总长度
console.log(`\n作品总数: ${mockWorks.length}`);
