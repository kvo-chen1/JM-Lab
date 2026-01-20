// 共享服务层，提供跨模块的功能支持
import eventBus from '../lib/eventBus'
import { useAuth } from '../contexts/authContext'
import { useWorkflow } from '../contexts/workflowContext'
import apiClient from '../lib/apiClient'

// 数据转换选项
interface DataTransformOptions {
  format?: 'json' | 'csv' | 'xml' | 'plain'
  includeFields?: string[]
  excludeFields?: string[]
  renameFields?: Record<string, string>
  transformFields?: Record<string, (value: any) => any>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 错误处理选项
interface ErrorHandlingOptions {
  showNotification?: boolean
  logError?: boolean
  retry?: boolean
  retryCount?: number
  retryDelay?: number
  fallbackValue?: any
  errorCodeMapping?: Record<number, string>
}

// 缓存选项
interface CacheOptions {
  enabled?: boolean
  ttl?: number
  key?: string
  storageType?: 'memory' | 'local' | 'session'
}

// 共享服务类
class SharedService {
  // 数据转换方法
  transformData<T>(data: any, options: DataTransformOptions = {}): T {
    let result = { ...data }
    
    // 排除字段
    if (options.excludeFields && options.excludeFields.length > 0) {
      options.excludeFields.forEach(field => {
        delete result[field]
      })
    }
    
    // 仅包含指定字段
    if (options.includeFields && options.includeFields.length > 0) {
      const filteredResult: any = {}
      options.includeFields.forEach(field => {
        if (result[field] !== undefined) {
          filteredResult[field] = result[field]
        }
      })
      result = filteredResult
    }
    
    // 重命名字段
    if (options.renameFields) {
      Object.keys(options.renameFields).forEach(oldName => {
        const newName = options.renameFields![oldName]
        if (result[oldName] !== undefined) {
          result[newName] = result[oldName]
          delete result[oldName]
        }
      })
    }
    
    // 转换字段值
    if (options.transformFields) {
      Object.keys(options.transformFields).forEach(field => {
        if (result[field] !== undefined) {
          result[field] = options.transformFields![field](result[field])
        }
      })
    }
    
    // 排序
    if (options.sortBy && Array.isArray(result)) {
      result.sort((a: any, b: any) => {
        const aVal = a[options.sortBy!]
        const bVal = b[options.sortBy!]
        if (aVal < bVal) return options.sortOrder === 'desc' ? 1 : -1
        if (aVal > bVal) return options.sortOrder === 'desc' ? -1 : 1
        return 0
      })
    }
    
    // 分页
    if (options.limit && Array.isArray(result)) {
      const offset = options.offset || 0
      result = result.slice(offset, offset + options.limit)
    }
    
    return result as T
  }
  
  // 统一错误处理
  handleError(error: any, options: ErrorHandlingOptions = {}): any {
    const { 
      showNotification = true, 
      logError = true, 
      retry = false, 
      fallbackValue = null 
    } = options
    
    // 记录错误
    if (logError) {
      console.error('Shared Service Error:', error)
    }
    
    // 发布错误事件
    eventBus.publish('数据:刷新', {
      type: 'error',
      payload: { error, options }
    })
    
    // 显示通知
    if (showNotification) {
      // 这里可以集成通知系统
      console.log('Error Notification:', error.message || 'Unknown error')
    }
    
    // 返回默认值
    return fallbackValue
  }
  
  // 跨模块数据共享
  shareData(key: string, data: any, options: CacheOptions = {}): void {
    // 发布数据共享事件
    eventBus.publish('数据:刷新', {
      type: 'data-shared',
      payload: { key, data, options }
    })
    
    // 如果启用缓存，将数据保存到缓存
    if (options.enabled) {
      const cacheKey = options.key || `shared:${key}`
      // 使用API客户端的缓存机制
      apiClient.cache.prefetch(cacheKey, data, {
        ttl: options.ttl || 3600000 // 默认1小时
      })
    }
  }
  
  // 获取共享数据
  async getSharedData<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = options.key || `shared:${key}`
    
    // 先尝试从缓存获取
    if (options.enabled) {
      try {
        const cacheStats = apiClient.cache.getStats()
        console.log('Cache Stats:', cacheStats)
        // 这里可以添加从缓存获取数据的逻辑
      } catch (error) {
        console.error('Failed to get shared data from cache:', error)
      }
    }
    
    // 发布获取共享数据事件
    let result: T | null = null
    const listenerId = eventBus.subscribe('数据:刷新', (data) => {
      if (data.type === 'data-shared' && data.payload.key === key) {
        result = data.payload.data as T
      }
    })
    
    // 等待一段时间，看看是否能获取到数据
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 取消订阅
    eventBus.unsubscribe('数据:刷新', listenerId)
    
    return result
  }
  
