import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useTheme } from '@/hooks/useTheme'

// 满意度评分类型
export type SatisfactionRating = 1 | 2 | 3 | 4 | 5

// 反馈类型定义
export type SurveyFeedbackType = 'feature' | 'usability' | 'performance' | 'design' | 'other'

// 调查表单数据类型
export interface SurveyFormData {
  rating: SatisfactionRating
  feedbackType: SurveyFeedbackType
  comments?: string
}

interface SatisfactionSurveyProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SurveyFormData) => void
}

const SatisfactionSurvey: React.FC<SatisfactionSurveyProps> = ({ isOpen, onClose, onSubmit }) => {
  const { isDark } = useTheme()
  
  // 表单状态
  const [formData, setFormData] = useState<SurveyFormData>({
    rating: 5,
    feedbackType: 'feature',
    comments: ''
  })
  
  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 评分状态（用于交互效果）
  const [hoverRating, setHoverRating] = useState<SatisfactionRating | null>(null)
  
  // 表单输入处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) as SatisfactionRating : value
    }))
  }
  
  // 评分悬停处理
  const handleRatingHover = (rating: SatisfactionRating) => {
    setHoverRating(rating)
  }
  
  // 评分点击处理
  const handleRatingClick = (rating: SatisfactionRating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }))
  }
  
  // 表单提交处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 调用外部提交函数
      onSubmit(formData)
      
      // 显示成功提示
      toast.success('感谢您的反馈！您的评价对我们很重要。')
      
      // 关闭表单
      onClose()
      
      // 重置表单
      setFormData({
        rating: 5,
        feedbackType: 'feature',
        comments: ''
      })
    } catch (error) {
      console.error('提交满意度调查失败:', error)
      toast.error('提交失败，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 如果表单未打开，返回null
  if (!isOpen) return null
  
  // 反馈类型选项
  const feedbackTypeOptions = [
    { value: 'feature' as const, label: '功能建议' },
    { value: 'usability' as const, label: '易用性' },
    { value: 'performance' as const, label: '性能' },
    { value: 'design' as const, label: '设计' },
    { value: 'other' as const, label: '其他' }
  ]
  
  // 评分显示文本
  const getRatingText = (rating: SatisfactionRating) => {
    const texts = {
      1: '非常不满意',
      2: '不满意',
      3: '一般',
      4: '满意',
      5: '非常满意'
    }
    return texts[rating]
  }
  
  // 当前显示的评分（悬停优先）
  const displayRating = hoverRating || formData.rating
  
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
        className={`rounded-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-xl max-w-md w-full mx-4 overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 表单头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">满意度调查</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 标题 */}
          <div className="text-center">
            <h4 className="text-lg font-medium mb-2">请评价您的使用体验</h4>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
              您的反馈将帮助我们持续改进产品
            </p>
          </div>
          
          {/* 评分组件 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star as SatisfactionRating)}
                  onMouseEnter={() => handleRatingHover(star as SatisfactionRating)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="text-4xl transition-colors"
                  aria-label={`${star} 星`}
                >
                  <i className={`fas fa-star ${(hoverRating || formData.rating) >= star ? 'text-yellow-400' : isDark ? 'text-gray-600' : 'text-gray-300'}`}></i>
                </button>
              ))}
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {getRatingText(displayRating)}
            </p>
          </div>
          
          {/* 反馈类型 */}
          <div>
            <label className="block text-sm font-medium mb-2">反馈类型</label>
            <select
              name="feedbackType"
              value={formData.feedbackType}
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
          
          {/* 详细反馈 */}
          <div>
            <label className="block text-sm font-medium mb-2">详细反馈（可选）</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              placeholder="请分享您的具体体验或建议"
              rows={4}
              className={`w-full px-4 py-2 rounded-lg border ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
            />
          </div>
          
          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg transition-colors ${isDark
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
                提交评价
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default SatisfactionSurvey
