// 调试脚本：检查用户头像数据
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 Supabase 配置')
  console.error('请确保设置了 SUPABASE_URL 和 SUPABASE_SERVICE_KEY 环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAvatarData() {
  console.log('=== 检查用户头像数据 ===\n')
  
  try {
    // 1. 检查 public.users 表
    console.log('1. 检查 public.users 表:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, avatar_url, cover_image')
      .limit(5)
    
    if (usersError) {
      console.error('  查询 users 表失败:', usersError.message)
    } else {
      console.log(`  找到 ${users.length} 个用户:`)
      users.forEach(u => {
        console.log(`    - ${u.username} (${u.email}):`)
        console.log(`      avatar_url: ${u.avatar_url ? u.avatar_url.substring(0, 50) + '...' : 'null/empty'}`)
        console.log(`      cover_image: ${u.cover_image ? '有' : 'null/empty'}`)
      })
    }
    
    // 2. 检查 auth.users 表的 metadata
    console.log('\n2. 检查 auth.users 表的 user_metadata:')
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .limit(5)
    
    if (authError) {
      console.error('  查询 auth.users 失败:', authError.message)
      // auth.users 可能需要特殊权限，这是正常的
    } else if (authUsers) {
      console.log(`  找到 ${authUsers.length} 个 auth 用户:`)
      authUsers.forEach(u => {
        const metadata = u.raw_user_meta_data || {}
        console.log(`    - ${u.email}:`)
        console.log(`      metadata.avatar: ${metadata.avatar ? metadata.avatar.substring(0, 50) + '...' : 'null/empty'}`)
        console.log(`      metadata.avatar_url: ${metadata.avatar_url ? metadata.avatar_url.substring(0, 50) + '...' : 'null/empty'}`)
      })
    }
    
    // 3. 测试 RPC 函数
    console.log('\n3. 测试 get_user_profile RPC 函数:')
    if (users && users.length > 0) {
      const testUserId = users[0].id
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_profile', { p_user_id: testUserId })
      
      if (rpcError) {
        console.error('  RPC 调用失败:', rpcError.message)
      } else {
        console.log('  RPC 返回结果:')
        console.log(`    username: ${rpcData[0]?.username}`)
        console.log(`    avatar_url: ${rpcData[0]?.avatar_url ? rpcData[0].avatar_url.substring(0, 50) + '...' : 'null/empty'}`)
      }
    }
    
    // 4. 检查表结构
    console.log('\n4. 检查 users 表结构:')
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
    
    if (columnsError) {
      // 如果没有这个 RPC 函数，使用直接查询
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'users')
        .eq('table_schema', 'public')
        .order('ordinal_position')
      
      if (tableError) {
        console.error('  获取表结构失败:', tableError.message)
      } else {
        console.log('  users 表字段:')
        tableInfo.forEach(col => {
          console.log(`    - ${col.column_name}: ${col.data_type}`)
        })
      }
    }
    
    console.log('\n=== 检查完成 ===')
    
  } catch (error) {
    console.error('检查过程中出错:', error)
  }
}

checkAvatarData()
