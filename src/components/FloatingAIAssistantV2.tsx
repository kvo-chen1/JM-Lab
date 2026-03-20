import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { useLocation } from 'react-router-dom'
import AICollaborationPanel from './AICollaborationPanel'
import ErrorBoundary from './ErrorBoundary'
import { useTranslation } from 'react-i18next'
import { IPMascotChatTrigger } from '@/components/ip-mascot'

interface FloatingAIAssistantV2Props {
  defaultOpen?: boolean
}

const PATH_TO_PAGE_KEY: Record<string, string> = {
  '/': 'home',
  '/cultural-knowledge': 'culturalKnowledge',
  '/creation-workshop': 'creationWorkshop',
  '/marketplace': 'marketplace',
  '/community': 'community',
  '/my-works': 'myWorks',
  '/explore': 'explore',
  '/create': 'create',
  '/dashboard': 'dashboard',
  '/settings': 'settings',
  '/neo': 'neo',
  '/events': 'events',
  '/wizard': 'wizard',
  '/square': 'square'
}

export default function FloatingAIAssistantV2({ defaultOpen = false }: FloatingAIAssistantV2Props) {
  const { isDark } = useTheme()
  const location = useLocation()
  const { t } = useTranslation()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const draggedRef = useRef(false)

  // 从 localStorage 加载保存的打开状态
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('aiAssistantOpenState')
      return savedState ? JSON.parse(savedState) : defaultOpen
    }
    return defaultOpen
  })
  const [positionStyle, setPositionStyle] = useState({ x: 20, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [windowHeight, setWindowHeight] = useState(0)
  const [windowWidth, setWindowWidth] = useState(0)

  // 安全获取窗口尺寸，避免hydration mismatch
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      setWindowWidth(newWidth)
      setWindowHeight(newHeight)
      
      // 确保按钮不会超出屏幕边界
      setPositionStyle(prev => {
        const buttonWidth = 80
        const buttonHeight = 80
        // 确保位置在屏幕范围内
        const newX = Math.max(0, Math.min(prev.x, newWidth - buttonWidth))
        const newY = Math.max(0, Math.min(prev.y, newHeight - buttonHeight))
        return { x: newX, y: newY }
      })
    }
    
    // 初始设置尺寸
    handleResize()
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize)
    
    // 清理监听器
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const currentPath = location.pathname
  const currentPage = useMemo(() => {
    const key = PATH_TO_PAGE_KEY[currentPath]
    return key ? t(`aiAssistant.pages.${key}`) : t('aiAssistant.pages.unknown')
  }, [currentPath, t])

  // 从 localStorage 加载保存的位置，并确保在屏幕范围内
  useEffect(() => {
    const savedPosition = localStorage.getItem('aiAssistantPosition')
    if (!savedPosition) {
      // 如果没有保存的位置，使用默认位置（左下角）
      setPositionStyle({ x: 20, y: window.innerHeight - 100 })
      return
    }
    try {
      const { x, y } = JSON.parse(savedPosition)
      if (typeof x === 'number' && typeof y === 'number') {
        // 确保加载的位置在屏幕范围内
        const buttonWidth = 80
        const buttonHeight = 80
        const safeX = Math.max(0, Math.min(x, window.innerWidth - buttonWidth))
        const safeY = Math.max(0, Math.min(y, window.innerHeight - buttonHeight))
        setPositionStyle({ x: safeX, y: safeY })
      }
    } catch {
      // 解析失败时使用默认位置
      setPositionStyle({ x: 20, y: window.innerHeight - 100 })
    }
  }, [])

  // 保存打开状态到 localStorage
  useEffect(() => {
    localStorage.setItem('aiAssistantOpenState', JSON.stringify(isOpen))
  }, [isOpen])

  useEffect(() => {
    if (!isDragging) return

    const onMove = (e: MouseEvent | TouchEvent) => {
      const point = 'touches' in e ? e.touches[0] : e
      if (!point) return

      const buttonWidth = 80
      const buttonHeight = 80
      let newX = point.clientX - dragOffset.x
      let newY = point.clientY - dragOffset.y
      newX = Math.max(0, Math.min(newX, windowWidth - buttonWidth))
      newY = Math.max(0, Math.min(newY, windowHeight - buttonHeight))

      draggedRef.current = true
      setPositionStyle({ x: newX, y: newY })
      localStorage.setItem('aiAssistantPosition', JSON.stringify({ x: newX, y: newY }))
    }

    const onEnd = () => {
      setIsDragging(false)
      setTimeout(() => {
        draggedRef.current = false
      }, 0)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onEnd)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [dragOffset, isDragging])

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const point = 'touches' in e ? e.touches[0] : e
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    setDragOffset({
      x: point.clientX - rect.left,
      y: point.clientY - rect.top
    })
  }

  const openPanel = () => {
    if (draggedRef.current) return
    setIsOpen(true)
  }

  return (
    <>
      <div
        className="fixed"
        style={{
          left: `${positionStyle.x}px`,
          top: `${positionStyle.y}px`,
          zIndex: 99999
        }}
      >
        {/* IP形象动画按钮 */}
        <motion.div
          ref={buttonRef}
          animate={{ y: [0, -8, 0, -5, 0] }}
          transition={{ y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
          onClick={openPanel}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl z-[100] transition-all duration-300 transform hover:scale-125 cursor-${isDragging ? 'grabbing' : 'grab'} overflow-hidden`}
          aria-label={t('aiAssistant.aria.floatingButton')}
          whileHover={{
            scale: 1.25,
            boxShadow: isDark
              ? '0 12px 28px rgba(192, 44, 56, 0.5), 0 4px 12px rgba(192, 44, 56, 0.3)'
              : '0 12px 28px rgba(192, 44, 56, 0.5), 0 4px 12px rgba(192, 44, 56, 0.3)',
            y: -5
          }}
          whileTap={{ scale: 1.1, y: 0 }}
          style={{
            position: 'relative',
            zIndex: 99998,
            boxShadow: isDark
              ? '0 8px 25px rgba(0, 0, 0, 0.4), 0 2px 10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              : '0 8px 25px rgba(0, 0, 0, 0.2), 0 2px 10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden'
          }}
        >
          {/* IP动画视频 */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ borderRadius: '50%' }}
          >
            <source src="/AI IP.mp4" type="video/mp4" />
          </video>
          
          {/* 悬停时的光晕效果 */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: isDark 
                ? 'radial-gradient(circle, rgba(192,44,56,0.3) 0%, transparent 70%)' 
                : 'radial-gradient(circle, rgba(192,44,56,0.2) 0%, transparent 70%)'
            }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.8, 0.6]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      <ErrorBoundary fallback={
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg max-w-sm z-[1001]">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <i className="fas fa-exclamation-circle"></i>
            <span className="font-medium">AI助手加载失败</span>
          </div>
          <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-3">
            请尝试刷新页面或检查网络连接
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            刷新页面
          </button>
        </div>
      }>
        <AICollaborationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} context={{ page: currentPage, path: currentPath }} />
      </ErrorBoundary>
    </>
  )
}
