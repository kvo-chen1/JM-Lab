import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import eventBus from '../lib/eventBus'

export interface WorkflowState {
  // 品牌相关
  brandId?: string
  brandName?: string
  
  // 创作输入
  inputText?: string
  imageUrl?: string
  
  // AI生成变体
  variants?: Array<{ script: string; image: string; video: string; loading?: boolean }>
  
  // 真实性评估
  authenticity?: { score: number; feedback: string[] }
  
  // 新增：作品相关
  workId?: string
  workTitle?: string
  workDescription?: string
  workCategory?: string
  workTags?: string[]
  workStatus?: 'draft' | 'pending' | 'published' | 'rejected'
  
  // 新增：创作过程
  currentStep?: number
  totalSteps?: number
  progress?: number
  
  // 新增：社区互动
  likesCount?: number
  commentsCount?: number
  sharesCount?: number
  isLiked?: boolean
  
  // 新增：会员状态
  membershipLevel?: 'free' | 'premium' | 'vip'
  
  // 新增：主题和语言
  theme?: 'light' | 'dark' | 'system'
  language?: 'zh-CN' | 'en-US' | 'zh-TW'
  
  // 新增：设备信息
  deviceType?: 'desktop' | 'mobile' | 'tablet'
}

interface WorkflowContextType {
  state: WorkflowState
  setState: (s: Partial<WorkflowState>) => void
  reset: () => void
  updatePartial: <K extends keyof WorkflowState>(key: K, value: WorkflowState[K]) => void
  incrementStep: () => void
  decrementStep: () => void
  setProgress: (progress: number) => void
  toggleLike: () => void
  addComment: (comment: any) => void
  shareWork: () => void
  // 新增：获取当前状态的特定部分
  getState: <K extends keyof WorkflowState>(key: K) => WorkflowState[K]
  // 新增：重置特定状态
  resetState: <K extends keyof WorkflowState>(keys: K[]) => void
  // 新增：监听状态变化
  subscribeToChanges: (callback: (state: WorkflowState, changes: Partial<WorkflowState>) => void) => () => void
}

const WorkflowContext = createContext<WorkflowContextType>({
  state: {},
  setState: () => {},
  reset: () => {},
  updatePartial: () => {},
  incrementStep: () => {},
  decrementStep: () => {},
  setProgress: () => {},
  toggleLike: () => {},
  addComment: () => {},
  shareWork: () => {},
  getState: () => undefined as any,
  resetState: () => {},
  subscribeToChanges: () => () => {},
})

export const useWorkflow = () => useContext(WorkflowContext)

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [state, set] = useState<WorkflowState>({})
  const [subscribers, setSubscribers] = useState<Array<(state: WorkflowState, changes: Partial<WorkflowState>) => void>>([])

  // 状态变更时发布事件
  useEffect(() => {
    // 监听事件总线，接收来自其他模块的状态更新
    const handleWorkflowUpdate = (data: any) => {
      if (data && data.state) {
        // 直接使用set而不是setState来避免循环调用
        set(prev => {
          const newState = { ...prev, ...data.state }
          // 通知订阅者但不发布事件，避免循环
          subscribers.forEach(callback => callback(newState, data.state))
          return newState
        })
      }
    }

    const handleDataRefresh = (data: any) => {
      if (data && data.type === 'workflow') {
        // 直接使用set而不是setState来避免循环调用
        set(prev => {
          const newState = { ...prev, ...(data.payload || {}) }
          // 通知订阅者但不发布事件，避免循环
          subscribers.forEach(callback => callback(newState, data.payload || {}))
          return newState
        })
      }
    }

    const listener1 = eventBus.subscribe('workflow:update', handleWorkflowUpdate)
    const listener2 = eventBus.subscribe('数据:刷新', handleDataRefresh)

    return () => {
      eventBus.unsubscribe('workflow:update', listener1)
      eventBus.unsubscribe('数据:刷新', listener2)
    }
  }, [subscribers])

  const setState = (s: Partial<WorkflowState>) => {
    set(prev => {
      const newState = { ...prev, ...s }
      // 发布状态更新事件
      eventBus.publish('workflow:update', { state: newState, changes: s })
      // 通知订阅者
      subscribers.forEach(callback => callback(newState, s))
      return newState
    })
  }

  const reset = () => {
    set({})
    // 发布重置事件
    eventBus.publish('workflow:reset', undefined)
    // 通知订阅者
    subscribers.forEach(callback => callback({}, {}))
  }

  const updatePartial = <K extends keyof WorkflowState>(key: K, value: WorkflowState[K]) => {
    setState({ [key]: value } as Partial<WorkflowState>)
  }

  const incrementStep = () => {
    setState(prev => {
      const newStep = (prev.currentStep || 0) + 1
      return {
        currentStep: newStep,
        progress: prev.totalSteps ? (newStep / prev.totalSteps) * 100 : 0
      }
    })
  }

  const decrementStep = () => {
    setState(prev => {
      const newStep = Math.max(0, (prev.currentStep || 1) - 1)
      return {
        currentStep: newStep,
        progress: prev.totalSteps ? (newStep / prev.totalSteps) * 100 : 0
      }
    })
  }

  const setProgress = (progress: number) => {
    setState({ progress })
  }

  const toggleLike = () => {
    setState(prev => {
      const isLiked = !prev.isLiked
      return {
        isLiked,
        likesCount: (prev.likesCount || 0) + (isLiked ? 1 : -1)
      }
    })
  }

  const addComment = (comment: any) => {
    setState(prev => ({
      commentsCount: (prev.commentsCount || 0) + 1
    }))
  }

  const shareWork = () => {
    setState(prev => ({
      sharesCount: (prev.sharesCount || 0) + 1
    }))
  }

  const getState = <K extends keyof WorkflowState>(key: K) => {
    return state[key]
  }

  const resetState = <K extends keyof WorkflowState>(keys: K[]) => {
    const resetObject = keys.reduce((acc, key) => {
      acc[key] = undefined as any
      return acc
    }, {} as Partial<WorkflowState>)
    setState(resetObject)
  }

  const subscribeToChanges = (callback: (state: WorkflowState, changes: Partial<WorkflowState>) => void) => {
    setSubscribers(prev => [...prev, callback])
    return () => {
      setSubscribers(prev => prev.filter(cb => cb !== callback))
    }
  }

  return (
    <WorkflowContext.Provider value={{
      state,
      setState,
      reset,
      updatePartial,
      incrementStep,
      decrementStep,
      setProgress,
      toggleLike,
      addComment,
      shareWork,
      getState,
      resetState,
      subscribeToChanges
    }}>
      {children}
    </WorkflowContext.Provider>
  )
}
