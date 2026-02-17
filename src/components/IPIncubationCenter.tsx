import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import ipService, { 
  IPAsset, 
  IPStage as ServiceIPStage, 
  CommercialOpportunity,
  CopyrightAsset,
  IPActivity,
  IPStats,
  SampleIPAsset
} from '@/services/ipService';
import { AuthContext } from '@/contexts/authContext';
import {
  Route, Gem, Handshake, Shield, BarChart3, Plus, Search,
  Filter, ChevronDown, MoreHorizontal, ArrowRight, Sparkles,
  TrendingUp, Clock, CheckCircle2, Circle, AlertCircle,
  Lightbulb, Target, Zap, Award, FileText, Share2, Download,
  Archive, ExternalLink, Bell, Calendar, RefreshCw, Loader2,
  X, ChevronLeft, Edit3, Trash2, Eye
} from 'lucide-react';

// 导航项类型
interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  badge?: number;
}



// ==================== 左侧导航栏组件 ====================
function Sidebar({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  navItems,
  onSubmitWork
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  navItems: NavItem[];
  onSubmitWork: () => void;
}) {
  const { isDark } = useTheme();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`${isCollapsed ? 'w-16' : 'w-60'} flex-shrink-0 transition-all duration-300`}
    >
      <div className={`sticky top-4 rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* 折叠按钮 */}
        <button
          onClick={onToggleCollapse}
          className={`w-full py-3 flex items-center justify-center border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        {/* 导航菜单 */}
        <nav className="p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-primary'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className={`flex-shrink-0 ${isActive ? 'text-white' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium text-left">{item.name}</span>
                    {item.badge && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* 底部快捷操作 */}
        {!isCollapsed && (
          <div className={`p-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <button 
              onClick={onSubmitWork}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>提交新作品</span>
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

// ==================== 右侧辅助信息区组件 ====================
function RightPanel({
  ipStats,
  selectedAsset,
  activities,
  opportunities,
  onApplyOpportunity,
  isLoading,
  onSubmitWork,
  onExportData
}: {
  ipStats: IPStats;
  selectedAsset: IPAsset | null;
  activities: IPActivity[];
  opportunities: CommercialOpportunity[];
  onApplyOpportunity: (id: string, ipAssetId: string) => void;
  isLoading: boolean;
  onSubmitWork: () => void;
  onExportData: () => void;
}) {
  const { isDark } = useTheme();

  // 获取匹配度最高的机会
  const topOpportunities = useMemo(() =>
    opportunities
      .filter(o => o.status === 'open')
      .slice(0, 2),
    [opportunities]
  );

  // 格式化时间显示
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 30) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-80 flex-shrink-0 hidden xl:block"
    >
      <div className="sticky top-4 space-y-4">
        {/* 统计卡片 */}
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-500" />
            数据概览
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className="text-2xl font-bold text-primary-600">{ipStats.totalAssets}</p>
                <p className="text-xs text-gray-500">IP资产</p>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className="text-2xl font-bold text-blue-600">{ipStats.totalPartnerships}</p>
                <p className="text-xs text-gray-500">商业合作</p>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} col-span-2`}>
                <p className="text-2xl font-bold text-emerald-600">
                  ¥{(ipStats.totalEstimatedValue / 10000).toFixed(1)}万
                </p>
                <p className="text-xs text-gray-500">预估总价值</p>
              </div>
            </div>
          )}
        </div>

        {/* 快捷操作 */}
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            快捷操作
          </h3>
          <div className="space-y-2">
            <button 
              onClick={onSubmitWork}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>提交新作品</span>
            </button>
            <button 
              onClick={onExportData}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            >
              <FileText className="w-4 h-4" />
              <span>导出数据</span>
            </button>
            <button className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
              <Share2 className="w-4 h-4" />
              <span>分享展示</span>
            </button>
          </div>
        </div>

        {/* 最近动态 */}
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            最近动态
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 4).map((activity) => (
                <div
                  key={activity.id}
                  className={`flex gap-3 p-2 rounded-lg ${!activity.isRead ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.type === 'progress' ? 'bg-emerald-500' :
                    activity.type === 'opportunity' ? 'bg-amber-500' :
                    activity.type === 'milestone' ? 'bg-purple-500' :
                    'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(activity.createdAt)}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">暂无动态</p>
              )}
            </div>
          )}
        </div>

        {/* 推荐机会 */}
        {topOpportunities.length > 0 && (
          <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              推荐机会
            </h3>
            <div className="space-y-3">
              {topOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-md transition-shadow cursor-pointer group`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium group-hover:text-primary-600 transition-colors">
                      {opportunity.name}
                    </h4>
                    <span className="text-xs font-medium text-emerald-600">
                      {opportunity.reward}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {opportunity.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{opportunity.brandName}</span>
                    <button
                      onClick={() => selectedAsset && onApplyOpportunity(opportunity.id, selectedAsset.id)}
                      disabled={!selectedAsset}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:text-gray-400"
                    >
                      申请 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 智能建议 */}
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'} border ${isDark ? 'border-amber-800' : 'border-amber-200'}`}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Lightbulb className="w-4 h-4" />
            智能建议
          </h3>
          <ul className="space-y-2">
            {selectedAsset && selectedAsset.stages[1]?.completed && !selectedAsset.stages[2]?.completed && (
              <li className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>您的作品"{selectedAsset.name}"已完成版权存证，可以开始申请商业合作</span>
              </li>
            )}
            <li className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
              <Target className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>建议将"传统纹样创新"设计转化为3D模型，提升商业价值</span>
            </li>
          </ul>
        </div>
      </div>
    </motion.aside>
  );
}

// ==================== 进度总览组件 ====================
function ProgressOverview({
  selectedAsset,
  progress,
  isDark
}: {
  selectedAsset: IPAsset | null;
  progress: number;
  isDark: boolean;
}) {
  if (!selectedAsset) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <TianjinImage
            src={selectedAsset.thumbnail}
            alt={selectedAsset.name}
            className="w-16 h-16 rounded-xl object-cover"
            ratio="square"
          />
          <div>
            <h2 className="text-xl font-bold">{selectedAsset.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedAsset.type === 'illustration' ? '插画' :
               selectedAsset.type === 'pattern' ? '纹样' :
               selectedAsset.type === '3d_model' ? '3D模型' :
               selectedAsset.type === 'digital_collectible' ? '数字藏品' : '设计'}
              {' · '}
              预估价值 ¥{selectedAsset.commercialValue.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary-600">{progress}%</p>
          <p className="text-sm text-gray-500">孵化进度</p>
        </div>
      </div>

      {/* 进度条 */}
      <div className={`h-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* 阶段指示点 */}
      <div className="flex justify-between mt-4">
        {['创意设计', '版权存证', 'IP孵化', '商业合作', '收益分成'].map((stage, index) => {
          const stageProgress = ((index + 1) / 5) * 100;
          const isCompleted = progress >= stageProgress;
          const isCurrent = progress < stageProgress && progress > (index / 5) * 100;

          return (
            <div key={stage} className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mb-2 ${
                isCompleted ? 'bg-emerald-500' :
                isCurrent ? 'bg-primary-500 ring-4 ring-primary-200' :
                isDark ? 'bg-gray-600' : 'bg-gray-300'
              }`} />
              <span className={`text-xs ${
                isCompleted || isCurrent ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400'
              }`}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ==================== 阶段时间线组件 ====================
function StageTimeline({
  stages,
  isDark,
  onUpdateStage,
  assetId,
  isLoading
}: {
  stages: ServiceIPStage[];
  isDark: boolean;
  onUpdateStage: (stageId: string, completed: boolean) => void;
  assetId: string;
  isLoading: boolean;
}) {
  const getStageIcon = (stageName: string) => {
    switch (stageName) {
      case '创意设计': return <Sparkles className="w-4 h-4" />;
      case '版权存证': return <Shield className="w-4 h-4" />;
      case 'IP孵化': return <Gem className="w-4 h-4" />;
      case '商业合作': return <Handshake className="w-4 h-4" />;
      case '收益分成': return <Award className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Target className="w-5 h-5 text-primary-500" />
        孵化阶段
      </h3>

      <div className="relative">
        {/* 垂直线 */}
        <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

        {/* 阶段列表 */}
        <div className="space-y-6">
          {stages.map((stage, index) => {
            const isCompleted = stage.completed;
            const isActive = !isCompleted && !stages.slice(0, index).some(s => !s.completed);

            return (
              <motion.div
                key={stage.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-4"
              >
                {/* 图标 */}
                <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                      ? 'bg-primary-500 text-white ring-4 ring-primary-200 dark:ring-primary-900'
                      : isDark
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : getStageIcon(stage.name)}
                </div>

                {/* 内容 */}
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-semibold ${isActive ? 'text-primary-600' : ''}`}>
                        {stage.name}
                      </h4>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {stage.description}
                      </p>
                      {stage.completedAt && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          完成于 {new Date(stage.completedAt).toLocaleDateString('zh-CN')}
                        </p>
                      )}
                    </div>

                    {/* 状态切换 */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={stage.completed}
                        onChange={(e) => onUpdateStage(stage.id, e.target.checked)}
                        disabled={isLoading}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600" />
                    </label>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==================== 示例IP资产卡片组件 ====================
function SampleIPAssetCard({
  asset,
  isDark,
  onViewDetails
}: {
  asset: SampleIPAsset;
  isDark: boolean;
  onViewDetails: (asset: SampleIPAsset) => void;
}) {
  const progress = useMemo(() => {
    const completedStages = asset.stages.filter(s => s.completed).length;
    return Math.round((completedStages / asset.stages.length) * 100);
  }, [asset]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'illustration': '插画',
      'pattern': '纹样',
      'design': '设计',
      '3d_model': '3D模型',
      'digital_collectible': '数字藏品'
    };
    return labels[type] || type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`rounded-2xl overflow-hidden cursor-pointer ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'} hover:shadow-card-hover transition-all`}
      onClick={() => onViewDetails(asset)}
    >
      <div className="relative">
        <img
          src={asset.thumbnail}
          alt={asset.name}
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${isDark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur`}>
            {getTypeLabel(asset.type)}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
            ¥{asset.commercialValue.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-sm">{asset.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            progress === 100
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-primary-100 text-primary-700'
          }`}>
            {progress}%
          </span>
        </div>
        <p className={`text-xs mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {asset.description}
        </p>
        <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-blue-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {asset.highlights.map((highlight, idx) => (
            <span
              key={idx}
              className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
            >
              {highlight}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ==================== 示例资产详情弹窗组件 ====================
function SampleAssetDetailModal({
  asset,
  isDark,
  onClose,
  onCreateSimilar
}: {
  asset: SampleIPAsset | null;
  isDark: boolean;
  onClose: () => void;
  onCreateSimilar: () => void;
}) {
  if (!asset) return null;

  const progress = useMemo(() => {
    const completedStages = asset.stages.filter(s => s.completed).length;
    return Math.round((completedStages / asset.stages.length) * 100);
  }, [asset]);

  const getStageIcon = (stageName: string) => {
    switch (stageName) {
      case '创意设计': return <Sparkles className="w-4 h-4" />;
      case '版权存证': return <Shield className="w-4 h-4" />;
      case 'IP孵化': return <Gem className="w-4 h-4" />;
      case '商业合作': return <Handshake className="w-4 h-4" />;
      case '收益分成': return <Award className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
          onClick={e => e.stopPropagation()}
        >
          {/* 头部图片 */}
          <div className="relative h-48">
            <img
              src={asset.thumbnail}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            >
              ×
            </button>
            <div className="absolute bottom-4 left-6 right-6">
              <h2 className="text-2xl font-bold text-white mb-1">{asset.name}</h2>
              <p className="text-white/80 text-sm">{asset.category}</p>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6">
            {/* 进度总览 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">孵化进度</span>
                <span className="text-lg font-bold text-primary-600">{progress}%</span>
              </div>
              <div className={`h-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 描述 */}
            <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                作品描述
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {asset.description}
              </p>
            </div>

            {/* 孵化阶段 */}
            <div className="mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary-500" />
                孵化阶段
              </h3>
              <div className="space-y-3">
                {asset.stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      stage.completed
                        ? isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'
                        : isDark ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      stage.completed
                        ? 'bg-emerald-500 text-white'
                        : isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'
                    }`}>
                      {stage.completed ? <CheckCircle2 className="w-4 h-4" /> : getStageIcon(stage.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${stage.completed ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
                          {stage.name}
                        </span>
                        {stage.completed && stage.completedAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(stage.completedAt).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 亮点 */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                作品亮点
              </h3>
              <div className="flex flex-wrap gap-2">
                {asset.highlights.map((highlight, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-sm rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>

            {/* 商业价值 */}
            <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gradient-to-br from-emerald-900/20 to-blue-900/20' : 'bg-gradient-to-br from-emerald-50 to-blue-50'} border ${isDark ? 'border-emerald-800' : 'border-emerald-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">预估商业价值</p>
                  <p className="text-2xl font-bold text-emerald-600">¥{asset.commercialValue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={onCreateSimilar}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                创建类似作品
              </button>
              <button
                onClick={onClose}
                className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                关闭
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ==================== 空状态组件 - 带示例展示 ====================
function EmptyStateWithSamples({
  isDark,
  onSubmitWork,
  sampleAssets,
  onViewSampleDetails
}: {
  isDark: boolean;
  onSubmitWork: () => void;
  sampleAssets: SampleIPAsset[];
  onViewSampleDetails: (asset: SampleIPAsset) => void;
}) {
  return (
    <div className="space-y-8">
      {/* 主空状态 */}
      <div className={`flex flex-col items-center justify-center py-12 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-card`}>
        <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
          <Gem className="w-10 h-10 text-primary-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">还没有IP资产</h3>
        <p className={`text-center max-w-md mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          提交作品并完成版权存证后，即可创建IP资产并开始孵化之旅
        </p>
        <div className="flex gap-3">
          <button
            onClick={onSubmitWork}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            提交作品
          </button>
        </div>
      </div>

      {/* 示例展示区域 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              参考示例
            </h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              查看其他创作者的IP资产，了解孵化流程
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleAssets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SampleIPAssetCard
                asset={asset}
                isDark={isDark}
                onViewDetails={onViewSampleDetails}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* 孵化流程说明 */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-br from-primary-900/20 to-purple-900/20' : 'bg-gradient-to-br from-primary-50 to-purple-50'} border ${isDark ? 'border-primary-800' : 'border-primary-200'}`}>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Route className="w-5 h-5 text-primary-500" />
          IP孵化流程
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { icon: Sparkles, name: '创意设计', desc: '完成原创作品' },
            { icon: Shield, name: '版权存证', desc: '保护知识产权' },
            { icon: Gem, name: 'IP孵化', desc: '转化为IP资产' },
            { icon: Handshake, name: '商业合作', desc: '对接品牌方' },
            { icon: Award, name: '收益分成', desc: '获得持续收益' }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary-600" />
                </div>
                {index < 4 && (
                  <div className="hidden md:block w-full h-0.5 bg-primary-200 dark:bg-primary-800 ml-2" />
                )}
              </div>
              <p className="text-sm font-medium">{step.name}</p>
              <p className="text-xs text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== 主内容区组件 - IP孵化路径 ====================
function IncubationPathContent({
  selectedAsset,
  ipAssets,
  ipStats,
  isDark,
  onAssetChange,
  onUpdateStage,
  isLoading,
  onSubmitWork,
  sampleAssets,
  onViewSampleDetails
}: {
  selectedAsset: IPAsset | null;
  ipAssets: IPAsset[];
  ipStats: IPStats;
  isDark: boolean;
  onAssetChange: (asset: IPAsset | null) => void;
  onUpdateStage: (assetId: string, stageId: string, completed: boolean) => void;
  onSubmitWork: () => void;
  isLoading: boolean;
  sampleAssets: SampleIPAsset[];
  onViewSampleDetails: (asset: SampleIPAsset) => void;
}) {
  const progress = useMemo(() => {
    if (!selectedAsset) return 0;
    const completedStages = selectedAsset.stages.filter(s => s.completed).length;
    return Math.round((completedStages / selectedAsset.stages.length) * 100);
  }, [selectedAsset]);

  const activeStage = useMemo(() => {
    if (!selectedAsset) return null;
    return selectedAsset.stages.find(s => !s.completed) || selectedAsset.stages[selectedAsset.stages.length - 1];
  }, [selectedAsset]);

  // 调试日志
  console.log('[IncubationPathContent] 渲染状态:', { isLoading, ipAssetsCount: ipAssets.length, hasSelectedAsset: !!selectedAsset });

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-card`}>
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!selectedAsset) {
    // 如果有资产但没有选中，显示资产列表供选择
    console.log('[IncubationPathContent] 无选中资产，ipAssets数量:', ipAssets.length);
    if (ipAssets.length > 0) {
      return (
        <div className="space-y-6">
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card`}>
            <h3 className="text-lg font-semibold mb-4">选择IP资产开始孵化</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ipAssets.map((asset) => (
                <motion.button
                  key={asset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAssetChange(asset)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isDark 
                      ? 'border-gray-700 hover:border-primary-500 bg-gray-800' 
                      : 'border-gray-200 hover:border-primary-500 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {asset.thumbnail ? (
                      <img src={asset.thumbnail} alt={asset.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <Gem className="w-8 h-8 text-primary-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{asset.name}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        预估价值: ¥{asset.commercialValue?.toLocaleString() || 0}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          asset.stages?.some(s => s.completed) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {asset.stages?.filter(s => s.completed).length || 0}/{asset.stages?.length || 5} 阶段完成
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* 示例展示 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  参考示例
                </h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  查看其他创作者的IP资产，了解孵化流程
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sampleAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SampleIPAssetCard
                    asset={asset}
                    isDark={isDark}
                    onViewDetails={onViewSampleDetails}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // 真正没有资产时显示空状态
    return (
      <EmptyStateWithSamples
        isDark={isDark}
        onSubmitWork={onSubmitWork}
        sampleAssets={sampleAssets}
        onViewSampleDetails={onViewSampleDetails}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* IP资产选择器 */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">选择IP资产:</span>
        <div className="relative">
          <select
            value={selectedAsset.id}
            onChange={(e) => {
              const asset = ipAssets.find(a => a.id === e.target.value);
              onAssetChange(asset || null);
            }}
            className={`appearance-none px-4 py-2 pr-10 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-primary-500`}
          >
            {ipAssets.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* 进度总览 */}
      <ProgressOverview
        selectedAsset={selectedAsset}
        progress={progress}
        isDark={isDark}
      />

      {/* 当前阶段提示 */}
      {activeStage && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl p-6 ${isDark ? 'bg-gradient-to-br from-primary-900/30 to-purple-900/30' : 'bg-gradient-to-br from-primary-50 to-purple-50'} border ${isDark ? 'border-primary-800' : 'border-primary-200'}`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">
                当前阶段: {activeStage.name}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                {activeStage.description}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} text-center`}>
                  <p className="text-xs text-gray-500 mb-1">完成条件</p>
                  <p className="text-sm font-medium">完成该阶段要求</p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} text-center`}>
                  <p className="text-xs text-gray-500 mb-1">预期收益</p>
                  <p className="text-sm font-medium">提升IP价值</p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} text-center`}>
                  <p className="text-xs text-gray-500 mb-1">下一阶段</p>
                  <p className="text-sm font-medium">
                    {selectedAsset.stages[selectedAsset.stages.indexOf(activeStage) + 1]?.name || '收益分成'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 阶段时间线 */}
      <StageTimeline
        stages={selectedAsset.stages}
        isDark={isDark}
        assetId={selectedAsset.id}
        onUpdateStage={(stageId, completed) => onUpdateStage(selectedAsset.id, stageId, completed)}
        isLoading={isLoading}
      />
    </div>
  );
}

// ==================== IP资产列表组件 ====================
function AssetsContent({
  ipAssets,
  isDark,
  onSelectAsset,
  calculateProgress,
  isLoading
}: {
  ipAssets: IPAsset[];
  isDark: boolean;
  onSelectAsset: (asset: IPAsset) => void;
  calculateProgress: (stages: ServiceIPStage[]) => number;
  isLoading: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredAssets = useMemo(() => {
    return ipAssets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || asset.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [ipAssets, searchQuery, typeFilter]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'illustration': '插画',
      'pattern': '纹样',
      'design': '设计',
      '3d_model': '3D模型',
      'digital_collectible': '数字藏品'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-card`}>
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索IP资产..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-primary-500`}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-4 py-2.5 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-primary-500`}
          >
            <option value="all">所有类型</option>
            <option value="illustration">插画</option>
            <option value="pattern">纹样</option>
            <option value="design">设计</option>
            <option value="3d_model">3D模型</option>
            <option value="digital_collectible">数字藏品</option>
          </select>
        </div>
      </div>

      {/* 资产网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssets.map((asset) => {
          const progress = calculateProgress(asset.stages);
          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              onClick={() => onSelectAsset(asset)}
              className={`rounded-2xl overflow-hidden cursor-pointer ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'} hover:shadow-card-hover transition-all`}
            >
              <div className="relative">
                <TianjinImage
                  src={asset.thumbnail}
                  alt={asset.name}
                  className="w-full h-40 object-cover"
                  ratio="landscape"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${isDark ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur`}>
                    {getTypeLabel(asset.type)}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                    ¥{asset.commercialValue.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{asset.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    progress === 100
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-primary-100 text-primary-700'
                  }`}>
                    {progress}%
                  </span>
                </div>
                <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {asset.description}
                </p>
                <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-card`}>
          <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">没有找到匹配的IP资产</p>
        </div>
      )}
    </div>
  );
}

// ==================== 商业机会组件 ====================
function OpportunitiesContent({
  opportunities,
  isDark,
  onApply,
  ipAssets,
  isLoading
}: {
  opportunities: CommercialOpportunity[];
  isDark: boolean;
  onApply: (opportunityId: string, ipAssetId: string) => void;
  ipAssets: IPAsset[];
  isLoading: boolean;
}) {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return { label: '开放申请', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' };
      case 'matched':
        return { label: '匹配中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' };
      default:
        return { label: '已关闭', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' };
    }
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-card`}>
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* IP资产选择 */}
      {ipAssets.length > 0 && (
        <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <label className="block text-sm font-medium mb-2">选择要申请的IP资产</label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-primary-500`}
          >
            <option value="">请选择IP资产</option>
            {ipAssets.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* 机会列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opportunities.map((opportunity, index) => {
          const status = getStatusConfig(opportunity.status);
          return (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'} hover:shadow-card-hover transition-all`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{opportunity.name}</h3>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {opportunity.brandName}
                </p>
                <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {opportunity.description}
                </p>
                {opportunity.requirements && (
                  <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    要求: {opportunity.requirements}
                  </p>
                )}
                <div className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">奖励</span>
                    <span className="font-semibold text-primary-600">{opportunity.reward}</span>
                  </div>
                </div>
                <button
                  onClick={() => selectedAssetId && onApply(opportunity.id, selectedAssetId)}
                  disabled={opportunity.status !== 'open' || !selectedAssetId}
                  className={`w-full py-2.5 rounded-xl font-medium transition-all ${
                    opportunity.status === 'open' && selectedAssetId
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {opportunity.status === 'open' 
                    ? (selectedAssetId ? '立即申请' : '请先选择IP资产')
                    : status.label
                  }
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {opportunities.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-card`}>
          <Handshake className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">暂无可申请的商业机会</p>
        </div>
      )}
    </div>
  );
}

// ==================== 版权资产组件 ====================
function CopyrightContent({
  copyrightAssets,
  isDark,
  onLicense,
  isLoading
}: {
  copyrightAssets: CopyrightAsset[];
  isDark: boolean;
  onLicense: (id: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-card`}>
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {copyrightAssets.map((asset) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <TianjinImage
              src={asset.thumbnail || ''}
              alt={asset.name}
              className="w-full h-40 object-cover"
              ratio="landscape"
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{asset.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {asset.type}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-gray-500">
                  {asset.registeredAt ? new Date(asset.registeredAt).toLocaleDateString('zh-CN') : '-'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  asset.status === 'registered'
                    ? 'bg-emerald-100 text-emerald-700'
                    : asset.status === 'licensed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                }`}>
                  {asset.status === 'registered' ? '已存证' : asset.status === 'licensed' ? '已授权' : '已过期'}
                </span>
              </div>
              <button
                onClick={() => onLicense(asset.id)}
                disabled={!asset.canLicense}
                className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${
                  asset.canLicense
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : isDark
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {asset.canLicense ? '版权授权' : '已授权'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {copyrightAssets.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-card`}>
          <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">暂无版权资产</p>
          <p className="text-sm text-gray-400 mt-2">完成作品版权存证后将显示在这里</p>
        </div>
      )}

      {/* 版权数据分析 */}
      {copyrightAssets.length > 0 && (
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-6">版权数据分析</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-4 text-gray-500">版权类型分布</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: '插画', value: copyrightAssets.filter(a => a.type === '插画').length },
                        { name: '纹样', value: copyrightAssets.filter(a => a.type === '纹样').length },
                        { name: '品牌设计', value: copyrightAssets.filter(a => a.type === '品牌设计').length },
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#f87171" />
                      <Cell fill="#60a5fa" />
                      <Cell fill="#34d399" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4 text-gray-500">收益预估</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>已授权收益</span>
                    <span className="font-medium">¥3,500</span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '35%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>待授权预估</span>
                    <span className="font-medium">¥6,500</span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className="h-full rounded-full bg-blue-500" style={{ width: '65%' }} />
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center mt-6`}>
                  <p className="text-sm text-gray-500 mb-1">总预估收益</p>
                  <p className="text-2xl font-bold text-emerald-600">¥10,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 数据分析组件 ====================
function AnalyticsContent({
  ipStats,
  ipAssets,
  valueTrendData,
  typeDistributionData,
  isDark,
  isLoading
}: {
  ipStats: IPStats;
  ipAssets: IPAsset[];
  valueTrendData: any[];
  typeDistributionData: any[];
  isDark: boolean;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-card`}>
        <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">总IP资产</p>
              <p className="text-2xl font-bold">{ipStats.totalAssets}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Gem className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">活跃合作</p>
              <p className="text-2xl font-bold">{ipStats.activePartnerships}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Handshake className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">总预估价值</p>
              <p className="text-2xl font-bold">¥{ipStats.totalEstimatedValue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 价值趋势 */}
      {valueTrendData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <h3 className="text-lg font-semibold mb-6">IP资产价值趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={valueTrendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="timestamp" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} tickFormatter={(value) => `¥${value}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    color: isDark ? '#f3f4f6' : '#111827',
                  }}
                  formatter={(value: any) => [`¥${value}`, '预估价值']}
                />
                <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* 类型分布和阶段分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {typeDistributionData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <h3 className="text-lg font-semibold mb-6">IP类型分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {ipAssets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <h3 className="text-lg font-semibold mb-6">IP孵化阶段分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: '创意设计', value: ipAssets.filter(asset => asset.stages[0]?.completed).length },
                  { name: '版权存证', value: ipAssets.filter(asset => asset.stages[1]?.completed).length },
                  { name: 'IP孵化', value: ipAssets.filter(asset => asset.stages[2]?.completed).length },
                  { name: '商业合作', value: ipAssets.filter(asset => asset.stages[3]?.completed).length },
                  { name: '收益分成', value: ipAssets.filter(asset => asset.stages[4]?.completed).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      color: isDark ? '#f3f4f6' : '#111827',
                    }}
                  />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ==================== IP资产详情弹窗组件 ====================
interface IPAssetDetailModalProps {
  asset: IPAsset | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  calculateProgress: (stages: ServiceIPStage[]) => number;
  onUpdateStage: (assetId: string, stageId: string, completed: boolean) => void;
  onDeleteAsset: (assetId: string) => void;
}

function IPAssetDetailModal({
  asset,
  isOpen,
  onClose,
  isDark,
  calculateProgress,
  onUpdateStage,
  onDeleteAsset
}: IPAssetDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'settings'>('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!asset || !isOpen) return null;

  const progress = calculateProgress(asset.stages);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'illustration': '插画',
      'pattern': '纹样',
      'design': '设计',
      '3d_model': '3D模型',
      'digital_collectible': '数字藏品'
    };
    return labels[type] || type;
  };

  const handleStageToggle = async (stageId: string, completed: boolean) => {
    setIsUpdating(true);
    try {
      await onUpdateStage(asset.id, stageId, completed);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    onDeleteAsset(asset.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed inset-4 md:inset-10 lg:inset-20 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} z-50 overflow-hidden flex flex-col shadow-2xl`}
          >
            {/* 头部 */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">IP资产详情</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                  title="删除资产"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 标签页导航 */}
            <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {[
                { id: 'overview', label: '概览', icon: Eye },
                { id: 'stages', label: '孵化阶段', icon: Route },
                { id: 'settings', label: '设置', icon: Edit3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 资产基本信息 */}
                  <div className="flex gap-6">
                    <TianjinImage
                      src={asset.thumbnail}
                      alt={asset.name}
                      className="w-48 h-48 rounded-2xl object-cover flex-shrink-0"
                      ratio="square"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{asset.name}</h3>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-sm rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              {getTypeLabel(asset.type)}
                            </span>
                            <span className="text-emerald-600 font-semibold">
                              ¥{asset.commercialValue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary-600">{progress}%</div>
                          <div className="text-sm text-gray-500">孵化进度</div>
                        </div>
                      </div>

                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {asset.description}
                      </p>

                      {/* 进度条 */}
                      <div className={`h-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden mt-4`}>
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 阶段概览 */}
                  <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="font-semibold mb-4">孵化阶段概览</h4>
                    <div className="grid grid-cols-5 gap-4">
                      {asset.stages.map((stage, index) => (
                        <div key={stage.id} className="text-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                            stage.completed
                              ? 'bg-emerald-500 text-white'
                              : isDark
                                ? 'bg-gray-700 text-gray-400'
                                : 'bg-gray-200 text-gray-500'
                          }`}>
                            {stage.completed ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              <span className="text-lg font-bold">{index + 1}</span>
                            )}
                          </div>
                          <p className="text-xs font-medium">{stage.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {stage.completedAt
                              ? new Date(stage.completedAt).toLocaleDateString()
                              : '未完成'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 关联作品信息 */}
                  {asset.originalWorkId && (
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDark ? 'border-blue-800' : 'border-blue-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <ExternalLink className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-sm">关联作品</span>
                      </div>
                      <p className="text-sm text-gray-500">此IP资产关联了ID为 {asset.originalWorkId} 的原创作品</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stages' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">孵化阶段管理</h3>
                  {asset.stages.map((stage, index) => (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        stage.completed
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : isDark
                            ? 'border-gray-700 hover:border-gray-600'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            stage.completed
                              ? 'bg-emerald-500 text-white'
                              : isDark
                                ? 'bg-gray-700 text-gray-400'
                                : 'bg-gray-200 text-gray-500'
                          }`}>
                            {stage.completed ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{stage.name}</h4>
                            <p className="text-sm text-gray-500">{stage.description}</p>
                            {stage.completedAt && (
                              <p className="text-xs text-emerald-600 mt-1">
                                完成于 {new Date(stage.completedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStageToggle(stage.id, !stage.completed)}
                          disabled={isUpdating}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            stage.completed
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 hover:bg-gray-300'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          } disabled:opacity-50`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : stage.completed ? (
                            '标记为未完成'
                          ) : (
                            '标记为完成'
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">资产设置</h3>
                  
                  {/* 基本信息编辑 */}
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="font-medium mb-4">基本信息</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">资产名称</label>
                        <p className="font-medium">{asset.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">资产类型</label>
                        <p className="font-medium">{getTypeLabel(asset.type)}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">预估商业价值</label>
                        <p className="font-medium text-emerald-600">¥{asset.commercialValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">创建时间</label>
                        <p className="font-medium">{new Date(asset.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* 危险操作 */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                    <h4 className="font-medium text-red-600 mb-2">危险操作</h4>
                    <p className="text-sm text-gray-500 mb-4">删除后数据将无法恢复，请谨慎操作</p>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      删除此IP资产
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* 删除确认弹窗 */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`max-w-md w-full rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">确认删除</h3>
                      <p className="text-sm text-gray-500">此操作不可撤销</p>
                    </div>
                  </div>
                  <p className={`text-sm mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    您确定要删除IP资产 <span className="font-semibold">"{asset.name}"</span> 吗？删除后所有相关数据将无法恢复。
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      确认删除
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

// ==================== 主组件 ====================
export default function IPIncubationCenter() {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // 状态管理
  const [activeTab, setActiveTab] = useState('incubation');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedIPAsset, setSelectedIPAsset] = useState<IPAsset | null>(null);
  const [ipAssets, setIpAssets] = useState<IPAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ipStats, setIpStats] = useState<IPStats>({
    totalAssets: 0,
    completedAssets: 0,
    inProgressAssets: 0,
    totalPartnerships: 0,
    activePartnerships: 0,
    totalEstimatedValue: 0
  });

  // 数据状态
  const [commercialOpportunities, setCommercialOpportunities] = useState<CommercialOpportunity[]>([]);
  const [copyrightAssets, setCopyrightAssets] = useState<CopyrightAsset[]>([]);
  const [activities, setActivities] = useState<IPActivity[]>([]);
  const [valueTrendData, setValueTrendData] = useState<any[]>([]);
  const [typeDistributionData, setTypeDistributionData] = useState<any[]>([]);
  const [sampleAssets, setSampleAssets] = useState<SampleIPAsset[]>([]);
  const [selectedSampleAsset, setSelectedSampleAsset] = useState<SampleIPAsset | null>(null);
  
  // IP资产详情弹窗状态
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalAsset, setDetailModalAsset] = useState<IPAsset | null>(null);

  // 动态导航配置 - 根据商业机会数量显示 badge
  const navItems: NavItem[] = useMemo(() => [
    { id: 'incubation', name: 'IP孵化路径', icon: Route },
    { id: 'assets', name: 'IP资产', icon: Gem },
    { id: 'opportunities', name: '商业机会', icon: Handshake, badge: commercialOpportunities.length > 0 ? commercialOpportunities.length : undefined },
    { id: 'copyright', name: '版权资产', icon: Shield },
    { id: 'analytics', name: '数据分析', icon: BarChart3 },
  ], [commercialOpportunities.length]);

  // 计算孵化进度
  const calculateIncubationProgress = useCallback((stages: ServiceIPStage[]): number => {
    const completedStages = stages.filter(stage => stage.completed).length;
    return Math.round((completedStages / stages.length) * 100);
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      // 并行加载所有数据
      const [
        assets,
        stats,
        opportunities,
        copyright,
        activitiesData,
        trendData,
        typeData
      ] = await Promise.all([
        ipService.getAllIPAssets(user.id),
        ipService.getIPStats(user.id),
        ipService.getAllOpportunities(),
        ipService.getCopyrightAssets(user.id),
        ipService.getIPActivities(10),
        ipService.getIPValueTrend(user.id),
        ipService.getIPTypeDistribution(user.id)
      ]);

      console.log('[IPIncubationCenter] 数据加载成功:', { assetsCount: assets.length, stats });
      setIpAssets(assets);
      setIpStats(stats);
      setCommercialOpportunities(opportunities);
      setCopyrightAssets(copyright);
      setActivities(activitiesData);
      setValueTrendData(trendData);
      setTypeDistributionData(typeData);

      // 如果没有选中的资产，选择第一个
      // 使用函数式更新避免依赖问题
      setSelectedIPAsset(prev => {
        if (assets.length > 0 && !prev) {
          console.log('[IPIncubationCenter] 自动选择第一个资产:', assets[0].id);
          return assets[0];
        }
        return prev;
      });
    } catch (error) {
      console.error('加载IP数据失败:', error);
      toast.error('加载数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // 初始加载
  useEffect(() => {
    loadData();
    // 加载示例数据
    setSampleAssets(ipService.getSampleIPAssets());
  }, [loadData]);

  // 订阅实时更新
  useEffect(() => {
    if (!isAuthenticated) return;

    // 订阅IP资产变化
    const assetsChannel = ipService.subscribeToIPAssets(() => {
      loadData();
    });

    // 订阅活动变化
    const activitiesChannel = ipService.subscribeToActivities(() => {
      ipService.getIPActivities(10).then(setActivities);
    });

    return () => {
      ipService.unsubscribeAll();
    };
  }, [isAuthenticated, loadData]);

  // 处理阶段更新
  const handleUpdateStage = useCallback(async (assetId: string, stageId: string, completed: boolean) => {
    try {
      const success = await ipService.updateIPStage(assetId, stageId, completed);
      if (success) {
        // 刷新数据
        await loadData();
        toast.success(completed ? '阶段已标记为完成' : '阶段已标记为未完成');
      } else {
        toast.error('IP孵化阶段更新失败');
      }
    } catch (error) {
      console.error('更新阶段失败:', error);
      toast.error('更新失败，请稍后重试');
    }
  }, [loadData]);

  // 打开IP资产详情弹窗
  const openAssetDetail = useCallback((asset: IPAsset) => {
    setDetailModalAsset(asset);
    setDetailModalOpen(true);
  }, []);

  // 关闭IP资产详情弹窗
  const closeAssetDetail = useCallback(() => {
    setDetailModalOpen(false);
    setDetailModalAsset(null);
  }, []);

  // 删除IP资产
  const handleDeleteAsset = useCallback(async (assetId: string) => {
    try {
      const success = await ipService.deleteIPAsset(assetId);
      if (success) {
        toast.success('IP资产已删除');
        await loadData();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('删除资产失败:', error);
      toast.error('删除失败，请稍后重试');
    }
  }, [loadData]);

  // 导出IP资产数据
  const handleExportData = useCallback(() => {
    try {
      const exportData = {
        exportTime: new Date().toISOString(),
        stats: ipStats,
        assets: ipAssets.map(asset => ({
          name: asset.name,
          type: asset.type,
          description: asset.description,
          commercialValue: asset.commercialValue,
          progress: calculateIncubationProgress(asset.stages),
          stages: asset.stages.map(s => ({
            name: s.name,
            completed: s.completed,
            completedAt: s.completedAt
          })),
          createdAt: asset.createdAt
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ip-assets-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('数据导出成功');
    } catch (error) {
      console.error('导出数据失败:', error);
      toast.error('导出失败，请稍后重试');
    }
  }, [ipAssets, ipStats, calculateIncubationProgress]);

  // 处理申请机会
  const handleApplyOpportunity = async (opportunityId: string, ipAssetId: string) => {
    try {
      const success = await ipService.applyOpportunity(opportunityId, ipAssetId);
      if (success) {
        toast.success('已申请商业机会，等待品牌方审核');
        // 刷新数据
        await loadData();
      } else {
        toast.error('申请失败，请稍后重试');
      }
    } catch (error) {
      console.error('申请机会失败:', error);
      toast.error('申请失败，请稍后重试');
    }
  };

  // 处理版权授权
  const handleLicenseAsset = async (assetId: string) => {
    try {
      const success = await ipService.updateCopyrightLicense(assetId, false);
      if (success) {
        toast.success('版权授权申请已提交');
        // 刷新数据
        await loadData();
      } else {
        toast.error('申请失败，请稍后重试');
      }
    } catch (error) {
      console.error('版权授权失败:', error);
      toast.error('申请失败，请稍后重试');
    }
  };

  // 骨架屏
  if (isLoading && ipAssets.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex gap-6">
            <div className={`w-60 flex-shrink-0 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card h-96 animate-pulse`} />
            <div className="flex-1 space-y-6">
              <div className={`h-48 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card animate-pulse`} />
              <div className={`h-64 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card animate-pulse`} />
            </div>
            <div className={`w-80 flex-shrink-0 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-card h-96 animate-pulse hidden xl:block`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* 页面标题 */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold">IP孵化中心</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              管理和孵化您的知识产权资产
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="刷新数据"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => navigate('/create/ip-submit')}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">提交作品</span>
            </button>
          </div>
        </motion.div>

        {/* 三栏布局 */}
        <div className="flex gap-6">
          {/* 左侧导航 */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            navItems={navItems}
            onSubmitWork={() => navigate('/create/ip-submit')}
          />

          {/* 中间主内容区 */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'incubation' && (
                  <IncubationPathContent
                    selectedAsset={selectedIPAsset}
                    ipAssets={ipAssets}
                    ipStats={ipStats}
                    isDark={isDark}
                    onAssetChange={setSelectedIPAsset}
                    onUpdateStage={handleUpdateStage}
                    isLoading={isLoading}
                    onSubmitWork={() => navigate('/create/ip-submit')}
                    sampleAssets={sampleAssets}
                    onViewSampleDetails={setSelectedSampleAsset}
                  />
                )}
                {activeTab === 'assets' && (
                  <AssetsContent
                    ipAssets={ipAssets}
                    isDark={isDark}
                    onSelectAsset={openAssetDetail}
                    calculateProgress={calculateIncubationProgress}
                    isLoading={isLoading}
                  />
                )}
                {activeTab === 'opportunities' && (
                  <OpportunitiesContent
                    opportunities={commercialOpportunities}
                    isDark={isDark}
                    onApply={handleApplyOpportunity}
                    ipAssets={ipAssets}
                    isLoading={isLoading}
                  />
                )}
                {activeTab === 'copyright' && (
                  <CopyrightContent
                    copyrightAssets={copyrightAssets}
                    isDark={isDark}
                    onLicense={handleLicenseAsset}
                    isLoading={isLoading}
                  />
                )}
                {activeTab === 'analytics' && (
                  <AnalyticsContent
                    ipStats={ipStats}
                    ipAssets={ipAssets}
                    valueTrendData={valueTrendData}
                    typeDistributionData={typeDistributionData}
                    isDark={isDark}
                    isLoading={isLoading}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* 右侧辅助区 */}
          <RightPanel
            ipStats={ipStats}
            selectedAsset={selectedIPAsset}
            activities={activities}
            opportunities={commercialOpportunities}
            onApplyOpportunity={handleApplyOpportunity}
            isLoading={isLoading}
            onSubmitWork={() => navigate('/create/ip-submit')}
            onExportData={handleExportData}
          />
        </div>
      </div>

      {/* 示例资产详情弹窗 */}
      <SampleAssetDetailModal
        asset={selectedSampleAsset}
        isDark={isDark}
        onClose={() => setSelectedSampleAsset(null)}
        onCreateSimilar={() => {
          setSelectedSampleAsset(null);
          navigate('/create/ip-submit');
        }}
      />

      {/* IP资产详情弹窗 */}
      <IPAssetDetailModal
        asset={detailModalAsset}
        isOpen={detailModalOpen}
        onClose={closeAssetDetail}
        isDark={isDark}
        calculateProgress={calculateIncubationProgress}
        onUpdateStage={handleUpdateStage}
        onDeleteAsset={handleDeleteAsset}
      />
    </div>
  );
}
