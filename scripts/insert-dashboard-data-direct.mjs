/**
 * 直接插入控制台图表测试数据
 * 使用 Supabase JS 客户端逐条插入
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

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

async function seedUserSessions(userIds) {
  console.log('\n📊 正在填充用户会话数据...');
  
  const weekDays = [0, 1, 2, 3, 4, 5, 6];
  let inserted = 0;
  let failed = 0;
  
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
        const userId = userIds.length > 0 ? userIds[randomInt(0, userIds.length - 1)] : crypto.randomUUID();
        const sessionStart = getTimestampForDayAndHour(dayOfWeek, hour, 14);
        const lastActive = sessionStart + randomInt(5, 120) * 60 * 1000;
        
        const { error } = await supabase.from('user_sessions').insert({
          user_id: userId,
          session_token: crypto.randomUUID(),
          ip_address: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          last_active: lastActive,
          created_at: sessionStart,
        });
        
        if (error) {
          failed++;
          if (failed <= 5) console.error('插入失败:', error.message);
        } else {
          inserted++;
        }
      }
    }
  }
  
  console.log(`✅ 已插入 ${inserted} 条用户会话数据${failed > 0 ? `, ${failed} 条失败` : ''}`);
  return inserted;
}

async function seedMembershipOrders(userIds) {
  console.log('\n💰 正在填充会员订单数据...');
  
  const membershipPlans = [
    { plan: 'basic', planName: '基础会员', period: 'monthly', amount: 29 },
    { plan: 'premium', planName: '高级会员', period: 'monthly', amount: 99 },
    { plan: 'vip', planName: 'VIP会员', period: 'monthly', amount: 199 },
    { plan: 'premium', planName: '高级会员', period: 'yearly', amount: 999 },
  ];
  
  const today = new Date();
  let inserted = 0;
  let failed = 0;
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
      const userId = userIds.length > 0 ? userIds[randomInt(0, userIds.length - 1)] : crypto.randomUUID();
      
      const orderDate = new Date(date);
      orderDate.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
      
      const orderId = `ORD-TEST-${Date.now()}-${i}-${j}`;
      
      const { error } = await supabase.from('membership_orders').insert({
        id: orderId,
        user_id: userId,
        plan: plan.plan,
        plan_name: plan.planName,
        period: plan.period,
        amount: plan.amount,
        currency: 'CNY',
        status: 'completed',
        payment_method: ['wechat', 'alipay'][randomInt(0, 1)],
        created_at: orderDate.toISOString(),
        paid_at: orderDate.toISOString(),
        expires_at: new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_type: 'personal_qr',
      });
      
      if (error) {
        failed++;
        if (failed <= 5) console.error('插入失败:', error.message);
      } else {
        inserted++;
        totalRevenue += plan.amount;
      }
    }
  }
  
  console.log(`✅ 已插入 ${inserted} 条订单数据${failed > 0 ? `, ${failed} 条失败` : ''}`);
  console.log(`💵 模拟总营收: ¥${totalRevenue.toLocaleString()}`);
  return inserted;
}

async function main() {
  console.log('🚀 开始填充控制台图表测试数据...\n');
  
  try {
    // 获取用户ID
    const { data: users, error: userError } = await supabase.from('users').select('id').limit(50);
    if (userError) {
      console.error('获取用户列表失败:', userError.message);
      return;
    }
    const userIds = users?.map(u => u.id) || [];
    console.log(`找到 ${userIds.length} 个用户`);
    
    // 填充数据
    await seedUserSessions(userIds);
    await seedMembershipOrders(userIds);
    
    console.log('\n✨ 数据填充完成！');
    console.log('\n📈 现在刷新控制台页面，图表应该可以正常显示了');
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    process.exit(1);
  }
}

main();
