import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { brandTaskService, BrandTask, BrandTaskParticipant, BrandTaskSubmission } from '@/services/brandTaskService';
import { useAuth } from '@/hooks/useAuth';
import {
  Target,
  Search,
  Filter,
  Clock,
  DollarSign,
  Users,
  FileText,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  Heart,
  Bookmark,
  Share2,
  Plus,
  Upload,
  ExternalLink,
  Wallet,
  History,
  Award,
  BarChart3,
  Calendar,
  TrendingDown,
  PieChart,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit3,
  Trash2,
  Play,
  Pause,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// ============================================================================
// 配置
// ============================================================================

const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  pending: { label: '审核中', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  published: { label: '进行中', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  paused: { label: '已暂停', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  completed: { label: '已完成', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const participationStatusConfig = {
  applied: { label: '已申请', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
  approved: { label: '已通过', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  active: { label: '进行中', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Activity },
  completed: { label: '已完成', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: XCircle },
};

const submissionStatusConfig = {
  pending: { label: '审核中', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  approved: { label: '已通过', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  needs_revision: { label: '需修改', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: AlertCircle },
};

// ============================================================================
// 统计卡片组件
// ============================================================================

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendUp,
  isDark,
  color = 'blue'
}: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  isDark: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'pink';
}) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' },
    pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', icon: 'text-pink-500' },
  };

  const colors = colorClasses[color];

  return (
    <div className={`p-5 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {subtitle && <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 任务卡片组件
// ============================================================================

interface TaskCardProps {
  task: BrandTask;
  onViewDetail: (task: BrandTask) => void;
  participationStatus?: string;
}

function TaskCard({ task, onViewDetail, participationStatus }: TaskCardProps) {
  const { isDark } = useTheme();
  const status = statusConfig[task.status];

  const daysLeft = Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft < 0;
  const isEndingSoon = daysLeft >= 0 && daysLeft <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'} 
        p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group`}
      onClick={() => onViewDetail(task)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {task.brand_logo ? (
            <img 
              src={task.brand_logo} 
              alt={task.brand_name} 
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm" 
            />
          ) : (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg
              bg-gradient-to-br from-blue-500 to-purple-500 shadow-sm`}>
              {task.brand_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{task.brand_name}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
          {participationStatus && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${participationStatusConfig[participationStatus as keyof typeof participationStatusConfig]?.color || 'bg-gray-100'}`}>
              {participationStatusConfig[participationStatus as keyof typeof participationStatusConfig]?.label || participationStatus}
            </span>
          )}
        </div>
      </div>

      <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        {task.description}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className={`p-2.5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <DollarSign className="w-3 h-3" />
            奖励
          </div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ¥{task.min_reward}-{task.max_reward}
          </p>
        </div>
        <div className={`p-2.5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Users className="w-3 h-3" />
            名额
          </div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {task.current_participants}/{task.max_participants}
          </p>
        </div>
        <div className={`p-2.5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Clock className="w-3 h-3" />
            剩余
          </div>
          <p className={`text-sm font-semibold ${isExpired ? 'text-red-500' : isEndingSoon ? 'text-amber-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
            {isExpired ? '已结束' : `${daysLeft}天`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {task.required_tags.slice(0, 3).map((tag, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-full text-xs ${
              isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              #{tag}
            </span>
          ))}
        </div>
        <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </div>
    </motion.div>
  );
}

// ============================================================================
// 任务详情模态框
// ============================================================================

interface TaskDetailModalProps {
  task: BrandTask | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (task: BrandTask) => void;
  participationStatus?: string;
  mySubmissions?: BrandTaskSubmission[];
}

function TaskDetailModal({ task, isOpen, onClose, onApply, participationStatus, mySubmissions = [] }: TaskDetailModalProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  if (!isOpen || !task) return null;

  const status = statusConfig[task.status];
  const daysLeft = Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft < 0;

  const taskSubmissions = mySubmissions.filter(s => s.task_id === task.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl`}
      >
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{task.brand_name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 奖励信息 */}
          <div className={`p-5 rounded-xl ${isDark ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>单个作品奖励</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ¥{task.min_reward} - ¥{task.max_reward}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>剩余时间</p>
                <p className={`text-xl font-semibold ${isExpired ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isExpired ? '已结束' : `${daysLeft}天`}
                </p>
              </div>
            </div>
          </div>

          {/* 任务描述 */}
          <div>
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>任务描述</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {task.description}
            </p>
            {task.content && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${isDark ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                {task.content}
              </div>
            )}
          </div>

          {/* 任务要求 */}
          <div>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>任务要求</h3>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>必须包含标签</p>
                <div className="flex flex-wrap gap-2">
                  {task.required_tags.map((tag, i) => (
                    <span key={i} className={`px-3 py-1 rounded-full text-sm ${
                      isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>发布位置</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.required_location}</p>
              </div>
              {task.content_requirements.length > 0 && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>内容要求</p>
                  <ul className="space-y-1">
                    {task.content_requirements.map((req, i) => (
                      <li key={i} className={`text-sm flex items-start gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 激励计算说明 */}
          <div>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>激励计算方式</h3>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <div className="space-y-2 text-sm">
                {task.incentive_model?.metrics?.views && (
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>浏览量</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>每1000次 ¥{task.incentive_model.metrics.views.rate_per_1000}</span>
                  </div>
                )}
                {task.incentive_model?.metrics?.likes && (
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>点赞数</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>每个 ¥{task.incentive_model.metrics.likes.rate_per}</span>
                  </div>
                )}
                {task.incentive_model?.metrics?.favorites && (
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>收藏数</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>每个 ¥{task.incentive_model.metrics.favorites.rate_per}</span>
                  </div>
                )}
                {task.incentive_model?.metrics?.shares && (
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>分享数</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>每个 ¥{task.incentive_model.metrics.shares.rate_per}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 我的提交记录 */}
          {taskSubmissions.length > 0 && (
            <div>
              <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>我的提交</h3>
              <div className="space-y-2">
                {taskSubmissions.map(submission => {
                  const StatusIcon = submissionStatusConfig[submission.status]?.icon || FileText;
                  return (
                    <div key={submission.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${submission.status === 'approved' ? 'text-emerald-500' : submission.status === 'rejected' ? 'text-red-500' : 'text-amber-500'}`} />
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {submission.work_title || '未命名作品'}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${submissionStatusConfig[submission.status]?.color || 'bg-gray-100'}`}>
                          {submissionStatusConfig[submission.status]?.label || submission.status}
                        </span>
                      </div>
                      {submission.final_reward !== null && (
                        <p className={`text-xs mt-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          获得奖励: ¥{submission.final_reward}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 参与统计 */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.current_participants}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已参与</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.max_participants}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>名额上限</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.max_works_per_user}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>每人作品数</p>
            </div>
          </div>
        </div>

        <div className={`sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
              isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            关闭
          </button>
          {!participationStatus && task.status === 'published' && !isExpired && (
            <button
              onClick={() => onApply(task)}
              className="px-6 py-2.5 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
            >
              申请参与
            </button>
          )}
          {participationStatus === 'approved' && task.status === 'published' && !isExpired && (
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-2.5 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <Sparkles className="w-4 h-4" />
              去创作中心发布
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 申请参与模态框
// ============================================================================

interface ApplyModalProps {
  task: BrandTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ApplyModal({ task, isOpen, onClose, onSuccess }: ApplyModalProps) {
  const { isDark } = useTheme();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!task) return;
    setIsSubmitting(true);
    try {
      const success = await brandTaskService.applyForTask(task.id, message);
      if (success) {
        toast.success('申请提交成功，请等待审核');
        onSuccess();
        onClose();
      } else {
        toast.error('申请失败，请重试');
      }
    } catch (error) {
      toast.error('申请失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl p-6`}
      >
        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          申请参与任务
        </h3>
        <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
          <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            <span className="font-medium">{task.title}</span>
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-blue-400/70' : 'text-blue-600/80'}`}>
            {task.brand_name}
          </p>
        </div>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          申请参与此任务，品牌方审核通过后即可开始创作。
        </p>
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            申请留言（可选）
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="简单介绍您的创作经验和优势..."
            rows={4}
            className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            提交申请
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 我的参与记录组件
// ============================================================================

interface MyParticipationsProps {
  onViewTask: (task: BrandTask) => void;
  participations: BrandTaskParticipant[];
  isLoading: boolean;
  onRefresh: () => void;
}

function MyParticipations({ onViewTask, participations, isLoading, onRefresh }: MyParticipationsProps) {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredParticipations = participations.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['applied', 'approved', 'active'].includes(p.status);
    if (filter === 'completed') return ['completed', 'rejected', 'cancelled'].includes(p.status);
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (participations.length === 0) {
    return (
      <div className={`text-center py-16 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <Target className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>还没有参与任何任务</h3>
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>去浏览可参与的任务，开始赚取收益</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 过滤器 */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: '全部' },
          { id: 'active', label: '进行中' },
          { id: 'completed', label: '已完成' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.id
                ? 'bg-blue-500 text-white'
                : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={onRefresh}
          className={`ml-auto p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {filteredParticipations.length === 0 ? (
        <div className={`text-center py-12 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>该分类下暂无记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredParticipations.map(participation => {
            const StatusIcon = participationStatusConfig[participation.status]?.icon || Target;
            return (
              <motion.div
                key={participation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {participation.task?.brand_logo ? (
                      <img 
                        src={participation.task.brand_logo} 
                        alt={participation.task.brand_name} 
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-gray-700" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {participation.task?.brand_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {participation.task?.title || '未知任务'}
                      </h4>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {participation.task?.brand_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${participationStatusConfig[participation.status]?.color || 'bg-gray-100'}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {participationStatusConfig[participation.status]?.label || participation.status}
                    </div>
                    <p className={`text-sm mt-2 font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      收益: ¥{participation.total_earnings}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        提交: {participation.submitted_works}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        通过: {participation.approved_works}
                      </span>
                    </div>
                  </div>
                  {participation.task && (
                    <button
                      onClick={() => onViewTask(participation.task as BrandTask)}
                      className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium"
                    >
                      查看详情 <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 收益明细组件
// ============================================================================

interface EarningsDetailProps {
  participations: BrandTaskParticipant[];
  submissions: BrandTaskSubmission[];
  isLoading: boolean;
}

function EarningsDetail({ participations, submissions, isLoading }: EarningsDetailProps) {
  const { isDark } = useTheme();
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

  // 计算统计数据
  const totalEarnings = participations.reduce((sum, p) => sum + p.total_earnings, 0);
  const approvedSubmissions = submissions.filter(s => s.status === 'approved' && s.final_reward !== null);
  const totalApprovedReward = approvedSubmissions.reduce((sum, s) => sum + (s.final_reward || 0), 0);
  const avgReward = approvedSubmissions.length > 0 ? totalApprovedReward / approvedSubmissions.length : 0;

  // 按任务分组统计
  const taskEarnings = participations.map(p => ({
    task: p.task,
    earnings: p.total_earnings,
    submissions: p.submitted_works,
    approved: p.approved_works,
  })).filter(t => t.earnings > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 收益概览 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100'}`}>
        <div className="flex items-center gap-3 mb-4">
          <Wallet className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <span className={`font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>收益概览</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>¥{totalEarnings}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>累计收益</p>
          </div>
          <div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{approvedSubmissions.length}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>通过作品</p>
          </div>
          <div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>¥{avgReward.toFixed(0)}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均奖励</p>
          </div>
          <div>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{participations.filter(p => p.total_earnings > 0).length}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>有收益任务</p>
          </div>
        </div>
      </div>

      {/* 时间筛选 */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: '全部时间' },
          { id: 'month', label: '本月' },
          { id: 'week', label: '本周' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setTimeFilter(f.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFilter === f.id
                ? 'bg-blue-500 text-white'
                : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Download className="w-4 h-4" />
          导出
        </button>
      </div>

      {/* 任务收益列表 */}
      <div className="space-y-4">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>任务收益明细</h3>
        {taskEarnings.length === 0 ? (
          <div className={`text-center py-12 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <History className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>暂无收益记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {taskEarnings.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {item.task?.brand_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.task?.title || '未知任务'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.task?.brand_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      +¥{item.earnings}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.approved}/{item.submissions} 作品通过
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 主组件
// ============================================================================

export default function BrandTaskParticipation() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'available' | 'my-tasks' | 'earnings'>('available');
  const [tasks, setTasks] = useState<BrandTask[]>([]);
  const [myParticipations, setMyParticipations] = useState<BrandTaskParticipant[]>([]);
  const [mySubmissions, setMySubmissions] = useState<BrandTaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<BrandTask | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [earningsSummary, setEarningsSummary] = useState({
    total_earnings: 0,
    pending_earnings: 0,
    paid_earnings: 0,
    this_month: 0,
  });

  // 加载可参与的任务
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { tasks: data } = await brandTaskService.getPublishedTasks();
      setTasks(data);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载我的参与记录
  const loadMyParticipations = useCallback(async () => {
    try {
      const data = await brandTaskService.getMyParticipations();
      setMyParticipations(data);
    } catch (error) {
      console.error('加载参与记录失败:', error);
    }
  }, []);

  // 加载我的提交记录
  const loadMySubmissions = useCallback(async () => {
    try {
      const data = await brandTaskService.getMySubmissions();
      setMySubmissions(data);
    } catch (error) {
      console.error('加载提交记录失败:', error);
    }
  }, []);

  // 加载收益汇总
  const loadEarningsSummary = useCallback(async () => {
    try {
      const summary = await brandTaskService.getEarningsSummary();
      setEarningsSummary(summary);
    } catch (error) {
      console.error('加载收益汇总失败:', error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadTasks(),
      loadMyParticipations(),
      loadMySubmissions(),
      loadEarningsSummary(),
    ]);
  }, [loadTasks, loadMyParticipations, loadMySubmissions, loadEarningsSummary]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // 获取任务的参与状态
  const getParticipationStatus = (taskId: string) => {
    const participation = myParticipations.find(p => p.task_id === taskId);
    return participation?.status;
  };

  // 过滤任务
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.brand_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 处理查看详情
  const handleViewDetail = (task: BrandTask) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  // 处理申请参与
  const handleApply = (task: BrandTask) => {
    setSelectedTask(task);
    setIsApplyModalOpen(true);
  };

  // 处理申请成功
  const handleApplySuccess = () => {
    loadMyParticipations();
    loadEarningsSummary();
  };

  // 处理提交成功
  const handleSubmitSuccess = () => {
    loadMyParticipations();
    loadMySubmissions();
    loadEarningsSummary();
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>品牌任务</h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            参与品牌任务，发布优质内容获取收益
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100'}`}>
            <span className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>本月收益: </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">¥{earningsSummary.this_month}</span>
          </div>
        </div>
      </div>

      {/* 收益统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="累计收益"
          value={`¥${earningsSummary.total_earnings}`}
          icon={Wallet}
          isDark={isDark}
          color="emerald"
        />
        <StatCard
          title="待结算"
          value={`¥${earningsSummary.pending_earnings}`}
          icon={Clock}
          isDark={isDark}
          color="amber"
        />
        <StatCard
          title="已提现"
          value={`¥${earningsSummary.paid_earnings}`}
          icon={CheckCircle2}
          isDark={isDark}
          color="blue"
        />
        <StatCard
          title="参与任务"
          value={myParticipations.length}
          subtitle={`${myParticipations.filter(p => p.status === 'approved').length} 个进行中`}
          icon={Target}
          isDark={isDark}
          color="purple"
        />
      </div>

      {/* 标签页 */}
      <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        {[
          { id: 'available', label: '可参与任务', icon: Target },
          { id: 'my-tasks', label: '我的任务', icon: FileText },
          { id: 'earnings', label: '收益明细', icon: Wallet },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-md'
                : isDark
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 可参与任务 */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索任务标题或品牌..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className={`text-center py-16 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <Target className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {searchQuery ? '没有找到匹配的任务' : '暂无可参与的任务'}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {searchQuery ? '请尝试其他搜索条件' : '请稍后再来查看'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onViewDetail={handleViewDetail}
                  participationStatus={getParticipationStatus(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 我的任务 */}
      {activeTab === 'my-tasks' && (
        <MyParticipations 
          onViewTask={handleViewDetail} 
          participations={myParticipations}
          isLoading={isLoading}
          onRefresh={loadMyParticipations}
        />
      )}

      {/* 收益明细 */}
      {activeTab === 'earnings' && (
        <EarningsDetail
          participations={myParticipations}
          submissions={mySubmissions}
          isLoading={isLoading}
        />
      )}

      {/* 任务详情模态框 */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
        onApply={handleApply}
        participationStatus={selectedTask ? getParticipationStatus(selectedTask.id) : undefined}
        mySubmissions={mySubmissions}
      />

      {/* 申请参与模态框 */}
      <ApplyModal
        task={selectedTask}
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          setSelectedTask(null);
        }}
        onSuccess={handleApplySuccess}
      />

    </div>
  );
}
