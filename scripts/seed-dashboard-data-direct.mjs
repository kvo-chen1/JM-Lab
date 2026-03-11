/**
 * 控制台图表测试数据填充脚本 - 直接 PostgreSQL 版本
 * 为热力图和营收预测图表生成模拟数据
 */

import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { randomUUID } from 'crypto';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: resolve(__dirname, '../.env') });

const connectionString = process.env.POSTGRES_URL_NON_POOLING || 
                         process.env.DATABASE_URL || 
                         process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('错误: 缺少 PostgreSQL 连接字符串');
  console.error('请确保 .env 文件中包含 POSTGRES_URL_NON_POOLING 或 DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// 生成随机整数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成特定小时和星期的日期时间戳（ISO 格式）
function getTimestampForDayAndHour(dayOfWeek, hour, daysAgo = 14) {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  const currentDay = date.getDay();
  const diff = dayOfWeek - currentDay;
  date.setDate(date.getDate() + diff);
  date.setHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return date.toISOString();
}

// 1. 填充用户历史数据（用于用户活跃度统计）
async function seedUserHistory(client) {
  console.log('\n📊 正在填充用户历史数据...');

  // 先获取现有用户ID
  const { rows: users } = await client.query('SELECT id FROM users LIMIT 100');

  if (!users || users.length === 0) {
    console.log('⚠️ 没有现有用户，跳过用户历史数据填充');
    return;
  }

  const userIds = users.map(u => u.id);
  const actions = ['view_work', 'like_work', 'share_work', 'comment_work', 'bookmark_work', 'follow_user'];
  const historyRecords = [];

  // 生成7天 x 24小时的用户活动数据
  const weekDays = [0, 1, 2, 3, 4, 5, 6];

  for (const dayOfWeek of weekDays) {
    for (let hour = 0; hour < 24; hour++) {
      let activityLevel = 0;

      // 工作日 (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (hour >= 9 && hour <= 12) activityLevel = randomInt(10, 30);
        else if (hour >= 14 && hour <= 18) activityLevel = randomInt(15, 40);
        else if (hour >= 20 && hour <= 23) activityLevel = randomInt(20, 50);
        else if (hour >= 0 && hour <= 6) activityLevel = randomInt(1, 5);
        else activityLevel = randomInt(5, 15);
      }
      // 周末 (0, 6)
      else {
        if (hour >= 10 && hour <= 12) activityLevel = randomInt(15, 35);
        else if (hour >= 14 && hour <= 17) activityLevel = randomInt(20, 45);
        else if (hour >= 19 && hour <= 23) activityLevel = randomInt(25, 60);
        else if (hour >= 0 && hour <= 7) activityLevel = randomInt(2, 8);
        else activityLevel = randomInt(5, 20);
      }

      for (let i = 0; i < activityLevel; i++) {
        const userId = userIds[randomInt(0, userIds.length - 1)];
        const actionType = actions[randomInt(0, actions.length - 1)];
        const createdAt = getTimestampForDayAndHour(dayOfWeek, hour, 14);

        historyRecords.push({
          user_id: userId,
          action_type: actionType,
          target_type: 'work',
          target_id: randomUUID(),
          metadata: JSON.stringify({ source: 'dashboard_seed' }),
          created_at: createdAt,
        });
      }
    }
  }

  console.log(`准备插入 ${historyRecords.length} 条用户历史数据...`);

  // 批量插入数据
  const batchSize = 100;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < historyRecords.length; i += batchSize) {
    const batch = historyRecords.slice(i, i + batchSize);
    try {
      const values = batch.map((h, idx) => 
        `($${idx * 6 + 1}, $${idx * 6 + 2}, $${idx * 6 + 3}, $${idx * 6 + 4}, $${idx * 6 + 5}, $${idx * 6 + 6})`
      ).join(',');
      
      const params = batch.flatMap(h => [h.user_id, h.action_type, h.target_type, h.target_id, h.metadata, h.created_at]);
      
      await client.query(
        `INSERT INTO user_history (user_id, action_type, target_type, target_id, metadata, created_at) VALUES ${values}`,
        params
      );
      
      inserted += batch.length;
      process.stdout.write(`\r进度: ${inserted}/${historyRecords.length}`);
    } catch (err) {
      console.error(`\n批次 ${Math.floor(i / batchSize) + 1} 失败:`, err.message);
      failed += batch.length;
    }
  }

  console.log(`\n✅ 已插入 ${inserted} 条用户历史数据${failed > 0 ? `, ${failed} 条失败` : ''}`);
}

