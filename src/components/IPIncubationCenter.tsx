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
  X, ChevronLeft, Edit3, Trash2, Eye, Building2, Award as AwardIcon
} from 'lucide-react';
import { BrandLicenseBrowser } from './ip-incubation/BrandLicenseBrowser';
import { MyLicenses } from './ip-incubation/MyLicenses';
import { OpportunitiesContent } from './ip-incubation/OpportunitiesContent';
import { CopyrightAssetsContent } from './ip-incubation/CopyrightAssetsContent';

// 导航项类型
interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  badge?: number;
}

// ==================== 主题配色常量 ====================
const DARK_THEME = {
  // 主背景色 - 深邃的深蓝黑色
  bgPrimary: 'bg-slate-950',
  bgSecondary: 'bg-slate-900',
  bgTertiary: 'bg-slate-800',
  bgCard: 'bg-slate-900/80',
  bgCardHover: 'bg-slate-800/80',

  // 边框颜色
  borderPrimary: 'border-slate-800',
  borderSecondary: 'border-slate-700',
  borderAccent: 'border-cyan-500/30',

  // 文字颜色
  textPrimary: 'text-slate-100',
  textSecondary: 'text-slate-300',
  textTertiary: 'text-slate-400',
  textMuted: 'text-slate-500',

  // 强调色 - 科技感的青色/蓝色渐变
  accentPrimary: 'from-cyan-500 to-blue-600',
  accentSecondary: 'from-violet-500 to-purple-600',
  accentSuccess: 'from-emerald-400 to-teal-500',
  accentWarning: 'from-amber-400 to-orange-500',

  // 渐变背景
  gradientPrimary: 'bg-gradient-to-br from-slate-900 via-slate-950 to-black',
  gradientCard: 'bg-gradient-to-br from-slate-800/50 to-slate-900/50',
  gradientAccent: 'bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10',

  // 发光效果
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]',
  glowAccent: 'shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]',

  // 玻璃效果
  glass: 'backdrop-blur-xl bg-slate-900/90',
};

const LIGHT_THEME = {
  // 主背景色 - 浅灰色系
  bgPrimary: 'bg-gray-50',
  bgSecondary: 'bg-white',
  bgTertiary: 'bg-gray-100',
  bgCard: 'bg-white/80',
  bgCardHover: 'bg-gray-50/80',

  // 边框颜色
  borderPrimary: 'border-gray-200',
  borderSecondary: 'border-gray-300',
  borderAccent: 'border-cyan-500/30',

  // 文字颜色
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-700',
  textTertiary: 'text-gray-600',
  textMuted: 'text-gray-400',

  // 强调色 - 科技感的青色/蓝色渐变
  accentPrimary: 'from-cyan-500 to-blue-600',
  accentSecondary: 'from-violet-500 to-purple-600',
  accentSuccess: 'from-emerald-500 to-teal-600',
  accentWarning: 'from-amber-500 to-orange-600',

  // 渐变背景
  gradientPrimary: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
  gradientCard: 'bg-gradient-to-br from-white/50 to-gray-50/50',
  gradientAccent: 'bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10',

  // 发光效果
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]',
  glowAccent: 'shadow-[0_0_20px_-5px_rgba(139,92,246,0.15)]',

  // 玻璃效果
  glass: 'backdrop-blur-xl bg-white/90',
};

// 获取主题对象
function useIPTheme(isDark: boolean) {
  return isDark ? DARK_THEME : LIGHT_THEME;
}

