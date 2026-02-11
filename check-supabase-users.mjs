// 直接检查 Supabase 数据库中的用户数据
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsers() {
  console.log('=== 检查 Supabase 用户数据 ===\n')
  
  try {
    // 1. 检查 public.users 表
    console.log('1. 查询 public.users 表:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10)
    
    if (usersError) {
      console.error('  查询失败:', usersError.message)
    } else {
      console.log(`  找到 ${users.length} 个用户`)
      users.forEach(u => {
        console.log(`\n    用户: ${u.username} (${u.email})`)
        console.log(`      id: ${u.id}`)
        console.log(`      avatar_url: ${u.avatar_url ? u.avatar_url.substring(0, 60) + '...' : 'null/empty'}`)
        console.log(`      cover_image: ${u.cover_image ? '有' : 'null/empty'}`)
      })
    }
    
    // 2. 检查表结构
    console.log('\n\n2. 检查 users 表结构:')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    if (columnsError) {
      console.error('  获取表结构失败:', columnsError.message)
    } else {
      console.log('  users 表字段:')
      columns.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type}`)
      })
    }
    
    // 3. 测试 RPC 函数
    if (users && users.length > 0) {
      console.log('\n\n3. 测试 get_user_profile RPC 函数:')
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_profile', { p_user_id: users[0].id })
      
      if (rpcError) {
        console.error('  RPC 调用失败:', rpcError.message)
      } else {
        console.log('  RPC 返回:')
        console.log(`    username: ${rpcData[0]?.username}`)
        console.log(`    avatar_url: ${rpcData[0]?.avatar_url ? rpcData[0].avatar_url.substring(0, 60) + '...' : 'null/empty'}`)
      }
    }
    
  } catch (error) {
    console.error('检查失败:', error)
  }
}

checkUsers()
