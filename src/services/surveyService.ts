// 满意度调查服务
import { SurveyFormData } from '@/components/SatisfactionSurvey'

// 满意度调查数据类型
export interface SurveyData {
  id: string
  userId: string
  username: string
  rating: number
  feedbackType: string
  comments?: string
  createdAt: Date
  status: 'pending' | 'processed'
}

// 模拟存储
const surveys: SurveyData[] = []

// 生成唯一ID
const generateId = (): string => {
  return `survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 满意度调查服务
const surveyService = {
  /**
   * 提交满意度调查
   */
  submitSurvey: (data: SurveyFormData, userId: string, username: string): SurveyData => {
    const survey: SurveyData = {
      id: generateId(),
      userId,
      username,
      rating: data.rating,
      feedbackType: data.feedbackType,
      comments: data.comments,
      createdAt: new Date(),
      status: 'pending'
    }
    
    surveys.push(survey)
    
    // 实际项目中这里应该调用API提交调查数据
    console.log('提交满意度调查:', survey)
    
    return survey
  },
  
  /**
   * 获取所有满意度调查
   */
  getAllSurveys: (): SurveyData[] => {
    // 实际项目中这里应该调用API获取调查数据
    return surveys
  },
  
  /**
   * 根据ID获取满意度调查
   */
  getSurveyById: (id: string): SurveyData | undefined => {
    // 实际项目中这里应该调用API获取调查数据
    return surveys.find(survey => survey.id === id)
  },
  
  /**
   * 更新满意度调查状态
   */
  updateSurveyStatus: (id: string, status: 'pending' | 'processed'): SurveyData | undefined => {
    const survey = surveys.find(survey => survey.id === id)
    if (survey) {
      survey.status = status
      // 实际项目中这里应该调用API更新调查状态
      console.log('更新满意度调查状态:', survey)
    }
    return survey
  },
  
  /**
   * 获取满意度统计数据
   */
  getSurveyStats: () => {
    const total = surveys.length
    const averageRating = total > 0 ? surveys.reduce((sum, survey) => sum + survey.rating, 0) / total : 0
    const ratingsByType = surveys.reduce((acc, survey) => {
      acc[survey.feedbackType] = (acc[survey.feedbackType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingsByType
    }
  }
}

export default surveyService
