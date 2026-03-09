/**
 * 用户反馈系统类型定义
 */

/**
 * 反馈类型
 */
export type FeedbackType = 'bug' | 'experience' | 'feature' | 'other';

/**
 * 反馈状态
 */
export type FeedbackStatus = 'pending' | 'processing' | 'resolved';

/**
 * 反馈优先级
 */
export type FeedbackPriority = 'high' | 'medium' | 'low';

/**
 * 反馈表单数据
 */
export interface FeedbackFormData {
  type: FeedbackType;
  description: string;
  images: string[];
  contact?: string;
}

/**
 * 反馈项（完整）
 */
export interface FeedbackItem extends FeedbackFormData {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  createdAt: string;
  updatedAt: string;
  adminReply?: string;
}

/**
 * 反馈类型配置
 */
export interface FeedbackTypeConfig {
  value: FeedbackType;
  label: string;
  color: string;
}

/**
 * 反馈类型选项
 */
export const FEEDBACK_TYPE_OPTIONS: FeedbackTypeConfig[] = [
  { value: 'bug', label: '功能异常', color: '#ef4444' },
  { value: 'experience', label: '体验问题', color: '#f59e0b' },
  { value: 'feature', label: '功能建议', color: '#3b82f6' },
  { value: 'other', label: '其他', color: '#6b7280' }
];

/**
 * 反馈状态配置
 */
export interface FeedbackStatusConfig {
  value: FeedbackStatus;
  label: string;
  color: string;
  bgColor: string;
}

/**
 * 反馈状态选项
 */
export const FEEDBACK_STATUS_OPTIONS: FeedbackStatusConfig[] = [
  { value: 'pending', label: '待处理', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  { value: 'processing', label: '处理中', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  { value: 'resolved', label: '已解决', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' }
];

/**
 * 反馈优先级配置
 */
export interface FeedbackPriorityConfig {
  value: FeedbackPriority;
  label: string;
  color: string;
  bgColor: string;
}

/**
 * 反馈优先级选项
 */
export const FEEDBACK_PRIORITY_OPTIONS: FeedbackPriorityConfig[] = [
  { value: 'high', label: '高优先级', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  { value: 'medium', label: '中优先级', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  { value: 'low', label: '低优先级', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' }
];

/**
 * 反馈筛选参数
 */
export interface FeedbackFilterParams {
  search?: string;
  status?: FeedbackStatus;
  type?: FeedbackType;
  priority?: FeedbackPriority;
  page?: number;
  pageSize?: number;
}

/**
 * 反馈统计数据
 */
export interface FeedbackStats {
  total: number;
  today: number;
  pending: number;
  processing: number;
  resolved: number;
}

/**
 * 获取反馈类型标签
 */
export function getFeedbackTypeLabel(type: FeedbackType): string {
  return FEEDBACK_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type;
}

/**
 * 获取反馈类型颜色
 */
export function getFeedbackTypeColor(type: FeedbackType): string {
  return FEEDBACK_TYPE_OPTIONS.find(opt => opt.value === type)?.color || '#6b7280';
}

/**
 * 获取反馈状态标签
 */
export function getFeedbackStatusLabel(status: FeedbackStatus): string {
  return FEEDBACK_STATUS_OPTIONS.find(opt => opt.value === status)?.label || status;
}

/**
 * 获取反馈状态颜色
 */
export function getFeedbackStatusColor(status: FeedbackStatus): string {
  return FEEDBACK_STATUS_OPTIONS.find(opt => opt.value === status)?.color || '#6b7280';
}

/**
 * 获取反馈优先级标签
 */
export function getFeedbackPriorityLabel(priority: FeedbackPriority): string {
  return FEEDBACK_PRIORITY_OPTIONS.find(opt => opt.value === priority)?.label || priority;
}

/**
 * 获取反馈优先级颜色
 */
export function getFeedbackPriorityColor(priority: FeedbackPriority): string {
  return FEEDBACK_PRIORITY_OPTIONS.find(opt => opt.value === priority)?.color || '#6b7280';
}