// ==================== 左侧导航栏组件 ====================
function Sidebar({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  navItems,
  onSubmitWork,
  theme,
  isDark
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  navItems: NavItem[];
  onSubmitWork: () => void;
  theme: typeof DARK_THEME;
  isDark: boolean;
}) {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`${isCollapsed ? 'w-16' : 'w-60'} flex-shrink-0 transition-all duration-300`}
    >
      <div className={`sticky top-4 rounded-2xl overflow-hidden ${theme.glass} border ${theme.borderPrimary} ${theme.glowPrimary}`}>
        {/* 折叠按钮 */}
        <button
          onClick={onToggleCollapse}
          className={`w-full py-3 flex items-center justify-center border-b ${theme.borderPrimary} ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors`}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
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
                    ? `bg-gradient-to-r ${theme.accentPrimary} text-white shadow-lg ${isDark ? 'shadow-cyan-500/25' : 'shadow-cyan-500/15'}`
                    : `${isDark ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'}`
                }`}
              >
                <div className={`flex-shrink-0 ${isActive ? 'text-white' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium text-left">{item.name}</span>
                    {item.badge && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full">
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
          <div className={`p-3 border-t ${theme.borderPrimary}`}>
            <button
              onClick={onSubmitWork}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isDark ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-cyan-600 hover:bg-cyan-50'}`}
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
  onExportData,
  theme,
  isDark
}: {
  ipStats: IPStats;
  selectedAsset: IPAsset | null;
  activities: IPActivity[];
  opportunities: CommercialOpportunity[];
  onApplyOpportunity: (id: string, ipAssetId: string) => void;
  isLoading: boolean;
  onSubmitWork: () => void;
  onExportData: () => void;
  theme: typeof DARK_THEME;
  isDark: boolean;
}) {
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
        <div className={`rounded-2xl p-4 ${theme.glass} border ${theme.borderPrimary} ${theme.glowPrimary}`}>
          <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
            <BarChart3 className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            数据概览
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl ${theme.bgTertiary} border ${theme.borderSecondary}`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{ipStats.totalAssets}</p>
                <p className={`text-xs ${theme.textMuted}`}>IP资产</p>
              </div>
              <div className={`p-3 rounded-xl ${theme.bgTertiary} border ${theme.borderSecondary}`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{ipStats.totalPartnerships}</p>
                <p className={`text-xs ${theme.textMuted}`}>商业合作</p>
              </div>
              <div className={`p-3 rounded-xl ${theme.bgTertiary} border ${theme.borderSecondary} col-span-2`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  ¥{(ipStats.totalEstimatedValue / 10000).toFixed(1)}万
                </p>
                <p className={`text-xs ${theme.textMuted}`}>预估总价值</p>
              </div>
            </div>
          )}
        </div>

        {/* 快捷操作 */}
        <div className={`rounded-2xl p-4 ${theme.glass} border ${theme.borderPrimary}`}>
          <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
            <Zap className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            快捷操作
          </h3>
          <div className="space-y-2">
            <button
              onClick={onSubmitWork}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl border transition-all ${isDark ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 border-cyan-500/30' : 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-700 hover:from-cyan-500/20 hover:to-blue-500/20 border-cyan-500/20'}`}
            >
              <Plus className="w-4 h-4" />
              <span>提交新作品</span>
            </button>
            <button
              onClick={onExportData}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl border transition-colors ${theme.bgTertiary} ${theme.borderSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'} ${theme.textSecondary}`}
            >
              <FileText className="w-4 h-4" />
              <span>导出数据</span>
            </button>
            <button className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl border transition-colors ${theme.bgTertiary} ${theme.borderSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'} ${theme.textSecondary}`}>
              <Share2 className="w-4 h-4" />
              <span>分享展示</span>
            </button>
          </div>
        </div>

        {/* 最近动态 */}
        <div className={`rounded-2xl p-4 ${theme.glass} border ${theme.borderPrimary}`}>
          <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
            <Clock className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            最近动态
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 4).map((activity) => (
                <div
                  key={activity.id}
                  className={`flex gap-3 p-2 rounded-lg ${!activity.isRead ? (isDark ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-200') : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.type === 'progress' ? (isDark ? 'bg-emerald-400' : 'bg-emerald-500') :
                    activity.type === 'opportunity' ? (isDark ? 'bg-amber-400' : 'bg-amber-500') :
                    activity.type === 'milestone' ? (isDark ? 'bg-violet-400' : 'bg-violet-500') :
                    (isDark ? 'bg-red-400' : 'bg-red-500')
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${theme.textSecondary}`}>{activity.title}</p>
                    <p className={`text-xs ${theme.textMuted} mt-0.5`}>{activity.description}</p>
                    <p className={`text-xs ${theme.textMuted} mt-1`}>{formatTimeAgo(activity.createdAt)}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className={`text-sm ${theme.textMuted} text-center py-4`}>暂无动态</p>
              )}
            </div>
          )}
        </div>

        {/* 推荐机会 */}
        {topOpportunities.length > 0 && (
          <div className={`rounded-2xl p-4 ${theme.glass} border ${theme.borderPrimary}`}>
            <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
              <Sparkles className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              推荐机会
            </h3>
            <div className="space-y-3">
              {topOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className={`p-3 rounded-xl ${theme.bgTertiary} border ${theme.borderSecondary} hover:border-cyan-500/30 transition-all cursor-pointer group`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`text-sm font-medium group-hover:text-cyan-400 transition-colors ${theme.textSecondary}`}>
                      {opportunity.name}
                    </h4>
                    <span className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {opportunity.reward}
                    </span>
                  </div>
                  <p className={`text-xs ${theme.textMuted} mb-2 line-clamp-2`}>
                    {opportunity.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${theme.textMuted}`}>{opportunity.brandName}</span>
                    <button
                      onClick={() => selectedAsset && onApplyOpportunity(opportunity.id, selectedAsset.id)}
                      disabled={!selectedAsset}
                      className={`text-xs font-medium ${isDark ? 'text-cyan-400 hover:text-cyan-300 disabled:text-slate-600' : 'text-cyan-600 hover:text-cyan-700 disabled:text-gray-400'}`}
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
        <div className={`rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20`}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-400">
            <Lightbulb className="w-4 h-4" />
            智能建议
          </h3>
          <ul className="space-y-2">
            {selectedAsset && selectedAsset.stages[1]?.completed && !selectedAsset.stages[2]?.completed && (
              <li className="flex items-start gap-2 text-xs text-amber-300">
                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>您的作品"{selectedAsset.name}"已完成版权存证，可以开始申请商业合作</span>
              </li>
            )}
            <li className="flex items-start gap-2 text-xs text-amber-300">
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
  const theme = useIPTheme(isDark);
  if (!selectedAsset) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`rounded-2xl p-6 mb-6 ${theme.glass} border ${theme.borderPrimary} ${theme.glowPrimary}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <TianjinImage
            src={selectedAsset.thumbnail}
            alt={selectedAsset.name}
            className={`w-16 h-16 rounded-xl object-cover ring-2 ${isDark ? 'ring-cyan-500/30' : 'ring-cyan-400/30'}`}
            ratio="square"
          />
          <div>
            <h2 className={`text-xl font-bold ${theme.textPrimary}`}>{selectedAsset.name}</h2>
            <p className={`text-sm mt-1 ${theme.textMuted}`}>
              {selectedAsset.type === 'illustration' ? '插画' :
               selectedAsset.type === 'pattern' ? '纹样' :
               selectedAsset.type === '3d_model' ? '3D模型' :
               selectedAsset.type === 'digital_collectible' ? '数字藏品' : '设计'}
              {' · '}
              预估价值 <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>¥{(selectedAsset?.commercialValue || 0).toLocaleString()}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{progress}%</p>
          <p className={`text-sm ${theme.textMuted}`}>孵化进度</p>
        </div>
      </div>

      {/* 进度条 */}
      <div className={`h-3 rounded-full overflow-hidden ${theme.bgTertiary}`}>
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-500"
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
                isCompleted ? (isDark ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]') :
                isCurrent ? (isDark ? 'bg-cyan-400 ring-4 ring-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-cyan-500 ring-4 ring-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]') :
                (isDark ? 'bg-slate-600' : 'bg-gray-300')
              }`} />
              <span className={`text-xs ${
                isCompleted || isCurrent ? `${theme.textSecondary} font-medium` : theme.textMuted
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
  onUpdateStage,
  assetId,
  isLoading,
  isDark
}: {
  stages: ServiceIPStage[];
  onUpdateStage: (stageId: string, completed: boolean) => void;
  assetId: string;
  isLoading: boolean;
  isDark: boolean;
}) {
  const theme = useIPTheme(isDark);
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
    <div className={`rounded-2xl p-6 ${theme.glass} border ${theme.borderPrimary}`}>
      <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${theme.textPrimary}`}>
        <Target className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
        孵化阶段
      </h3>

      <div className="relative">
        {/* 垂直线 */}
        <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${theme.bgTertiary}`} />

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
                    ? (isDark ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]')
                    : isActive
                      ? (isDark ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-cyan-500 text-white ring-4 ring-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]')
                      : `${theme.bgTertiary} ${isDark ? 'text-slate-500' : 'text-gray-400'}`
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : getStageIcon(stage.name)}
                </div>

                {/* 内容 */}
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-semibold ${isActive ? (isDark ? 'text-cyan-400' : 'text-cyan-600') : theme.textSecondary}`}>
                        {stage.name}
                      </h4>
                      <p className={`text-sm mt-1 ${theme.textMuted}`}>
                        {stage.description}
                      </p>
                      {stage.completedAt && (
                        <p className={`text-xs mt-2 flex items-center gap-1 ${theme.textMuted}`}>
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
                      <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isDark ? 'bg-slate-700 peer-focus:ring-4 peer-focus:ring-cyan-500/20 peer-checked:bg-cyan-500 after:border-slate-600' : 'bg-gray-300 peer-focus:ring-4 peer-focus:ring-cyan-400/20 peer-checked:bg-cyan-500 after:border-gray-400'}`} />
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
  onViewDetails,
  isDark
}: {
  asset: SampleIPAsset;
  onViewDetails: (asset: SampleIPAsset) => void;
  isDark: boolean;
}) {
  const theme = useIPTheme(isDark);
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
      className={`rounded-2xl overflow-hidden cursor-pointer ${theme.glass} border ${theme.borderPrimary} hover:border-cyan-500/30 transition-all ${theme.glowPrimary}`}
      onClick={() => onViewDetails(asset)}
    >
      <div className="relative">
        <img
          src={asset.thumbnail}
          alt={asset.name}
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${theme.glass} backdrop-blur text-slate-200`}>
            {getTypeLabel(asset.type)}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ¥{(asset?.commercialValue || 0).toLocaleString()}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className={`font-semibold text-sm ${theme.textSecondary}`}>{asset.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            progress === 100
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          }`}>
            {progress}%
          </span>
        </div>
        <p className={`text-xs mb-3 line-clamp-2 ${theme.textMuted}`}>
          {asset.description}
        </p>
        <div className={`h-1.5 rounded-full ${theme.bgTertiary}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {asset.highlights.map((highlight, idx) => (
            <span
              key={idx}
              className={`text-xs px-2 py-0.5 rounded-full ${theme.bgTertiary} ${theme.textMuted} border ${theme.borderSecondary}`}
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
  onClose,
  onCreateSimilar,
  isDark
}: {
  asset: SampleIPAsset | null;
  onClose: () => void;
  onCreateSimilar: () => void;
  isDark: boolean;
}) {
  const theme = useIPTheme(isDark);

  const progress = useMemo(() => {
    if (!asset) return 0;
    const completedStages = asset.stages.filter(s => s.completed).length;
    return Math.round((completedStages / asset.stages.length) * 100);
  }, [asset]);

  if (!asset) return null;

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
        className={`fixed inset-0 backdrop-blur-sm z-[70] flex items-center justify-center p-4 ${isDark ? 'bg-black/70' : 'bg-black/40'}`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${theme.bgSecondary} ${theme.borderPrimary}`}
          onClick={e => e.stopPropagation()}
        >
          {/* 头部图片 */}
          <div className="relative h-48">
            <img
              src={asset.thumbnail}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent' : 'bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent'}`} />
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors backdrop-blur ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-gray-900'}`}
            >
              ×
            </button>
            <div className="absolute bottom-4 left-6 right-6">
              <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-white'}`}>{asset.name}</h2>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-white/70'}`}>{asset.category}</p>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6">
            {/* 进度总览 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className={theme.textMuted}>孵化进度</span>
                <span className={`text-lg font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{progress}%</span>
              </div>
              <div className={`h-3 rounded-full overflow-hidden ${theme.bgTertiary}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 描述 */}
            <div className={`p-4 rounded-xl mb-6 border ${theme.bgTertiary} ${theme.borderSecondary}`}>
              <h3 className={`font-semibold mb-2 flex items-center gap-2 ${theme.textSecondary}`}>
                <Lightbulb className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                作品描述
              </h3>
              <p className={`text-sm ${theme.textMuted}`}>
                {asset.description}
              </p>
            </div>

            {/* 孵化阶段 */}
            <div className="mb-6">
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textSecondary}`}>
                <Target className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                孵化阶段
              </h3>
              <div className="space-y-3">
                {asset.stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      stage.completed
                        ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')
                        : `${theme.bgTertiary} ${theme.borderSecondary}`
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      stage.completed
                        ? 'bg-emerald-500 text-white'
                        : `${theme.bgSecondary} ${isDark ? 'text-slate-500' : 'text-gray-400'}`
                    }`}>
                      {stage.completed ? <CheckCircle2 className="w-4 h-4" /> : getStageIcon(stage.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${stage.completed ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : theme.textSecondary}`}>
                          {stage.name}
                        </span>
                        {stage.completed && stage.completedAt && (
                          <span className={`text-xs ${theme.textMuted}`}>
                            {new Date(stage.completedAt).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${theme.textMuted}`}>{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 亮点 */}
            <div className="mb-6">
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${theme.textSecondary}`}>
                <Sparkles className="w-4 h-4 text-purple-400" />
                作品亮点
              </h3>
              <div className="flex flex-wrap gap-2">
                {asset.highlights.map((highlight, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-sm rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>

            {/* 商业价值 */}
            <div className={`p-4 rounded-xl mb-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${theme.textMuted} mb-1`}>预估商业价值</p>
                  <p className="text-2xl font-bold text-emerald-400">¥{(asset?.commercialValue || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={onCreateSimilar}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                创建类似作品
              </button>
              <button
                onClick={onClose}
                className={`px-6 py-3 rounded-xl font-medium transition-colors ${theme.bgTertiary} hover:bg-slate-700 ${theme.textSecondary} border ${theme.borderSecondary}`}
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
  onSubmitWork,
  sampleAssets,
  onViewSampleDetails,
  isDark
}: {
  onSubmitWork: () => void;
  sampleAssets: SampleIPAsset[];
  onViewSampleDetails: (asset: SampleIPAsset) => void;
  isDark: boolean;
}) {
  const theme = useIPTheme(isDark);
  return (
    <div className="space-y-8">
      {/* 主空状态 */}
      <div className={`flex flex-col items-center justify-center py-12 ${theme.glass} rounded-2xl border ${theme.borderPrimary} ${theme.glowPrimary}`}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 ring-2 ring-cyan-500/30">
          <Gem className="w-10 h-10 text-cyan-400" />
        </div>
        <h3 className={`text-xl font-bold mb-2 ${theme.textPrimary}`}>还没有IP资产</h3>
        <p className={`text-center max-w-md mb-4 ${theme.textMuted}`}>
          提交作品并完成版权存证后，即可创建IP资产并开始孵化之旅
        </p>
        <div className="flex gap-3">
          <button
            onClick={onSubmitWork}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
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
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.textPrimary}`}>
              <Sparkles className="w-5 h-5 text-amber-400" />
              参考示例
            </h3>
            <p className={`text-sm mt-1 ${theme.textMuted}`}>
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
                onViewDetails={onViewSampleDetails}
                isDark={isDark}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* 孵化流程说明 */}
      <div className={`p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-purple-500/10 border border-cyan-500/20`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
          <Route className="w-5 h-5 text-cyan-400" />
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
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center ring-2 ring-cyan-500/30">
                  <step.icon className="w-5 h-5 text-cyan-400" />
                </div>
                {index < 4 && (
                  <div className="hidden md:block w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-violet-500/50 ml-2" />
                )}
              </div>
              <p className={`text-sm font-medium ${theme.textSecondary}`}>{step.name}</p>
              <p className={`text-xs ${theme.textMuted}`}>{step.desc}</p>
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
  isLoading,
  onAssetChange,
  onUpdateStage,
  onSubmitWork,
  sampleAssets,
  onViewSampleDetails,
  isDark
}: {
  selectedAsset: IPAsset | null;
  ipAssets: IPAsset[];
  isLoading: boolean;
  onAssetChange: (asset: IPAsset | null) => void;
  onUpdateStage: (assetId: string, stageId: string, completed: boolean) => void;
  onSubmitWork: () => void;
  sampleAssets: SampleIPAsset[];
  onViewSampleDetails: (asset: SampleIPAsset) => void;
  isDark: boolean;
}) {
  const theme = useIPTheme(isDark);
  const progress = useMemo(() => {
    if (!selectedAsset) return 0;
    const completedStages = selectedAsset.stages.filter(s => s.completed).length;
    return Math.round((completedStages / selectedAsset.stages.length) * 100);
  }, [selectedAsset]);

  const activeStage = useMemo(() => {
    if (!selectedAsset) return null;
    return selectedAsset.stages.find(s => !s.completed) || selectedAsset.stages[selectedAsset.stages.length - 1];
  }, [selectedAsset]);

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${theme.glass} rounded-2xl border ${theme.borderPrimary}`}>
        <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <p className={theme.textMuted}>加载中...</p>
      </div>
    );
  }

  if (!selectedAsset) {
    if (ipAssets.length > 0) {
      return (
        <div className="space-y-6">
          <div className={`rounded-2xl p-6 ${theme.glass} border ${theme.borderPrimary}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme.textPrimary}`}>选择IP资产开始孵化</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ipAssets.map((asset) => (
                <motion.button
                  key={asset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAssetChange(asset)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${theme.bgSecondary} ${isDark ? 'border-slate-700 hover:border-cyan-500/50' : 'border-gray-200 hover:border-cyan-400/50'}`}
                >
                  <div className="flex items-center gap-3">
                    {asset.thumbnail ? (
                      <img src={asset.thumbnail} alt={asset.name} className={`w-16 h-16 rounded-lg object-cover ring-2 ${isDark ? 'ring-cyan-500/30' : 'ring-cyan-400/30'}`} />
                    ) : (
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${theme.bgTertiary}`}>
                        <Gem className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className={`font-medium ${theme.textSecondary}`}>{asset.name}</h4>
                      <p className={`text-sm ${theme.textMuted}`}>
                        预估价值: <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>¥{asset.commercialValue?.toLocaleString() || 0}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          asset.stages?.some(s => s.completed)
                            ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border border-emerald-200')
                            : `${theme.bgTertiary} ${theme.textMuted}`
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
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.textPrimary}`}>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  参考示例
                </h3>
                <p className={`text-sm mt-1 ${theme.textMuted}`}>
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
                    onViewDetails={onViewSampleDetails}
                    isDark={isDark}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <EmptyStateWithSamples
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
        <span className={`text-sm ${theme.textMuted}`}>选择IP资产:</span>
        <div className="relative">
          <select
            value={selectedAsset.id}
            onChange={(e) => {
              const asset = ipAssets.find(a => a.id === e.target.value);
              onAssetChange(asset || null);
            }}
            className={`appearance-none px-4 py-2 pr-10 rounded-xl border ${theme.bgSecondary} ${theme.borderSecondary} ${theme.textSecondary} focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
          >
            {ipAssets.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.name}</option>
            ))}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme.textMuted}`} />
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
          className={`rounded-2xl p-6 border ${isDark ? 'bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-purple-500/10 border-cyan-500/20' : 'bg-gradient-to-br from-cyan-50 via-violet-50 to-purple-50 border-cyan-200'}`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-lg ${isDark ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/25' : 'bg-gradient-to-br from-cyan-600 to-blue-700 shadow-cyan-500/15'}`}>
              <Target className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-lg mb-2 ${theme.textPrimary}`}>
                当前阶段: <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>{activeStage.name}</span>
              </h3>
              <p className={`text-sm mb-4 ${theme.textMuted}`}>
                {activeStage.description}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-xl text-center border ${theme.glass} ${theme.borderPrimary}`}>
                  <p className={`text-xs mb-1 ${theme.textMuted}`}>完成条件</p>
                  <p className={`text-sm font-medium ${theme.textSecondary}`}>完成该阶段要求</p>
                </div>
                <div className={`p-3 rounded-xl text-center border ${theme.glass} ${theme.borderPrimary}`}>
                  <p className={`text-xs mb-1 ${theme.textMuted}`}>预期收益</p>
                  <p className={`text-sm font-medium ${theme.textSecondary}`}>提升IP价值</p>
                </div>
                <div className={`p-3 rounded-xl text-center border ${theme.glass} ${theme.borderPrimary}`}>
                  <p className={`text-xs mb-1 ${theme.textMuted}`}>下一阶段</p>
                  <p className={`text-sm font-medium ${theme.textSecondary}`}>
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
        assetId={selectedAsset.id}
        onUpdateStage={(stageId, completed) => onUpdateStage(selectedAsset.id, stageId, completed)}
        isLoading={isLoading}
        isDark={isDark}
      />
    </div>
  );
}