// 2. 更新用户会话数据（每个用户只有一条会话记录）
async function seedUserSessions(client) {
  console.log('\n📊 正在更新用户会话数据...');

  // 先获取现有用户ID
  const { rows: users } = await client.query('SELECT id FROM users LIMIT 100');

  if (!users || users.length === 0) {
    console.log('⚠️ 没有现有用户，跳过会话数据填充');
    return;
  }

  const userIds = users.map(u => u.id);
  let updated = 0;
  let inserted = 0;
  let failed = 0;

  // 为每个用户更新或插入会话记录
  for (const userId of userIds) {
    try {
      // 检查是否已有会话记录
      const { rows: existing } = await client.query(
        'SELECT id FROM user_sessions WHERE user_id = $1',
        [userId]
      );

      const now = Date.now();
      const sessionStart = now - randomInt(1, 7 * 24 * 60 * 60 * 1000); // 1-7天内
      const lastActive = now - randomInt(0, 60 * 60 * 1000); // 1小时内

      if (existing.length > 0) {
        // 更新现有会话
        await client.query(
          `UPDATE user_sessions 
           SET session_token = $1, ip_address = $2, user_agent = $3, last_active = $4, created_at = $5
           WHERE user_id = $6`,
          [randomUUID(), `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`, 
           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
           lastActive, sessionStart, userId]
        );
        updated++;
      } else {
        // 插入新会话
        await client.query(
          `INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, last_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, randomUUID(), `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`, 
           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
           lastActive, sessionStart]
        );
        inserted++;
      }
    } catch (err) {
      console.error(`用户 ${userId} 会话操作失败:`, err.message);
      failed++;
    }
  }

  console.log(`✅ 会话数据: ${inserted} 条插入, ${updated} 条更新${failed > 0 ? `, ${failed} 条失败` : ''}`);
}

// 3. 填充订单数据（用于营收预测图表）
async function seedMembershipOrders(client) {
  console.log('\n💰 正在填充会员订单数据...');

  // 先获取现有用户ID
  const { rows: users } = await client.query('SELECT id FROM users LIMIT 100');

  const userIds = users?.map(u => u.id) || [];
  const orders = [];

  // 会员套餐配置（必须符合 membership_orders_plan_check 约束: free, premium, vip）
  const membershipPlans = [
    { plan: 'free', planName: '免费会员', period: 'monthly', amount: 0 },
    { plan: 'premium', planName: '高级会员', period: 'monthly', amount: 99 },
    { plan: 'vip', planName: 'VIP会员', period: 'monthly', amount: 199 },
    { plan: 'premium', planName: '高级会员', period: 'yearly', amount: 999 },
  ];

  // 生成过去30天的订单数据
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseOrders = isWeekend ? randomInt(8, 20) : randomInt(3, 12);
    const promotionBoost = Math.random() > 0.8 ? randomInt(5, 15) : 0;
    const dailyOrders = baseOrders + promotionBoost;

    for (let j = 0; j < dailyOrders; j++) {
      const plan = membershipPlans[randomInt(0, membershipPlans.length - 1)];
      const userId = userIds.length > 0
        ? userIds[randomInt(0, userIds.length - 1)]
        : randomUUID();

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
        status: 'completed',
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
      const values = batch.map((o, idx) => 
        `($${idx * 13 + 1}, $${idx * 13 + 2}, $${idx * 13 + 3}, $${idx * 13 + 4}, $${idx * 13 + 5}, $${idx * 13 + 6}, $${idx * 13 + 7}, $${idx * 13 + 8}, $${idx * 13 + 9}, $${idx * 13 + 10}, $${idx * 13 + 11}, $${idx * 13 + 12}, $${idx * 13 + 13})`
      ).join(',');
      
      const params = batch.flatMap(o => [
        o.id, o.user_id, o.plan, o.plan_name, o.period, o.amount, o.currency, 
        o.status, o.payment_method, o.created_at, o.paid_at, o.expires_at, o.payment_type
      ]);
      
      await client.query(
        `INSERT INTO membership_orders (id, user_id, plan, plan_name, period, amount, currency, status, payment_method, created_at, paid_at, expires_at, payment_type) VALUES ${values}`,
        params
      );
      
      inserted += batch.length;
      process.stdout.write(`\r进度: ${inserted}/${orders.length}`);
    } catch (err) {
      console.error(`\n批次 ${Math.floor(i / batchSize) + 1} 失败:`, err.message);
      failed += batch.length;
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  console.log(`\n✅ 已插入 ${inserted} 条订单数据${failed > 0 ? `, ${failed} 条失败` : ''}`);
  console.log(`💵 模拟总营收: ¥${totalRevenue.toLocaleString()}`);
}

// 4. 填充其他业务数据
async function seedOtherBusinessData(client) {
  console.log('\n📝 正在填充其他业务数据...');

  // 获取用户ID
  const { rows: users } = await client.query('SELECT id FROM users LIMIT 50');
  if (!users || users.length === 0) {
    console.log('⚠️ 没有现有用户，跳过其他业务数据填充');
    return;
  }
  const userIds = users.map(u => u.id);

  // 1. 填充 likes 数据
  try {
    const likesCount = randomInt(100, 200);
    for (let i = 0; i < likesCount; i++) {
      const userId = userIds[randomInt(0, userIds.length - 1)];
      const createdAt = new Date(Date.now() - randomInt(0, 30 * 24 * 60 * 60 * 1000)).toISOString();
      await client.query(
        `INSERT INTO likes (user_id, target_type, target_id, created_at) 
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [userId, 'work', randomUUID(), createdAt]
      );
    }
    console.log(`✅ 已插入 ${likesCount} 条点赞数据`);
  } catch (err) {
    console.log('点赞数据填充:', err.message);
  }

  // 2. 填充 comments 数据
  try {
    const commentsCount = randomInt(50, 100);
    const commentContents = ['很棒的作品！', '非常喜欢', '期待更多', '太厉害了', '学习了', '支持一下'];
    for (let i = 0; i < commentsCount; i++) {
      const userId = userIds[randomInt(0, userIds.length - 1)];
      const createdAt = new Date(Date.now() - randomInt(0, 30 * 24 * 60 * 60 * 1000)).toISOString();
      await client.query(
        `INSERT INTO comments (user_id, content, created_at) 
         VALUES ($1, $2, $3)`,
        [userId, commentContents[randomInt(0, commentContents.length - 1)], createdAt]
      );
    }
    console.log(`✅ 已插入 ${commentsCount} 条评论数据`);
  } catch (err) {
    console.log('评论数据填充:', err.message);
  }

  // 3. 填充 works 数据
  try {
    const worksCount = randomInt(20, 50);
    const categories = ['design', 'illustration', 'photography', 'video', 'writing'];
    for (let i = 0; i < worksCount; i++) {
      const userId = userIds[randomInt(0, userIds.length - 1)];
      const createdAt = new Date(Date.now() - randomInt(0, 30 * 24 * 60 * 60 * 1000)).toISOString();
      await client.query(
        `INSERT INTO works (id, creator_id, title, category, view_count, likes, comments_count, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [randomUUID(), userId, `作品 ${i + 1}`, categories[randomInt(0, categories.length - 1)], 
         randomInt(10, 1000), randomInt(0, 100), randomInt(0, 50), 'published', createdAt]
      );
    }
    console.log(`✅ 已插入 ${worksCount} 条作品数据`);
  } catch (err) {
    console.log('作品数据填充:', err.message);
  }
}

// 5. 清理旧数据
async function cleanupOldData(client) {
  console.log('\n🧹 清理旧的测试数据...');

  try {
    // 删除测试订单数据（根据ID前缀）
    await client.query("DELETE FROM membership_orders WHERE id LIKE 'ORD-%'");
    console.log('✅ 已清理旧订单数据');
  } catch (err) {
    console.log('清理旧订单数据:', err.message);
  }

  try {
    // 删除由脚本生成的用户历史数据
    await client.query("DELETE FROM user_history WHERE metadata->>'source' = 'dashboard_seed'");
    console.log('✅ 已清理旧用户历史数据');
  } catch (err) {
    console.log('清理旧用户历史数据:', err.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始填充控制台图表测试数据...\n');

  const client = await pool.connect();

  try {
    // 检查必要表是否存在
    const tables = ['user_sessions', 'membership_orders', 'user_history', 'likes', 'comments', 'works'];
    for (const table of tables) {
      try {
        await client.query(`SELECT id FROM ${table} LIMIT 1`);
        console.log(`✅ ${table} 表存在`);
      } catch (err) {
        console.log(`⚠️ ${table} 表不存在或无法访问: ${err.message}`);
      }
    }

    // 执行数据填充
    await cleanupOldData(client);
    await seedUserHistory(client);
    await seedUserSessions(client);
    await seedMembershipOrders(client);
    await seedOtherBusinessData(client);

    console.log('\n✨ 数据填充完成！');
    console.log('\n📈 现在刷新控制台页面，图表应该可以正常显示了');

  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
