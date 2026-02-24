import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { adminService } from '@/services/adminService';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  Shield, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Settings,
  AlertTriangle,
  Sparkles,
  FileText,
  Video,
  Image as ImageIcon,
  MessageSquare,
  Calendar,
  User,
  BarChart3,
  Clock,
  ChevronDown,
  MoreHorizontal,
  Eye,
  CheckSquare,
  X,
  TrendingUp,
  AlertCircle,
  Bot,
  Award
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  creator: string;
  creator_id: string;
  type: 'post' | 'comment' | 'activity' | 'work';
  status: 'pending' | 'approved' | 'rejected';
  created_at: number;
  thumbnail?: string;
  videoUrl?: string;
  authenticity_score?: number;
  cultural_elements?: string[];
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  ai_risk_score?: number;
  spam_score?: number;
  category?: string; // 作品分类
}

interface AuditAction {
  id: string;
  content_id: string;
  action: 'approve' | 'reject' | 'delete';
  admin_id: string;
  admin_name: string;
  reason?: string;
  created_at: number;
}

interface AuditRule {
  id: string;
  name: string;
  type: 'sensitive_words' | 'spam_detection' | 'ai_generated' | 'cultural_authenticity';
  enabled: boolean;
  threshold: number;
  auto_action: 'none' | 'flag' | 'reject';
}

const DEFAULT_AUDIT_RULES: AuditRule[] = [
  { id: '1', name: '敏感词检测', type: 'sensitive_words', enabled: true, threshold: 80, auto_action: 'reject' },
  { id: '2', name: '垃圾作品识别', type: 'spam_detection', enabled: true, threshold: 70, auto_action: 'flag' },
  { id: '3', name: 'AI生成作品检测', type: 'ai_generated', enabled: true, threshold: 85, auto_action: 'flag' },
  { id: '4', name: '文化真实性评估', type: 'cultural_authenticity', enabled: true, threshold: 60, auto_action: 'flag' },
];

// 统计卡片组件
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  trend,
  delay 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string;
  trend?: string;
  delay: number;
}) => {
  const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', glow: 'shadow-blue-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', glow: 'shadow-amber-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', glow: 'shadow-rose-500/20' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20', glow: 'shadow-violet-500/20' },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-5 group hover:shadow-lg ${colors.glow} transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <h3 className={`text-3xl font-bold ${colors.text}`}>{value.toLocaleString()}</h3>
          {trend && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${colors.bg} opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-500`} />
    </motion.div>
  );
};

// 风险指示器组件
const RiskIndicator = ({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number; 
  color: 'green' | 'yellow' | 'red';
}) => {
  const colors = {
    green: { bg: 'bg-emerald-500', text: 'text-emerald-500', bar: 'bg-emerald-500/20' },
    yellow: { bg: 'bg-amber-500', text: 'text-amber-500', bar: 'bg-amber-500/20' },
    red: { bg: 'bg-rose-500', text: 'text-rose-500', bar: 'bg-rose-500/20' },
  };

  const c = colors[color];

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className={`font-semibold ${c.text}`}>{value}%</span>
      </div>
      <div className={`h-2 rounded-full ${c.bar} overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${c.bg}`}
        />
      </div>
    </div>
  );
};

// 作品类型图标
const TypeIcon = ({ type }: { type: string }) => {
  const icons: Record<string, any> = {
    post: FileText,
    comment: MessageSquare,
    activity: Calendar,
    work: ImageIcon,
  };
  const Icon = icons[type] || FileText;
  return <Icon className="w-4 h-4" />;
};

// 状态徽章
const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: Clock, label: '待审核' },
    approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', icon: CheckCircle, label: '已通过' },
    rejected: { bg: 'bg-rose-500/10', text: 'text-rose-600', icon: XCircle, label: '已拒绝' },
  };
  
  // 如果状态为空或不存在，默认为 approved
  const effectiveStatus = status || 'approved';
  const config = configs[effectiveStatus] || configs.approved;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

// 真实性评分徽章
const AuthenticityBadge = ({ score }: { score?: number }) => {
  if (!score) return <span className="text-gray-400">-</span>;
  
  const getColor = () => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (score >= 60) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (score >= 40) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getColor()}`}>
      <Award className="w-4 h-4" />
      <span className="font-semibold">{score}</span>
      <span className="text-xs opacity-70">分</span>
    </div>
  );
};

