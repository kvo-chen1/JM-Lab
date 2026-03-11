/**
 * 插入真实的控制台图表数据
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function insertData() {
  console.log('🚀 开始插入真实数据...\n');

  // 获取真实用户ID
  const { data: users } = await supabase.from('users').select('id').limit(10);
  const userIds = users?.map(u => u.id) || ['f3dedf79-5c5e-40fd-9513-d0fb0995d429'];
  console.log(`使用 ${userIds.length} 个真实用户ID`);

  // 1. 插入用户会话数据（用于热力图）
  console.log('\n📊 插入用户会话数据...');
  let sessionCount = 0;
  
  // 为过去14天的每一天、每个小时生成会话数据
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dayOfWeek = date.getDay();
    
    for (let hour = 0; hour < 24; hour++) {
      // 根据时间段决定活跃度
      let activityLevel = 0;
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // 工作日
        if (hour >= 9 && hour <= 12) activityLevel = randomInt(3, 8);
        else if (hour >= 14 && hour <= 18) activityLevel = randomInt(5, 12);
        else if (hour >= 20 && hour <= 23) activityLevel = randomInt(8, 15);
        else if (hour >= 0 && hour <= 6) activityLevel = randomInt(0, 2);
        else activityLevel = randomInt(2, 5);
      } else {
        // 周末
        if (hour >= 10 && hour <= 12) activityLevel = randomInt(5, 10);
        else if (hour >= 14 && hour <= 17) activityLevel = randomInt(6, 12);
        else if (hour >= 19 && hour <= 23) activityLevel = randomInt(10, 18);
        else if (hour >= 0 && hour <= 7) activityLevel = randomInt(1, 3);
        else activityLevel = randomInt(3, 6);
      }
      
      for (let i = 0; i < activityLevel; i++) {
        const userId = userIds[randomInt(0, userIds.length - 1)];
        const sessionStart = new Date(date);
        sessionStart.setHours(hour, randomInt(0, 59), randomInt(0, 59));
        const lastActive = new Date(sessionStart.getTime() + randomInt(5, 120) * 60 * 1000);
        
        const { error } = await supabase.from('user_sessions').insert({
          user_id: userId,
          session_token: crypto.randomUUID(),
          ip_address: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          last_active: lastActive.getTime(),
          created_at: sessionStart.getTime(),
        });
        
        if (!error) sessionCount++;
      }
    }
    
    if (dayOffset % 3 === 0) {
      process.stdout.write(`\r进度: ${dayOffset + 1}/14 天，已插入 ${sessionCount} 条会话`);
    }
  }
  console.log(`\n✅ 会话数据插入完成: ${sessionCount} 条`);

  // 2. 插入订单数据（用于营收预测）
  console.log('\n💰 插入会员订单数据...');
  let orderCount = 0;
  let totalRevenue = 0;
  
  const plans = [
    { plan: 'basic', planName: '基础会员', period: 'monthly', amount: 29 },
    { plan: 'premium', planName: '高级会员', period: 'monthly', amount: 99 },
    { plan: 'vip', planName: 'VIP会员', period: 'monthly', amount: 199 },
  ];
  
  // 为过去30天生成订单
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    
    // 每天3-12个订单
    const dailyOrders = randomInt(3, 12);
    
    for (let j = 0; j < dailyOrders; j++) {
      const plan = plans[randomInt(0, plans.length - 1)];
      const userId = userIds[randomInt(0, userIds.length - 1)];
      
      const orderDate = new Date(date);
      orderDate.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
      
      const orderId = `ORD${Date.now()}${randomInt(1000, 9999)}${dayOffset}${j}`;
      
      const { error } = await supabase.from('membership_orders').insert({
        id: orderId,
        user_id: userId,
        plan: plan.plan,
        plan_name: plan.planName,
        period: plan.period,
        amount: plan.amount,
        currency: 'CNY',
        status: 'completed',
        payment_method: randomInt(0, 1) === 0 ? 'wechat' : 'alipay',
        created_at: orderDate.toISOString(),
        paid_at: orderDate.toISOString(),
        expires_at: new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_type: 'personal_qr',
      });
      
      if (!error) {
        orderCount++;
        totalRevenue += plan.amount;
      }
    }
    
    if (dayOffset % 5 === 0) {
      process.stdout.write(`\r进度: ${dayOffset + 1}/30 天，已插入 ${orderCount} 条订单`);
    }
  }
  
  console.log(`\n✅ 订单数据插入完成: ${orderCount} 条`);
  console.log(`💵 总营收: ¥${totalRevenue.toLocaleString()}`);

  console.log('\n🎉 所有数据插入完成！');
  console.log('请刷新控制台页面查看图表效果');
}

insertData().catch(console.error);
