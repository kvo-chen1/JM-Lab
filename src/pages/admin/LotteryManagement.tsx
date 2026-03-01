/**
 * 转盘活动管理后台页面
 * 提供转盘活动的全面监控和管理功能
 */

import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import {
  lotteryAdminService,
  type LotteryActivity,
  type LotteryStatus,
  type LotteryPrize,
  type UserSpinRecord,
  type LotteryStatistics,
} from '@/services/lotteryAdminService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Gift,
  TrendingUp,
  DollarSign,
  Activity,
  X,
  Check,
  AlertCircle,
  MoreHorizontal,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  MapPin,
  Smartphone,
  Settings,
  Percent,
  Coins,
  Package,
  Award,
  Save,
  GripVertical,
  RefreshCw,
  Upload,
} from 'lucide-react';

// 状态颜色映射
const statusColors: Record<LotteryStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  active: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  paused: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
  ended: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
};

const statusLabels: Record<LotteryStatus, string> = {
  draft: '草稿',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
};

// 图表颜色
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// 转盘颜色配置
const WHEEL_COLORS = [
  { color: '#EF4444', textColor: '#FFFFFF' },
  { color: '#F97316', textColor: '#FFFFFF' },
  { color: '#EAB308', textColor: '#FFFFFF' },
  { color: '#22C55E', textColor: '#FFFFFF' },
  { color: '#3B82F6', textColor: '#FFFFFF' },
  { color: '#A855F7', textColor: '#FFFFFF' },
  { color: '#EC4899', textColor: '#FFFFFF' },
  { color: '#DC2626', textColor: '#FFFFFF' },
  { color: '#14B8A6', textColor: '#FFFFFF' },
  { color: '#F59E0B', textColor: '#FFFFFF' },
  { color: '#6366F1', textColor: '#FFFFFF' },
  { color: '#84CC16', textColor: '#FFFFFF' },
];