// ==================== IP资产列表组件 ====================
function AssetsContent({
  ipAssets,
  onSelectAsset,
  calculateProgress,
  isLoading,
  isDark
}: {
  ipAssets: IPAsset[];
  isDark: boolean;
  onSelectAsset: (asset: IPAsset) => void;
  calculateProgress: (stages: ServiceIPStage[]) => number;
  isLoading: boolean;
}) {
  const theme = useIPTheme(isDark);
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
      <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${theme.glass} ${theme.borderPrimary}`}>
        <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <p className={theme.textMuted}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <div className={`rounded-2xl p-4 border ${theme.glass} ${theme.borderPrimary}`}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
            <input
              type="text"
              placeholder="搜索IP资产..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${theme.bgSecondary} ${theme.borderSecondary} ${theme.textSecondary} ${isDark ? 'focus:ring-cyan-500/50 placeholder:text-slate-500' : 'focus:ring-cyan-400/50 placeholder:text-gray-400'}`}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${theme.bgSecondary} ${theme.borderSecondary} ${theme.textSecondary} ${isDark ? 'focus:ring-cyan-500/50' : 'focus:ring-cyan-400/50'}`}
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

      {/* 资产列表 */}
      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const progress = calculateProgress(asset.stages);
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className={`rounded-2xl p-4 border hover:border-cyan-500/30 transition-all cursor-pointer ${theme.glass} ${theme.borderPrimary} ${theme.glowPrimary}`}
                onClick={() => onSelectAsset(asset)}
              >
                <div className="flex items-start gap-4">
                  {asset.thumbnail ? (
                    <img src={asset.thumbnail} alt={asset.name} className={`w-20 h-20 rounded-xl object-cover ring-2 ${isDark ? 'ring-cyan-500/30' : 'ring-cyan-400/30'}`} />
                  ) : (
                    <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${theme.bgTertiary}`}>
                      <Gem className={`w-10 h-10 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold truncate ${theme.textSecondary}`}>{asset.name}</h4>
                    <p className={`text-sm mt-1 ${theme.textMuted}`}>{getTypeLabel(asset.type)}</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>¥{(asset?.commercialValue || 0).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`flex-1 h-1.5 rounded-full ${theme.bgTertiary}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className={`text-xs ${theme.textMuted}`}>{progress}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center py-12 rounded-2xl border ${theme.glass} ${theme.borderPrimary}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-100'}`}>
            <Search className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          </div>
          <h3 className={`text-lg font-medium ${theme.textSecondary}`}>未找到匹配的IP资产</h3>
          <p className={`text-sm mt-1 ${theme.textMuted}`}>尝试调整搜索条件</p>
        </div>
      )}
    </div>
  );
}

