// 注意：此脚本已禁用，系统现在使用真实数据API
// 为商业化部署，所有模拟数据生成功能已移除

console.warn('generate_static_works: 模拟数据生成已禁用，系统现在使用真实数据API');
console.warn('如需生成真实数据，请使用数据库迁移脚本或管理后台功能');

// 保留空的主函数以避免导入错误
async function main() {
  console.warn('模拟数据生成已禁用');
  return Promise.resolve();
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
