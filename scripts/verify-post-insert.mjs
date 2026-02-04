import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import crypto from 'node:crypto'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('Missing env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY')
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const client = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const email = `rls_test_${crypto.randomBytes(6).toString('hex')}@example.com`
const password = `Pw_${crypto.randomBytes(12).toString('hex')}a1`

let userId = null
let postId = null

try {
  const { data: created, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: 'rls_test' },
  })
  if (createUserError) throw createUserError

  userId = created.user?.id
  if (!userId) throw new Error('Admin createUser returned no user id')

  const { data: signedIn, error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) throw signInError
  if (!signedIn.session?.access_token) throw new Error('No session returned from signIn')

  const now = new Date().toISOString()

  const { data: inserted, error: insertError } = await client
    .from('posts')
    .insert({
      title: 'RLS publish test',
      content: 'ok',
      user_id: userId,
      author_id: userId,
      status: 'published',
      created_at: now,
      updated_at: now,
      view_count: 0,
      likes_count: 0,
      comments_count: 0,
      attachments: [],
      images: [],
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  postId = inserted?.id

  console.log('✅ Insert succeeded. postId:', postId)
} finally {
  if (postId != null) {
    await admin.from('posts').delete().eq('id', postId)
  }
  if (userId) {
    await admin.auth.admin.deleteUser(userId)
  }
}

