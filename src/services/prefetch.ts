const flags = new Map<string, {
  expireAt: number;
  priority: number;
  preloaded: boolean;
}>()

// 预加载优先级配置
const PRIORITY_LEVELS = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
} as const

// 基于当前路由的预测路由映射
const ROUTE_PREDICTIONS: Record<string, string[]> = {
  '/': ['/explore', '/create', '/community'],
  '/explore': ['/explore/:id', '/create', '/community'],
  '/create': ['/drafts', '/explore'],
  '/community': ['/community/:id', '/explore'],
  '/dashboard': ['/settings', '/collection', '/analytics'],
}

/**
 * 标记路由为已预取
 * @param key 路由键
 * @param options 预取选项
 */
export function markPrefetched(key: string, options?: {
  ttlMs?: number;
  priority?: number;
  preloaded?: boolean;
}) {
  const {
    ttlMs = 60000,
    priority = PRIORITY_LEVELS.MEDIUM,
    preloaded = false,
  } = options || {}
  
  const expireAt = Date.now() + ttlMs
  flags.set(key, {
    expireAt,
    priority,
    preloaded,
  })
}

/**
 * 检查路由是否已预取
 * @param key 路由键
 * @returns 是否已预取
 */
export function isPrefetched(key: string) {
  const info = flags.get(key)
  if (!info) return false
  if (Date.now() > info.expireAt) {
    flags.delete(key)
    return false
  }
  return true
}

/**
 * 清除预取标记
 * @param key 可选，要清除的路由键，不提供则清除所有
 */
export function clearPrefetch(key?: string) {
  if (key) flags.delete(key)
  else flags.clear()
}

/**
 * 智能预加载，基于当前路由预测可能访问的路由
 * @param currentPath 当前路由
 * @param preloadFn 预加载函数
 */
export function smartPrefetch(
  currentPath: string,
  preloadFn: (path: string) => void
) {
  // 仅预加载高频访问路由，减少预加载数量
  const highFrequencyRoutes = ['/', '/explore', '/neo', '/wizard'];
  
  // 获取预测的路由列表，只取前1个最可能访问的路由，减少预加载数量
  const predictedRoutes = (ROUTE_PREDICTIONS[currentPath] || [])
    .slice(0, 1)
    .filter(route => {
      // 只预加载高频访问路由
      const normalizedRoute = route.replace(/:\w+/g, 'example')
      return highFrequencyRoutes.includes(normalizedRoute)
    })
  
  // 如果没有预测的路由，直接返回
  if (predictedRoutes.length === 0) return
  
  // 只在浏览器空闲时进行预加载，避免阻塞主线程
  const idleCallback = (window as any).requestIdleCallback || ((fn: Function) => setTimeout(fn, 200))
  
  idleCallback(() => {
    // 按优先级预加载
    predictedRoutes.forEach((route, index) => {
      // 替换动态路由参数
      const normalizedRoute = route.replace(/:\w+/g, 'example')
      
      // 只预加载未预取的路由
      if (!isPrefetched(normalizedRoute)) {
        // 延迟预加载，避免阻塞主线程
        setTimeout(() => {
          preloadFn(normalizedRoute)
          markPrefetched(normalizedRoute, {
            priority: PRIORITY_LEVELS.MEDIUM,
            preloaded: true,
          })
        }, index * 100) // 减少延迟时间，提高预加载效率
      }
    })
  })
}

/**
 * 获取预取的路由列表，按优先级排序
 * @returns 排序后的预取路由列表
 */
export function getPrefetchedRoutes() {
  const now = Date.now()
  const validRoutes: Array<{
    key: string;
    priority: number;
  }> = []
  
  // 过滤掉过期的路由，并收集有效的路由
  flags.forEach((info, key) => {
    if (now <= info.expireAt) {
      validRoutes.push({ key, priority: info.priority })
    } else {
      flags.delete(key)
    }
  })
  
  // 按优先级排序，优先级高的排在前面
  return validRoutes.sort((a, b) => b.priority - a.priority)
}

/**
 * 预加载关键资源
 * @param resources 资源列表
 */
export function preloadCriticalResources(resources: Array<{
  url: string;
  as: 'script' | 'style' | 'image' | 'font' | 'fetch';
}>) {
  resources.forEach((resource) => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.url
      link.as = resource.as
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      
      // 预加载完成后移除 link 标签
      link.onload = () => {
        document.head.removeChild(link)
      }
      
      // 加载失败时移除 link 标签
      link.onerror = () => {
        document.head.removeChild(link)
      }
    }
  })
}