export default function LotteryManagement() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // 标签页状态
  const [activeTab, setActiveTab] = useState<'activities' | 'records' | 'statistics' | 'prizes'>('activities');

  // 活动列表状态
  const [activities, setActivities] = useState<LotteryActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesPageSize] = useState(10);
  const [activitiesFilter, setActivitiesFilter] = useState({
    keyword: '',
    status: '' as LotteryStatus | '',
  });

  // 选中的活动
  const [selectedActivity, setSelectedActivity] = useState<LotteryActivity | null>(null);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LotteryActivity | null>(null);

  // 抽奖记录状态
  const [spinRecords, setSpinRecords] = useState<UserSpinRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsPageSize] = useState(20);
  const [recordsFilter, setRecordsFilter] = useState({
    activityId: '',
    startDate: '',
    endDate: '',
  });

  // 统计数据
  const [statistics, setStatistics] = useState<LotteryStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsActivityId, setStatsActivityId] = useState('');

  // 奖品管理状态
  const [prizeManagementActivity, setPrizeManagementActivity] = useState<LotteryActivity | null>(null);
  const [editingPrizes, setEditingPrizes] = useState<LotteryPrize[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [savingPrizes, setSavingPrizes] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState<LotteryPrize | null>(null);
  const [editingPrizeIndex, setEditingPrizeIndex] = useState<number | null>(null);

  // 加载活动列表
  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const result = await lotteryAdminService.getActivities(
        {
          keyword: activitiesFilter.keyword || undefined,
          status: activitiesFilter.status || undefined,
        },
        activitiesPage,
        activitiesPageSize
      );
      setActivities(result.data);
      setActivitiesTotal(result.total);
    } catch (error) {
      console.error('加载活动列表失败:', error);
      toast.error('加载活动列表失败');
    } finally {
      setActivitiesLoading(false);
    }
  }, [activitiesFilter, activitiesPage, activitiesPageSize]);

  // 加载抽奖记录
  const loadSpinRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const result = await lotteryAdminService.getSpinRecords(
        recordsFilter.activityId || undefined,
        undefined,
        recordsFilter.startDate || undefined,
        recordsFilter.endDate || undefined,
        recordsPage,
        recordsPageSize
      );
      setSpinRecords(result.data);
      setRecordsTotal(result.total);
    } catch (error) {
      console.error('加载抽奖记录失败:', error);
      toast.error('加载抽奖记录失败');
    } finally {
      setRecordsLoading(false);
    }
  }, [recordsFilter, recordsPage, recordsPageSize]);

  // 加载统计数据
  const loadStatistics = useCallback(async () => {
    if (!statsActivityId) return;
    setStatsLoading(true);
    try {
      const stats = await lotteryAdminService.getActivityStatistics(statsActivityId);
      setStatistics(stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      toast.error('加载统计数据失败');
    } finally {
      setStatsLoading(false);
    }
  }, [statsActivityId]);

  // 初始加载
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    if (activeTab === 'records') {
      loadSpinRecords();
    }
  }, [activeTab, loadSpinRecords]);

  useEffect(() => {
    if (activeTab === 'statistics' && statsActivityId) {
      loadStatistics();
    }
  }, [activeTab, statsActivityId, loadStatistics]);

  // 删除活动
  const handleDeleteActivity = async (activity: LotteryActivity) => {
    if (!confirm(`确定要删除活动"${activity.name}"吗？此操作不可恢复。`)) return;

    try {
      await lotteryAdminService.deleteActivity(activity.id);
      toast.success('活动删除成功');
      loadActivities();
    } catch (error) {
      console.error('删除活动失败:', error);
      toast.error('删除活动失败');
    }
  };

  // 更新活动状态
  const handleUpdateStatus = async (activity: LotteryActivity, status: LotteryStatus) => {
    try {
      await lotteryAdminService.updateActivityStatus(activity.id, status);
      toast.success(`活动已${statusLabels[status]}`);
      loadActivities();
    } catch (error) {
      console.error('更新状态失败:', error);
      toast.error('更新状态失败');
    }
  };

  // ========== 奖品管理方法 ==========

  // 进入奖品管理
  const handleEnterPrizeManagement = (activity: LotteryActivity) => {
    setPrizeManagementActivity(activity);
    setEditingPrizes([...activity.prizes]);
    setActiveTab('prizes');
  };

  // 返回活动列表
  const handleBackFromPrizeManagement = () => {
    setPrizeManagementActivity(null);
    setEditingPrizes([]);
    setActiveTab('activities');
  };

  // 添加奖品
  const handleAddPrize = () => {
    const newPrize: LotteryPrize = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      probability: 0,
      points: 0,
      stock: -1,
      sortOrder: editingPrizes.length,
      isEnabled: true,
      isRare: false,
    };
    setEditingPrize(newPrize);
    setEditingPrizeIndex(null);
    setShowPrizeModal(true);
  };

  // 编辑奖品
  const handleEditPrize = (prize: LotteryPrize, index: number) => {
    setEditingPrize({ ...prize });
    setEditingPrizeIndex(index);
    setShowPrizeModal(true);
  };

  // 删除奖品
  const handleDeletePrize = (index: number) => {
    if (!confirm('确定要删除这个奖品吗？')) return;
    const newPrizes = editingPrizes.filter((_, i) => i !== index);
    newPrizes.forEach((prize, i) => {
      prize.sortOrder = i;
    });
    setEditingPrizes(newPrizes);
    toast.success('奖品已删除');
  };

  // 保存奖品编辑
  const handleSavePrize = () => {
    if (!editingPrize) return;

    if (!editingPrize.name.trim()) {
      toast.error('请输入奖品名称');
      return;
    }

    if (editingPrizeIndex !== null) {
      const newPrizes = [...editingPrizes];
      newPrizes[editingPrizeIndex] = editingPrize;
      setEditingPrizes(newPrizes);
    } else {
      setEditingPrizes([...editingPrizes, editingPrize]);
    }

    setShowPrizeModal(false);
    setEditingPrize(null);
    setEditingPrizeIndex(null);
    toast.success('奖品已保存');
  };

  // 保存所有奖品配置
  const handleSaveAllPrizes = async () => {
    if (!prizeManagementActivity) return;

    const totalProb = editingPrizes.reduce((sum, p) => sum + p.probability, 0);
    if (Math.abs(totalProb - 1) > 0.001) {
      toast.error(`奖品总概率必须等于100%，当前为${(totalProb * 100).toFixed(1)}%`);
      return;
    }

    if (editingPrizes.length < 2) {
      toast.error('至少需要2个奖品');
      return;
    }

    setSavingPrizes(true);
    try {
      await lotteryAdminService.updateActivity(prizeManagementActivity.id, {
        prizes: editingPrizes,
      });
      toast.success('奖品配置保存成功');
      loadActivities();
    } catch (error) {
      console.error('保存奖品配置失败:', error);
      toast.error('保存失败');
    } finally {
      setSavingPrizes(false);
    }
  };

  // 拖拽排序
  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) return;

    const newPrizes = [...editingPrizes];
    const draggedPrize = newPrizes[draggingIndex];
    newPrizes.splice(draggingIndex, 1);
    newPrizes.splice(index, 0, draggedPrize);

    newPrizes.forEach((prize, i) => {
      prize.sortOrder = i;
    });

    setEditingPrizes(newPrizes);
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  // 导出记录
  const handleExportRecords = async () => {
    try {
      const records = await lotteryAdminService.exportSpinRecords(
        recordsFilter.activityId || undefined,
        recordsFilter.startDate || undefined,
        recordsFilter.endDate || undefined
      );

      // 转换为CSV
      const headers = ['活动名称', '用户名', '奖品名称', '奖品价值', '消耗积分', '抽奖时间', 'IP地址'];
      const rows = records.map(r => [
        r.activityName,
        r.username,
        r.prizeName,
        r.prizePoints,
        r.cost,
        new Date(r.spinTime).toLocaleString('zh-CN'),
        r.ip || '-',
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `抽奖记录_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败');
    }
  };

  // 渲染活动列表
  const renderActivitiesList = () => (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索活动名称..."
                value={activitiesFilter.keyword}
                onChange={(e) => setActivitiesFilter({ ...activitiesFilter, keyword: e.target.value })}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>
          <select
            value={activitiesFilter.status}
            onChange={(e) => setActivitiesFilter({ ...activitiesFilter, status: e.target.value as LotteryStatus })}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="active">进行中</option>
            <option value="paused">已暂停</option>
            <option value="ended">已结束</option>
          </select>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingActivity(null);
                setShowActivityForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建活动
            </button>
          )}
        </div>
      </div>

      {/* 活动表格 */}
      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">活动名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium">时间范围</th>
                <th className="px-4 py-3 text-left text-sm font-medium">参与人数</th>
                <th className="px-4 py-3 text-left text-sm font-medium">抽奖次数</th>
                <th className="px-4 py-3 text-left text-sm font-medium">消耗积分</th>
                <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {activitiesLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    暂无活动数据
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{activity.name}</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          每次消耗 {activity.spinCost} 积分
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          statusColors[activity.status].bg
                        } ${statusColors[activity.status].text} ${statusColors[activity.status].border}`}
                      >
                        {statusLabels[activity.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>{new Date(activity.startTime).toLocaleDateString('zh-CN')}</div>
                        <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                          至 {new Date(activity.endTime).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{activity.totalParticipants}</td>
                    <td className="px-4 py-3">{activity.totalSpins}</td>
                    <td className="px-4 py-3">{activity.totalSpins * activity.spinCost}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setShowActivityDetail(true);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && activity.status === 'draft' && (
                          <button
                            onClick={() => {
                              setEditingActivity(activity);
                              setShowActivityForm(true);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && activity.status === 'draft' && (
                          <button
                            onClick={() => handleUpdateStatus(activity, 'active')}
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 text-green-600 rounded transition-colors"
                            title="开始活动"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && activity.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(activity, 'paused')}
                            className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900 text-yellow-600 rounded transition-colors"
                            title="暂停"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && activity.status === 'paused' && (
                          <button
                            onClick={() => handleUpdateStatus(activity, 'active')}
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 text-green-600 rounded transition-colors"
                            title="恢复"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (activity.status === 'active' || activity.status === 'paused') && (
                          <button
                            onClick={() => handleUpdateStatus(activity, 'ended')}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 rounded transition-colors"
                            title="结束"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && activity.status === 'draft' && (
                          <button
                            onClick={() => handleDeleteActivity(activity)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {/* 管理奖品按钮 */}
                        <button
                          onClick={() => handleEnterPrizeManagement(activity)}
                          className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 rounded transition-colors"
                          title="管理奖品"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            共 {activitiesTotal} 条记录
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivitiesPage((p) => Math.max(1, p - 1))}
              disabled={activitiesPage === 1}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm">
              第 {activitiesPage} 页
            </span>
            <button
              onClick={() => setActivitiesPage((p) => p + 1)}
              disabled={activitiesPage * activitiesPageSize >= activitiesTotal}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染抽奖记录
  const renderSpinRecords = () => {
    // 计算图表数据
    const prizeDistribution = useMemo(() => {
      const distribution: Record<string, { name: string; count: number; totalValue: number }> = {};
      spinRecords.forEach((record) => {
        if (!distribution[record.prizeName]) {
          distribution[record.prizeName] = { name: record.prizeName, count: 0, totalValue: 0 };
        }
        distribution[record.prizeName].count += 1;
        distribution[record.prizeName].totalValue += record.prizePoints;
      });
      return Object.values(distribution).sort((a, b) => b.count - a.count).slice(0, 8);
    }, [spinRecords]);

    const hourlyDistribution = useMemo(() => {
      const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
      spinRecords.forEach((record) => {
        const hour = new Date(record.spinTime).getHours();
        hours[hour].count += 1;
      });
      return hours;
    }, [spinRecords]);

    const userSpinFrequency = useMemo(() => {
      const userCounts: Record<string, number> = {};
      spinRecords.forEach((record) => {
        userCounts[record.userId] = (userCounts[record.userId] || 0) + 1;
      });
      const frequency: Record<string, number> = { '1次': 0, '2-3次': 0, '4-5次': 0, '6-10次': 0, '10次以上': 0 };
      Object.values(userCounts).forEach((count) => {
        if (count === 1) frequency['1次'] += 1;
        else if (count <= 3) frequency['2-3次'] += 1;
        else if (count <= 5) frequency['4-5次'] += 1;
        else if (count <= 10) frequency['6-10次'] += 1;
        else frequency['10次以上'] += 1;
      });
      return Object.entries(frequency).map(([name, value]) => ({ name, value }));
    }, [spinRecords]);

    const valueDistribution = useMemo(() => {
      const ranges = [
        { name: '0-100', min: 0, max: 100, count: 0 },
        { name: '101-500', min: 101, max: 500, count: 0 },
        { name: '501-1000', min: 501, max: 1000, count: 0 },
        { name: '1001-5000', min: 1001, max: 5000, count: 0 },
        { name: '5000+', min: 5001, max: Infinity, count: 0 },
      ];
      spinRecords.forEach((record) => {
        const range = ranges.find((r) => record.prizePoints >= r.min && record.prizePoints <= r.max);
        if (range) range.count += 1;
      });
      return ranges.map((r) => ({ name: r.name, count: r.count }));
    }, [spinRecords]);

    return (
    <div className="space-y-6">
      {/* 筛选栏 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap gap-4">
          <select
            value={recordsFilter.activityId}
            onChange={(e) => setRecordsFilter({ ...recordsFilter, activityId: e.target.value })}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">全部活动</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={recordsFilter.startDate}
            onChange={(e) => setRecordsFilter({ ...recordsFilter, startDate: e.target.value })}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <input
            type="date"
            value={recordsFilter.endDate}
            onChange={(e) => setRecordsFilter({ ...recordsFilter, endDate: e.target.value })}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <button
            onClick={handleExportRecords}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出CSV
          </button>
        </div>
      </div>

      {/* 数据图表 */}
      {!recordsLoading && spinRecords.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 热门奖品分布 */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              热门奖品分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prizeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                  >
                    {prizeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 用户抽奖频次分布 */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              用户抽奖频次分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userSpinFrequency}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {userSpinFrequency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 24小时抽奖分布 */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              24小时抽奖分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(value) => `${value}:00`}
                    stroke={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                  <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => `${value}:00 - ${value}:59`}
                  />
                  <Bar dataKey="count" name="抽奖次数" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 奖品价值分布 */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              奖品价值分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="name" stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" name="中奖次数" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 记录表格 */}
      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">活动</th>
                <th className="px-4 py-3 text-left text-sm font-medium">用户</th>
                <th className="px-4 py-3 text-left text-sm font-medium">奖品</th>
                <th className="px-4 py-3 text-left text-sm font-medium">价值</th>
                <th className="px-4 py-3 text-left text-sm font-medium">消耗</th>
                <th className="px-4 py-3 text-left text-sm font-medium">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recordsLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : spinRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    暂无抽奖记录
                  </td>
                </tr>
              ) : (
                spinRecords.map((record) => (
                  <tr key={record.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-4 py-3 text-sm">{record.activityName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {record.avatar && (
                          <img src={record.avatar} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <span className="text-sm">{record.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{record.prizeName}</td>
                    <td className="px-4 py-3 text-sm text-green-600">{record.prizePoints}</td>
                    <td className="px-4 py-3 text-sm text-red-600">-{record.cost}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(record.spinTime).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            共 {recordsTotal} 条记录
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRecordsPage((p) => Math.max(1, p - 1))}
              disabled={recordsPage === 1}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm">第 {recordsPage} 页</span>
            <button
              onClick={() => setRecordsPage((p) => p + 1)}
              disabled={recordsPage * recordsPageSize >= recordsTotal}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  };

  // 渲染统计页面
  const renderStatistics = () => (
    <div className="space-y-6">
      {/* 活动选择 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <label className="block text-sm font-medium mb-2">选择活动</label>
        <select
          value={statsActivityId}
          onChange={(e) => setStatsActivityId(e.target.value)}
          className={`w-full max-w-md px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="">请选择活动</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : statistics ? (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总抽奖次数</span>
              </div>
              <div className="text-2xl font-bold">{statistics.totalSpins.toLocaleString()}</div>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>参与人数</span>
              </div>
              <div className="text-2xl font-bold">{statistics.totalParticipants.toLocaleString()}</div>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总消耗积分</span>
              </div>
              <div className="text-2xl font-bold">{statistics.totalCost.toLocaleString()}</div>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>中奖率</span>
              </div>
              <div className="text-2xl font-bold">{statistics.winRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 每日趋势 */}
            <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                每日参与趋势（最近30天）
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statistics.dailyStats}>
                    <defs>
                      <linearGradient id="colorSpins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => value.slice(5)}
                      stroke={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                    <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="spins"
                      name="抽奖次数"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorSpins)"
                    />
                    <Area
                      type="monotone"
                      dataKey="participants"
                      name="参与人数"
                      stroke="#10B981"
                      fillOpacity={0.3}
                      fill="#10B981"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 热门奖品 */}
            <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                热门奖品分布
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statistics.topPrizes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                    >
                      {statistics.topPrizes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 24小时分布 */}
            <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm lg:col-span-2`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                24小时参与分布
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(value) => `${value}:00`}
                      stroke={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                    <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => `${value}:00 - ${value}:59`}
                    />
                    <Bar dataKey="spins" name="抽奖次数" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={`p-12 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm text-center`}>
          <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>请选择活动查看统计数据</p>
        </div>
      )}
    </div>
  );

  // 渲染奖品管理
  const renderPrizeManagement = () => {
    if (!prizeManagementActivity) return null;

    const totalProbability = editingPrizes.reduce((sum, p) => sum + p.probability, 0);
    const isProbabilityValid = Math.abs(totalProbability - 1) < 0.001;

    return (
      <div className="space-y-6">
        {/* 头部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackFromPrizeManagement}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-900'
              }`}
            >
              返回活动列表
            </button>
            <div>
              <h2 className="text-2xl font-bold">{prizeManagementActivity.name}</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                管理转盘奖品配置
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddPrize}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加奖品
            </button>
            <button
              onClick={handleSaveAllPrizes}
              disabled={savingPrizes || !isProbabilityValid}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPrizes ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存配置
            </button>
          </div>
        </div>

        {/* 概率校验提示 */}
        <div
          className={`p-4 rounded-xl ${
            isProbabilityValid
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              isProbabilityValid
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {isProbabilityValid ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">
              总概率: {(totalProbability * 100).toFixed(1)}%
              {isProbabilityValid
                ? ' (有效)'
                : ` (需调整 ${((1 - totalProbability) * 100).toFixed(1)}%)`}
            </span>
          </div>
        </div>

        {/* 转盘预览 */}
        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            转盘预览
          </h3>
          <div className="flex justify-center">
            <div className="relative w-80 h-80">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {editingPrizes.map((prize, index) => {
                  const angle = (360 / editingPrizes.length) * index;
                  const nextAngle = (360 / editingPrizes.length) * (index + 1);
                  const colorConfig = WHEEL_COLORS[index % WHEEL_COLORS.length];

                  const startAngle = (angle - 90) * (Math.PI / 180);
                  const endAngle = (nextAngle - 90) * (Math.PI / 180);
                  const x1 = 100 + 80 * Math.cos(startAngle);
                  const y1 = 100 + 80 * Math.sin(startAngle);
                  const x2 = 100 + 80 * Math.cos(endAngle);
                  const y2 = 100 + 80 * Math.sin(endAngle);

                  const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 0 1 ${x2} ${y2} Z`;

                  const textAngle = (angle + nextAngle) / 2 - 90;
                  const textRadius = 60;
                  const textX = 100 + textRadius * Math.cos(textAngle * (Math.PI / 180));
                  const textY = 100 + textRadius * Math.sin(textAngle * (Math.PI / 180));

                  return (
                    <g key={prize.id}>
                      <path d={pathData} fill={colorConfig.color} stroke="white" strokeWidth="2" />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={colorConfig.textColor}
                        fontSize="8"
                        fontWeight="bold"
                      >
                        {prize.name.slice(0, 4)}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="20" fill={isDark ? '#374151' : '#F3F4F6'} stroke="white" strokeWidth="2" />
              </svg>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 奖品概率分布 */}
        {editingPrizes.length > 0 && (
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              奖品概率分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={editingPrizes.map((prize, index) => ({
                      name: prize.name || `奖品${index + 1}`,
                      value: prize.probability,
                      color: WHEEL_COLORS[index % WHEEL_COLORS.length].color
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                  >
                    {editingPrizes.map((prize, index) => (
                      <Cell key={`cell-${index}`} fill={WHEEL_COLORS[index % WHEEL_COLORS.length].color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 奖品列表 */}
        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            奖品列表 ({editingPrizes.length}个)
          </h3>

          {editingPrizes.length === 0 ? (
            <div className="text-center py-12">
              <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>暂无奖品，请点击"添加奖品"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {editingPrizes.map((prize, index) => {
                const colorConfig = WHEEL_COLORS[index % WHEEL_COLORS.length];
                return (
                  <motion.div
                    key={prize.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-700' : 'bg-gray-50'
                    } flex items-center gap-4 cursor-move hover:shadow-md transition-shadow`}
                  >
                    <div className="text-gray-400 hover:text-gray-600">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: colorConfig.color }}
                    >
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{prize.name || '未命名奖品'}</span>
                        {prize.isRare && (
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                            稀有
                          </span>
                        )}
                        {!prize.isEnabled && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            禁用
                          </span>
                        )}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-4 mt-1`}>
                        <span className="flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {prize.points} 积分
                        </span>
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          {(prize.probability * 100).toFixed(1)}%
                        </span>
                        <span>库存: {prize.stock === -1 ? '无限' : prize.stock}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditPrize(prize, index)}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePrize(index)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染奖品编辑弹窗
  const renderPrizeModal = () => {
    if (!showPrizeModal || !editingPrize) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-lg rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
        >
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <h3 className="text-xl font-bold">
              {editingPrizeIndex !== null ? '编辑奖品' : '添加奖品'}
            </h3>
            <button
              onClick={() => setShowPrizeModal(false)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">奖品名称 *</label>
              <input
                type="text"
                value={editingPrize.name}
                onChange={(e) => setEditingPrize({ ...editingPrize, name: e.target.value })}
                placeholder="例如：10元红包"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">奖品描述</label>
              <input
                type="text"
                value={editingPrize.description || ''}
                onChange={(e) => setEditingPrize({ ...editingPrize, description: e.target.value })}
                placeholder="奖品详细描述"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">积分价值</label>
                <input
                  type="number"
                  min={0}
                  value={editingPrize.points}
                  onChange={(e) => setEditingPrize({ ...editingPrize, points: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">概率 (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={(editingPrize.probability * 100).toFixed(1)}
                  onChange={(e) =>
                    setEditingPrize({
                      ...editingPrize,
                      probability: parseFloat(e.target.value) / 100 || 0,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">库存 (-1为无限)</label>
                <input
                  type="number"
                  min={-1}
                  value={editingPrize.stock}
                  onChange={(e) => setEditingPrize({ ...editingPrize, stock: parseInt(e.target.value) || -1 })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">排序</label>
                <input
                  type="number"
                  min={0}
                  value={editingPrize.sortOrder}
                  onChange={(e) =>
                    setEditingPrize({ ...editingPrize, sortOrder: parseInt(e.target.value) || 0 })
                  }
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">奖品图片URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingPrize.imageUrl || ''}
                  onChange={(e) => setEditingPrize({ ...editingPrize, imageUrl: e.target.value })}
                  placeholder="图片链接地址"
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Upload className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPrize.isEnabled}
                  onChange={(e) => setEditingPrize({ ...editingPrize, isEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">启用</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPrize.isRare}
                  onChange={(e) => setEditingPrize({ ...editingPrize, isRare: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm">稀有奖品</span>
              </label>
            </div>
          </div>

          <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
            <button
              onClick={() => setShowPrizeModal(false)}
              className={`px-4 py-2 rounded-lg border ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              } transition-colors`}
            >
              取消
            </button>
            <button
              onClick={handleSavePrize}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // 渲染活动详情弹窗
  const renderActivityDetailModal = () => {
    if (!showActivityDetail || !selectedActivity) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } shadow-2xl`}
        >
          {/* 头部 */}
          <div className={`sticky top-0 px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <h2 className="text-xl font-bold">活动详情</h2>
            <button
              onClick={() => setShowActivityDetail(false)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 基本信息 */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                基本信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>活动名称</label>
                  <p className="font-medium">{selectedActivity.name}</p>
                </div>
                <div>
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>活动状态</label>
                  <p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      statusColors[selectedActivity.status].bg
                    } ${statusColors[selectedActivity.status].text} ${statusColors[selectedActivity.status].border}`}>
                      {statusLabels[selectedActivity.status]}
                    </span>
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>开始时间</label>
                  <p className="font-medium">{new Date(selectedActivity.startTime).toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>结束时间</label>
                  <p className="font-medium">{new Date(selectedActivity.endTime).toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>每次消耗积分</label>
                  <p className="font-medium flex items-center gap-1">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    {selectedActivity.spinCost}
                  </p>
                </div>
                <div>
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>创建时间</label>
                  <p className="font-medium">{new Date(selectedActivity.createdAt).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            </div>

            {/* 统计数据 */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                统计数据
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'} text-center`}>
                  <div className={`text-2xl font-bold text-blue-500`}>{selectedActivity.totalSpins}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总抽奖次数</div>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'} text-center`}>
                  <div className="text-2xl font-bold text-green-500">{selectedActivity.totalParticipants}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>参与人数</div>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'} text-center`}>
                  <div className="text-2xl font-bold text-yellow-500">{selectedActivity.totalSpins * selectedActivity.spinCost}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>消耗积分</div>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'} text-center`}>
                  <div className="text-2xl font-bold text-purple-500">{selectedActivity.prizes.length}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>奖品数量</div>
                </div>
              </div>
            </div>

            {/* 奖品配置 */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                奖品配置
              </h3>
              <div className="space-y-3">
                {selectedActivity.prizes.map((prize, index) => (
                  <div
                    key={prize.id}
                    className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'} flex items-center gap-4`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{prize.name}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        价值 {prize.points} 积分 · 库存 {prize.stock === -1 ? '无限' : prize.stock}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{(prize.probability * 100).toFixed(1)}%</span>
                    </div>
                    {prize.isRare && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                        稀有
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 概率验证 */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="text-lg font-semibold mb-2">概率校验</h3>
              {(() => {
                const totalProb = selectedActivity.prizes.reduce((sum, p) => sum + p.probability, 0);
                const isValid = Math.abs(totalProb - 1) < 0.001;
                return (
                  <div className={`flex items-center gap-2 ${isValid ? 'text-green-500' : 'text-red-500'}`}>
                    {isValid ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>
                      总概率: {(totalProb * 100).toFixed(1)}% {isValid ? '(有效)' : '(无效，总概率必须等于100%)'}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // 渲染活动表单弹窗
  const renderActivityFormModal = () => {
    if (!showActivityForm) return null;

    const [formData, setFormData] = useState({
      name: editingActivity?.name || '',
      description: editingActivity?.description || '',
      startTime: editingActivity?.startTime ? new Date(editingActivity.startTime).toISOString().slice(0, 16) : '',
      endTime: editingActivity?.endTime ? new Date(editingActivity.endTime).toISOString().slice(0, 16) : '',
      spinCost: editingActivity?.spinCost || 10,
      maxSpinsPerUser: editingActivity?.maxSpinsPerUser || -1,
      prizes: editingActivity?.prizes || [
        { id: '1', name: '谢谢参与', points: 0, probability: 0.3, stock: -1, isRare: false, sortOrder: 0, isEnabled: true },
        { id: '2', name: '小奖', points: 10, probability: 0.4, stock: 1000, isRare: false, sortOrder: 1, isEnabled: true },
        { id: '3', name: '大奖', points: 100, probability: 0.2, stock: 100, isRare: false, sortOrder: 2, isEnabled: true },
        { id: '4', name: '特等奖', points: 1000, probability: 0.1, stock: 10, isRare: true, sortOrder: 3, isEnabled: true },
      ],
    });

    const [saving, setSaving] = useState(false);

    const handleAddPrize = () => {
      setFormData({
        ...formData,
        prizes: [
          ...formData.prizes,
          { id: Date.now().toString(), name: '', points: 0, probability: 0, stock: -1, isRare: false, sortOrder: formData.prizes.length, isEnabled: true },
        ],
      });
    };

    const handleRemovePrize = (index: number) => {
      setFormData({
        ...formData,
        prizes: formData.prizes.filter((_, i) => i !== index),
      });
    };

    const handleUpdatePrize = (index: number, field: keyof LotteryPrize, value: any) => {
      const newPrizes = [...formData.prizes];
      newPrizes[index] = { ...newPrizes[index], [field]: value };
      setFormData({ ...formData, prizes: newPrizes });
    };

    const handleSave = async () => {
      if (!formData.name.trim()) {
        toast.error('请输入活动名称');
        return;
      }
      if (!formData.startTime || !formData.endTime) {
        toast.error('请选择活动时间');
        return;
      }
      if (formData.prizes.length < 2) {
        toast.error('至少需要2个奖品');
        return;
      }
      const totalProb = formData.prizes.reduce((sum, p) => sum + p.probability, 0);
      if (Math.abs(totalProb - 1) > 0.001) {
        toast.error(`奖品总概率必须等于100%，当前为${(totalProb * 100).toFixed(1)}%`);
        return;
      }

      setSaving(true);
      try {
        if (editingActivity) {
          await lotteryAdminService.updateActivity(editingActivity.id, formData);
          toast.success('活动更新成功');
        } else {
          await lotteryAdminService.createActivity(formData, user?.id || '');
          toast.success('活动创建成功');
        }
        setShowActivityForm(false);
        loadActivities();
      } catch (error) {
        console.error('保存活动失败:', error);
        toast.error('保存失败');
      } finally {
        setSaving(false);
      }
    };

    const totalProb = formData.prizes.reduce((sum, p) => sum + p.probability, 0);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } shadow-2xl`}
        >
          {/* 头部 */}
          <div className={`sticky top-0 px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <h2 className="text-xl font-bold">{editingActivity ? '编辑活动' : '新建活动'}</h2>
            <button
              onClick={() => setShowActivityForm(false)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                基本信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">活动名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入活动名称"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">活动描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请输入活动描述"
                    rows={2}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">开始时间 *</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">结束时间 *</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">每次消耗积分 *</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.spinCost}
                    onChange={(e) => setFormData({ ...formData, spinCost: parseInt(e.target.value) || 0 })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">每人最大次数 (-1为不限)</label>
                  <input
                    type="number"
                    min={-1}
                    value={formData.maxSpinsPerUser}
                    onChange={(e) => setFormData({ ...formData, maxSpinsPerUser: parseInt(e.target.value) || -1 })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
            </div>

            {/* 奖品配置 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  奖品配置
                </h3>
                <button
                  onClick={handleAddPrize}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加奖品
                </button>
              </div>

              <div className="space-y-3">
                {formData.prizes.map((prize, index) => (
                  <div
                    key={prize.id}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex flex-wrap gap-3 items-center`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs text-gray-500 mb-1">奖品名称</label>
                      <input
                        type="text"
                        value={prize.name}
                        onChange={(e) => handleUpdatePrize(index, 'name', e.target.value)}
                        placeholder="奖品名称"
                        className={`w-full px-3 py-1.5 rounded border ${
                          isDark
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-gray-500 mb-1">积分价值</label>
                      <input
                        type="number"
                        min={0}
                        value={prize.points}
                        onChange={(e) => handleUpdatePrize(index, 'points', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-1.5 rounded border ${
                          isDark
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-gray-500 mb-1">概率 (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={(prize.probability * 100).toFixed(1)}
                        onChange={(e) => handleUpdatePrize(index, 'probability', parseFloat(e.target.value) / 100 || 0)}
                        className={`w-full px-3 py-1.5 rounded border ${
                          isDark
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-gray-500 mb-1">库存</label>
                      <input
                        type="number"
                        min={-1}
                        value={prize.stock}
                        onChange={(e) => handleUpdatePrize(index, 'stock', parseInt(e.target.value) || -1)}
                        placeholder="-1=无限"
                        className={`w-full px-3 py-1.5 rounded border ${
                          isDark
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white border-gray-200 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prize.isRare}
                          onChange={(e) => handleUpdatePrize(index, 'isRare', e.target.checked)}
                          className="rounded"
                        />
                        稀有
                      </label>
                      <button
                        onClick={() => handleRemovePrize(index)}
                        className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 概率校验 */}
              <div className={`p-3 rounded-lg ${Math.abs(totalProb - 1) < 0.001 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <div className={`flex items-center gap-2 ${Math.abs(totalProb - 1) < 0.001 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {Math.abs(totalProb - 1) < 0.001 ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="font-medium">
                    总概率: {(totalProb * 100).toFixed(1)}% {Math.abs(totalProb - 1) < 0.001 ? '(有效)' : `(需调整 ${((1 - totalProb) * 100).toFixed(1)}%)`}
                  </span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowActivityForm(false)}
                className={`px-6 py-2 rounded-lg border ${
                  isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                } transition-colors`}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {editingActivity ? '保存修改' : '创建活动'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">转盘活动管理</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            全面监控和管理转盘活动数据
          </p>
        </div>

        {/* 标签页 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'activities', label: '活动列表', icon: Gift },
              { key: 'records', label: '抽奖记录', icon: Activity },
              { key: 'statistics', label: '数据统计', icon: BarChart3 },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-blue-600 text-white'
                    : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'activities' && renderActivitiesList()}
            {activeTab === 'records' && renderSpinRecords()}
            {activeTab === 'statistics' && renderStatistics()}
            {activeTab === 'prizes' && renderPrizeManagement()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 弹窗 */}
      <AnimatePresence>
        {showActivityDetail && renderActivityDetailModal()}
        {showActivityForm && renderActivityFormModal()}
        {showPrizeModal && renderPrizeModal()}
      </AnimatePresence>
    </div>
  );
}
