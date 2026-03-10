import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(projectRoot, '.env') })
dotenv.config({ path: path.join(projectRoot, '.env.local'), override: true })

const { Pool } = pg

async function verifyTables() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  })

  try {
    const client = await pool.connect()

    // 检查表是否存在
    const tables = ['brands', 'products', 'user_favorites']
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        );
      `, [table])
      console.log(`${table} 表存在:`, result.rows[0].exists)
    }

    // 检查 brands 表结构
    console.log('\nbrands 表结构:')
    const brandsCols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'brands'
      ORDER BY ordinal_position
    `)
    brandsCols.rows.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`))

    // 检查 products 表结构
    console.log('\nproducts 表结构:')
    const productsCols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `)
    productsCols.rows.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`))

    client.release()
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

verifyTables()
