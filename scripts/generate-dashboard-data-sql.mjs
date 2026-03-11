/**
 * 生成控制台图表测试数据的SQL文件
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTimestampForDayAndHour(dayOfWeek, hour, daysAgo = 14) {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  const currentDay = date.getDay();
  const diff = dayOfWeek - currentDay;
  date.setDate(date.getDate() + diff);
  date.setHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return date.getTime();
}

function generateUserSessionsSQL(userIds) {
  const sql = [];
  sql.push('-- 用户会话数据（用于用户活跃度热力图）');
  sql.push('DELETE FROM user_sessions WHERE created_at > ' + (Date.now() - 30 * 24 * 60 * 60 * 1000) + ';');
  sql.push('');
  
  const weekDays = [0, 1, 2, 3, 4, 5, 6];
  let count = 0;
  
  for (const dayOfWeek of weekDays) {
    for (let hour = 0; hour < 24; hour++) {
      let activityLevel = 0;
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (hour >= 9 && hour <= 12) activityLevel = randomInt(5, 15);
        else if (hour >= 14 && hour <= 18) activityLevel = randomInt(8, 20);
        else if (hour >= 20 && hour <= 23) activityLevel = randomInt(10, 25);
        else if (hour >= 0 && hour <= 6) activityLevel = randomInt(0, 3);
        else activityLevel = randomInt(2, 8);
      } else {
        if (hour >= 10 && hour <= 12) activityLevel = randomInt(8, 18);
        else if (hour >= 14 && hour <= 17) activityLevel = randomInt(10, 22);
        else if (hour >= 19 && hour <= 23) activityLevel = randomInt(15, 30);
        else if (hour >= 0 && hour <= 7) activityLevel = randomInt(1, 5);
        else activityLevel = randomInt(3, 10);
      }
      
      for (let i = 0; i < activityLevel; i++) {
        const userId = userIds.length > 0 ? userIds[randomInt(0, userIds.length - 1)] : 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';
        const sessionStart = getTimestampForDayAndHour(dayOfWeek, hour, 14);
        const lastActive = sessionStart + randomInt(5, 120) * 60 * 1000;
        const sessionToken = `token-${Date.now()}-${randomInt(1000, 9999)}-${i}`;
        
        sql.push(`INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, last_active, created_at) VALUES ('${userId}', '${sessionToken}', '192.168.${randomInt(1, 255)}.${randomInt(1, 255)}', 'Mozilla/5.0', ${lastActive}, ${sessionStart});`);
        count++;
      }
    }
  }
  
  console.log(`生成了 ${count} 条用户会话数据`);
  return sql.join('\n');
}

function generateMembershipOrdersSQL(userIds) {
  const sql = [];
  sql.push('-- 会员订单数据（用于营收预测图表）');
  sql.push("DELETE FROM membership_orders WHERE id LIKE 'ORD-TEST-%';");
  sql.push('');
  
  const membershipPlans = [
    { plan: 'basic', planName: '基础会员', period: 'monthly', amount: 29 },
    { plan: 'premium', planName: '高级会员', period: 'monthly', amount: 99 },
    { plan: 'vip', planName: 'VIP会员', period: 'monthly', amount: 199 },
    { plan: 'premium', planName: '高级会员', period: 'yearly', amount: 999 },
  ];
  
  const today = new Date();
  let count = 0;
  let totalRevenue = 0;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseOrders = isWeekend ? randomInt(8, 20) : randomInt(3, 12);
    const promotionBoost = Math.random() > 0.8 ? randomInt(5, 15) : 0;
    const dailyOrders = baseOrders + promotionBoost;
    
    for (let j = 0; j < dailyOrders; j++) {
      const plan = membershipPlans[randomInt(0, membershipPlans.length - 1)];
      const userId = userIds.length > 0 ? userIds[randomInt(0, userIds.length - 1)] : 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';
      
      const orderDate = new Date(date);
      orderDate.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
      
      const orderId = `ORD-TEST-${Date.now()}-${i}-${j}`;
      const createdAt = orderDate.toISOString();
      const expiresAt = new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const paymentMethod = ['wechat', 'alipay'][randomInt(0, 1)];
      
      sql.push(`INSERT INTO membership_orders (id, user_id, plan, plan_name, period, amount, currency, status, payment_method, created_at, paid_at, expires_at, payment_type) VALUES ('${orderId}', '${userId}', '${plan.plan}', '${plan.planName}', '${plan.period}', ${plan.amount}, 'CNY', 'completed', '${paymentMethod}', '${createdAt}', '${createdAt}', '${expiresAt}', 'personal_qr');`);
      count++;
      totalRevenue += plan.amount;
    }
  }
  
  console.log(`生成了 ${count} 条订单数据，总营收: ¥${totalRevenue.toLocaleString()}`);
  return sql.join('\n');
}

// 主函数
console.log('🚀 正在生成测试数据SQL文件...\n');

// 使用一些示例用户ID（实际使用时可以替换为真实用户ID）
const sampleUserIds = [
  'f3dedf79-5c5e-40fd-9513-d0fb0995d429',
  '78340927-c853-4978-a90f-f54d7c6883d2',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
];

const sessionSQL = generateUserSessionsSQL(sampleUserIds);
const orderSQL = generateMembershipOrdersSQL(sampleUserIds);

const fullSQL = `-- 控制台图表测试数据
-- 生成时间: ${new Date().toISOString()}

BEGIN;

${sessionSQL}

${orderSQL}

COMMIT;
`;

const outputPath = path.join(__dirname, '../seed-dashboard-data.sql');
fs.writeFileSync(outputPath, fullSQL);

console.log(`\n✅ SQL文件已生成: ${outputPath}`);
console.log('\n请执行以下命令导入数据:');
console.log(`  psql "${process.env.VITE_SUPABASE_URL?.replace('.co/', '.co:5432/')?.replace('https://', 'postgresql://postgres:')}" -f seed-dashboard-data.sql`);
console.log('\n或者通过 Supabase Dashboard 的 SQL Editor 执行该文件内容');
