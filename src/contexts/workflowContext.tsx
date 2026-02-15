import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react'
import eventBus from '../lib/eventBus'
import { brandWizardDraftService, BrandWizardDraft } from '@/services/brandWizardDraftService'

// localStorage key for workflow state persistence
const WORKFLOW_STATE_KEY = 'workflow_current_state'
const WORKFLOW_STEP_KEY = 'workflow_current_step'

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
  
  // 新增：品牌资产配置
  brandAssets?: {
    logo: string
    colors: string[]
    font: string
  }
  
  // 新增：草稿相关
  draftId?: string
  lastSavedAt?: number
}

interface WorkflowContextType {
  state: WorkflowState
  setState: (s: Partial<WorkflowState> | ((prev: WorkflowState) => Partial<WorkflowState>)) => void
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
  // 新增：草稿相关方法
  saveToDrafts: (currentStep: number) => Promise<BrandWizardDraft | null>
  loadFromDraft: (draftId: string) => Promise<boolean>
  isDirty: boolean
  lastSavedAt: number | null
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
  saveToDrafts: async () => null,
  loadFromDraft: async () => false,
  isDirty: false,
  lastSavedAt: null,
})

export const useWorkflow = () => useContext(WorkflowContext)

// Load persisted state from localStorage
const loadPersistedState = (): WorkflowState => {
  if (typeof localStorage === 'undefined') return {}
  try {
    const saved = localStorage.getItem(WORKFLOW_STATE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load persisted workflow state:', e)
  }
  return {}
}

// Load persisted step from localStorage
const loadPersistedStep = (): number => {
  if (typeof localStorage === 'undefined') return 1
  try {
    const saved = localStorage.getItem(WORKFLOW_STEP_KEY)
    return saved ? parseInt(saved, 10) || 1 : 1
  } catch (e) {
    return 1
  }
}

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [state, set] = useState<WorkflowState>(loadPersistedState())
  const [subscribers, setSubscribers] = useState<Array<(state: WorkflowState, changes: Partial<WorkflowState>) => void>>([])
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastStateRef = useRef<WorkflowState>(loadPersistedState())

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

  // Auto-save functionality
  useEffect(() => {
    // Check if state has meaningful changes
    const hasChanges = JSON.stringify(state) !== JSON.stringify(lastStateRef.current)
    if (hasChanges && state.brandName) {
      setIsDirty(true)
      
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      
      // Set new auto-save timer (30 seconds)
      autoSaveTimerRef.current = setTimeout(() => {
        if (state.brandName) {
          saveToDrafts(state.currentStep || 1)
        }
      }, 30000)
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [state])

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        // Only persist if there's meaningful data
        if (state.brandName || state.variants?.length || state.inputText) {
          localStorage.setItem(WORKFLOW_STATE_KEY, JSON.stringify(state))
        }
      } catch (e) {
        console.error('Failed to persist workflow state:', e)
      }
    }
  }, [state])

  const setState = (s: Partial<WorkflowState> | ((prev: WorkflowState) => Partial<WorkflowState>)) => {
    set(prev => {
      const changes = typeof s === 'function' ? s(prev) : s
      const newState = { ...prev, ...changes }
      // 发布状态更新事件
      eventBus.publish('workflow:update', { state: newState, changes })
      // 通知订阅者
      subscribers.forEach(callback => callback(newState, changes))
      return newState
    })
  }

  const reset = () => {
    set({})
    // 清除持久化的状态
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(WORKFLOW_STATE_KEY)
        localStorage.removeItem(WORKFLOW_STEP_KEY)
      } catch (e) {
        console.error('Failed to clear persisted workflow state:', e)
      }
    }
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

  // Save current state to drafts
  const saveToDrafts = useCallback(async (currentStep: number): Promise<BrandWizardDraft | null> => {
    try {
      const draft = await brandWizardDraftService.saveWorkflowState(
        state,
        currentStep,
        state.draftId
      )
      
      // Update state with draft info
      set(prev => ({
        ...prev,
        draftId: draft.id,
        lastSavedAt: draft.updatedAt
      }))
      
      setLastSavedAt(draft.updatedAt)
      setIsDirty(false)
      lastStateRef.current = { ...state, draftId: draft.id, lastSavedAt: draft.updatedAt }
      
      // Publish event
      eventBus.publish('workflow:draftSaved', { draft })
      
      return draft
    } catch (error) {
      console.error('Failed to save draft:', error)
      return null
    }
  }, [state])

  // Load state from draft
  const loadFromDraft = useCallback(async (draftId: string): Promise<boolean> => {
    try {
      const result = await brandWizardDraftService.loadDraft(draftId)
      if (!result) return false
      
      // Clear auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      
      // Update state with loaded data
      set({
        ...result.state,
        draftId,
        lastSavedAt: Date.now()
      })
      
      setLastSavedAt(Date.now())
      setIsDirty(false)
      lastStateRef.current = result.state
      
      // Publish event
      eventBus.publish('workflow:draftLoaded', { draftId, state: result.state })
      
      return true
    } catch (error) {
      console.error('Failed to load draft:', error)
      return false
    }
  }, [])

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
      subscribeToChanges,
      saveToDrafts,
      loadFromDraft,
      isDirty,
      lastSavedAt
    }}>
      {children}
    </WorkflowContext.Provider>
  )
}
