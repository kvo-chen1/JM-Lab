import React, { useState, useContext, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useTheme } from '@/hooks/useTheme'
import { AuthContext } from '@/contexts/authContext'
import { feedbackService, type FeedbackType } from '@/services/feedbackService'
import { supabase } from '@/lib/supabase'

// 反馈类型定义（复用 feedbackService 中的类型）
export type { FeedbackType }

// 反馈表单数据类型
export interface FeedbackFormData {
  type: FeedbackType
  title: string
  description: string
  email: string
  screenshot?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

interface UserFeedbackProps {
  isOpen: boolean
  onClose: () => void
}

const UserFeedback: React.FC<UserFeedbackProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme()
  const { user } = useContext(AuthContext)
  
  // 从 Supabase 会话获取用户ID（更可靠）
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  
  useEffect(() => {
    // 优先使用 AuthContext 的用户ID，如果不存在则从 Supabase 会话获取
    if (user?.id) {
      setSessionUserId(user.id)
    } else {
      // 从 Supabase 获取当前会话
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          setSessionUserId(session.user.id)
          console.log('[UserFeedback] 从 Supabase 会话获取用户ID:', session.user.id)
        } else {
          setSessionUserId(null)
          console.log('[UserFeedback] 用户未登录')
        }
      })
    }
  }, [user])
  
  // 当用户登录状态变化时，更新表单邮箱
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email
      }))
    }
  }, [user])
  
  // 表单状态
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: 'bug',
    title: '',
    description: '',
    email: '',
    priority: 'normal'
  })
  
  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false)
  // 错误状态
  const [errors, setErrors] = useState<Partial<Record<keyof FeedbackFormData, string>>>({})
  
  // 表单输入处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 清除对应字段的错误
    if (errors[name as keyof FeedbackFormData]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof FeedbackFormData]
        return newErrors
      })
    }
  }
  
  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FeedbackFormData, string>> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空'
    } else if (formData.title.length < 5) {
      newErrors.title = '标题至少5个字符'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '描述不能为空'
    } else if (formData.description.length < 10) {
      newErrors.description = '描述至少10个字符'
    }
    
    // 联系方式选填，如果填写了则验证格式
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // 表单提交处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证表单
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      console.log('[UserFeedback] 开始提交反馈:', formData)
      console.log('[UserFeedback] 当前用户ID:', sessionUserId)
      
      // 如果未填写联系方式，使用用户账号的邮箱
      const contactInfo = formData.email.trim() || user?.email || ''
      
      // 提交反馈到数据库 - 使用从 Supabase 会话获取的用户ID
      const result = await feedbackService.submitFeedback({
        type: formData.type,
        title: formData.title,
        content: formData.description,
        contact_info: contactInfo,
        contact_type: 'email',
        screenshots: formData.screenshot ? [formData.screenshot] : [],
        page_url: window.location.href,
        user_id: sessionUserId  // 使用从 Supabase 会话获取的用户ID
      })
      console.log('[UserFeedback] 提交成功:', result)

      // 显示成功提示
      toast.success('感谢您的反馈！我们会尽快处理。')

      // 关闭反馈表单
      onClose()

      // 重置表单 - 保留用户邮箱
      setFormData({
        type: 'bug',
        title: '',
        description: '',
        email: user?.email || '',
        priority: 'normal'
      })
    } catch (error) {
      console.error('提交反馈失败:', error)
      toast.error('提交反馈失败，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 如果表单未打开，返回null
  if (!isOpen) return null
  
  // 反馈类型选项（必须与数据库 user_feedbacks 表的 type 字段一致）
  const feedbackTypeOptions = [
    { value: 'bug', label: '功能异常' },
    { value: 'feature', label: '功能建议' },
    { value: 'complaint', label: '投诉建议' },
    { value: 'inquiry', label: '咨询问题' },
    { value: 'other', label: '其他' }
  ]
  
  // 优先级选项
  const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'normal', label: '普通' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' }
  ]
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[70] flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
      onClick={() => onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-xl max-w-lg w-full mx-4 overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 表单头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">用户反馈</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 反馈类型 */}
          <div>
            <label className="block text-sm font-medium mb-2">反馈类型</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {feedbackTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* 反馈标题 */}
          <div>
            <label className="block text-sm font-medium mb-2">标题</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="请简要描述您的反馈"
              className={`w-full px-4 py-2 rounded-lg border ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          
          {/* 反馈描述 */}
          <div>
            <label className="block text-sm font-medium mb-2">详细描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="请详细描述您遇到的问题或建议"
              rows={5}
              className={`w-full px-4 py-2 rounded-lg border ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          
          {/* 联系方式（选填） */}
          <div>
            <label className="block text-sm font-medium mb-2">
              联系方式
              <span className="text-gray-400 text-xs ml-1">(选填)</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="如需其他联系方式可在此填写"
              className={`w-full px-4 py-2 rounded-lg border ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            {!errors.email && (
              <p className="text-gray-400 text-xs mt-1">
                我们会通过您的账号联系您，如需其他联系方式可填写
              </p>
            )}
          </div>
          
          {/* 优先级 */}
          <div>
            <label className="block text-sm font-medium mb-2">优先级</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 rounded-lg transition-colors ${isDark
              ? 'bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600'
              : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300'}
              text-white font-medium disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                提交中...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                提交反馈
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default UserFeedback