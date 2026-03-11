#!/usr/bin/env node
/**
 * 执行津币系统SQL脚本 - 改进版
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const { Pool } = pg

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL

console.log('==========================================')
console.log('   执行津币系统SQL脚本 (改进版)')
console.log('==========================================\n')

if (!connectionString) {
  console.error('❌ 错误: 数据库连接字符串未设置')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function executeSQL() {
  const client = await pool.connect()
  
  try {
    console.log('🔌 数据库连接成功\n')
    
    // 按顺序执行SQL命令
    const commands = [
      // 1. 创建 user_jinbi_balance 表
      {
        name: '创建 user_jinbi_balance 表',
        sql: `CREATE TABLE IF NOT EXISTS public.user_jinbi_balance (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          total_balance INTEGER NOT NULL DEFAULT 0,
          available_balance INTEGER NOT NULL DEFAULT 0,
          frozen_balance INTEGER NOT NULL DEFAULT 0,
          total_earned INTEGER NOT NULL DEFAULT 0,
          total_spent INTEGER NOT NULL DEFAULT 0,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        )`
      },
      // 2. 创建 jinbi_records 表
      {
        name: '创建 jinbi_records 表',
        sql: `CREATE TABLE IF NOT EXISTS public.jinbi_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          amount INTEGER NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('grant', 'earn', 'spend', 'purchase', 'refund', 'expire')),
          source TEXT NOT NULL,
          source_type TEXT,
          description TEXT NOT NULL DEFAULT '',
          balance_after INTEGER NOT NULL,
          related_id UUID,
          related_type TEXT,
          expires_at TIMESTAMP WITH TIME ZONE,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      // 3. 创建 jinbi_consumption_details 表
      {
        name: '创建 jinbi_consumption_details 表',
        sql: `CREATE TABLE IF NOT EXISTS public.jinbi_consumption_details (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          record_id UUID REFERENCES public.jinbi_records(id),
          service_type TEXT NOT NULL,
          service_params JSONB DEFAULT '{}',
          jinbi_cost INTEGER NOT NULL,
          actual_cost INTEGER NOT NULL,
          status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      // 4. 创建 jinbi_packages 表
      {
        name: '创建 jinbi_packages 表',
        sql: `CREATE TABLE IF NOT EXISTS public.jinbi_packages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          jinbi_amount INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'CNY',
          bonus_jinbi INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      // 5. 创建 membership_jinbi_config 表
      {
        name: '创建 membership_jinbi_config 表',
        sql: `CREATE TABLE IF NOT EXISTS public.membership_jinbi_config (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          level TEXT NOT NULL UNIQUE,
          monthly_grant INTEGER NOT NULL,
          daily_checkin_base INTEGER DEFAULT 50,
          daily_checkin_max INTEGER DEFAULT 200,
          concurrent_limit INTEGER NOT NULL,
          discount_rate DECIMAL(3,2) DEFAULT 1.00,
          storage_gb INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      // 6. 创建 service_pricing 表
      {
        name: '创建 service_pricing 表',
        sql: `CREATE TABLE IF NOT EXISTS public.service_pricing (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service_type TEXT NOT NULL,
          service_subtype TEXT,
          name TEXT NOT NULL,
          description TEXT,
          base_cost INTEGER NOT NULL,
          params JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
    ]
    
    // 执行创建表命令
    for (const cmd of commands) {
      try {
        await client.query(cmd.sql)
        console.log(`✅ ${cmd.name}`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  ${cmd.name} - 已存在`)
        } else {
          console.error(`❌ ${cmd.name} - ${error.message}`)
        }
      }
    }
    
    // 插入默认数据
    console.log('\n📊 插入默认数据...\n')
    
    // 津币套餐
    const packages = [
      { name: '小额充值', desc: '适合轻度用户', amount: 500, price: 5.00, bonus: 0, order: 1 },
      { name: '标准充值', desc: '性价比之选', amount: 1100, price: 10.00, bonus: 100, order: 2 },
      { name: '大额充值', desc: '赠送100津币', amount: 2600, price: 20.00, bonus: 100, order: 3 },
      { name: '超值充值', desc: '赠送400津币', amount: 5400, price: 50.00, bonus: 400, order: 4 },
      { name: '至尊充值', desc: '赠送1500津币', amount: 11500, price: 100.00, bonus: 1500, order: 5 }
    ]
    
    for (const pkg of packages) {
      try {
        await client.query(`
          INSERT INTO public.jinbi_packages (name, description, jinbi_amount, price, bonus_jinbi, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [pkg.name, pkg.desc, pkg.amount, pkg.price, pkg.bonus, pkg.order])
        console.log(`✅ 套餐: ${pkg.name}`)
      } catch (error) {
        console.error(`❌ 套餐 ${pkg.name}: ${error.message}`)
      }
    }
    
    // 会员配置
    const memberships = [
      { level: 'free', grant: 0, checkin: 10, max: 50, limit: 1, rate: 1.00, storage: 1 },
      { level: 'base', grant: 1000, checkin: 50, max: 200, limit: 3, rate: 0.95, storage: 10 },
      { level: 'pro', grant: 3000, checkin: 50, max: 200, limit: 5, rate: 0.90, storage: 50 },
      { level: 'star', grant: 8000, checkin: 50, max: 200, limit: 10, rate: 0.85, storage: 200 },
      { level: 'vip', grant: 20000, checkin: 50, max: 200, limit: 20, rate: 0.80, storage: null }
    ]
    
    for (const m of memberships) {
      try {
        await client.query(`
          INSERT INTO public.membership_jinbi_config 
          (level, monthly_grant, daily_checkin_base, daily_checkin_max, concurrent_limit, discount_rate, storage_gb)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (level) DO NOTHING
        `, [m.level, m.grant, m.checkin, m.max, m.limit, m.rate, m.storage])
        console.log(`✅ 会员: ${m.level}`)
      } catch (error) {
        console.error(`❌ 会员 ${m.level}: ${error.message}`)
      }
    }
    
    // 服务计费标准
    const pricings = [
      { type: 'agent_chat', subtype: null, name: 'Agent对话', desc: '津小脉Agent每轮对话', cost: 10, order: 1 },
      { type: 'image_gen', subtype: 'standard', name: '标准图像', desc: '1024x1024标准图像生成', cost: 50, order: 1 },
      { type: 'image_gen', subtype: 'hd', name: '高清图像', desc: '2048x2048高清图像生成', cost: 100, order: 2 },
      { type: 'image_gen', subtype: 'ultra', name: '超清图像', desc: '4096x4096超清图像生成', cost: 200, order: 3 },
      { type: 'video_gen', subtype: '5s_720p', name: '5秒视频720p', desc: '5秒720p视频生成', cost: 200, order: 1 },
      { type: 'video_gen', subtype: '10s_1080p', name: '10秒视频1080p', desc: '10秒1080p视频生成', cost: 400, order: 2 },
      { type: 'video_gen', subtype: '30s_1080p', name: '30秒视频1080p', desc: '30秒1080p视频生成', cost: 1000, order: 3 },
      { type: 'text_gen', subtype: null, name: '文案生成', desc: 'AI文案生成', cost: 20, order: 1 },
      { type: 'audio_gen', subtype: null, name: '音频生成', desc: '30秒内音频生成', cost: 100, order: 1 },
      { type: 'export', subtype: 'hd', name: '高清导出', desc: '高清无水印导出', cost: 50, order: 1 },
      { type: 'export', subtype: '4k', name: '4K导出', desc: '4K超清导出', cost: 100, order: 2 }
    ]
    
    for (const p of pricings) {
      try {
        await client.query(`
          INSERT INTO public.service_pricing (service_type, service_subtype, name, description, base_cost, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [p.type, p.subtype, p.name, p.desc, p.cost, p.order])
        console.log(`✅ 计费: ${p.name}`)
      } catch (error) {
        console.error(`❌ 计费 ${p.name}: ${error.message}`)
      }
    }
    
    console.log('\n🎉 所有表和数据创建完成!')
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

executeSQL()
