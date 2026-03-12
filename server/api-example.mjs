/**
 * 示例：使用服务端 Supabase 客户端的 API 路由
 * 
 * 这个文件展示了如何将现有的 API 路由从 memoryDB/pg 迁移到 Supabase
 */

import { supabaseServer } from './supabase-server.mjs'

// ==================== 用户相关 API ====================

/**
 * 获取所有用户
 * 对应原 userDB.getAllUsers()
 */
export async function getAllUsers() {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * 根据 ID 查找用户
 * 对应原 userDB.findById(id)
 */
export async function findUserById(id) {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // 未找到记录
    throw error
  }
  return data
}

/**
 * 根据邮箱查找用户
 * 对应原 userDB.findByEmail(email)
 */
export async function findUserByEmail(email) {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

/**
 * 创建用户
 * 对应原 userDB.createUser(userData)
 */
export async function createUser(userData) {
  const { data, error } = await supabaseServer
    .from('users')
    .insert({
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 更新用户信息
 * 对应原 userDB.updateById(id, updateData)
 */
export async function updateUser(id, updateData) {
  const { data, error } = await supabaseServer
    .from('users')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ==================== 作品相关 API ====================

/**
 * 获取所有作品
 * 对应原 workDB.getAllWorks()
 */
export async function getAllWorks() {
  const { data, error } = await supabaseServer
    .from('works')
    .select(`
      *,
      creator:users!works_creator_id_fkey(id, username, avatar_url)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * 获取用户的作品
 * 对应原 workDB.getWorksByUserId(userId)
 */
export async function getWorksByUserId(userId, limit = 50, offset = 0) {
  const { data, error } = await supabaseServer
    .from('works')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  return data || []
}

/**
 * 创建作品
 * 对应原 workDB.createWork(workData)
 */
export async function createWork(workData) {
  const { data, error } = await supabaseServer
    .from('works')
    .insert({
      ...workData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ==================== 社群相关 API ====================

/**
 * 获取所有社群
 * 对应原 communityDB.getAllCommunities()
 */
export async function getAllCommunities() {
  const { data, error } = await supabaseServer
    .from('communities')
    .select(`
      *,
      creator:users!communities_creator_id_fkey(id, username, avatar_url),
      member_count:community_members(count)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * 创建社群
 * 对应原 communityDB.createCommunity(communityData)
 */
export async function createCommunity(communityData) {
  const { data, error } = await supabaseServer
    .from('communities')
    .insert({
      ...communityData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 加入社群
 * 对应原 communityDB.joinCommunity(userId, communityId, role)
 */
export async function joinCommunity(userId, communityId, role = 'member') {
  const { data, error } = await supabaseServer
    .from('community_members')
    .insert({
      user_id: userId,
      community_id: communityId,
      role: role,
      joined_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ==================== 测试函数 ====================

/**
 * 测试 Supabase 连接和基本操作
 */
export async function testSupabaseAPI() {
  console.log('\n========== Supabase API 测试 ==========')
  
  try {
    // 测试 1: 获取用户数量
    console.log('\n1. 测试获取用户数量...')
    const { count: userCount, error: countError } = await supabaseServer
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (countError) throw countError
    console.log('   ✓ 用户数量:', userCount)
    
    // 测试 2: 获取最新作品
    console.log('\n2. 测试获取最新作品...')
    const { data: works, error: worksError } = await supabaseServer
      .from('works')
      .select('id, title, creator_id, created_at')
      .limit(3)
    
    if (worksError) throw worksError
    console.log('   ✓ 作品数量:', works?.length || 0)
    if (works?.length > 0) {
      console.log('   ✓ 最新作品:', works[0].title)
    }
    
    // 测试 3: 获取社群列表
    console.log('\n3. 测试获取社群列表...')
    const { data: communities, error: communitiesError } = await supabaseServer
      .from('communities')
      .select('id, name, member_count')
      .limit(3)
    
    if (communitiesError) throw communitiesError
    console.log('   ✓ 社群数量:', communities?.length || 0)
    
    console.log('\n========== 所有测试通过! ==========\n')
    return true
  } catch (error) {
    console.error('\n✗ 测试失败:', error.message)
    console.error('错误详情:', error)
    return false
  }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testSupabaseAPI()
}
