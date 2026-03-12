import { MongoClient } from 'mongodb'

// 获取MongoDB连接字符串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jinmai_lab'

// 连接选项
const MONGODB_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  loggerLevel: 'error', // 禁用调试日志，只显示错误信息
  monitorCommands: false // 禁用命令监控日志
}

// 全局MongoDB客户端和数据库实例
let client = null
let db = null

/**
 * 初始化MongoDB连接
 */
export async function initMongoDB() {
  try {
    if (!client || !client.topology || !client.topology.isConnected()) {
      // 创建新连接
      client = new MongoClient(MONGODB_URI, MONGODB_OPTIONS)
      await client.connect()
      db = client.db()
      
      // 验证连接
      await db.command({ ping: 1 })
      console.log('MongoDB连接成功')
      
      // 初始化集合和索引
      await initCollections()
    }
    return db
  } catch (error) {
    console.error('MongoDB连接失败:', error.message)
    throw error
  }
}

/**
 * 初始化集合和索引
 */
async function initCollections() {
  try {
    // 初始化users集合
    const usersCollection = db.collection('users')
    
    // 创建唯一索引
    await usersCollection.createIndex({ email: 1 }, { unique: true })
    await usersCollection.createIndex({ username: 1 }, { unique: true })
    
    console.log('MongoDB集合和索引初始化成功')
  } catch (error) {
    console.error('初始化集合和索引失败:', error.message)
    throw error
  }
}

/**
 * 获取MongoDB数据库实例
 */
export async function getMongoDB() {
  if (!db || !client || !client.topology || !client.topology.isConnected()) {
    await initMongoDB()
  }
  return db
}

/**
 * 关闭MongoDB连接
 */
export async function closeMongoDB() {
  if (client && client.topology && client.topology.isConnected()) {
    await client.close()
    console.log('MongoDB连接已关闭')
  }
}