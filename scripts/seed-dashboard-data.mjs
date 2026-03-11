/**
 * 控制台图表测试数据填充脚本
 * 为热力图和营收预测图表生成模拟数据
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 环境变量');
  console.error('请确保 .env 文件中包含 VITE_SUPABASE_URL 和 VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 生成随机整数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成特定小时和星期的日期时间戳（bigint格式）
function getTimestampForDayAndHour(dayOfWeek, hour, daysAgo = 14) {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  // 调整到指定的星期几
  const currentDay = date.getDay();
  const diff = dayOfWeek - currentDay;
  date.setDate(date.getDate() + diff);
  date.setHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return date.getTime(); // 返回 bigint 时间戳
}

// 1. 填充用户会话数据（用于用户活跃度热力图）
async function seedUserSessions() {
  console.log('\n📊 正在填充用户会话数据...');

  // 先获取现有用户ID
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .limit(50);

  if (userError) {
    console.error('获取用户列表失败:', userError.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('⚠️ 没有现有用户，将使用随机UUID创建会话数据');
  }

  const userIds = users?.map(u => u.id) || [];
  const sessions = [];

  // 生成7天 x 24小时的会话数据，模拟不同时间段的用户活跃度
  const weekDays = [0, 1, 2, 3, 4, 5, 6]; // 周日到周六

  // 模拟真实用户行为模式
  for (const dayOfWeek of weekDays) {
    for (let hour = 0; hour < 24; hour++) {
      // 根据时间段决定活跃度
      let activityLevel = 0;

      // 工作日 (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (hour >= 9 && hour <= 12) activityLevel = randomInt(5, 15); // 上午工作时间
        else if (hour >= 14 && hour <= 18) activityLevel = randomInt(8, 20); // 下午工作时间
        else if (hour >= 20 && hour <= 23) activityLevel = randomInt(10, 25); // 晚上休闲时间
        else if (hour >= 0 && hour <= 6) activityLevel = randomInt(0, 3); // 深夜
        else activityLevel = randomInt(2, 8);
      }
      // 周末 (0, 6)
      else {
        if (hour >= 10 && hour <= 12) activityLevel = randomInt(8, 18); // 上午
        else if (hour >= 14 && hour <= 17) activityLevel = randomInt(10, 22); // 下午
        else if (hour >= 19 && hour <= 23) activityLevel = randomInt(15, 30); // 晚上高峰
        else if (hour >= 0 && hour <= 7) activityLevel = randomInt(1, 5); // 深夜
        else activityLevel = randomInt(3, 10);
      }

      // 生成该时间段的会话
      for (let i = 0; i < activityLevel; i++) {
        const userId = userIds.length > 0
          ? userIds[randomInt(0, userIds.length - 1)]
          : crypto.randomUUID();

        const sessionStart = getTimestampForDayAndHour(dayOfWeek, hour, 14);
        const lastActive = sessionStart + randomInt(5, 120) * 60 * 1000;

        sessions.push({
          user_id: userId,
          session_token: crypto.randomUUID(),
          ip_address: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          last_active: lastActive,
          created_at: sessionStart,
        });
      }
    }
  }

  console.log(`准备插入 ${sessions.length} 条会话数据...`);

  // 批量插入数据
  const batchSize = 100;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < sessions.length; i += batchSize) {
    const batch = sessions.slice(i, i + batchSize);
    try {
      const { error } = await supabase
        .from('user_sessions')
        .insert(batch);

      if (error) {
        console.error(`批次 ${Math.floor(i / batchSize) + 1} 失败:`, error.message);
        failed += batch.length;
      } else {
        inserted += batch.length;
        process.stdout.write(`\r进度: ${inserted}/${sessions.length}`);
      }
    } catch (err) {
      console.error(`批次 ${Math.floor(i / batchSize) + 1} 异常:`, err.message);
      failed += batch.length;
    }
  }

  console.log(`\n✅ 已插入 ${inserted} 条用户会话数据${failed > 0 ? `, ${failed} 条失败` : ''}`);
}

// 2. 填充订单数据（用于营收预测图表）
async function seedMembershipOrders() {
  console.log('\n💰 正在填充会员订单数据...');

  // 先获取现有用户ID
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .limit(100);

  if (userError) {
    console.error('获取用户列表失败:', userError.message);
    return;
  }

  const userIds = users?.map(u => u.id) || [];
  const orders = [];

  // 会员套餐配置（匹配实际表结构）
  const membershipPlans = [
    { plan: 'basic', planName: '基础会员', period: 'monthly', amount: 29 },
    { plan: 'premium', planName: '高级会员', period: 'monthly', amount: 99 },
    { plan: 'vip', planName: 'VIP会员', period: 'monthly', amount: 199 },
    { plan: 'premium', planName: '高级会员', period: 'yearly', amount: 999 },
  ];

  // 生成过去30天的订单数据
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // 每天生成随机数量的订单（模拟波动）
    // 周末订单更多
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseOrders = isWeekend ? randomInt(8, 20) : randomInt(3, 12);

    // 添加一些随机波动（促销活动效果）
    const promotionBoost = Math.random() > 0.8 ? randomInt(5, 15) : 0;
    const dailyOrders = baseOrders + promotionBoost;

    for (let j = 0; j < dailyOrders; j++) {
      const plan = membershipPlans[randomInt(0, membershipPlans.length - 1)];
      const userId = userIds.length > 0
        ? userIds[randomInt(0, userIds.length - 1)]
        : crypto.randomUUID();

      const orderDate = new Date(date);
      orderDate.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));

      const orderId = `ORD-${Date.now()}-${randomInt(1000, 9999)}-${j}`;

      orders.push({
        id: orderId,
        user_id: userId,
        plan: plan.plan,
        plan_name: plan.planName,
        period: plan.period,
        amount: plan.amount,
        currency: 'CNY',
        status: 'completed', // 已完成订单
        payment_method: ['wechat', 'alipay'][randomInt(0, 1)],
        created_at: orderDate.toISOString(),
        paid_at: orderDate.toISOString(),
        expires_at: new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_type: 'personal_qr',
      });
    }
  }

  console.log(`准备插入 ${orders.length} 条订单数据...`);

  // 批量插入数据
  const batchSize = 50;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);
    try {
      const { error } = await supabase
        .from('membership_orders')
        .insert(batch);

      if (error) {
        console.error(`\n批次 ${Math.floor(i / batchSize) + 1} 失败:`, error.message);
        failed += batch.length;
      } else {
        inserted += batch.length;
        process.stdout.write(`\r进度: ${inserted}/${orders.length}`);
      }
    } catch (err) {
      console.error(`\n批次 ${Math.floor(i / batchSize) + 1} 异常:`, err.message);
      failed += batch.length;
    }
  }

  // 计算总营收
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  console.log(`\n✅ 已插入 ${inserted} 条订单数据${failed > 0 ? `, ${failed} 条失败` : ''}`);
  console.log(`💵 模拟总营收: ¥${totalRevenue.toLocaleString()}`);
}

// 3. 清理旧数据（可选）
async function cleanupOldData() {
  console.log('\n🧹 清理旧的测试数据...');

  // 删除30天前的会话数据
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const { error: sessionError } = await supabase
    .from('user_sessions')
    .delete()
    .lt('created_at', thirtyDaysAgo);

  if (sessionError) {
    console.log('清理旧会话数据:', sessionError.message);
  } else {
    console.log('✅ 已清理旧会话数据');
  }

  // 删除测试订单数据（根据ID前缀）
  const { error: orderError } = await supabase
    .from('membership_orders')
    .delete()
    .like('id', 'ORD-%');

  if (orderError) {
    console.log('清理旧订单数据:', orderError.message);
  } else {
    console.log('✅ 已清理旧订单数据');
  }
}

// 主函数
async function main() {
  console.log('🚀 开始填充控制台图表测试数据...\n');

  try {
    // 检查表是否存在
    const { error: sessionTableError } = await supabase
      .from('user_sessions')
      .select('id')
      .limit(1);

    if (sessionTableError) {
      console.error('❌ user_sessions 表查询失败:', sessionTableError.message);
      return;
    }

    const { error: orderTableError } = await supabase
      .from('membership_orders')
      .select('id')
      .limit(1);

    if (orderTableError) {
      console.error('❌ membership_orders 表查询失败:', orderTableError.message);
      return;
    }

    // 执行数据填充
    await cleanupOldData();
    await seedUserSessions();
    await seedMembershipOrders();

    console.log('\n✨ 数据填充完成！');
    console.log('\n📈 现在刷新控制台页面，图表应该可以正常显示了');

  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    process.exit(1);
  }
}

main();
