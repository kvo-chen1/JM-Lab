import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { performanceMonitor } from '@/utils/performanceMonitor'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

// 性能指标卡片组件
interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  status?: 'good' | 'warning' | 'error'
  description?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit = '', status = 'good', description }) => {
  const statusColors = {
    good: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
      </div>
      <div className="flex items-baseline mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">{unit}</span>
      </div>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </motion.div>
  )
}

// 性能监控仪表盘组件
const PerformanceMonitoringDashboard: React.FC = () => {
  const { isDark } = useTheme()
  const { t } = useTranslation()
  const [metrics, setMetrics] = useState<any>({
    webVitals: {},
    networkStats: {},
    componentStats: {},
    memoryUsage: {},
    audit: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'5m' | '15m' | '1h' | '24h'>('1h')

  // 获取性能指标
  const fetchMetrics = useCallback(async () => {
    setIsLoading(true)
    try {
      // 获取 Web Vitals
      const webVitals = {
        LCP: performanceMonitor.getMetrics().find((m: any) => m.name === 'LCP')?.value || 0,
        FID: performanceMonitor.getMetrics().find((m: any) => m.name === 'FID')?.value || 0,
        CLS: performanceMonitor.getMetrics().find((m: any) => m.name === 'CLS')?.value || 0,
        TTFB: performanceMonitor.getMetrics().find((m: any) => m.name === 'TTFB')?.value || 0,
        INP: performanceMonitor.getMetrics().find((m: any) => m.name === 'INP')?.value || 0
      }

      // 获取网络请求统计
      const networkStats = performanceMonitor.getNetworkRequestStats()

      // 获取组件渲染统计
      const componentStats = performanceMonitor.getComponentRenderStats()

      // 获取内存使用情况
      const memoryUsage = performanceMonitor.getMemoryUsage().slice(-1)[0] || {}

      // 运行{t('performance.runAuditButton')}
      const audit = await performanceMonitor.runAudit()

      setMetrics({
        webVitals,
        networkStats,
        componentStats,
        memoryUsage,
        audit
      })
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
      toast.error(t('performance.fetchFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 定期更新性能指标
  useEffect(() => {
    fetchMetrics()
    // 减少轮询频率以降低 Supabase 出口流量使用
    const interval = setInterval(fetchMetrics, 300000) // 每5分钟更新一次
    return () => clearInterval(interval)
  }, [fetchMetrics])

  // 手动刷新指标
  const handleRefresh = () => {
    fetchMetrics()
    toast.success(t('performance.refreshSuccess'))
  }

  // 清除所有指标
  const handleClearMetrics = () => {
    performanceMonitor.clearMetrics()
    fetchMetrics()
    toast.success(t('performance.clearSuccess'))
  }

  // 运行完整审计
  const handleRunAudit = async () => {
    setIsLoading(true)
    try {
      const audit = await performanceMonitor.runAudit()
      setMetrics((prev: any) => ({ ...prev, audit }))
      toast.success(t('performance.auditSuccess'))
    } catch (error) {
      console.error('Failed to run performance audit:', error)
      toast.error(t('performance.auditFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 计算 Web Vitals 状态
  const getWebVitalStatus = (name: string, value: number): 'good' | 'warning' | 'error' => {
    switch (name) {
      case 'LCP':
        if (value < 2500) return 'good'
        if (value < 4000) return 'warning'
        return 'error'
      case 'FID':
        if (value < 100) return 'good'
        if (value < 300) return 'warning'
        return 'error'
      case 'CLS':
        if (value < 0.1) return 'good'
        if (value < 0.25) return 'warning'
        return 'error'
      case 'TTFB':
        if (value < 800) return 'good'
        if (value < 1800) return 'warning'
        return 'error'
      case 'INP':
        if (value < 200) return 'good'
        if (value < 500) return 'warning'
        return 'error'
      default:
        return 'good'
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t('performance.dashboardTitle')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('performance.dashboardDescription')}
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            {(['5m', '15m', '1h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isLoading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            <i className="fas fa-sync-alt"></i>
            {t('performance.refreshButton')}
          </button>
          <button
            onClick={handleRunAudit}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isLoading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'}`}
          >
            <i className="fas fa-search"></i>
            运行审计
          </button>
        </div>
      </div>

      {/* 核心 Web Vitals */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">核心 Web Vitals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(metrics.webVitals).map(([name, value]) => (
            <MetricCard
              key={name}
              title={name}
              value={Math.round(value as number)}
              unit="ms"
              status={getWebVitalStatus(name, value as number)}
              description={{
                LCP: '最大内容绘制时间',
                FID: '首次输入延迟',
                CLS: '累积布局偏移',
                TTFB: '首字节时间',
                INP: '交互到下一次绘制'
              }[name]}
            />
          ))}
        </div>
      </div>

      {/* 性能评分 */}
      {metrics.audit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-bold mb-1">性能评分</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">基于核心 Web Vitals 的综合评分</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-5xl font-bold">{metrics.audit.score}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">满分：100</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.audit.score}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full transition-colors ${metrics.audit.score >= 80
                  ? 'bg-green-500'
                  : metrics.audit.score >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'}`}
              ></motion.div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 网络请求统计 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">网络请求统计</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="总请求数"
            value={metrics.networkStats.totalRequests}
            unit=""
            status="good"
            description="最近一段时间内的网络请求总数"
          />
          <MetricCard
            title="平均响应时间"
            value={Math.round(metrics.networkStats.averageDuration || 0)}
            unit="ms"
            status={metrics.networkStats.averageDuration && metrics.networkStats.averageDuration > 1000 ? 'warning' : 'good'}
            description="网络请求的平均响应时间"
          />
          <MetricCard
            title="缓存命中率"
            value={Math.round((metrics.networkStats.cacheHitRate || 0) * 100)}
            unit="%"
            status={metrics.networkStats.cacheHitRate && metrics.networkStats.cacheHitRate < 0.5 ? 'warning' : 'good'}
            description="从缓存中获取的请求比例"
          />
          <MetricCard
            title="成功率"
            value={Math.round((metrics.networkStats.successRate || 0) * 100)}
            unit="%"
            status={metrics.networkStats.successRate && metrics.networkStats.successRate < 0.95 ? 'error' : 'good'}
            description="成功响应的请求比例"
          />
        </div>
      </div>

      {/* 组件渲染统计 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">组件渲染统计</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="总渲染次数"
            value={Object.values(metrics.componentStats).reduce((sum: number, stats: any) => sum + stats.renderCount, 0)}
            unit=""
            status="good"
            description="所有组件的总渲染次数"
          />
          <MetricCard
            title="平均渲染时间"
            value={Math.round(Object.values(metrics.componentStats).reduce((sum: number, stats: any) => sum + stats.averageRenderTime, 0) / (Object.values(metrics.componentStats).length || 1))}
            unit="ms"
            status={Object.values(metrics.componentStats).some((stats: any) => stats.averageRenderTime > 16) ? 'warning' : 'good'}
            description="组件的平均渲染时间"
          />
          <MetricCard
            title="组件数量"
            value={Object.keys(metrics.componentStats).length}
            unit=""
            status="good"
            description="被监控的组件数量"
          />
        </div>
      </div>

      {/* 内存使用情况 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">内存使用情况</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            title="已使用堆内存"
            value={Math.round((metrics.memoryUsage.usedJSHeapSize || 0) / (1024 * 1024))}
            unit="MB"
            status="good"
            description="JavaScript 已使用的堆内存大小"
          />
          <MetricCard
            title="总堆内存"
            value={Math.round((metrics.memoryUsage.totalJSHeapSize || 0) / (1024 * 1024))}
            unit="MB"
            status="good"
            description="JavaScript 总堆内存大小"
          />
        </div>
      </div>

      {/* 优化建议 */}
      {metrics.audit && metrics.audit.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold mb-4">优化建议</h2>
          <ul className="space-y-3">
            {metrics.audit.suggestions.map((suggestion: string, index: number) => (
              <li key={index} className="flex gap-3">
                <i className="fas fa-lightbulb text-yellow-500 mt-0.5"></i>
                <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleClearMetrics}
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-trash"></i>
          清除指标
        </button>
      </div>
    </div>
  )
}

export default PerformanceMonitoringDashboard
