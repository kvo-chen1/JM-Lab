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
  Edit3,
  Eye,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  Users,
  FileText,
  DollarSign,
  Clock,
  Briefcase,
  MessageSquare,
  User,
  X,
  Inbox,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ipService, { CommercialOpportunity, CommercialPartnership } from '@/services/ipService';

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
  const [applications, setApplications] = useState<CommercialPartnership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<string>('all');
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
      
      // 获取主办方自己的商业机会列表
      const opportunitiesData = await ipService.getOrganizerOpportunities();
      
      // 获取申请列表
      const partnershipsData = await ipService.getAllPartnerships();
      setApplications(partnershipsData);

      // 根据真实申请数据计算每个商业机会的申请数量
      const opportunitiesWithStats = opportunitiesData.map(opp => {
        const oppApplications = partnershipsData.filter(p => p.opportunityId === opp.id);
        return {
          ...opp,
          applicationCount: oppApplications.length,
          viewCount: opp.viewCount || 0 // 使用真实的浏览量，如果没有则显示0
        };
      });
      setOpportunities(opportunitiesWithStats);

      // 计算统计数据
      setStats({
        total: opportunitiesWithStats.length,
        open: opportunitiesWithStats.filter(o => o.status === 'open').length,
        closed: opportunitiesWithStats.filter(o => o.status === 'closed').length,
        totalApplications: partnershipsData.filter(p => 
          opportunitiesWithStats.some(o => o.id === p.opportunityId)
        ).length,
        pendingApplications: partnershipsData.filter(p => 
          p.status === 'pending' && opportunitiesWithStats.some(o => o.id === p.opportunityId)
        ).length,
        approvedApplications: partnershipsData.filter(p => 
          p.status === 'approved' && opportunitiesWithStats.some(o => o.id === p.opportunityId)
        ).length
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

  // 筛选申请
  const filteredApplications = applications.filter(app => {
    if (applicationStatusFilter === 'all') return true;
    return app.status === applicationStatusFilter;
  });

  // 渲染申请审核列表
  const renderApplicationsList = () => (
    <div className="space-y-4">
      {/* 申请筛选器 */}
      <div className={`flex gap-3 mb-4`}>
        {[
          { id: 'all', label: '全部', count: applications.length },
          { id: 'pending', label: '待审核', count: applications.filter(a => a.status === 'pending').length },
          { id: 'approved', label: '已通过', count: applications.filter(a => a.status === 'approved').length },
          { id: 'rejected', label: '已拒绝', count: applications.filter(a => a.status === 'rejected').length },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setApplicationStatusFilter(filter.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              applicationStatusFilter === filter.id
                ? isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {filter.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {filteredApplications.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <Inbox className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              暂无申请
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              当创作者申请您的商业机会时，申请将显示在这里
            </p>
          </div>
        ) : (
          filteredApplications.map((application, index) => (
          <motion.div
            key={application.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-5 rounded-2xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-gray-200'} border hover:border-cyan-500/30 transition-all`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* 申请者头像 */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-100 to-blue-100'}`}>
                  <User className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>

                {/* 申请信息 */}
                <div>
                  <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {application.applicantName || '未知用户'}
                  </h3>
                  <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    申请参与：{opportunities.find(o => o.id === application.opportunityId)?.name || '未知机会'}
                  </p>

                  {/* 状态标签 */}
                  <div className="flex flex-wrap gap-2">
                    {application.status === 'pending' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                        <Clock className="w-3 h-3" />
                        待审核
                      </span>
                    )}
                    {application.status === 'approved' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        已通过
                      </span>
                    )}
                    {application.status === 'rejected' && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                        <XCircle className="w-3 h-3" />
                        已拒绝
                      </span>
                    )}
                  </div>

                  {/* 申请留言 */}
                  {application.message && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-50 text-gray-600'}`}>
                      <MessageSquare className={`w-4 h-4 inline mr-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                      {application.message}
                    </div>
                  )}
                </div>
              </div>

              {/* 申请时间 */}
              <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                {application.createdAt ? new Date(application.createdAt).toLocaleDateString('zh-CN') : '-'}
              </div>
            </div>

            {/* 操作按钮 */}
            {application.status === 'pending' && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => handleReviewApplication(application.id, 'approved')}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  通过
                </button>
                <button
                  onClick={() => handleReviewApplication(application.id, 'rejected')}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                >
                  <XCircle className="w-4 h-4" />
                  拒绝
                </button>
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );

  // 处理审核申请
  const handleReviewApplication = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const success = await ipService.reviewApplication(applicationId, status);
      if (success) {
        toast.success(status === 'approved' ? '申请已通过' : '申请已拒绝');
        loadData();
      } else {
        toast.error('操作失败，请重试');
      }
    } catch (error) {
      console.error('审核申请失败:', error);
      toast.error('操作失败，请重试');
    }
  };

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
          renderApplicationsList()
        )}
      </div>

      {/* 发布/编辑弹窗 */}
      <CreateOpportunityModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedOpportunity(null);
        }}
        opportunity={selectedOpportunity}
        onSuccess={loadData}
      />
    </div>
  );
}

// ============================================================================
// 发布/编辑商业机会弹窗组件
// ============================================================================

interface CreateOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity?: OpportunityWithStats | null;
  onSuccess: () => void;
}

function CreateOpportunityModal({ isOpen, onClose, opportunity, onSuccess }: CreateOpportunityModalProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    description: '',
    type: 'collaboration',
    rewardMin: '',
    rewardMax: '',
    matchCriteria: {
      type: [] as string[],
      style: '',
      minFollowers: ''
    },
    deadline: '',
    contactInfo: '',
    status: 'draft' as 'draft' | 'open'
  });

  // 编辑模式时加载数据
  useEffect(() => {
    if (opportunity) {
      setFormData({
        name: opportunity.name || '',
        brandName: opportunity.brandName || '',
        description: opportunity.description || '',
        type: opportunity.type || 'collaboration',
        rewardMin: opportunity.rewardMin?.toString() || '',
        rewardMax: opportunity.rewardMax?.toString() || '',
        matchCriteria: {
          type: opportunity.matchCriteria?.type || [],
          style: opportunity.matchCriteria?.style || '',
          minFollowers: opportunity.matchCriteria?.minFollowers?.toString() || ''
        },
        deadline: opportunity.deadline ? new Date(opportunity.deadline).toISOString().split('T')[0] : '',
        contactInfo: opportunity.contactInfo || '',
        status: opportunity.status || 'draft'
      });
    } else {
      // 重置表单
      setFormData({
        name: '',
        brandName: user?.username || '',
        description: '',
        type: 'collaboration',
        rewardMin: '',
        rewardMax: '',
        matchCriteria: {
          type: [],
          style: '',
          minFollowers: ''
        },
        deadline: '',
        contactInfo: user?.email || '',
        status: 'draft'
      });
    }
    setCurrentStep(1);
  }, [opportunity, user, isOpen]);

  // 处理表单字段变化
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 处理匹配条件变化
  const handleMatchCriteriaChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      matchCriteria: { ...prev.matchCriteria, [field]: value }
    }));
  };

  // 处理IP类型选择
  const handleTypeToggle = (type: string) => {
    const currentTypes = formData.matchCriteria.type;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    handleMatchCriteriaChange('type', newTypes);
  };

  // 提交表单
  const handleSubmit = async (publish: boolean = false) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...formData,
        status: publish ? 'open' : 'draft',
        rewardMin: formData.rewardMin ? parseInt(formData.rewardMin) : undefined,
        rewardMax: formData.rewardMax ? parseInt(formData.rewardMax) : undefined,
        matchCriteria: {
          ...formData.matchCriteria,
          minFollowers: formData.matchCriteria.minFollowers ? parseInt(formData.matchCriteria.minFollowers) : undefined
        }
      };

      if (opportunity) {
        // 更新现有机会
        await ipService.updateOpportunity(opportunity.id, payload);
        toast.success('商业机会已更新');
      } else {
        // 创建新机会
        await ipService.createOpportunity(payload);
        toast.success(publish ? '商业机会已发布' : '草稿已保存');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 验证当前步骤
  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.brandName.trim() && formData.description.trim();
      case 2:
        return formData.rewardMin || formData.rewardMax;
      case 3:
        return true;
      default:
        return false;
    }
  };

  // 下一步
  const handleNext = () => {
    if (validateStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (!validateStep()) {
      toast.error('请填写必填项');
    }
  };

  // 上一步
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // IP类型选项
  const ipTypeOptions = [
    { id: 'illustration', name: '插画', icon: '🎨' },
    { id: 'pattern', name: '图案', icon: '🧩' },
    { id: 'design', name: '设计', icon: '✏️' },
    { id: '3d_model', name: '3D模型', icon: '🎭' },
    { id: 'digital_collectible', name: '数字藏品', icon: '💎' },
  ];

  // 合作类型选项
  const collaborationTypes = [
    { id: 'collaboration', name: '联名合作', description: '与品牌联合推出产品或内容' },
    { id: 'content_creation', name: '内容创作', description: '为品牌创作原创内容' },
    { id: 'product_placement', name: '产品植入', description: '在作品中植入品牌产品' },
    { id: 'endorsement', name: '代言推广', description: '为品牌进行代言或推广' },
    { id: 'custom', name: '定制合作', description: '其他定制化的合作方式' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border ${isDark ? 'backdrop-blur-xl bg-slate-900/90 border-slate-800 shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]' : 'backdrop-blur-xl bg-white/90 border-gray-200 shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]'}`}
          >
            {/* 头部 */}
            <div className={`relative overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? 'from-cyan-500 to-blue-600' : 'from-cyan-600 to-blue-700'} opacity-10`} />
              <div className="relative p-6 flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {opportunity ? '编辑商业机会' : '发布商业机会'}
                  </h2>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    步骤 {currentStep} / {totalSteps}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 进度条 */}
              <div className={`h-1 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                <motion.div
                  className={`h-full bg-gradient-to-r ${isDark ? 'from-cyan-500 to-blue-600' : 'from-cyan-600 to-blue-700'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* 表单内容 */}
            <div className={`p-6 overflow-y-auto max-h-[calc(90vh-200px)] ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
              {/* 步骤1: 基本信息 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      机会名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="例如：春节礼盒插画设计合作"
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-cyan-400/50'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      品牌名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => handleChange('brandName', e.target.value)}
                      placeholder="您的品牌名称"
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-cyan-400/50'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      合作类型
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {collaborationTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleChange('type', type.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            formData.type === type.id
                              ? isDark ? 'border-cyan-500 bg-cyan-500/10' : 'border-cyan-500 bg-cyan-50'
                              : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{type.name}</p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      需求描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="详细描述您的合作需求，包括项目背景、期望成果、合作方式等..."
                      rows={5}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-cyan-400/50'}`}
                    />
                  </div>
                </div>
              )}

              {/* 步骤2: 合作条件 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      预算范围 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="relative">
                          <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>¥</span>
                          <input
                            type="number"
                            value={formData.rewardMin}
                            onChange={(e) => handleChange('rewardMin', e.target.value)}
                            placeholder="最低预算"
                            className={`w-full pl-8 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-cyan-400/50'}`}
                          />
                        </div>
                      </div>
                      <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>至</span>
                      <div className="flex-1">
                        <div className="relative">
                          <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>¥</span>
                          <input
                            type="number"
                            value={formData.rewardMax}
                            onChange={(e) => handleChange('rewardMax', e.target.value)}
                            placeholder="最高预算"
                            className={`w-full pl-8 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-cyan-400/50'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      期望的IP类型
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ipTypeOptions.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleTypeToggle(type.id)}
                          className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                            formData.matchCriteria.type.includes(type.id)
                              ? isDark ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-cyan-500 bg-cyan-50 text-cyan-600'
                              : isDark ? 'border-slate-700 hover:border-slate-600 text-slate-300' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          {type.icon} {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      风格偏好
                    </label>
                    <input
                      type="text"
                      value={formData.matchCriteria.style}
                      onChange={(e) => handleMatchCriteriaChange('style', e.target.value)}
                      placeholder="例如：国潮、简约、可爱、复古等"
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-cyan-400/50'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      最低粉丝量要求
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.matchCriteria.minFollowers}
                        onChange={(e) => handleMatchCriteriaChange('minFollowers', e.target.value)}
                        placeholder="不填表示无要求"
                        className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-cyan-400/50'}`}
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>粉丝</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 步骤3: 发布设置 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      截止时间
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleChange('deadline', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-cyan-400/50'}`}
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>不填表示长期有效</p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      联系方式
                    </label>
                    <input
                      type="text"
                      value={formData.contactInfo}
                      onChange={(e) => handleChange('contactInfo', e.target.value)}
                      placeholder="邮箱或电话，用于创作者联系您"
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-cyan-400/50'}`}
                    />
                  </div>

                  {/* 预览 */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>信息预览</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>机会名称:</span>
                        <span className={isDark ? 'text-slate-200' : 'text-gray-700'}>{formData.name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>品牌:</span>
                        <span className={isDark ? 'text-slate-200' : 'text-gray-700'}>{formData.brandName || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>预算:</span>
                        <span className={isDark ? 'text-slate-200' : 'text-gray-700'}>
                          {formData.rewardMin || formData.rewardMax
                            ? `¥${formData.rewardMin || 0} - ¥${formData.rewardMax || '不限'}`
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className={`flex gap-3 p-6 border-t ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
              {currentStep > 1 && (
                <button
                  onClick={handlePrev}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  上一步
                </button>
              )}
              <div className="flex-1" />
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/15'}`}
                >
                  下一步
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50`}
                  >
                    {isSubmitting ? '保存中...' : '保存草稿'}
                  </button>
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/15'} disabled:opacity-50`}
                  >
                    {isSubmitting ? '发布中...' : '立即发布'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

