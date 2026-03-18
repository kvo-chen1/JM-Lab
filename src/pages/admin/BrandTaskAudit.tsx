import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { supabase, supabaseAdmin as originalSupabaseAdmin } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// 浏览器环境中使用普通 supabase 客户端替代 supabaseAdmin
const supabaseAdmin = typeof window !== 'undefined' ? supabase : originalSupabaseAdmin;
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  brandTaskService,
  BrandTask,
  BrandTaskParticipant,
  BrandTaskSubmission,
  TaskStats
} from '@/services/brandTaskService';

// 任务状态类型
type TaskStatus = 'all' | 'draft' | 'pending' | 'published' | 'paused' | 'completed' | 'cancelled';

// 提交作品状态
type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

// 参与者状态
type ParticipantStatus = 'applied' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';

// 审核标签页
type AuditTab = 'overview' | 'participants' | 'submissions' | 'analytics';

// 统计卡片数据
interface TaskStatsCard {
  totalTasks: number;
  publishedTasks: number;
  pendingReview: number;
  totalBudget: number;
  totalParticipants: number;
  totalSubmissions: number;
}

export default function BrandTaskAudit() {
  const { isDark } = useTheme();
  const { user: currentUser } = useContext(AuthContext);

  // 状态管理
  const [tasks, setTasks] = useState<BrandTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<BrandTask | null>(null);
  const [participants, setParticipants] = useState<BrandTaskParticipant[]>([]);
  const [submissions, setSubmissions] = useState<BrandTaskSubmission[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<AuditTab>('overview');
  const [stats, setStats] = useState<TaskStatsCard>({
    totalTasks: 0,
    publishedTasks: 0,
    pendingReview: 0,
    totalBudget: 0,
    totalParticipants: 0,
    totalSubmissions: 0
  });

  // 模态框状态
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<BrandTaskSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<BrandTaskParticipant | null>(null);
  const [showTaskReviewModal, setShowTaskReviewModal] = useState(false);
  const [showTaskRejectModal, setShowTaskRejectModal] = useState(false);
  const [taskReviewNotes, setTaskReviewNotes] = useState('');
  const [taskRejectReason, setTaskRejectReason] = useState('');

  // 获取所有品牌任务
  useEffect(() => {
    fetchAllTasks();
  }, []);

  // 获取任务详情数据
  useEffect(() => {
    if (selectedTask) {
      fetchTaskDetails(selectedTask.id);
    }
  }, [selectedTask, activeTab]);

  // 获取所有任务
  const fetchAllTasks = async () => {
    setLoading(true);
    try {
      // 使用 Supabase 获取所有品牌任务
      const query = supabaseAdmin
        .from('brand_tasks')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('获取品牌任务失败:', error);
        toast.error('获取品牌任务失败');
        return;
      }

      const tasksData = data || [];
      setTasks(tasksData);

      // 计算统计数据
      const publishedCount = tasksData.filter(t => t.status === 'published').length;
      const pendingCount = tasksData.filter(t => t.status === 'pending').length;
      const totalBudget = tasksData.reduce((sum, t) => sum + (t.total_budget || 0), 0);
      const totalParticipants = tasksData.reduce((sum, t) => sum + (t.current_participants || 0), 0);
      const totalSubmissions = tasksData.reduce((sum, t) => sum + (t.total_works || 0), 0);

      setStats({
        totalTasks: count || 0,
        publishedTasks: publishedCount,
        pendingReview: pendingCount,
        totalBudget,
        totalParticipants,
        totalSubmissions
      });
    } catch (error) {
      console.error('获取品牌任务失败:', error);
      toast.error('获取品牌任务失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取任务详情
  const fetchTaskDetails = async (taskId: string) => {
    setDetailLoading(true);
    try {
      // 获取参与者
      const participantsData = await brandTaskService.getTaskParticipants(taskId);
      setParticipants(participantsData);

      // 获取提交作品
      const submissionsData = await brandTaskService.getTaskSubmissions(taskId);
      setSubmissions(submissionsData);

      // 获取统计数据
      const statsData = await brandTaskService.getTaskStats(taskId);
      setTaskStats(statsData);

      // 获取分析数据
      const analyticsData = await brandTaskService.getTaskAnalytics(taskId, 30);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('获取任务详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  // 更新任务状态
  const handleUpdateTaskStatus = async (taskId: string, status: BrandTask['status'], notes?: string) => {
    try {
      let success = false;
      switch (status) {
        case 'published':
          success = await brandTaskService.approveTask(taskId, notes);
          break;
        case 'cancelled':
          if (!notes) {
            toast.error('请输入拒绝原因');
            return;
          }
          success = await brandTaskService.rejectTask(taskId, notes);
          break;
        case 'paused':
          success = await brandTaskService.pauseTask(taskId);
          break;
        case 'completed':
          success = await brandTaskService.completeTask(taskId);
          break;
        default:
          break;
      }

      if (success) {
        toast.success(`任务状态已更新为${getStatusLabel(status)}`);
        fetchAllTasks();
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, status });
        }
      }
    } catch (error) {
      console.error('更新任务状态失败:', error);
      toast.error('更新任务状态失败');
    }
  };

  // 审核任务
  const handleApproveTask = async () => {
    if (!selectedTask) return;
    try {
      const success = await brandTaskService.approveTask(selectedTask.id, taskReviewNotes);
      if (success) {
        toast.success('任务审核通过并已发布');
        fetchAllTasks();
        setSelectedTask({ ...selectedTask, status: 'published' });
        setShowTaskReviewModal(false);
        setTaskReviewNotes('');
      }
    } catch (error) {
      console.error('审核任务失败:', error);
      toast.error('审核任务失败');
    }
  };

  const handleRejectTask = async () => {
    if (!selectedTask) return;
    if (!taskRejectReason.trim()) {
      toast.error('请输入拒绝原因');
      return;
    }
    try {
      const success = await brandTaskService.rejectTask(selectedTask.id, taskRejectReason);
      if (success) {
        toast.success('任务已拒绝');
        fetchAllTasks();
        setSelectedTask({ ...selectedTask, status: 'cancelled' });
        setShowTaskRejectModal(false);
        setTaskRejectReason('');
      }
    } catch (error) {
      console.error('拒绝任务失败:', error);
      toast.error('拒绝任务失败');
    }
  };

  // 审核参与者
  const handleApproveParticipant = async (participantId: string) => {
    try {
      const success = await brandTaskService.approveParticipant(participantId);
      if (success) {
        toast.success('已通过参与者申请');
        if (selectedTask) {
          fetchTaskDetails(selectedTask.id);
        }
        setShowParticipantModal(false);
      }
    } catch (error) {
      console.error('审核参与者失败:', error);
      toast.error('审核参与者失败');
    }
  };

  const handleRejectParticipant = async (participantId: string) => {
    try {
      const success = await brandTaskService.rejectParticipant(participantId);
      if (success) {
        toast.success('已拒绝参与者申请');
        if (selectedTask) {
          fetchTaskDetails(selectedTask.id);
        }
        setShowParticipantModal(false);
      }
    } catch (error) {
      console.error('拒绝参与者失败:', error);
      toast.error('拒绝参与者失败');
    }
  };

  // 审核作品提交
  const handleApproveSubmission = async (submissionId: string) => {
    try {
      const success = await brandTaskService.approveSubmission(submissionId, reviewNotes);
      if (success) {
        toast.success('作品审核通过');
        if (selectedTask) {
          fetchTaskDetails(selectedTask.id);
        }
        setShowSubmissionModal(false);
        setReviewNotes('');
      }
    } catch (error) {
      console.error('审核作品失败:', error);
      toast.error('审核作品失败');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('请输入拒绝原因');
      return;
    }
    try {
      const success = await brandTaskService.rejectSubmission(submissionId, rejectionReason);
      if (success) {
        toast.success('作品已拒绝');
        if (selectedTask) {
          fetchTaskDetails(selectedTask.id);
        }
        setShowSubmissionModal(false);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('拒绝作品失败:', error);
      toast.error('拒绝作品失败');
    }
  };

  const handleRequestRevision = async (submissionId: string) => {
    if (!reviewNotes.trim()) {
      toast.error('请输入修改建议');
      return;
    }
    try {
      const success = await brandTaskService.requestRevision(submissionId, reviewNotes);
      if (success) {
        toast.success('已要求修改作品');
        if (selectedTask) {
          fetchTaskDetails(selectedTask.id);
        }
        setShowSubmissionModal(false);
        setReviewNotes('');
      }
    } catch (error) {
      console.error('请求修改失败:', error);
      toast.error('请求修改失败');
    }
  };

  // 筛选任务
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.brand_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': '草稿',
      'pending': '待审核',
      'published': '已发布',
      'paused': '已暂停',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-600',
      'pending': 'bg-yellow-100 text-yellow-600',
      'published': 'bg-green-100 text-green-600',
      'paused': 'bg-orange-100 text-orange-600',
      'completed': 'bg-blue-100 text-blue-600',
      'cancelled': 'bg-red-100 text-red-600'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-600';
  };

  // 获取提交状态标签
  const getSubmissionStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已拒绝',
      'needs_revision': '需修改'
    };
    return statusMap[status] || status;
  };

  // 获取提交状态颜色
  const getSubmissionStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-600',
      'approved': 'bg-green-100 text-green-600',
      'rejected': 'bg-red-100 text-red-600',
      'needs_revision': 'bg-orange-100 text-orange-600'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-600';
  };

  // 获取参与者状态标签
  const getParticipantStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'applied': '已申请',
      'approved': '已通过',
      'rejected': '已拒绝',
      'active': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 获取参与者状态颜色
  const getParticipantStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'applied': 'bg-yellow-100 text-yellow-600',
      'approved': 'bg-green-100 text-green-600',
      'rejected': 'bg-red-100 text-red-600',
      'active': 'bg-blue-100 text-blue-600',
      'completed': 'bg-purple-100 text-purple-600',
      'cancelled': 'bg-gray-100 text-gray-600'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-600';
  };

  // 格式化时间
  const formatTime = (timestamp: string | number) => {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化金额
  const formatMoney = (amount: number) => {
    return `¥${(amount || 0).toLocaleString('zh-CN')}`;
  };

  // 图表颜色配置
  const chartColors = {
    primary: '#ef4444',
    secondary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    purple: '#8b5cf6',
    grid: isDark ? '#374151' : '#e5e7eb'
  };

  // 渲染统计卡片
  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {[
        { label: '总任务数', value: stats.totalTasks, icon: 'tasks', color: 'blue' },
        { label: '已发布', value: stats.publishedTasks, icon: 'check-circle', color: 'green' },
        { label: '待审核', value: stats.pendingReview, icon: 'clock', color: 'yellow' },
        { label: '总预算', value: formatMoney(stats.totalBudget), icon: 'money-bill', color: 'purple' },
        { label: '参与者', value: stats.totalParticipants, icon: 'users', color: 'indigo' },
        { label: '提交作品', value: stats.totalSubmissions, icon: 'images', color: 'pink' }
      ].map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
              <p className="text-lg font-bold mt-1">{stat.value}</p>
            </div>
            <div className={`p-2.5 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
              <i className={`fas fa-${stat.icon} text-sm`}></i>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // 渲染任务列表
  const renderTaskList = () => (
    <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <input
                type="text"
                placeholder="搜索任务或品牌..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-transparent border-none outline-none text-sm"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus)}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
          >
            <option value="all">所有状态</option>
            <option value="draft">草稿</option>
            <option value="pending">待审核</option>
            <option value="published">已发布</option>
            <option value="paused">已暂停</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <i className="fas fa-spinner fa-spin text-2xl text-red-600"></i>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400">
              <i className="fas fa-inbox text-4xl mb-2"></i>
              <p>暂无可参与的商单</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                whileHover={{ backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 0.8)' }}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedTask?.id === task.id ? (isDark ? 'bg-gray-700' : 'bg-red-50') : ''
                }`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={task.brand_logo || '/default-brand.png'}
                    alt={task.brand_name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{task.title}</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                      {task.brand_name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatMoney(task.total_budget)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span><i className="fas fa-users mr-1"></i>{task.current_participants}/{task.max_participants}</span>
                  <span><i className="fas fa-images mr-1"></i>{task.total_works}</span>
                  <span>{formatTime(task.created_at)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 渲染任务详情
  const renderTaskDetail = () => {
    if (!selectedTask) {
      return (
        <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm`}>
          <div className="text-center text-gray-400">
            <i className="fas fa-hand-pointer text-4xl mb-3"></i>
            <p>选择左侧任务查看详情</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden h-full flex flex-col`}>
        {/* 任务头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src={selectedTask.brand_logo || '/default-brand.png'}
                alt={selectedTask.brand_name}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div>
                <h2 className="text-xl font-bold">{selectedTask.title}</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  {selectedTask.brand_name}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTask.status)}`}>
                    {getStatusLabel(selectedTask.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    创建于 {formatTime(selectedTask.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedTask.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowTaskReviewModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <i className="fas fa-check mr-2"></i>审核通过
                  </button>
                  <button
                    onClick={() => setShowTaskRejectModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    <i className="fas fa-times mr-2"></i>拒绝
                  </button>
                </>
              )}
              {selectedTask.status === 'published' && (
                <button
                  onClick={() => handleUpdateTaskStatus(selectedTask.id, 'paused')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                >
                  <i className="fas fa-pause mr-2"></i>暂停
                </button>
              )}
              {selectedTask.status === 'paused' && (
                <button
                  onClick={() => handleUpdateTaskStatus(selectedTask.id, 'published')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <i className="fas fa-play mr-2"></i>恢复
                </button>
              )}
              {(selectedTask.status === 'published' || selectedTask.status === 'paused') && (
                <button
                  onClick={() => handleUpdateTaskStatus(selectedTask.id, 'completed')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <i className="fas fa-flag-checkered mr-2"></i>完成
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className={`px-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex space-x-6">
            {[
              { id: 'overview', label: '概览', icon: 'chart-pie' },
              { id: 'participants', label: '参与者', icon: 'users', badge: participants.length, pendingCount: participants.filter(p => p.status === 'applied').length },
              { id: 'submissions', label: '作品审核', icon: 'images', badge: submissions.length, pendingCount: submissions.filter(s => s.status === 'pending').length },
              { id: 'analytics', label: '数据分析', icon: 'chart-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AuditTab)}
                className={`py-4 px-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                <i className={`fas fa-${tab.icon} mr-2`}></i>
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    tab.pendingCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="auditTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {detailLoading ? (
            <div className="flex items-center justify-center h-full">
              <i className="fas fa-spinner fa-spin text-2xl text-red-600"></i>
            </div>
          ) : (
            <>
              {/* 概览标签 */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 任务信息 */}
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className="font-semibold mb-4">任务信息</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总预算</p>
                        <p className="text-lg font-semibold">{formatMoney(selectedTask.total_budget)}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>剩余预算</p>
                        <p className="text-lg font-semibold">{formatMoney(selectedTask.remaining_budget || 0)}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>奖励范围</p>
                        <p className="text-lg font-semibold">
                          {formatMoney(selectedTask.min_reward || 0)} - {formatMoney(selectedTask.max_reward || 0)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>时间范围</p>
                        <p className="text-sm">
                          {new Date(selectedTask.start_date).toLocaleDateString()} ~ {new Date(selectedTask.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 统计数据 */}
                  {taskStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: '参与者', value: taskStats.total_participants, icon: 'users', color: 'blue' },
                        { label: '提交作品', value: taskStats.total_submissions, icon: 'images', color: 'purple' },
                        { label: '已通过', value: taskStats.approved_submissions, icon: 'check', color: 'green' },
                        { label: '待审核', value: taskStats.pending_submissions, icon: 'clock', color: 'yellow' }
                      ].map((stat, index) => (
                        <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                              <i className={`fas fa-${stat.icon}`}></i>
                            </div>
                            <div>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                              <p className="text-xl font-bold">{stat.value}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 任务描述 */}
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className="font-semibold mb-3">任务描述</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-wrap`}>
                      {selectedTask.description}
                    </p>
                  </div>

                  {/* 内容要求 */}
                  {selectedTask.content_requirements?.length > 0 && (
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className="font-semibold mb-3">内容要求</h3>
                      <ul className="space-y-2">
                        {selectedTask.content_requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 参与者标签 */}
              {activeTab === 'participants' && (
                <div className="space-y-4">
                  {participants.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <i className="fas fa-users text-4xl mb-3"></i>
                      <p>暂无参与者</p>
                    </div>
                  ) : (
                    participants.map((participant) => (
                      <motion.div
                        key={participant.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={participant.creator?.avatar_url || '/default-avatar.png'}
                              alt={participant.creator?.username}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <h4 className="font-medium">{participant.creator?.username || '未知用户'}</h4>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                申请于 {formatTime(participant.applied_at)}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span><i className="fas fa-images mr-1"></i>{participant.submitted_works} 作品</span>
                                <span><i className="fas fa-check-circle mr-1"></i>{participant.approved_works} 通过</span>
                                <span><i className="fas fa-money-bill mr-1"></i>{formatMoney(participant.total_earnings)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs ${getParticipantStatusColor(participant.status)}`}>
                              {getParticipantStatusLabel(participant.status)}
                            </span>
                            {participant.status === 'applied' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedParticipant(participant);
                                    setShowParticipantModal(true);
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                >
                                  审核
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {participant.application_message && (
                          <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              <i className="fas fa-quote-left mr-2 text-gray-400"></i>
                              {participant.application_message}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* 作品审核标签 */}
              {activeTab === 'submissions' && (
                <div className="space-y-4">
                  {submissions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <i className="fas fa-images text-4xl mb-3"></i>
                      <p>暂无提交作品</p>
                    </div>
                  ) : (
                    submissions.map((submission) => (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start gap-4">
                          {submission.work_thumbnail && (
                            <img
                              src={submission.work_thumbnail}
                              alt={submission.work_title}
                              className="w-24 h-24 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{submission.work_title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <img
                                    src={submission.creator?.avatar_url || '/default-avatar.png'}
                                    alt={submission.creator?.username}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {submission.creator?.username}
                                  </span>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs ${getSubmissionStatusColor(submission.status)}`}>
                                {getSubmissionStatusLabel(submission.status)}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 mt-3 text-xs">
                              <span><i className="fas fa-eye mr-1"></i>{submission.current_views || 0}</span>
                              <span><i className="fas fa-heart mr-1"></i>{submission.current_likes || 0}</span>
                              <span><i className="fas fa-star mr-1"></i>{submission.current_favorites || 0}</span>
                              <span><i className="fas fa-share mr-1"></i>{submission.current_shares || 0}</span>
                              {submission.estimated_reward && (
                                <span className="text-green-600 font-medium">
                                  预估: {formatMoney(submission.estimated_reward)}
                                </span>
                              )}
                            </div>

                            {submission.status === 'pending' && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => {
                                    setSelectedSubmission(submission);
                                    setShowSubmissionModal(true);
                                  }}
                                  className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                                >
                                  审核
                                </button>
                              </div>
                            )}

                            {submission.review_notes && (
                              <div className={`mt-3 p-2 rounded text-xs ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                                <span className="font-medium">审核备注:</span> {submission.review_notes}
                              </div>
                            )}

                            {submission.rejection_reason && (
                              <div className="mt-3 p-2 rounded text-xs bg-red-50 text-red-600">
                                <span className="font-medium">拒绝原因:</span> {submission.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* 数据分析标签 */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {analytics.length > 0 ? (
                    <>
                      {/* 趋势图表 */}
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className="font-semibold mb-4">参与趋势 (30天)</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics}>
                              <defs>
                                <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                              <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                  borderRadius: '8px'
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="new_participants"
                                stroke={chartColors.primary}
                                fillOpacity={1}
                                fill="url(#colorParticipants)"
                                name="新参与者"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* 作品统计 */}
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className="font-semibold mb-4">作品提交统计</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics}>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                              <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                  borderRadius: '8px'
                                }}
                              />
                              <Bar dataKey="new_submissions" fill={chartColors.secondary} name="新提交" />
                              <Bar dataKey="approved_submissions" fill={chartColors.success} name="已通过" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* 互动数据 */}
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className="font-semibold mb-4">互动数据趋势</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics}>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                              <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                  borderRadius: '8px'
                                }}
                              />
                              <Line type="monotone" dataKey="views" stroke={chartColors.primary} name="浏览" strokeWidth={2} />
                              <Line type="monotone" dataKey="likes" stroke={chartColors.secondary} name="点赞" strokeWidth={2} />
                              <Line type="monotone" dataKey="favorites" stroke={chartColors.warning} name="收藏" strokeWidth={2} />
                              <Line type="monotone" dataKey="shares" stroke={chartColors.purple} name="分享" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <i className="fas fa-chart-line text-4xl mb-3"></i>
                      <p>暂无分析数据</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧任务列表 */}
        <div className="lg:col-span-1">
          {renderTaskList()}
        </div>

        {/* 右侧详情面板 */}
        <div className="lg:col-span-2">
          {renderTaskDetail()}
        </div>
      </div>

      {/* 作品审核模态框 */}
      <AnimatePresence>
        {showSubmissionModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold">审核作品</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedSubmission.work_title} - {selectedSubmission.creator?.username}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {selectedSubmission.work_thumbnail && (
                  <img
                    src={selectedSubmission.work_thumbnail}
                    alt={selectedSubmission.work_title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    审核备注
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="输入审核备注或修改建议..."
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    拒绝原因 (拒绝时必填)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="输入拒绝原因..."
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => {
                    setShowSubmissionModal(false);
                    setReviewNotes('');
                    setRejectionReason('');
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  取消
                </button>
                <button
                  onClick={() => handleRequestRevision(selectedSubmission.id)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  要求修改
                </button>
                <button
                  onClick={() => handleRejectSubmission(selectedSubmission.id)}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  拒绝
                </button>
                <button
                  onClick={() => handleApproveSubmission(selectedSubmission.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  通过
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 参与者审核模态框 */}
      <AnimatePresence>
        {showParticipantModal && selectedParticipant && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold">审核参与者</h3>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={selectedParticipant.creator?.avatar_url || '/default-avatar.png'}
                    alt={selectedParticipant.creator?.username}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">{selectedParticipant.creator?.username}</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      申请于 {formatTime(selectedParticipant.applied_at)}
                    </p>
                  </div>
                </div>

                {selectedParticipant.application_message && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-6`}>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <i className="fas fa-quote-left mr-2 text-gray-400"></i>
                      {selectedParticipant.application_message}
                    </p>
                  </div>
                )}

                {selectedParticipant.portfolio_links?.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-sm font-medium mb-2">作品集链接</h5>
                    <div className="space-y-2">
                      {selectedParticipant.portfolio_links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <i className="fas fa-external-link-alt"></i>
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => {
                    setShowParticipantModal(false);
                    setSelectedParticipant(null);
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  取消
                </button>
                <button
                  onClick={() => handleRejectParticipant(selectedParticipant.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  拒绝
                </button>
                <button
                  onClick={() => handleApproveParticipant(selectedParticipant.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  通过
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 任务审核通过模态框 */}
      <AnimatePresence>
        {showTaskReviewModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold text-green-600">
                  <i className="fas fa-check-circle mr-2"></i>
                  审核通过任务
                </h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedTask.title}
                </p>
              </div>

              <div className="p-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    审核备注（可选）
                  </label>
                  <textarea
                    value={taskReviewNotes}
                    onChange={(e) => setTaskReviewNotes(e.target.value)}
                    placeholder="输入审核备注..."
                    rows={4}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => {
                    setShowTaskReviewModal(false);
                    setTaskReviewNotes('');
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  取消
                </button>
                <button
                  onClick={handleApproveTask}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  确认通过
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 任务拒绝模态框 */}
      <AnimatePresence>
        {showTaskRejectModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold text-red-600">
                  <i className="fas fa-times-circle mr-2"></i>
                  拒绝任务
                </h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedTask.title}
                </p>
              </div>

              <div className="p-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    拒绝原因 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={taskRejectReason}
                    onChange={(e) => setTaskRejectReason(e.target.value)}
                    placeholder="请输入拒绝原因..."
                    rows={4}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    拒绝原因将通知给任务发布者
                  </p>
                </div>
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => {
                    setShowTaskRejectModal(false);
                    setTaskRejectReason('');
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  取消
                </button>
                <button
                  onClick={handleRejectTask}
                  disabled={!taskRejectReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  确认拒绝
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
