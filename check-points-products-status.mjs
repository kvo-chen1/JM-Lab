/**
 * 检查 points_products 表的状态和商品上下架状态
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   检查积分商城商品上下架状态')
console.log('==========================================\n')

// 获取连接字符串
const connectionString = process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.DATABASE_URL ||
                        process.env.NEON_DATABASE_URL ||
                        process.env.NEON_URL

if (!connectionString) {
  console.error('❌ 错误：未找到数据库连接字符串')
  process.exit(1)
}

console.log('数据库连接:', connectionString.replace(/:[^:@]+@/, ':****@'))
console.log('')

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

async function checkProductsStatus() {
  try {
    const client = await pool.connect()
    console.log('✅ 数据库连接成功!\n')

    // 检查表是否存在
    console.log('【1】检查 points_products 表')
    console.log('------------------------------------------')
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'points_products'
      )
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ points_products 表不存在!')
      client.release()
      await pool.end()
      return
    }
    console.log('✅ points_products 表存在\n')

    // 检查表结构
    console.log('【2】检查表结构')
    console.log('------------------------------------------')
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'points_products'
      ORDER BY ordinal_position
    `)
    
    console.log('字段列表:')
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' (NOT NULL)' : ''}`)
    })
    console.log('')

    // 检查所有商品的状态
    console.log('【3】检查商品上下架状态')
    console.log('------------------------------------------')
    const allProducts = await client.query(`
      SELECT id, name, status, stock, points, category, is_featured, sort_order, updated_at
      FROM points_products
      ORDER BY sort_order, created_at
    `)
    
    console.log(`总商品数：${allProducts.rows.length}\n`)
    
    const statusGroups = {
      active: allProducts.rows.filter(p => p.status === 'active'),
      inactive: allProducts.rows.filter(p => p.status === 'inactive'),
      sold_out: allProducts.rows.filter(p => p.status === 'sold_out')
    }
    
    console.log(`✅ 上架商品 (active): ${statusGroups.active.length}`)
    statusGroups.active.forEach(p => {
      console.log(`   - ${p.name} (库存：${p.stock}, 积分：${p.points})`)
    })
    
    console.log(`\n️  下架商品 (inactive): ${statusGroups.inactive.length}`)
    statusGroups.inactive.forEach(p => {
      console.log(`   - ${p.name} (库存：${p.stock}, 积分：${p.points})`)
    })
    
    console.log(`\n❌ 售罄商品 (sold_out): ${statusGroups.sold_out.length}`)
    statusGroups.sold_out.forEach(p => {
      console.log(`   - ${p.name} (库存：${p.stock}, 积分：${p.points})`)
    })
    console.log('')

    // 检查 RLS 策略
    console.log('【4】检查 RLS 策略')
    console.log('------------------------------------------')
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'points_products'
    `)
    
    if (policies.rows.length === 0) {
      console.log('⚠️  没有找到 RLS 策略')
    } else {
      console.log(`找到 ${policies.rows.length} 个 RLS 策略:`)
      policies.rows.forEach(policy => {
        console.log(`\n  策略名：${policy.policyname}`)
        console.log(`  权限：${policy.permissive}`)
        console.log(`  角色：${Array.isArray(policy.roles) ? policy.roles.join(', ') : policy.roles}`)
        console.log(`  命令：${policy.cmd}`)
        console.log(`  条件：${policy.qual || 'N/A'}`)
        console.log(`  检查：${policy.with_check || 'N/A'}`)
      })
    }
    console.log('')

    // 测试查询：模拟前端查询上架商品
    console.log('【5】模拟前端查询（只查询上架商品）')
    console.log('------------------------------------------')
    const frontendQuery = await client.query(`
      SELECT id, name, status, stock, points, category, image_url, is_featured
      FROM points_products
      WHERE status = 'active'
      ORDER BY sort_order, created_at
    `)
    
    console.log(`前端查询结果：${frontendQuery.rows.length} 个商品`)
    frontendQuery.rows.forEach(p => {
      console.log(`  - ${p.name} [${p.status}]`)
    })
    console.log('')

    // 检查是否有状态不一致的问题
    console.log('【6】检查可能的数据不一致')
    console.log('------------------------------------------')
    const inconsistencyCheck = await client.query(`
      SELECT id, name, status, stock, 
             CASE 
               WHEN stock = 0 AND status != 'sold_out' THEN '库存为 0 但不是售罄状态'
               WHEN stock > 0 AND status = 'sold_out' THEN '库存大于 0 却是售罄状态'
               ELSE '正常'
             END as consistency_status
      FROM points_products
      WHERE (stock = 0 AND status != 'sold_out')
         OR (stock > 0 AND status = 'sold_out')
    `)
    
    if (inconsistencyCheck.rows.length === 0) {
      console.log('✅ 没有发现数据不一致')
    } else {
      console.log('⚠️  发现数据不一致:')
      inconsistencyCheck.rows.forEach(p => {
        console.log(`  - ${p.name}: ${p.consistency_status} (库存：${p.stock}, 状态：${p.status})`)
      })
    }
    console.log('')

    client.release()
    console.log('==========================================')
    console.log('检查完成!')
    console.log('==========================================')
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
    console.error('错误详情:', error)
  } finally {
    await pool.end()
  }
}

checkProductsStatus()
