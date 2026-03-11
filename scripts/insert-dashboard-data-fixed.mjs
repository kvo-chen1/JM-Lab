/**
 * 插入控制台图表数据（修复版）
 * 处理唯一约束问题
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
  console.log('🚀 开始插入数据...\n');

  // 获取真实用户ID
  const { data: users } = await supabase.from('users').select('id').limit(50);
  const userIds = users?.map(u => u.id) || [];
  console.log(`使用 ${userIds.length} 个真实用户ID`);

  // 1. 插入用户会话数据 - 使用 upsert 更新现有记录
  console.log('\n📊 更新用户会话数据...');
  let sessionCount = 0;
  
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    // 为每个用户生成多个时间点的会话活动
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      for (let hour = 0; hour < 24; hour += 3) { // 每3小时一个会话
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        date.setHours(hour, randomInt(0, 59), randomInt(0, 59));
        
        // 使用不同的 session_token 来避免唯一约束
        const { error } = await supabase.from('user_sessions').upsert({
          user_id: userId,
          session_token: `${userId}-${dayOffset}-${hour}`,
          ip_address: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          last_active: date.getTime(),
          created_at: date.getTime(),
        }, {
          onConflict: 'session_token'
        });
        
        if (!error) sessionCount++;
      }
    }
    process.stdout.write(`\r进度: ${i + 1}/${userIds.length} 用户，${sessionCount} 条会话`);
  }
  console.log(`\n✅ 会话数据: ${sessionCount} 条`);

  // 2. 插入订单数据
  console.log('\n💰 插入会员订单数据...');
  let orderCount = 0;
  let totalRevenue = 0;
  
  const plans = [
    { plan: 'basic', planName: '基础会员', period: 'monthly', amount: 29 },
    { plan: 'premium', planName: '高级会员', period: 'monthly', amount: 99 },
    { plan: 'vip', planName: 'VIP会员', period: 'monthly', amount: 199 },
  ];
  
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dailyOrders = randomInt(2, 8);
    
    for (let j = 0; j < dailyOrders; j++) {
      const plan = plans[randomInt(0, plans.length - 1)];
      const userId = userIds[randomInt(0, userIds.length - 1)];
      
      const orderDate = new Date(date);
      orderDate.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
      
      // 生成唯一订单ID
      const orderId = `ORD${Date.now()}${randomInt(10000, 99999)}${dayOffset}${j}`;
      
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
      process.stdout.write(`\r进度: ${dayOffset + 1}/30 天，${orderCount} 条订单`);
    }
  }
  
  console.log(`\n✅ 订单数据: ${orderCount} 条`);
  console.log(`💵 总营收: ¥${totalRevenue.toLocaleString()}`);

  console.log('\n🎉 数据插入完成！请刷新控制台页面查看图表');
}

insertData().catch(console.error);
