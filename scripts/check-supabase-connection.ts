// 检查 Supabase 连接状态
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

console.log('========================================')
console.log('Supabase 连接检查')
console.log('========================================\n')

// 检查环境变量
console.log('1. 环境变量检查:')
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ 已配置' : '❌ 未配置'}`)
console.log(`   SUPABASE_KEY: ${supabaseKey ? '✅ 已配置' : '❌ 未配置'}`)

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ 错误: 缺少必要的 Supabase 配置')
  console.log('\n请确保 .env.local 文件中包含:')
  console.log('  SUPABASE_URL=https://your-project.supabase.co')
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
  process.exit(1)
}

console.log(`   URL: ${supabaseUrl}`)
console.log(`   Key 前缀: ${supabaseKey.substring(0, 20)}...`)

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 测试连接
async function checkConnection() {
  console.log('\n2. 连接测试:')

  try {
    // 测试 1: 基础连接
    console.log('   测试 1: 基础连接...')
    const startTime = Date.now()
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    const duration = Date.now() - startTime

    if (error) {
      console.log(`   ❌ 连接失败 (${duration}ms)`)
      console.log(`   错误: ${error.message}`)
      console.log(`   错误代码: ${error.code}`)
      return false
    }

    console.log(`   ✅ 连接成功 (${duration}ms)`)

    // 测试 2: 数据库查询
    console.log('\n   测试 2: 数据库查询...')
    const queryStart = Date.now()
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_info')
      .select('*')
    const queryDuration = Date.now() - queryStart

    if (tablesError) {
      // 尝试另一种方式获取表信息
      const { data: tableData, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(10)

      if (tableError) {
        console.log(`   ⚠️ 无法获取表信息 (${queryDuration}ms)`)
        console.log(`   原因: ${tableError.message}`)
      } else {
        console.log(`   ✅ 查询成功 (${queryDuration}ms)`)
        console.log(`   找到 ${tableData?.length || 0} 个表`)
        if (tableData && tableData.length > 0) {
          console.log('   部分表名:')
          tableData.slice(0, 5).forEach((t: any) => {
            console.log(`     - ${t.table_name}`)
          })
        }
      }
    } else {
      console.log(`   ✅ 查询成功 (${queryDuration}ms)`)
    }

    // 测试 3: Auth 服务
    console.log('\n   测试 3: Auth 服务...')
    const authStart = Date.now()
    const { data: authData, error: authError } = await supabase.auth.getSession()
    const authDuration = Date.now() - authStart

    if (authError) {
      console.log(`   ⚠️ Auth 服务异常 (${authDuration}ms)`)
      console.log(`   原因: ${authError.message}`)
    } else {
      console.log(`   ✅ Auth 服务正常 (${authDuration}ms)`)
    }

    // 测试 4: Storage 服务
    console.log('\n   测试 4: Storage 服务...')
    const storageStart = Date.now()
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    const storageDuration = Date.now() - storageStart

    if (storageError) {
      console.log(`   ⚠️ Storage 服务异常 (${storageDuration}ms)`)
      console.log(`   原因: ${storageError.message}`)
    } else {
      console.log(`   ✅ Storage 服务正常 (${storageDuration}ms)`)
      console.log(`   存储桶数量: ${buckets?.length || 0}`)
    }

    return true

  } catch (err: any) {
    console.log(`   ❌ 测试过程中发生错误`)
    console.log(`   错误: ${err.message}`)
    return false
  }
}

// 运行检查
checkConnection().then(success => {
  console.log('\n========================================')
  if (success) {
    console.log('✅ Supabase 连接检查完成 - 连接正常')
  } else {
    console.log('❌ Supabase 连接检查完成 - 存在连接问题')
  }
  console.log('========================================')
  process.exit(success ? 0 : 1)
})
