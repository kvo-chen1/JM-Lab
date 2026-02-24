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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// 任务状态配置
const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  pending: { label: '审核中', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  published: { label: '进行中', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  paused: { label: '已暂停', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  completed: { label: '已完成', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const participationStatusConfig = {
  applied: { label: '已申请', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  approved: { label: '已通过', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  active: { label: '进行中', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  completed: { label: '已完成', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
};

const submissionStatusConfig = {
  pending: { label: '审核中', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  approved: { label: '已通过', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  needs_revision: { label: '需修改', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
};

// 任务卡片组件
interface TaskCardProps {
  task: BrandTask;
  onViewDetail: (task: BrandTask) => void;
  participationStatus?: string;
}

function TaskCard({ task, onViewDetail, participationStatus }: TaskCardProps) {
  const { isDark } = useTheme();
  const status = statusConfig[task.status];

  const daysLeft = Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'} 
        p-5 hover:shadow-lg transition-all duration-300 cursor-pointer`}
      onClick={() => onViewDetail(task)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg
            bg-gradient-to-br from-blue-500 to-purple-500`}>
            {task.brand_name.charAt(0)}
          </div>
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</h3>
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
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {daysLeft > 0 ? `${daysLeft}天` : '已结束'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {task.required_tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {tag}
            </span>
          ))}
        </div>
        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </div>
    </motion.div>
  );
}

// 任务详情模态框
interface TaskDetailModalProps {
  task: BrandTask | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (task: BrandTask) => void;
  onSubmitWork: (task: BrandTask) => void;
  participationStatus?: string;
}

function TaskDetailModal({ task, isOpen, onClose, onApply, onSubmitWork, participationStatus }: TaskDetailModalProps) {
  const { isDark } = useTheme();

  if (!isOpen || !task) return null;

  const status = statusConfig[task.status];
  const daysLeft = Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
      >
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
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
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>单个作品奖励</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ¥{task.min_reward} - ¥{task.max_reward}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>剩余时间</p>
                <p className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {daysLeft > 0 ? `${daysLeft}天` : '已结束'}
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
              <div className={`mt-3 p-3 rounded-lg text-sm ${isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                {task.content}
              </div>
            )}
          </div>

          {/* 任务要求 */}
          <div>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>任务要求</h3>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>必须包含标签</p>
                <div className="flex flex-wrap gap-2">
                  {task.required_tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>发布位置</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.required_location}</p>
              </div>
              {task.content_requirements.length > 0 && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
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
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
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

          {/* 参与统计 */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.current_participants}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已参与</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.max_participants}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>名额上限</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.max_works_per_user}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>每人作品数</p>
            </div>
          </div>
        </div>

        <div className={`sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
              isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            关闭
          </button>
          {!participationStatus && task.status === 'published' && (
            <button
              onClick={() => onApply(task)}
              className="px-6 py-2.5 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              申请参与
            </button>
          )}
          {participationStatus === 'approved' && task.status === 'published' && (
            <button
              onClick={() => onSubmitWork(task)}
              className="px-6 py-2.5 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              提交作品
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// 申请参与模态框
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
        className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl p-6`}
      >
        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          申请参与任务
        </h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          申请参与「{task.title}」任务，品牌方审核通过后即可开始创作。
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
            className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
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

// 提交作品模态框
interface SubmitWorkModalProps {
  task: BrandTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function SubmitWorkModal({ task, isOpen, onClose, onSuccess }: SubmitWorkModalProps) {
  const { isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!task || !title.trim()) {
      toast.error('请填写作品标题');
      return;
    }
    setIsSubmitting(true);
    try {
      await brandTaskService.submitWork({
        task_id: task.id,
        work_title: title,
        content,
        tags,
      });
      toast.success('作品提交成功，请等待审核');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('提交失败：' + (error instanceof Error ? error.message : '未知错误'));
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
        className={`w-full max-w-lg rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl p-6`}
      >
        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          提交作品
        </h3>
        <div className="space-y-4 mb-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              作品标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="给您的作品起个标题"
              className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              作品描述
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="描述您的作品内容..."
              rows={4}
              className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              作品标签
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="添加标签，按回车确认"
                className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                请确保作品包含以下标签：{task.required_tags.join('、')}，并发布到{task.required_location}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="px-4 py-2 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            提交作品
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// 我的参与记录组件
interface MyParticipationsProps {
  onViewTask: (task: BrandTask) => void;
}

function MyParticipations({ onViewTask }: MyParticipationsProps) {
  const { isDark } = useTheme();
  const [participations, setParticipations] = useState<BrandTaskParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadParticipations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await brandTaskService.getMyParticipations();
      setParticipations(data);
    } catch (error) {
      console.error('加载参与记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParticipations();
  }, [loadParticipations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (participations.length === 0) {
    return (
      <div className={`text-center py-12 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <Target className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>您还没有参与任何任务</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {participations.map(participation => (
        <motion.div
          key={participation.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {participation.task?.brand_name?.charAt(0) || '?'}
              </div>
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${participationStatusConfig[participation.status]?.color || 'bg-gray-100'}`}>
                {participationStatusConfig[participation.status]?.label || participation.status}
              </span>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                收益: ¥{participation.total_earnings}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-4 text-xs">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                提交作品: {participation.submitted_works}
              </span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                已通过: {participation.approved_works}
              </span>
            </div>
            {participation.task && (
              <button
                onClick={() => onViewTask(participation.task as BrandTask)}
                className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                查看详情 <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// 主组件
export default function BrandTaskParticipation() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'available' | 'my-tasks' | 'earnings'>('available');
  const [tasks, setTasks] = useState<BrandTask[]>([]);
  const [myParticipations, setMyParticipations] = useState<BrandTaskParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<BrandTask | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
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

  // 加载收益汇总
  const loadEarningsSummary = useCallback(async () => {
    try {
      const summary = await brandTaskService.getEarningsSummary();
      setEarningsSummary(summary);
    } catch (error) {
      console.error('加载收益汇总失败:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadMyParticipations();
    loadEarningsSummary();
  }, [loadTasks, loadMyParticipations, loadEarningsSummary]);

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

  // 处理提交作品
  const handleSubmitWork = (task: BrandTask) => {
    setSelectedTask(task);
    setIsSubmitModalOpen(true);
  };

  // 处理申请成功
  const handleApplySuccess = () => {
    loadMyParticipations();
  };

  // 处理提交成功
  const handleSubmitSuccess = () => {
    loadMyParticipations();
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
          <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>本月收益: </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">¥{earningsSummary.this_month}</span>
          </div>
        </div>
      </div>

      {/* 收益统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>累计收益</p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ¥{earningsSummary.total_earnings}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>待结算</p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ¥{earningsSummary.pending_earnings}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已提现</p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ¥{earningsSummary.paid_earnings}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>参与任务</p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {myParticipations.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
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
                ? 'bg-blue-600 text-white shadow-md'
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
                placeholder="搜索任务..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
        <MyParticipations onViewTask={handleViewDetail} />
      )}

      {/* 收益明细 */}
      {activeTab === 'earnings' && (
        <div className={`p-8 text-center rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <History className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>收益明细功能开发中...</p>
        </div>
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
        onSubmitWork={handleSubmitWork}
        participationStatus={selectedTask ? getParticipationStatus(selectedTask.id) : undefined}
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

      {/* 提交作品模态框 */}
      <SubmitWorkModal
        task={selectedTask}
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSelectedTask(null);
        }}
        onSuccess={handleSubmitSuccess}
      />
    </div>
  );
}