// ==================== 数据分析组件 ====================
function AnalyticsContent({
  ipStats,
  ipAssets,
  isLoading,
  isDark
}: {
  ipStats: IPStats;
  ipAssets: IPAsset[];
  isDark: boolean;
  isLoading: boolean;
}) {
  const theme = useIPTheme(isDark);
  // 类型分布数据
  const typeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    ipAssets.forEach(asset => {
      distribution[asset.type] = (distribution[asset.type] || 0) + 1;
    });
    return Object.entries(distribution).map(([type, count]) => ({
      name: type === 'illustration' ? '插画' :
            type === 'pattern' ? '纹样' :
            type === 'design' ? '设计' :
            type === '3d_model' ? '3D模型' : '数字藏品',
      value: count
    }));
  }, [ipAssets]);

  // 阶段完成度数据
  const stageCompletion = useMemo(() => {
    const stages = ['创意设计', '版权存证', 'IP孵化', '商业合作', '收益分成'];
    return stages.map((stage, index) => {
      const completed = ipAssets.filter(asset => 
        asset.stages[index]?.completed
      ).length;
      return {
        name: stage,
        completed,
        total: ipAssets.length
      };
    });
  }, [ipAssets]);

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${theme.glass} ${theme.borderPrimary}`}>
        <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <p className={theme.textMuted}>加载分析数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-2xl p-6 border ${theme.glass} ${theme.borderPrimary} ${theme.glowPrimary}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
              <Gem className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme.textPrimary}`}>{ipStats.totalAssets}</p>
              <p className={`text-sm ${theme.textMuted}`}>IP资产总数</p>
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-6 border ${theme.glass} ${theme.borderPrimary}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <CheckCircle2 className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme.textPrimary}`}>{ipStats.completedAssets}</p>
              <p className={`text-sm ${theme.textMuted}`}>已完成孵化</p>
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-6 border ${theme.glass} ${theme.borderPrimary}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
              <Handshake className={`w-6 h-6 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme.textPrimary}`}>{ipStats.totalPartnerships}</p>
              <p className={`text-sm ${theme.textMuted}`}>商业合作</p>
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-6 border ${theme.glass} ${theme.borderPrimary}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <TrendingUp className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>¥{(ipStats.totalEstimatedValue / 10000).toFixed(1)}万</p>
              <p className={`text-sm ${theme.textMuted}`}>预估总价值</p>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 类型分布饼图 */}
        <div className={`rounded-2xl p-6 border ${theme.glass} ${theme.borderPrimary}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme.textPrimary}`}>IP类型分布</h3>
          {typeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    border: isDark ? '1px solid #1e293b' : '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px]">
              <p className={theme.textMuted}>暂无数据</p>
            </div>
          )}
        </div>

        {/* 阶段完成度柱状图 */}
        <div className={`rounded-2xl p-6 border ${theme.glass} ${theme.borderPrimary}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme.textPrimary}`}>各阶段完成度</h3>
          {ipAssets.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stageCompletion}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e5e7eb'} />
                <XAxis dataKey="name" tick={{ fill: isDark ? '#64748b' : '#6b7280' }} />
                <YAxis tick={{ fill: isDark ? '#64748b' : '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    border: isDark ? '1px solid #1e293b' : '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="completed" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px]">
              <p className={theme.textMuted}>暂无数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================
export function IPIncubationCenter() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const theme = useIPTheme(isDark);
  const { user } = useContext(AuthContext);

  // 状态管理
  const [activeTab, setActiveTab] = useState('path');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [ipAssets, setIpAssets] = useState<IPAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<IPAsset | null>(null);
  const [ipStats, setIpStats] = useState<IPStats>({
    totalAssets: 0,
    completedAssets: 0,
    inProgressAssets: 0,
    totalPartnerships: 0,
    activePartnerships: 0,
    totalEstimatedValue: 0
  });
  const [activities, setActivities] = useState<IPActivity[]>([]);
  const [opportunities, setOpportunities] = useState<CommercialOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSampleAsset, setSelectedSampleAsset] = useState<SampleIPAsset | null>(null);

  // 导航项
  const navItems: NavItem[] = [
    { id: 'path', name: '孵化路径', icon: Route },
    { id: 'assets', name: 'IP资产', icon: Gem },
    { id: 'opportunities', name: '商业机会', icon: Handshake, badge: opportunities.filter(o => o.status === 'open').length },
    { id: 'brand-licenses', name: '品牌授权', icon: Building2 },
    { id: 'my-licenses', name: '我的授权', icon: AwardIcon },
    { id: 'copyright', name: '版权资产', icon: Shield },
    { id: 'analytics', name: '数据分析', icon: BarChart3 },
  ];

  // 示例IP资产数据
  const sampleAssets: SampleIPAsset[] = useMemo(() => ipService.getSampleIPAssets(), []);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 并行加载所有数据
        const [assets, stats, acts, ops] = await Promise.all([
          ipService.getAllIPAssets(user.id),
          ipService.getIPStats(user.id),
          ipService.getIPActivities(10),
          ipService.getAllOpportunities()
        ]);

        setIpAssets(assets);
        setIpStats(stats);
        setActivities(acts);
        setOpportunities(ops);

        // 如果有资产，默认选中第一个
        if (assets.length > 0 && !selectedAsset) {
          setSelectedAsset(assets[0]);
        }
      } catch (error) {
        console.error('加载IP孵化中心数据失败:', error);
        toast.error('加载数据失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // 处理阶段更新
  const handleUpdateStage = async (assetId: string, stageId: string, completed: boolean) => {
    try {
      const success = await ipService.updateIPStage(assetId, stageId, completed);
      if (success) {
        // 更新本地状态
        setIpAssets(prev => prev.map(asset => {
          if (asset.id === assetId) {
            return {
              ...asset,
              stages: asset.stages.map(stage =>
                stage.id === stageId ? { ...stage, completed, completedAt: completed ? new Date().toISOString() : undefined } : stage
              )
            };
          }
          return asset;
        }));

        // 更新选中的资产
        if (selectedAsset?.id === assetId) {
          setSelectedAsset(prev => prev ? {
            ...prev,
            stages: prev.stages.map(stage =>
              stage.id === stageId ? { ...stage, completed, completedAt: completed ? new Date().toISOString() : undefined } : stage
            )
          } : null);
        }

        toast.success(completed ? '阶段已完成' : '阶段已重置');
      }
    } catch (error) {
      toast.error('更新失败，请重试');
    }
  };

  // 处理申请机会
  const handleApplyOpportunity = async (opportunityId: string, ipAssetId: string) => {
    try {
      const success = await ipService.applyOpportunity(opportunityId, ipAssetId);
      if (success) {
        toast.success('申请已提交，等待审核');
      }
    } catch (error) {
      toast.error('申请失败，请重试');
    }
  };

  // 计算进度
  const calculateProgress = (stages: ServiceIPStage[]) => {
    const completed = stages.filter(s => s.completed).length;
    return Math.round((completed / stages.length) * 100);
  };

  // 提交作品
  const handleSubmitWork = () => {
    navigate('/create/ip-submit');
  };

  // 导出数据
  const handleExportData = () => {
    toast.success('数据导出功能开发中');
  };

  // 渲染内容区域
  const renderContent = () => {
    switch (activeTab) {
      case 'path':
        return (
          <IncubationPathContent
            selectedAsset={selectedAsset}
            ipAssets={ipAssets}
            isLoading={isLoading}
            onAssetChange={setSelectedAsset}
            onUpdateStage={handleUpdateStage}
            onSubmitWork={handleSubmitWork}
            sampleAssets={sampleAssets}
            onViewSampleDetails={setSelectedSampleAsset}
          />
        );
      case 'assets':
        return (
          <AssetsContent
            ipAssets={ipAssets}
            onSelectAsset={(asset) => {
              setSelectedAsset(asset);
              setActiveTab('path');
            }}
            calculateProgress={calculateProgress}
            isLoading={isLoading}
            isDark={isDark}
          />
        );
      case 'analytics':
        return (
          <AnalyticsContent
            ipStats={ipStats}
            ipAssets={ipAssets}
            isLoading={isLoading}
            isDark={isDark}
          />
        );
      case 'brand-licenses':
        return (
          <BrandLicenseBrowser 
            onClose={() => setActiveTab('path')}
          />
        );
      case 'my-licenses':
        return (
          <MyLicenses 
            onClose={() => setActiveTab('path')}
          />
        );
      case 'opportunities':
        return (
          <OpportunitiesContent 
            ipAssets={ipAssets}
          />
        );
      case 'copyright':
        return (
          <CopyrightAssetsContent 
            ipAssets={ipAssets}
          />
        );
      default:
        return (
          <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${theme.glass} ${theme.borderPrimary}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
              <Loader2 className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <h3 className={`text-lg font-medium ${theme.textSecondary}`}>功能开发中</h3>
            <p className={`text-sm mt-1 ${theme.textMuted}`}>敬请期待</p>
          </div>
        );
    }
  };

  return (
    <div
      className={`min-h-screen w-full py-6 px-4 ${theme.gradientPrimary}`}
    >
      <div className="max-w-[1600px] mx-auto">
        {/* 页面标题 */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${theme.textPrimary}`}>
                <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-cyan-400 via-violet-400 to-purple-400' : 'from-cyan-600 via-violet-600 to-purple-600'}`}>
                  IP孵化中心
                </span>
              </h1>
              <p className={theme.textMuted}>
                从创意到商业，全程护航您的IP成长之旅
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmitWork}
                className={`px-6 py-3 font-medium rounded-xl transition-all flex items-center gap-2 ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25' : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/15'}`}
              >
                <Plus className="w-5 h-5" />
                提交作品
              </button>
            </div>
          </div>
        </motion.div>

        {/* 三栏布局 */}
        <div className="flex gap-6">
          {/* 左侧导航 */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            navItems={navItems}
            onSubmitWork={handleSubmitWork}
            theme={theme}
            isDark={isDark}
          />

          {/* 中间内容区 */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>

          {/* 右侧辅助信息 */}
          <RightPanel
            ipStats={ipStats}
            selectedAsset={selectedAsset}
            activities={activities}
            opportunities={opportunities}
            onApplyOpportunity={handleApplyOpportunity}
            isLoading={isLoading}
            onSubmitWork={handleSubmitWork}
            onExportData={handleExportData}
            theme={theme}
            isDark={isDark}
          />
        </div>
      </div>

      {/* 示例资产详情弹窗 */}
      <SampleAssetDetailModal
        asset={selectedSampleAsset}
        onClose={() => setSelectedSampleAsset(null)}
        onCreateSimilar={handleSubmitWork}
        isDark={isDark}
      />
    </div>
  );
}

export default IPIncubationCenter;
