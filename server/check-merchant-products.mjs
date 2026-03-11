/**
 * 检查商家商品数据
 */

import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(projectRoot, '.env') })

const envLocalPath = path.join(projectRoot, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const connectionString = process.env.DATABASE_URL || 
                        process.env.POSTGRES_URL_NON_POOLING ||
                        process.env.POSTGRES_URL ||
                        process.env.NEON_DATABASE_URL

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { 
    rejectUnauthorized: false 
  }
})

async function checkMerchantProducts() {
  const client = await pool.connect()
  
  try {
    console.log('========== 检查商家商品数据 ==========\n')

    // 检查 merchant_products 表是否存在
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'merchant_products'
      )
    `)
    console.log('merchant_products 表存在:', tableCheck.rows[0].exists)

    if (tableCheck.rows[0].exists) {
      // 获取商家ID
      const merchantResult = await client.query(
        "SELECT id, store_name FROM merchants WHERE store_name = '津门文创旗舰店'"
      )
      
      if (merchantResult.rowCount > 0) {
        const merchantId = merchantResult.rows[0].id
        console.log('\n商家:', merchantResult.rows[0].store_name, '(', merchantId, ')')
        
        // 检查该商家的商品
        const products = await client.query(
          'SELECT * FROM merchant_products WHERE merchant_id = $1',
          [merchantId]
        )
        console.log('商品数量:', products.rowCount)
        
        if (products.rowCount > 0) {
          products.rows.forEach(p => {
            console.log(`  - ${p.name} - ¥${p.price} - 库存:${p.stock} - 状态:${p.status}`)
          })
        }
      }
    }

    console.log('\n========== 检查完成 ==========')
    
  } catch (error) {
    console.error('检查失败:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkMerchantProducts().catch(console.error)
