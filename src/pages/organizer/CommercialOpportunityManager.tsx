/**
 * 主办方商业机会管理页面
 * 用于发布、管理和审核商业机会
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronRight,
  BarChart3,
  Clock,
  AlertCircle,
  MoreHorizontal,
  ChevronDown,
  ArrowLeft,
  Briefcase,
  Target,
  Award,
  Sparkles,
  Zap,
  ArrowUpRight,
  Activity,
  Layers,
  Hash,
  MessageSquare,
  Heart,
  User,
  Tag,
  FilterX,
  RefreshCw,
  X,
  Handshake,
  Inbox,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ipService, { CommercialOpportunity, Partnership } from '@/services/ipService';

// ============================================================================
// 类型定义
// ============================================================================

interface OpportunityWithStats extends CommercialOpportunity {
  applicationCount?: number;
  viewCount?: number;
}

// ============================================================================
// 状态配置
// ============================================================================

const statusConfig = {
  open: {
    label: '进行中',
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    borderColor: 'border-emerald-200 dark:border-emerald-500/30',
    icon: Play,
    gradient: 'from-emerald-400 to-teal-500',
    description: '正在接收申请'
  },
  closed: {
    label: '已结束',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-500/10',
    borderColor: 'border-slate-200 dark:border-slate-500/30',
    icon: Pause,
    gradient: 'from-slate-400 to-slate-500',
    description: '已停止接收申请'
  },
  draft: {
    label: '草稿',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-500/10',
    borderColor: 'border-amber-200 dark:border-amber-500/30',
    icon: FileText,
    gradient: 'from-amber-400 to-orange-500',
    description: '尚未发布'
  }
};

// ============================================================================
// 主组件
// ============================================================================

export default function CommercialOpportunityManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  // 状态管理
  const [opportunities, setOpportunities] = useState<OpportunityWithStats[]>([]);
  const [applications, setApplications] = useState<Partnership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityWithStats | null>(null);
  const [activeTab, setActiveTab] = useState<'opportunities' | 'applications'>('opportunities');

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0
  });

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      // 获取商业机会列表（需要添加主办方视角的API）
      const opportunitiesData = await ipService.getCommercialOpportunities();
      // 模拟添加申请数量
      const opportunitiesWithStats = opportunitiesData.map(opp => ({
        ...opp,
        applicationCount: Math.floor(Math.random() * 20),
        viewCount: Math.floor(Math.random() * 100)
      }));
      setOpportunities(opportunitiesWithStats);

      // 获取申请列表
      const partnershipsData = await ipService.getPartnerships();
      setApplications(partnershipsData);

      // 计算统计数据
      setStats({
        total: opportunitiesWithStats.length,
        open: opportunitiesWithStats.filter(o => o.status === 'open').length,
        closed: opportunitiesWithStats.filter(o => o.status === 'closed').length,
        totalApplications: partnershipsData.length,
        pendingApplications: partnershipsData.filter(p => p.status === 'pending').length,
        approvedApplications: partnershipsData.filter(p => p.status === 'approved').length
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 筛选机会
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opp.brandName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.closed;
  };

  // 渲染统计卡片
  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'} border`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
            <Briefcase className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>总机会数</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'} border`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
            <Play className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.open}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>进行中</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'} border`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
            <Inbox className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalApplications}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>总申请数</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'} border`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
            <Clock className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.pendingApplications}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>待审核</p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // 渲染机会列表
  const renderOpportunitiesList = () => (
    <div className="space-y-4">
      {filteredOpportunities.map((opportunity, index) => {
        const status = getStatusConfig(opportunity.status);
        const StatusIcon = status.icon;

        return (
          <motion.div
            key={opportunity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-5 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'} border hover:border-cyan-500/30 transition-all`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* 品牌Logo */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-100 to-blue-100'}`}>
                  {opportunity.brandLogo ? (
                    <img src={opportunity.brandLogo} alt={opportunity.brandName} className="w-10 h-10 object-contain" />
                  ) : (
                    <Briefcase className={`w-7 h-7 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  )}
                </div>

                {/* 信息 */}
                <div>
                  <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {opportunity.name}
                  </h3>
                  <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {opportunity.brandName}
                  </p>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    {opportunity.reward && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <DollarSign className="w-3 h-3" />
                        {opportunity.reward}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 统计数据 */}
              <div className="flex items-center gap-4 text-sm">
                <div className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  <Users className="w-4 h-4" />
                  <span>{opportunity.applicationCount} 申请</span>
                </div>
                <div className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  <Eye className="w-4 h-4" />
                  <span>{opportunity.viewCount} 浏览</span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setSelectedOpportunity(opportunity);
                  setShowApplicationsModal(true);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Inbox className="w-4 h-4" />
                查看申请
              </button>
              <button
                onClick={() => {
                  setSelectedOpportunity(opportunity);
                  setShowCreateModal(true);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Edit3 className="w-4 h-4" />
                编辑
              </button>
              {opportunity.status === 'open' ? (
                <button
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
                >
                  <Pause className="w-4 h-4" />
                  暂停
                </button>
              ) : opportunity.status === 'closed' ? (
                <button
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                >
                  <Play className="w-4 h-4" />
                  开启
                </button>
              ) : null}
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* 头部 */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              商业机会管理
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              发布商业合作机会，管理申请和合作
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedOpportunity(null);
              setShowCreateModal(true);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/15'}`}
          >
            <Plus className="w-5 h-5" />
            发布机会
          </button>
        </div>

        {/* 统计卡片 */}
        {renderStatsCards()}

        {/* 标签页切换 */}
        <div className={`flex gap-4 mb-6 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'opportunities'
                ? `border-cyan-500 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`
                : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            <Briefcase className="w-4 h-4" />
            商业机会
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'applications'
                ? `border-cyan-500 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`
                : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            <Inbox className="w-4 h-4" />
            申请审核
            {stats.pendingApplications > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${isDark ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white'}`}>
                {stats.pendingApplications}
              </span>
            )}
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className={`flex flex-wrap gap-4 mb-6 p-4 rounded-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'} border`}>
          <div className="relative flex-1 min-w-[280px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索机会名称或品牌..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-cyan-400/50'}`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 focus:ring-cyan-400/50'}`}
          >
            <option value="all">全部状态</option>
            <option value="open">进行中</option>
            <option value="closed">已结束</option>
            <option value="draft">草稿</option>
          </select>
        </div>

        {/* 内容区域 */}
        {isLoading ? (
          <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-cyan-500/30 border-t-cyan-400' : 'border-cyan-200 border-t-cyan-600'}`} />
            <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>加载中...</p>
          </div>
        ) : activeTab === 'opportunities' ? (
          filteredOpportunities.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <Briefcase className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                暂无商业机会
              </h3>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                点击右上角"发布机会"按钮创建您的第一个商业机会
              </p>
            </div>
          ) : (
            renderOpportunitiesList()
          )
        ) : (
          // 申请审核标签页内容
          <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <Inbox className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              申请审核功能开发中
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              敬请期待
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
