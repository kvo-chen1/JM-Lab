// 检查和修复 Supabase Storage 的 RLS 策略
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少环境变量')
  console.error('请确保设置了 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 使用 Service Role Key 创建客户端（需要管理员权限）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAndFixPolicies() {
  console.log('=== 检查 Storage RLS 策略 ===\n')

  try {
    // 1. 检查 buckets
    console.log('1. 检查 storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase
      .from('storage.buckets')
      .select('*')

    if (bucketsError) {
      console.error('查询 buckets 失败:', bucketsError.message)
    } else {
      console.log(`找到 ${buckets?.length || 0} 个 buckets:`)
      buckets?.forEach(b => {
        console.log(`  - ${b.name} (public: ${b.public})`)
      })
    }

    // 2. 检查 works bucket 是否存在
    const worksBucket = buckets?.find(b => b.name === 'works')
    if (!worksBucket) {
      console.log('\n2. works bucket 不存在，正在创建...')
      const { error: createError } = await supabase
        .from('storage.buckets')
        .insert({
          id: 'works',
          name: 'works',
          public: true
        })

      if (createError) {
        console.error('创建 works bucket 失败:', createError.message)
      } else {
        console.log('✓ works bucket 创建成功')
      }
    } else {
      console.log('\n2. works bucket 已存在')
    }

    // 3. 查询现有的 RLS 策略
    console.log('\n3. 查询现有的 RLS 策略...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage')

    if (policiesError) {
      console.error('查询策略失败:', policiesError.message)
    } else {
      console.log(`找到 ${policies.length} 个策略:`)
      policies.forEach((p, i) => {
        console.log(`  [${i + 1}] ${p.policyname} (${p.cmd})`)
      })
    }

    // 4. 检查 works bucket 的特定策略
    console.log('\n4. 检查 works bucket 的 RLS 策略...')
    const worksPolicies = policies?.filter(p =>
      (p.qual && p.qual.includes('works')) ||
      (p.with_check && p.with_check.includes('works'))
    ) || []

    console.log(`找到 ${worksPolicies.length} 个与 works bucket 相关的策略`)

    // 5. 使用 RPC 创建策略（通过数据库函数）
    console.log('\n5. 尝试创建缺失的 RLS 策略...')

    // 创建策略的 SQL
    const policiesToCreate = [
      {
        name: 'Allow public read access on works bucket',
        cmd: 'SELECT',
        using: "bucket_id = 'works'"
      },
      {
        name: 'Allow authenticated users to upload to works bucket',
        cmd: 'INSERT',
        check: "bucket_id = 'works' AND auth.role() = 'authenticated'"
      },
      {
        name: 'Allow authenticated users to update own files in works bucket',
        cmd: 'UPDATE',
        using: "bucket_id = 'works' AND auth.role() = 'authenticated'",
        check: "bucket_id = 'works' AND auth.role() = 'authenticated'"
      },
      {
        name: 'Allow authenticated users to delete own files in works bucket',
        cmd: 'DELETE',
        using: "bucket_id = 'works' AND auth.role() = 'authenticated'"
      }
    ]

    for (const policy of policiesToCreate) {
      // 检查策略是否已存在
      const exists = policies?.some(p => p.policyname === policy.name)
      if (exists) {
        console.log(`  ✓ 策略已存在: ${policy.name}`)
        continue
      }

      console.log(`  创建策略: ${policy.name}...`)

      // 使用原始 SQL 创建策略
      let sql
      if (policy.cmd === 'SELECT') {
        sql = `CREATE POLICY "${policy.name}" ON storage.objects FOR SELECT USING (${policy.using});`
      } else if (policy.cmd === 'INSERT') {
        sql = `CREATE POLICY "${policy.name}" ON storage.objects FOR INSERT WITH CHECK (${policy.check});`
      } else if (policy.cmd === 'UPDATE') {
        sql = `CREATE POLICY "${policy.name}" ON storage.objects FOR UPDATE USING (${policy.using}) WITH CHECK (${policy.check});`
      } else if (policy.cmd === 'DELETE') {
        sql = `CREATE POLICY "${policy.name}" ON storage.objects FOR DELETE USING (${policy.using});`
      }

      // 使用 RPC 执行 SQL
      const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sql })

      if (rpcError) {
        console.error(`    ✗ 创建失败:`, rpcError.message)

        // 尝试直接执行 SQL
        console.log(`    尝试直接执行 SQL...`)
        const { error: sqlError } = await supabase.auth.admin.executeSql(sql)
        if (sqlError) {
          console.error(`    ✗ 直接执行也失败:`, sqlError.message)
        } else {
          console.log(`    ✓ 策略创建成功`)
        }
      } else {
        console.log(`    ✓ 策略创建成功`)
      }
    }

    // 6. 启用 RLS
    console.log('\n6. 启用 RLS...')
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    })

    if (rlsError) {
      console.error('  启用 RLS 失败:', rlsError.message)
    } else {
      console.log('  ✓ RLS 已启用')
    }

    console.log('\n=== 检查完成 ===')
    console.log('\n如果策略创建失败，请手动在 Supabase Dashboard 中执行以下操作：')
    console.log('1. 进入 Storage > Policies')
    console.log('2. 选择 works bucket')
    console.log('3. 添加以下策略：')
    console.log('   - SELECT: bucket_id = "works"')
    console.log('   - INSERT: bucket_id = "works" AND auth.role() = "authenticated"')
    console.log('   - UPDATE: bucket_id = "works" AND auth.role() = "authenticated"')
    console.log('   - DELETE: bucket_id = "works" AND auth.role() = "authenticated"')

  } catch (error) {
    console.error('检查失败:', error)
  }
}

// 备用方案：使用 Management API
async function fixWithManagementAPI() {
  console.log('\n=== 尝试使用 Management API ===\n')

  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]

  if (!projectRef) {
    console.error('无法提取 project ref')
    return
  }

  try {
    // 使用 Supabase Management API 创建 bucket
    const response = await fetch(`https://api.supabase.io/v1/projects/${projectRef}/storage/buckets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'works',
        public: true
      })
    })

    if (response.ok) {
      console.log('✓ works bucket 创建成功 (via Management API)')
    } else {
      const error = await response.json()
      console.log('创建 bucket 结果:', error.message || '可能已存在')
    }
  } catch (error) {
    console.error('Management API 调用失败:', error)
  }
}

// 运行检查
checkAndFixPolicies().then(() => {
  console.log('\n')
  return fixWithManagementAPI()
}).then(() => {
  console.log('\n完成！')
  process.exit(0)
}).catch(err => {
  console.error('错误:', err)
  process.exit(1)
})