export default function ContentAudit() {
  const { isDark } = useTheme();
  
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [auditActions, setAuditActions] = useState<AuditAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [filter, setFilter] = useState('all');
  const [contentType, setContentType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 作品分类筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reason, setReason] = useState('');
  
  // 批量操作状态
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<'approve' | 'reject'>('approve');
  const [batchReason, setBatchReason] = useState('');
  
  // 作品审核规则状态
  const [auditRules, setAuditRules] = useState<AuditRule[]>(DEFAULT_AUDIT_RULES);
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    today: 0
  });
  
  // 获取津脉广场作品数据
  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminService.getContents({
        page: 1,
        limit: 50,
        status: filter === 'all' ? undefined : filter,
        type: contentType,
      });
      
      // 调试：查看原始数据
      console.log('Frontend received contents:', result.contents.slice(0, 3).map((c: any) => ({ 
        id: c.id, 
        status: c.status, 
        title: c.title?.substring(0, 20) 
      })));
      
      const formattedContents: ContentItem[] = result.contents.map((item: any) => {
        // 处理时间戳 - 如果是秒级时间戳（小于 1e12），转换为毫秒
        let timestamp = new Date(item.created_at).getTime();
        if (timestamp < 1000000000000) {
          timestamp = timestamp * 1000;
        }
        
        const formattedItem = {
          id: item.id,
          title: item.title || item.content?.substring(0, 50) + '...' || '无标题',
          content: item.content || item.description || '',
          creator: item.author || item.creator_name || '未知用户',
          creator_id: item.creator_id || item.author_id,
          type: item.type || 'work',
          // 如果没有状态，默认为 approved（已发布的作品视为已通过）
          status: item.status || 'approved',
          created_at: timestamp,
          thumbnail: item.thumbnail || item.cover_url || item.image_url,
          videoUrl: item.videoUrl || item.video_url,
          authenticity_score: item.authenticity_score || 0,
          cultural_elements: item.cultural_elements || [],
          likes_count: item.likes || item.likes_count || 0,
          comments_count: item.comments || item.comments_count || 0,
          views_count: item.views || item.views_count || 0,
          ai_risk_score: item.ai_risk_score || 0,
          spam_score: item.spam_score || 0,
          category: item.category || '', // 作品分类
        };
        
        console.log('Item formatted:', item.status, '->', formattedItem.status, formattedItem.title?.substring(0, 20));
        
        return formattedItem;
      });
      
      setContents(formattedContents);
      
      const today = new Date().setHours(0, 0, 0, 0);
      setStats({
        total: formattedContents.length,
        pending: formattedContents.filter(c => c.status === 'pending').length,
        approved: formattedContents.filter(c => c.status === 'approved').length,
        rejected: formattedContents.filter(c => c.status === 'rejected').length,
        today: formattedContents.filter(c => c.created_at >= today).length
      });
    } catch (error) {
      console.error('获取作品数据失败:', error);
      toast.error('获取作品数据失败');
    } finally {
      setLoading(false);
    }
  }, [filter, contentType]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  // 获取作品审核操作记录
  const fetchAuditActions = async (contentId: string) => {
    try {
      const { data: auditLogs, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('record_id', contentId)
        .eq('table_name', 'works')
        .order('created_at', { ascending: false });
      
      if (error) {
        setAuditActions([]);
        return;
      }
      
      const actions: AuditAction[] = auditLogs?.map((log: any) => ({
        id: log.id,
        content_id: contentId,
        action: log.operation_type === 'UPDATE' && log.new_data?.status === 'approved' ? 'approve' : 
                log.operation_type === 'UPDATE' && log.new_data?.status === 'rejected' ? 'reject' : 'delete',
        admin_id: log.user_id || 'system',
        admin_name: log.user_name || '系统',
        reason: log.new_data?.rejection_reason || log.details,
        created_at: log.created_at
      })) || [];
      
      setAuditActions(actions);
    } catch (error) {
      setAuditActions([]);
    }
  };
  
  // 处理单个作品审核操作
  const handleAuditAction = async (contentId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const content = contents.find(c => c.id === contentId);
      const contentType = content?.type || 'work';
      
      const success = await adminService.auditContent(
        contentId, 
        contentType, 
        action,
        action === 'reject' ? reason : undefined
      );
      
      if (success) {
        setContents(prev => prev.map(item => 
          item.id === contentId 
            ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
            : item
        ));
        
        toast.success(`作品已${action === 'approve' ? '通过' : '拒绝'}`);
        setReason('');
        await fetchContents();
      } else {
        toast.error('操作失败，请重试');
      }
    } catch (error) {
      toast.error('作品审核操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  // 处理删除作品
  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('确定要删除这个作品吗？此操作不可恢复！')) return;
    
    setActionLoading(true);
    try {
      const content = contents.find(c => c.id === contentId);
      const contentType = content?.type || 'work';
      
      const success = await adminService.deleteContent(contentId, contentType);
      
      if (success) {
        setContents(prev => prev.filter(item => item.id !== contentId));
        if (selectedContent?.id === contentId) setSelectedContent(null);
        toast.success('作品已删除');
        await fetchContents();
      } else {
        toast.error('删除失败，请重试');
      }
    } catch (error) {
      toast.error('删除作品失败');
    } finally {
      setActionLoading(false);
    }
  };
  
  // 处理批量作品审核
  const handleBatchAudit = async () => {
    if (selectedItems.size === 0) return;
    
    setActionLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const contentId of selectedItems) {
        const content = contents.find(c => c.id === contentId);
        if (!content) continue;
        
        const success = await adminService.auditContent(
          contentId,
          content.type,
          batchAction,
          batchAction === 'reject' ? batchReason : undefined
        );
        
        if (success) successCount++;
        else failCount++;
      }
      
      if (successCount > 0) {
        toast.success(`成功${batchAction === 'approve' ? '通过' : '拒绝'} ${successCount} 条作品`);
      }
      if (failCount > 0) toast.error(`${failCount} 条作品处理失败`);
      
      setSelectedItems(new Set());
      setIsBatchMode(false);
      setShowBatchModal(false);
      setBatchReason('');
      await fetchContents();
    } catch (error) {
      toast.error('批量作品审核失败');
    } finally {
      setActionLoading(false);
    }
  };
  
  // 切换内容选择
  const toggleItemSelection = (contentId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(contentId)) newSelection.delete(contentId);
    else newSelection.add(contentId);
    setSelectedItems(newSelection);
  };
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedContents.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedContents.map(c => c.id)));
    }
  };
  
  // 处理内容选择
  const handleContentSelect = (content: ContentItem) => {
    if (isBatchMode) toggleItemSelection(content.id);
    else {
      setSelectedContent(content);
      fetchAuditActions(content.id);
    }
  };
  
  // 筛选和排序内容
  const filteredAndSortedContents = contents
    .filter(item => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (contentType !== 'all' && item.type !== contentType) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && !item.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof ContentItem];
      let bValue = b[sortBy as keyof ContentItem];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  
  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取风险等级
  const getRiskLevel = (aiScore?: number, spamScore?: number) => {
    const ai = aiScore || 0;
    const spam = spamScore || 0;
    const max = Math.max(ai, spam);
    
    if (max >= 70) return { level: 'high', color: 'red', label: '高风险' };
    if (max >= 40) return { level: 'medium', color: 'yellow', label: '中风险' };
    return { level: 'low', color: 'green', label: '低风险' };
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正在加载津脉广场作品数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 页面标题 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg shadow-red-500/25">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">津脉广场作品管理</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">管理津脉广场的用户作品，包括审核、评分和删除操作</p>
          </div>
        </div>
      </motion.div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard icon={BarChart3} label="全部作品" value={stats.total} color="blue" trend="+12%" delay={0} />
        <StatCard icon={Clock} label="待审核" value={stats.pending} color="amber" delay={0.1} />
        <StatCard icon={CheckCircle} label="已通过" value={stats.approved} color="emerald" delay={0.2} />
        <StatCard icon={XCircle} label="已拒绝" value={stats.rejected} color="rose" delay={0.3} />
        <StatCard icon={Sparkles} label="今日新增" value={stats.today} color="violet" delay={0.4} />
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧内容列表 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 工具栏 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-2xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} backdrop-blur-sm`}
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索作品标题或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* 筛选器 */}
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className={`pl-9 pr-8 py-2.5 rounded-xl border text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="all">全部状态</option>
                    <option value="pending">待审核</option>
                    <option value="approved">已通过</option>
                    <option value="rejected">已拒绝</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* 作品分类下拉选择 */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`pl-9 pr-8 py-2.5 rounded-xl border text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="all">全部分类</option>
                    <option value="国潮设计">国潮设计</option>
                    <option value="品牌联名">品牌联名</option>
                    <option value="校园活动">校园活动</option>
                    <option value="文旅推广">文旅推广</option>
                    <option value="纹样设计">纹样设计</option>
                    <option value="插画设计">插画设计</option>
                    <option value="工艺创新">工艺创新</option>
                    <option value="老字号品牌">老字号品牌</option>
                    <option value="包装设计">包装设计</option>
                    <option value="共创设计">共创设计</option>
                    <option value="非遗传承">非遗传承</option>
                    <option value="IP设计">IP设计</option>
                    <option value="数字艺术">数字艺术</option>
                    <option value="3D设计">3D设计</option>
                    <option value="AI设计">AI设计</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* 批量操作按钮 */}
                <button
                  onClick={() => {
                    setIsBatchMode(!isBatchMode);
                    setSelectedItems(new Set());
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isBatchMode 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
                      : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 inline mr-2" />
                  {isBatchMode ? '退出批量' : '批量操作'}
                </button>

                <button
                  onClick={() => setShowRulesModal(true)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  审核规则
                </button>
              </div>
            </div>

            {/* 批量操作栏 */}
            {isBatchMode && selectedItems.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  已选择 <span className="font-semibold text-red-500">{selectedItems.size}</span> 项
                </span>
                <div className="flex-1" />
                <button
                  onClick={() => { setBatchAction('approve'); setShowBatchModal(true); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1.5" />
                  批量通过
                </button>
                <button
                  onClick={() => { setBatchAction('reject'); setShowBatchModal(true); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                >
                  <XCircle className="w-4 h-4 inline mr-1.5" />
                  批量拒绝
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* 内容列表 */}
          <div className="space-y-3">
            {filteredAndSortedContents.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-12 rounded-2xl border text-center ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无内容</h3>
                <p className="text-sm text-gray-500">当前筛选条件下没有符合条件的内容</p>
              </motion.div>
            ) : (
              filteredAndSortedContents.map((content, index) => {
                const risk = getRiskLevel(content.ai_risk_score, content.spam_score);
                const isSelected = selectedContent?.id === content.id;
                const isChecked = selectedItems.has(content.id);

                return (
                  <motion.div
                    key={content.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleContentSelect(content)}
                    className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 shadow-lg shadow-red-500/10' 
                        : isDark 
                          ? 'bg-gray-900/50 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50' 
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* 批量选择框 */}
                      {isBatchMode && (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                            isChecked 
                              ? 'bg-red-500 border-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      )}

                      {/* 缩略图 */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                        {content.videoUrl ? (
                          <>
                            <video src={content.videoUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          </>
                        ) : content.thumbnail ? (
                          <img src={content.thumbnail} alt={content.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* 内容信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1 group-hover:text-red-500 transition-colors">
                              {content.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {content.creator}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatTime(content.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {content.content}
                            </p>
                          </div>

                          {/* 状态徽章 */}
                          <StatusBadge status={content.status} />
                        </div>

                        {/* 评分信息 */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <AuthenticityBadge score={content.authenticity_score} />
                          
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            risk.color === 'red' ? 'bg-rose-500/10 text-rose-600' :
                            risk.color === 'yellow' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {risk.label}
                          </div>

                          <div className="flex-1" />

                          {/* 操作按钮 */}
                          {!isBatchMode && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {content.status === 'pending' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAuditAction(content.id, 'approve');
                                    }}
                                    disabled={actionLoading}
                                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAuditAction(content.id, 'reject');
                                    }}
                                    disabled={actionLoading}
                                    className="p-2 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteContent(content.id);
                                }}
                                disabled={actionLoading}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                title="删除作品"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* 右侧详情面板 */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`sticky top-6 rounded-2xl border overflow-hidden max-h-[calc(100vh-6rem)] flex flex-col ${
              isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            {selectedContent ? (
              <div className="p-6 overflow-y-auto">
                {/* 标题 */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">内容详情</h3>
                  <button 
                    onClick={() => setSelectedContent(null)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 媒体预览 */}
                {selectedContent.thumbnail && (
                  <div className="relative rounded-xl overflow-hidden mb-6 bg-gray-100 dark:bg-gray-800">
                    {selectedContent.videoUrl ? (
                      <video 
                        src={selectedContent.videoUrl} 
                        className="w-full aspect-video object-cover"
                        controls
                      />
                    ) : (
                      <img 
                        src={selectedContent.thumbnail} 
                        alt={selectedContent.title}
                        className="w-full aspect-video object-cover"
                      />
                    )}
                  </div>
                )}

                {/* 基本信息 */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{selectedContent.title}</h4>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={selectedContent.status} />
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                        isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <TypeIcon type={selectedContent.type} />
                        {selectedContent.type === 'post' ? '帖子' : 
                         selectedContent.type === 'comment' ? '评论' :
                         selectedContent.type === 'activity' ? '活动' : '作品'}
                      </span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">作者</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedContent.creator}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">发布时间</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatTime(selectedContent.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 内容描述 */}
                  <div>
                    <span className="text-sm text-gray-500 mb-2 block">内容描述</span>
                    <div className={`p-4 rounded-xl text-sm max-h-40 overflow-y-auto ${
                      isDark ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {selectedContent.content || '暂无描述'}
                    </div>
                  </div>
                </div>

                {/* 风险评估 */}
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    风险评估
                  </h5>
                  <div className={`p-4 rounded-xl space-y-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <RiskIndicator 
                      label="AI生成风险" 
                      value={selectedContent.ai_risk_score || 0}
                      color={(selectedContent.ai_risk_score || 0) >= 70 ? 'red' : (selectedContent.ai_risk_score || 0) >= 40 ? 'yellow' : 'green'}
                    />
                    <RiskIndicator 
                      label="垃圾内容风险" 
                      value={selectedContent.spam_score || 0}
                      color={(selectedContent.spam_score || 0) >= 70 ? 'red' : (selectedContent.spam_score || 0) >= 40 ? 'yellow' : 'green'}
                    />
                  </div>
                </div>

                {/* 真实性评估 */}
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-500" />
                    真实性评估
                  </h5>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">文化真实性评分</span>
                      <span className={`text-2xl font-bold ${
                        (selectedContent.authenticity_score || 0) >= 80 ? 'text-emerald-500' :
                        (selectedContent.authenticity_score || 0) >= 60 ? 'text-blue-500' :
                        (selectedContent.authenticity_score || 0) >= 40 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {selectedContent.authenticity_score || 0}%
                      </span>
                    </div>
                    <div className={`h-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedContent.authenticity_score || 0}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${
                          (selectedContent.authenticity_score || 0) >= 80 ? 'bg-emerald-500' :
                          (selectedContent.authenticity_score || 0) >= 60 ? 'bg-blue-500' :
                          (selectedContent.authenticity_score || 0) >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 作品分类 */}
                {selectedContent.category && (
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">作品分类</h5>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {selectedContent.category}
                    </span>
                  </div>
                )}

                {/* 文化元素 */}
                {selectedContent.cultural_elements && selectedContent.cultural_elements.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">检测到的文化元素</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.cultural_elements.map((element, idx) => (
                        <span 
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'
                          }`}
                        >
                          {element}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 审核操作 */}
                {selectedContent.status === 'pending' && (
                  <div className="space-y-3">
                    <textarea
                      placeholder="请输入拒绝原因（可选）..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${
                        isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAuditAction(selectedContent.id, 'approve')}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        通过
                      </button>
                      <button
                        onClick={() => handleAuditAction(selectedContent.id, 'reject')}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        拒绝
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Eye className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">选择内容查看详情</h3>
                <p className="text-sm text-gray-500">点击左侧列表中的内容项查看详细信息和审核选项</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* 批量操作模态框 */}
      <AnimatePresence>
        {showBatchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowBatchModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${batchAction === 'approve' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                  {batchAction === 'approve' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    批量{batchAction === 'approve' ? '通过' : '拒绝'}
                  </h3>
                  <p className="text-sm text-gray-500">已选择 {selectedItems.size} 条内容</p>
                </div>
              </div>
              
              {batchAction === 'reject' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    拒绝原因
                  </label>
                  <textarea
                    value={batchReason}
                    onChange={(e) => setBatchReason(e.target.value)}
                    placeholder="请输入批量拒绝的原因..."
                    className={`w-full p-4 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                    rows={4}
                  />
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBatchModal(false)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={handleBatchAudit}
                  disabled={actionLoading || (batchAction === 'reject' && !batchReason.trim())}
                  className={`flex-1 py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50 ${
                    batchAction === 'approve' 
                      ? 'bg-emerald-500 hover:bg-emerald-600' 
                      : 'bg-rose-500 hover:bg-rose-600'
                  }`}
                >
                  {actionLoading ? '处理中...' : `确认${batchAction === 'approve' ? '通过' : '拒绝'}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 审核规则模态框 */}
      <AnimatePresence>
        {showRulesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRulesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <Settings className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">审核规则配置</h3>
                      <p className="text-sm text-gray-500">配置自动化内容审核的各项规则</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRulesModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                {auditRules.map((rule) => (
                  <div 
                    key={rule.id} 
                    className={`p-5 rounded-xl border transition-all ${
                      rule.enabled 
                        ? isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                        : isDark ? 'bg-gray-900/50 border-gray-800 opacity-60' : 'bg-gray-100/50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          rule.type === 'sensitive_words' ? 'bg-rose-500/10 text-rose-500' :
                          rule.type === 'spam_detection' ? 'bg-amber-500/10 text-amber-500' :
                          rule.type === 'ai_generated' ? 'bg-violet-500/10 text-violet-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {rule.type === 'sensitive_words' ? <AlertCircle className="w-5 h-5" /> :
                           rule.type === 'spam_detection' ? <AlertTriangle className="w-5 h-5" /> :
                           rule.type === 'ai_generated' ? <Bot className="w-5 h-5" /> :
                           <Award className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h4>
                          <p className="text-sm text-gray-500">
                            {rule.type === 'sensitive_words' && '检测敏感词汇和不当内容'}
                            {rule.type === 'spam_detection' && '识别垃圾信息和重复内容'}
                            {rule.type === 'ai_generated' && '检测AI生成的内容'}
                            {rule.type === 'cultural_authenticity' && '评估文化元素的真实性'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(e) => {
                            setAuditRules(prev => prev.map(r => 
                              r.id === rule.id ? { ...r, enabled: e.target.checked } : r
                            ));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
                      </label>
                    </div>
                    
                    {rule.enabled && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            阈值: {rule.threshold}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={rule.threshold}
                            onChange={(e) => {
                              setAuditRules(prev => prev.map(r => 
                                r.id === rule.id ? { ...r, threshold: parseInt(e.target.value) } : r
                              ));
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-red-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            自动操作
                          </label>
                          <select
                            value={rule.auto_action}
                            onChange={(e) => {
                              setAuditRules(prev => prev.map(r => 
                                r.id === rule.id ? { ...r, auto_action: e.target.value as any } : r
                              ));
                            }}
                            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                            }`}
                          >
                            <option value="none">无操作</option>
                            <option value="flag">标记审核</option>
                            <option value="reject">自动拒绝</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className={`p-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} flex gap-3`}>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    toast.success('审核规则已保存');
                    setShowRulesModal(false);
                  }}
                  className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  保存规则
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