  // 验证数据格式
  validateData(data: any, schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // 简单的schema验证
    if (schema && typeof schema === 'object') {
      Object.keys(schema).forEach(field => {
        const fieldSchema = schema[field]
        const value = data[field]
        
        // 检查必填字段
        if (fieldSchema.required && value === undefined) {
          errors.push(`${field} is required`)
        }
        
        // 检查类型
        if (fieldSchema.type && value !== undefined) {
          const type = typeof value
          if (type !== fieldSchema.type) {
            errors.push(`${field} should be ${fieldSchema.type}, got ${type}`)
          }
        }
        
        // 检查最小值
        if (fieldSchema.min !== undefined && value < fieldSchema.min) {
          errors.push(`${field} should be at least ${fieldSchema.min}`)
        }
        
        // 检查最大值
        if (fieldSchema.max !== undefined && value > fieldSchema.max) {
          errors.push(`${field} should be at most ${fieldSchema.max}`)
        }
        
        // 检查长度
        if (fieldSchema.length !== undefined && value.length !== fieldSchema.length) {
          errors.push(`${field} should be exactly ${fieldSchema.length} characters long`)
        }
        
        // 检查正则表达式
        if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
          errors.push(`${field} does not match the required pattern`)
        }
      })
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  // 格式化日期
  formatDate(date: Date | string | number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    const d = new Date(date)
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }
  
  // 生成唯一ID
  generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // 深度克隆对象
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any
    }
    
    if (typeof obj === 'object') {
      const clonedObj: any = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key])
        }
      }
      return clonedObj
    }
    
    return obj
  }
  
  // 防抖函数
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout)
      }
      
      timeout = setTimeout(() => {
        func(...args)
      }, wait)
    }
  }
  
  // 节流函数
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle = false
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
  
  // 检查权限
  checkPermission(permission: string, user?: any): boolean {
    // 这里可以实现更复杂的权限检查逻辑
    if (!user) {
      return false
    }
    
    if (user.isAdmin) {
      return true
    }
    
    // 根据用户角色和权限进行检查
    const permissions = {
      free: ['read', 'create', 'like', 'comment'],
      premium: ['read', 'create', 'like', 'comment', 'share', 'export'],
      vip: ['read', 'create', 'like', 'comment', 'share', 'export', 'admin', 'analytics']
    }
    
    const userPermissions = permissions[user.membershipLevel || 'free'] || permissions.free
    return userPermissions.includes(permission)
  }
  
  // 获取设备类型
  getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      if (userAgent.includes('ipad')) {
        return 'tablet'
      }
      return 'mobile'
    }
    
    return 'desktop'
  }
  
  // 获取浏览器信息
  getBrowserInfo(): {
    name: string
    version: string
    platform: string
    userAgent: string
  } {
    const userAgent = navigator.userAgent
    let name = 'Unknown'
    let version = 'Unknown'
    let platform = navigator.platform
    
    // 检测浏览器名称和版本
    if (/chrome|chromium|crios/i.test(userAgent)) {
      name = 'Chrome'
      const match = userAgent.match(/chrome\/([0-9.]+)/i)
      version = match ? match[1] : 'Unknown'
    } else if (/firefox|fxios/i.test(userAgent)) {
      name = 'Firefox'
      const match = userAgent.match(/firefox\/([0-9.]+)/i)
      version = match ? match[1] : 'Unknown'
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      name = 'Safari'
      const match = userAgent.match(/version\/([0-9.]+)/i)
      version = match ? match[1] : 'Unknown'
    } else if (/edg/i.test(userAgent)) {
      name = 'Edge'
      const match = userAgent.match(/edg\/([0-9.]+)/i)
      version = match ? match[1] : 'Unknown'
    } else if (/msie|trident/i.test(userAgent)) {
      name = 'Internet Explorer'
      const match = userAgent.match(/(?:msie |rv:)([0-9.]+)/i)
      version = match ? match[1] : 'Unknown'
    }
    
    return {
      name,
      version,
      platform,
      userAgent
    }
  }
  
  // 下载文件
  downloadFile(data: any, filename: string, options: { mimeType?: string; encoding?: string } = {}): void {
    const { mimeType = 'application/octet-stream', encoding = 'utf-8' } = options
    
    let blob: Blob
    
    if (typeof data === 'string') {
      blob = new Blob([data], { type: mimeType })
    } else if (data instanceof Blob) {
      blob = data
    } else {
      blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    }
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // 上传文件
  async uploadFile(file: File, options: { url?: string; method?: string; headers?: Record<string, string> } = {}): Promise<any> {
    const { url = '/api/upload', method = 'POST', headers = {} } = options
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      // 发布上传开始事件
      eventBus.publish('数据:刷新', {
        type: 'file-upload-start',
        payload: { file, options }
      })
      
      const response = await fetch(url, {
        method,
        headers,
        body: formData
      })
      
      const result = await response.json()
      
      // 发布上传成功事件
      eventBus.publish('数据:刷新', {
        type: 'file-upload-success',
        payload: { file, result, options }
      })
      
      return result
    } catch (error) {
      // 发布上传失败事件
      eventBus.publish('数据:刷新', {
        type: 'file-upload-failed',
        payload: { file, error, options }
      })
      
      throw error
    }
  }
}

// 导出共享服务实例
export const sharedService = new SharedService()

export default sharedService
