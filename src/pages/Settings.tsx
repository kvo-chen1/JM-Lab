import { useState, useEffect, useContext } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { themeOrder } from '@/config/themeConfig'
import { Link, useNavigate } from 'react-router-dom'
import { useGuide } from '@/contexts/GuideContext'
import { AuthContext } from '@/contexts/authContext'
import { toast } from 'sonner'
import { 
  Download, 
  Trash2, 
  AlertTriangle, 
  X,
  Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import ModelSelector from '@/components/ModelSelector'

export default function Settings() {
  const { theme, isDark, toggleTheme, setTheme, availableThemes } = useTheme()
  const { startGuide } = useGuide()
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [showModelSelector, setShowModelSelector] = useState(false)
  
  // 数据导出状态
  const [isExporting, setIsExporting] = useState(false)
  
  // 账号注销确认
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 通知设置
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('notificationsEnabled')
    return saved ? JSON.parse(saved) : true
  })
  const [notificationSound, setNotificationSound] = useState<boolean>(() => {
    const saved = localStorage.getItem('notificationSound')
    return saved ? JSON.parse(saved) : true
  })
  const [notificationFrequency, setNotificationFrequency] = useState<string>(() => {
    const saved = localStorage.getItem('notificationFrequency')
    return saved || 'immediate'
  })
  
  // 隐私设置
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('dataCollectionEnabled')
    return saved ? JSON.parse(saved) : true
  })
  
  // 界面设置
  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('language')
    return saved || 'zh-CN'
  })
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('fontSize')
    return saved ? parseInt(saved) : 16
  })
  const [layoutCompactness, setLayoutCompactness] = useState<string>(() => {
    const saved = localStorage.getItem('layoutCompactness')
    return saved || 'standard'
  })
  
  // 高级设置
  const [developerMode, setDeveloperMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('developerMode')
    return saved ? JSON.parse(saved) : false
  })
  const [apiDebugging, setApiDebugging] = useState<boolean>(() => {
    const saved = localStorage.getItem('apiDebugging')
    return saved ? JSON.parse(saved) : false
  })
  const [performanceMonitoring, setPerformanceMonitoring] = useState<boolean>(() => {
    const saved = localStorage.getItem('performanceMonitoring')
    return saved ? JSON.parse(saved) : true
  })
  
  // 保存设置到localStorage
  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled))
  }, [notificationsEnabled])
  
  useEffect(() => {
    localStorage.setItem('notificationSound', JSON.stringify(notificationSound))
  }, [notificationSound])
  
  useEffect(() => {
    localStorage.setItem('notificationFrequency', notificationFrequency)
  }, [notificationFrequency])
  
  useEffect(() => {
    localStorage.setItem('dataCollectionEnabled', JSON.stringify(dataCollectionEnabled))
  }, [dataCollectionEnabled])
  
  useEffect(() => {
    localStorage.setItem('language', language)
    // 这里可以添加语言切换的逻辑
  }, [language])
  
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString())
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])
  
  useEffect(() => {
    localStorage.setItem('layoutCompactness', layoutCompactness)
    // 这里可以添加布局紧凑度切换的逻辑
  }, [layoutCompactness])
  
  useEffect(() => {
    localStorage.setItem('developerMode', JSON.stringify(developerMode))
  }, [developerMode])
  
  useEffect(() => {
    localStorage.setItem('apiDebugging', JSON.stringify(apiDebugging))
  }, [apiDebugging])
  
  useEffect(() => {
    localStorage.setItem('performanceMonitoring', JSON.stringify(performanceMonitoring))
  }, [performanceMonitoring])

  // 清除缓存功能
  const handleClearCache = () => {
    localStorage.clear()
    // 保留主题设置
    localStorage.setItem('theme', theme)
    // 刷新页面
    window.location.reload()
  }

  // 导出个人数据
  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const res = await fetch(`/api/user/export?userId=${user?.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.code === 0) {
          // 创建下载链接
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `user-data-${user?.username || 'export'}-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          toast.success('数据导出成功')
        } else {
          toast.error(data.message || '导出失败')
        }
      } else {
        toast.error('导出失败，请稍后重试')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('导出失败，请稍后重试')
    } finally {
      setIsExporting(false)
    }
  }

  // 注销账号
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '注销账号') {
      toast.error('请输入"注销账号"以确认')
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/user/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.code === 0) {
          toast.success('账号已注销')
          logout()
          navigate('/')
        } else {
          toast.error(data.message || '注销失败')
        }
      } else {
        toast.error('注销失败，请稍后重试')
      }
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error('注销失败，请稍后重试')
    } finally {
      setIsDeleting(false)
    }
  }
  
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">设置</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 主题设置 */}
          <div id="guide-step-settings-theme" className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">主题</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>当前主题</span>
                <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'} font-medium`}>
                  {theme === 'auto' ? '自动' : 
                   theme === 'light' ? '浅色' : 
                   theme === 'dark' ? '深色' : 
                   theme === 'pink' ? '粉色' : 
                   theme === 'blue' ? '蓝色' : '绿色'}
                </span>
              </div>
              <button
                onClick={() => {
                  // 直接切换主题
                  const currentIndex = themeOrder.indexOf(theme as typeof themeOrder[number]);
                  const nextIndex = (currentIndex + 1) % themeOrder.length;
                  setTheme(themeOrder[nextIndex]);
                }}
                className={`w-full py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                }`}
              >
                <i className="fas fa-palette text-lg"></i>
                <span className="font-medium">切换主题</span>
              </button>
            </div>
          </div>
          
          {/* 模型与API设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">模型与API</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>配置 Kimi/DeepSeek 密钥与模型参数，仅保存在本机。</p>
            <button onClick={() => setShowModelSelector(true)} className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white">打开模型设置</button>
          </div>
          
          {/* 通知设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">通知</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>启用通知</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationsEnabled} 
                    onChange={(e) => setNotificationsEnabled(e.target.checked)} 
                    className={`sr-only peer`}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>通知声音</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSound} 
                    onChange={(e) => setNotificationSound(e.target.checked)} 
                    className={`sr-only peer`}
                    disabled={!notificationsEnabled}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300 ${!notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>通知频率</label>
                <select 
                  value={notificationFrequency} 
                  onChange={(e) => setNotificationFrequency(e.target.value)} 
                  className={`w-full px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  disabled={!notificationsEnabled}
                >
                  <option value="immediate">立即</option>
                  <option value="daily">每日</option>
                  <option value="weekly">每周</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* 隐私设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">隐私</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>数据收集</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={dataCollectionEnabled} 
                    onChange={(e) => setDataCollectionEnabled(e.target.checked)} 
                    className={`sr-only peer`}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300`}></div>
                </label>
              </div>
              <div className="pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                <button onClick={handleClearCache} className={`w-full text-left px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors`}>
                  清除缓存
                </button>
              </div>
            </div>
          </div>
          
          {/* 界面设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">界面</h2>
            <div className="space-y-4">
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>语言</label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)} 
                  className={`w-full px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="zh-CN">中文 (简体)</option>
                  <option value="en-US">English</option>
                </select>
              </div>
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>字体大小: {fontSize}px</label>
                <input 
                  type="range" 
                  min="12" 
                  max="24" 
                  step="1" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(parseInt(e.target.value))} 
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                />
              </div>
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>布局紧凑度</label>
                <select 
                  value={layoutCompactness} 
                  onChange={(e) => setLayoutCompactness(e.target.value)} 
                  className={`w-full px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="compact">紧凑</option>
                  <option value="standard">标准</option>
                  <option value="spacious">宽松</option>
                </select>
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={startGuide}
                  className={`w-full text-left px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors flex items-center justify-between`}
                >
                  <span>重置新手引导</span>
                  <i className="fas fa-redo-alt text-sm opacity-50"></i>
                </button>
              </div>
            </div>
          </div>
          
          {/* 账户设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">账户</h2>
            <div className="space-y-3">
              <Link to="/profile/edit" className={`w-full text-left px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors flex items-center justify-between`}>
                <span>编辑个人资料</span>
                <i className="fas fa-chevron-right text-sm opacity-50"></i>
              </Link>
              <Link to="/password/change" className={`w-full text-left px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors flex items-center justify-between`}>
                <span>修改密码</span>
                <i className="fas fa-chevron-right text-sm opacity-50"></i>
              </Link>
              <Link to="/account/security" className={`w-full text-left px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors flex items-center justify-between`}>
                <span>账号安全设置</span>
                <i className="fas fa-chevron-right text-sm opacity-50"></i>
              </Link>
              <button 
                onClick={handleExportData}
                disabled={isExporting}
                className={`w-full text-left px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors flex items-center justify-between disabled:opacity-50`}
              >
                <span>导出个人数据</span>
                {isExporting ? (
                  <i className="fas fa-spinner fa-spin text-sm"></i>
                ) : (
                  <i className="fas fa-download text-sm opacity-50"></i>
                )}
              </button>
            </div>
          </div>

          {/* 危险操作区域 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6 border-2 border-red-200 dark:border-red-900/30`}>
            <h2 className="font-medium mb-3 text-red-600 dark:text-red-400">危险操作</h2>
            <div className="space-y-3">
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-left px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-between"
              >
                <span>注销账号</span>
                <i className="fas fa-exclamation-triangle text-sm"></i>
              </button>
            </div>
            <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              注销账号后，您的所有数据将被永久删除，无法恢复
            </p>
          </div>
          
          {/* 高级设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">高级</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>开发者模式</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={developerMode} 
                    onChange={(e) => setDeveloperMode(e.target.checked)} 
                    className={`sr-only peer`}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>API调试</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={apiDebugging} 
                    onChange={(e) => setApiDebugging(e.target.checked)} 
                    className={`sr-only peer`}
                    disabled={!developerMode}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300 ${!developerMode ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>性能监控</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={performanceMonitoring} 
                    onChange={(e) => setPerformanceMonitoring(e.target.checked)} 
                    className={`sr-only peer`}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300`}></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
      {showModelSelector && (
        <ModelSelector isOpen={showModelSelector} onClose={() => setShowModelSelector(false)} />
      )}

      {/* 注销账号确认对话框 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-600">注销账号</h3>
              </div>
              
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                此操作将永久删除您的账号和所有相关数据，包括：
              </p>
              
              <ul className={`list-disc list-inside mb-6 space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <li>个人资料和设置</li>
                <li>所有作品和草稿</li>
                <li>收藏和点赞记录</li>
                <li>消息和通知</li>
                <li>积分和成就</li>
              </ul>
              
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  请输入 "注销账号" 以确认
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                  placeholder="注销账号"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`flex-1 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== '注销账号'}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-spinner fa-spin"></i>
                      处理中...
                    </span>
                  ) : (
                    '确认注销'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
