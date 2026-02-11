// 检查URL过期时间
const urls = [
  { title: '流水', expires: 1770820543 },
  { title: '。', expires: 1770730761 },
  { title: '来尝尝天津伯伯亲手做的煎饼', expires: 1770730360 }
];

const now = Math.floor(Date.now() / 1000);

console.log('=== 检查URL过期时间 ===\n');
console.log(`当前时间戳: ${now}`);
console.log(`当前时间: ${new Date().toLocaleString()}`);
console.log('');

urls.forEach(u => {
  const diff = u.expires - now;
  const isExpired = diff < 0;
  const expiryDate = new Date(u.expires * 1000).toLocaleString();
  
  console.log(`${u.title}:`);
  console.log(`  过期时间戳: ${u.expires}`);
  console.log(`  过期日期: ${expiryDate}`);
  console.log(`  剩余时间: ${isExpired ? '已过期 ' + Math.abs(diff) + ' 秒' : diff + ' 秒'}`);
  console.log(`  状态: ${isExpired ? '❌ 已过期' : '✅ 未过期'}`);
  console.log('');
});
