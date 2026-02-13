import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { adminService } from '@/services/adminService';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { toast } from 'sonner';

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

// 预设的审核规则
const DEFAULT_AUDIT_RULES: AuditRule[] = [
  { id: '1', name: '敏感词检测', type: 'sensitive_words', enabled: true, threshold: 80, auto_action: 'reject' },
  { id: '2', name: '垃圾内容识别', type: 'spam_detection', enabled: true, threshold: 70, auto_action: 'flag' },
  { id: '3', name: 'AI生成内容检测', type: 'ai_generated', enabled: true, threshold: 85, auto_action: 'flag' },
  { id: '4', name: '文化真实性评估', type: 'cultural_authenticity', enabled: true, threshold: 60, auto_action: 'flag' },
];

// 敏感词列表
const SENSITIVE_WORDS = ['暴力', '色情', '赌博', '毒品', '诈骗', '反动'];

export default function ContentAudit() {
  const { isDark } = useTheme();
  
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [auditActions, setAuditActions] = useState<AuditAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [filter, setFilter] = useState('all');
  const [contentType, setContentType] = useState('all');
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
  
  // 审核规则状态
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
  
  // 获取内容数据
  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminService.getContents({
        page: 1,
        limit: 50,
        status: filter === 'all' ? undefined : filter,
        type: contentType,
      });
      
      // 转换数据格式并应用AI检测
      const formattedContents: ContentItem[] = result.contents.map((item: any) => {
        // 基于内容特征计算AI风险评分
        const aiRiskScore = calculateAIRiskScore(item.content || item.description || '');
        const spamScore = calculateSpamScore(item.content || item.description || '');
        
        return {
          id: item.id,
          title: item.title || item.content?.substring(0, 50) + '...' || '无标题',
          content: item.content || item.description || '',
          creator: item.author || item.creator_name || '未知用户',
          creator_id: item.creator_id || item.author_id,
          type: item.type || 'work',
          status: item.status || 'pending',
          created_at: new Date(item.created_at).getTime(),
          thumbnail: item.thumbnail || item.cover_url || item.image_url,
          videoUrl: item.videoUrl || item.video_url,
          authenticity_score: item.authenticity_score || 0,
          cultural_elements: item.cultural_elements || [],
          likes_count: item.likes || item.likes_count || 0,
          comments_count: item.comments || item.comments_count || 0,
          views_count: item.views || item.views_count || 0,
          ai_risk_score: aiRiskScore,
          spam_score: spamScore,
        };
      });
      
      setContents(formattedContents);
      
      // 更新统计数据
      const today = new Date().setHours(0, 0, 0, 0);
      setStats({
        total: formattedContents.length,
        pending: formattedContents.filter(c => c.status === 'pending').length,
        approved: formattedContents.filter(c => c.status === 'approved').length,
        rejected: formattedContents.filter(c => c.status === 'rejected').length,
        today: formattedContents.filter(c => c.created_at >= today).length
      });
    } catch (error) {
      console.error('获取内容数据失败:', error);
      toast.error('获取内容数据失败');
    } finally {
      setLoading(false);
    }
  }, [filter, contentType]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);
  
  // 计算垃圾内容评分
  const calculateSpamScore = (content: string): number => {
    let score = 0;
    const lowerContent = content.toLowerCase();
    
    // 检查敏感词
    SENSITIVE_WORDS.forEach(word => {
      if (lowerContent.includes(word)) score += 30;
    });
    
    // 检查重复字符
    if (/(.)\1{4,}/.test(content)) score += 20;
    
    // 检查链接数量
    const linkCount = (content.match(/http/g) || []).length;
    if (linkCount > 3) score += 15;
    
    // 检查全大写比例
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.5) score += 10;
    
    // 检查内容长度（过短的内容可能是垃圾）
    if (content.length < 20) score += 25;
    
    // 检查特殊字符比例
    const specialCharRatio = (content.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length / content.length;
    if (specialCharRatio > 0.3) score += 15;
    
    return Math.min(score, 100);
  };
  
  // 计算AI生成内容风险评分
  const calculateAIRiskScore = (content: string): number => {
    let score = 0;
    
    // 检查过于完美的格式（可能是AI生成）
    const hasPerfectStructure = /^[\u4e00-\u9fa5]+[，。！？]/.test(content) && 
                                (content.match(/[，。！？]/g) || []).length > content.length / 20;
    if (hasPerfectStructure) score += 20;
    
    // 检查重复模式
    const sentences = content.split(/[。！？]/);
    const uniqueSentences = new Set(sentences);
    if (sentences.length > 3 && uniqueSentences.size / sentences.length < 0.7) {
      score += 25;
    }
    
    // 检查过于通用的表达
    const genericPatterns = ['众所周知', '不言而喻', '总而言之', '综上所述', '首先', '其次', '最后'];
    genericPatterns.forEach(pattern => {
      if (content.includes(pattern)) score += 5;
    });
    
    // 检查情感词汇密度（AI生成内容往往情感词汇较少）
    const emotionalWords = ['喜欢', '讨厌', '开心', '难过', '激动', '失望', '热爱', '痛恨'];
    const emotionalCount = emotionalWords.reduce((count, word) => 
      count + (content.includes(word) ? 1 : 0), 0);
    if (emotionalCount < 2 && content.length > 100) score += 15;
    
    return Math.min(score, 100);
  };
  
  // 获取审核操作记录
  const fetchAuditActions = async (contentId: string) => {
    try {
      // 从审计日志获取真实的审核记录
      const { data: auditLogs, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('record_id', contentId)
        .eq('table_name', 'works')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('获取审核记录失败:', error);
        setAuditActions([]);
        return;
      }
      
      // 转换数据格式
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
      console.error('获取审核记录失败:', error);
      setAuditActions([]);
    }
  };
  
  // 处理单个审核操作
  const handleAuditAction = async (contentId: string, action: 'approve' | 'reject' | 'delete') => {
    setActionLoading(true);
    try {
      const content = contents.find(c => c.id === contentId);
      const contentType = content?.type || 'work';
      
      const success = await adminService.auditContent(
        contentId, 
        contentType, 
        action === 'delete' ? 'reject' : action,
        action === 'reject' ? reason : undefined
      );
      
      if (success) {
        // 更新本地状态
        setContents(prev => prev.map(item => 
          item.id === contentId 
            ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
            : item
        ));
        
        toast.success(`内容已${action === 'approve' ? '通过' : action === 'reject' ? '拒绝' : '删除'}`);
        setReason('');
        
        // 刷新内容列表
        await fetchContents();
      } else {
        toast.error('操作失败，请重试');
      }
    } catch (error) {
      console.error('审核操作失败:', error);
      toast.error('审核操作失败');
    } finally {
      setActionLoading(false);
    }
  };
  
  // 处理批量审核
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
        
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`成功${batchAction === 'approve' ? '通过' : '拒绝'} ${successCount} 条内容`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} 条内容处理失败`);
      }
      
      // 清空选择并刷新
      setSelectedItems(new Set());
      setIsBatchMode(false);
      setShowBatchModal(false);
      setBatchReason('');
      await fetchContents();
    } catch (error) {
      console.error('批量审核失败:', error);
      toast.error('批量审核失败');
    } finally {
      setActionLoading(false);
    }
  };
  
  // 切换内容选择
  const toggleItemSelection = (contentId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(contentId)) {
      newSelection.delete(contentId);
    } else {
      newSelection.add(contentId);
    }
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
    if (isBatchMode) {
      toggleItemSelection(content.id);
    } else {
      setSelectedContent(content);
      fetchAuditActions(content.id);
    }
  };
  
  // 筛选和排序内容
  const filteredAndSortedContents = contents
    .filter(item => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (contentType !== 'all' && item.type !== contentType) return false;
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
  
  // 获取状态标签样式
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'approved':
        return 'bg-green-100 text-green-600';
      case 'rejected':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // 获取内容类型标签样式
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'post':
        return 'bg-blue-100 text-blue-600';
      case 'comment':
        return 'bg-purple-100 text-purple-600';
      case 'activity':
        return 'bg-orange-100 text-orange-600';
      case 'work':
        return 'bg-pink-100 text-pink-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // 获取内容类型中文名称
  const getTypeName = (type: string) => {
    switch (type) {
      case 'post':
        return '帖子';
      case 'comment':
        return '评论';
      case 'activity':
        return '活动';
      case 'work':
        return '作品';
      default:
        return type;
    }
  };
  
  // 获取真实性评分颜色
  const getAuthenticityColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // 获取真实性评分描述
  const getAuthenticityDescription = (score?: number) => {
    if (!score) return '未评估';
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '一般';
    return '较差';
  };
  
  // 获取风险等级颜色
  const getRiskColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-red-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-12 h-12 border-4 ${isDark ? 'border-gray-600 border-t-red-600' : 'border-gray-200 border-t-red-600'} border-t-transparent rounded-full animate-spin`}></div>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正在加载内容数据...</p>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: '全部内容', value: stats.total, color: 'blue' },
          { label: '待审核', value: stats.pending, color: 'yellow' },
          { label: '已通过', value: stats.approved, color: 'green' },
          { label: '已拒绝', value: stats.rejected, color: 'red' },
          { label: '今日新增', value: stats.today, color: 'purple' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
          >
            <div className={`text-2xl font-bold text-${stat.color}-500`}>{stat.value}</div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
          </motion.div>
        ))}
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* 左侧内容列表 */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">内容审核</h2>
              <button
                onClick={() => setShowRulesModal(true)}
                className={`px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                <i className="fas fa-cog mr-1"></i>审核规则
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {/* 批量操作按钮 */}
              <button
                onClick={() => {
                  setIsBatchMode(!isBatchMode);
                  setSelectedItems(new Set());
                }}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  isBatchMode 
                    ? 'bg-red-600 text-white' 
                    : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {isBatchMode ? '退出批量' : '批量操作'}
              </button>
              
              {isBatchMode && selectedItems.size > 0 && (
                <>
                  <button
                    onClick={() => { setBatchAction('approve'); setShowBatchModal(true); }}
                    className="px-3 py-2 rounded-lg text-sm bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  >
                    批量通过 ({selectedItems.size})
                  </button>
                  <button
                    onClick={() => { setBatchAction('reject'); setShowBatchModal(true); }}
                    className="px-3 py-2 rounded-lg text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    批量拒绝 ({selectedItems.size})
                  </button>
                </>
              )}
              
              <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-2 flex-1 sm:flex-none sm:w-64`}>
                <input
                  type="text"
                  placeholder="搜索内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm"
                />
                <i className={`fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}></i>
              </div>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
              
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
              >
                <option value="all">全部类型</option>
                <option value="post">帖子</option>
                <option value="comment">评论</option>
                <option value="activity">活动</option>
                <option value="work">作品</option>
              </select>
            </div>
          </div>
          
          {/* 排序选项 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {isBatchMode && (
                <>
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredAndSortedContents.length && filteredAndSortedContents.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">全选</span>
                </>
              )}
              <div className="text-sm text-gray-500">共 {filteredAndSortedContents.length} 条内容</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
              >
                <option value="created_at">创建时间</option>
                <option value="title">标题</option>
                <option value="authenticity_score">真实性评分</option>
                <option value="ai_risk_score">AI风险</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-1 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                <i className={`fas ${sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
              </button>
            </div>
          </div>
          
          {/* 内容列表 */}
          <div className={`overflow-y-auto max-h-[calc(100vh-400px)] rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="min-w-full">
              <thead>
                <tr className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                  {isBatchMode && <th className="px-2 py-3 text-left text-sm font-medium w-8"></th>}
                  <th className="px-4 py-3 text-left text-sm font-medium">内容信息</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">类型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">真实性</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">风险</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredAndSortedContents.length === 0 ? (
                  <tr>
                    <td colSpan={isBatchMode ? 8 : 7} className="px-4 py-10 text-center">
                      <div className="text-gray-400">
                        <i className="fas fa-file-alt text-4xl mb-2"></i>
                        <p>暂无符合条件的内容</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedContents.map((content) => {
                    const authenticityScore = content.authenticity_score || 0;
                    const isHighRisk = (content.ai_risk_score || 0) > 70 || (content.spam_score || 0) > 70;
                    
                    return (
                      <tr 
                        key={content.id} 
                        className={`hover:bg-gray-700/50 cursor-pointer ${selectedContent?.id === content.id ? (isDark ? 'bg-gray-700/30' : 'bg-gray-50') : ''} ${isHighRisk ? 'bg-red-50/5' : ''}`}
                        onClick={() => handleContentSelect(content)}
                      >
                        {isBatchMode && (
                          <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedItems.has(content.id)}
                              onChange={() => toggleItemSelection(content.id)}
                              className="w-4 h-4 rounded"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-start">
                            {/* 视频作品显示视频预览 */}
                            {content.videoUrl ? (
                              <div className="w-16 h-16 rounded-lg mr-3 flex-shrink-0 overflow-hidden bg-gray-900 relative">
                                <video
                                  src={content.videoUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  loop
                                  autoPlay
                                  preload="auto"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <span className="bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <i className="fas fa-video text-[6px]"></i>
                                    视频
                                  </span>
                                </div>
                              </div>
                            ) : content.thumbnail ? (
                              <img
                                src={content.thumbnail}
                                alt={content.title}
                                className="w-16 h-16 rounded-lg object-cover mr-3 flex-shrink-0"
                              />
                            ) : null}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{content.title}</div>
                              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                作者：{content.creator}
                              </div>
                              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-2`}>
                                {content.content}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${getTypeBadgeClass(content.type)}`}>
                            {getTypeName(content.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(content.status)}`}>
                            {content.status === 'pending' ? '待审核' : content.status === 'approved' ? '已通过' : '已拒绝'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <span className={`font-medium ${getAuthenticityColor(authenticityScore)}`}>
                              {authenticityScore}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-1">
                            {content.ai_risk_score > 50 && (
                              <span className={`text-xs ${getRiskColor(content.ai_risk_score)}`}>
                                AI: {content.ai_risk_score}%
                              </span>
                            )}
                            {content.spam_score > 50 && (
                              <span className={`text-xs ${getRiskColor(content.spam_score)}`}>
                                垃圾: {content.spam_score}%
                              </span>
                            )}
                            {content.ai_risk_score <= 50 && content.spam_score <= 50 && (
                              <span className="text-xs text-green-500">低风险</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(content.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {content.status === 'pending' && !isBatchMode && (
                            <div className="flex gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAuditAction(content.id, 'approve');
                                }}
                                disabled={actionLoading}
                                className={`p-1 rounded text-xs bg-green-100 text-green-600 hover:bg-green-200 transition-colors`}
                              >
                                通过
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAuditAction(content.id, 'reject');
                                }}
                                disabled={actionLoading}
                                className={`p-1 rounded text-xs bg-red-100 text-red-600 hover:bg-red-200 transition-colors`}
                              >
                                拒绝
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 右侧内容详情 */}
        {!isBatchMode && (
          <div className="w-full md:w-1/3 min-w-0">
            <h3 className="text-lg font-bold mb-4">内容详情</h3>
            
            {selectedContent ? (
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 h-full flex flex-col`}>
                {/* 内容基本信息 */}
                <div className="mb-6">
                  {selectedContent.thumbnail && (
                    <img 
                      src={selectedContent.thumbnail} 
                      alt={selectedContent.title} 
                      className="w-full h-48 object-cover rounded-lg mb-4" 
                    />
                  )}
                  
                  <h4 className="text-lg font-bold mb-2">{selectedContent.title}</h4>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                    <div>作者：{selectedContent.creator}</div>
                    <div>类型：{getTypeName(selectedContent.type)}</div>
                    <div>创建时间：{formatTime(selectedContent.created_at)}</div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">内容</h5>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-100'} text-sm max-h-40 overflow-y-auto`}>
                      {selectedContent.content}
                    </div>
                  </div>
                </div>
                
                {/* 内容统计 */}
                {selectedContent.type === 'post' && (
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className={`p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-100'} text-center`}>
                      <div className="text-lg font-bold">{selectedContent.likes_count || 0}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>点赞</div>
                    </div>
                    <div className={`p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-100'} text-center`}>
                      <div className="text-lg font-bold">{selectedContent.comments_count || 0}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>评论</div>
                    </div>
                    <div className={`p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-100'} text-center`}>
                      <div className="text-lg font-bold">{selectedContent.views_count || 0}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>浏览</div>
                    </div>
                  </div>
                )}
                
                {/* 文化元素分析 */}
                {selectedContent.cultural_elements && selectedContent.cultural_elements.length > 0 && (
                  <div className="mb-6">
                    <h5 className="font-medium mb-2">文化元素</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedContent.cultural_elements.map((element, index) => (
                        <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                          {element}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 风险评估 */}
                <div className="mb-6">
                  <h5 className="font-medium mb-2">风险评估</h5>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>AI生成风险</span>
                          <span className={getRiskColor(selectedContent.ai_risk_score)}>{selectedContent.ai_risk_score || 0}%</span>
                        </div>
                        <div className={`w-full bg-gray-300 rounded-full h-2 ${isDark ? 'bg-gray-500' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-2 rounded-full ${(selectedContent.ai_risk_score || 0) >= 70 ? 'bg-red-500' : (selectedContent.ai_risk_score || 0) >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${selectedContent.ai_risk_score || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>垃圾内容风险</span>
                          <span className={getRiskColor(selectedContent.spam_score)}>{selectedContent.spam_score || 0}%</span>
                        </div>
                        <div className={`w-full bg-gray-300 rounded-full h-2 ${isDark ? 'bg-gray-500' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-2 rounded-full ${(selectedContent.spam_score || 0) >= 70 ? 'bg-red-500' : (selectedContent.spam_score || 0) >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${selectedContent.spam_score || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 真实性评估 */}
                <div className="mb-6">
                  <h5 className="font-medium mb-2">真实性评估</h5>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                    {(() => {
                      const score = selectedContent.authenticity_score || 0;
                      return (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">真实性评分</span>
                            <span className={`font-bold ${getAuthenticityColor(score)}`}>
                              {score}%
                            </span>
                          </div>
                          <div className={`w-full bg-gray-300 rounded-full h-2.5 ${isDark ? 'bg-gray-500' : 'bg-gray-200'}`}>
                            <div 
                              className={`h-2.5 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                {/* 审核操作 */}
                {selectedContent.status === 'pending' && (
                  <div className="mb-6">
                    <h5 className="font-medium mb-2">审核操作</h5>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">拒绝原因（可选）</label>
                      <textarea
                        placeholder="请输入拒绝原因..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className={`w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
                        rows={3}
                      ></textarea>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAuditAction(selectedContent.id, 'approve')}
                        disabled={actionLoading}
                        className={`flex-1 px-3 py-2 rounded text-sm bg-green-100 text-green-600 hover:bg-green-200 transition-colors ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {actionLoading ? '处理中...' : '通过'}
                      </button>
                      <button 
                        onClick={() => handleAuditAction(selectedContent.id, 'reject')}
                        disabled={actionLoading}
                        className={`flex-1 px-3 py-2 rounded text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-colors ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {actionLoading ? '处理中...' : '拒绝'}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 拒绝原因展示 */}
                {selectedContent.status === 'rejected' && (
                  <div className="mb-6">
                    <h5 className="font-medium mb-2">拒绝原因</h5>
                    <div className={`p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-100'} text-sm`}>
                      {auditActions.find(action => action.content_id === selectedContent.id && action.action === 'reject')?.reason || '未提供原因'}
                    </div>
                  </div>
                )}
                
                {/* 审核记录 */}
                <div className="flex-1 min-h-0">
                  <h5 className="font-medium mb-2">审核记录</h5>
                  <div className={`overflow-y-auto max-h-40 ${isDark ? 'bg-gray-600' : 'bg-gray-100'} rounded-lg p-3`}>
                    {auditActions.length === 0 ? (
                      <div className="text-center py-4">
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无审核记录</p>
                      </div>
                    ) : (
                      auditActions.map((action) => (
                        <div key={action.id} className={`${isDark ? 'bg-gray-700' : 'bg-white'} rounded p-2 mb-2`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <span className={`font-medium ${action.action === 'approve' ? 'text-green-500' : action.action === 'reject' ? 'text-red-500' : 'text-orange-500'}`}>
                                {action.action === 'approve' ? '通过' : action.action === 'reject' ? '拒绝' : '删除'}
                              </span>
                              <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                由 {action.admin_name}
                              </span>
                            </div>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatTime(action.created_at)}
                            </span>
                          </div>
                          {action.reason && (
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              原因：{action.reason}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-12 text-center`}>
                <i className="fas fa-file-alt text-4xl mb-4 text-gray-400"></i>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>请选择一个内容查看详情</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 批量操作模态框 */}
      <AnimatePresence>
        {showBatchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBatchModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl p-6`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">
                批量{batchAction === 'approve' ? '通过' : '拒绝'} ({selectedItems.size} 条内容)
              </h3>
              
              {batchAction === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">拒绝原因</label>
                  <textarea
                    value={batchReason}
                    onChange={(e) => setBatchReason(e.target.value)}
                    placeholder="请输入批量拒绝的原因..."
                    className={`w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border`}
                    rows={4}
                  ></textarea>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBatchModal(false)}
                  className={`flex-1 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  取消
                </button>
                <button
                  onClick={handleBatchAudit}
                  disabled={actionLoading || (batchAction === 'reject' && !batchReason.trim())}
                  className={`flex-1 py-2 rounded-lg ${
                    batchAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRulesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-2xl rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl p-6 max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">审核规则配置</h3>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                {auditRules.map((rule) => (
                  <div key={rule.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {rule.type === 'sensitive_words' && '检测敏感词汇和不当内容'}
                          {rule.type === 'spam_detection' && '识别垃圾信息和重复内容'}
                          {rule.type === 'ai_generated' && '检测AI生成的内容'}
                          {rule.type === 'cultural_authenticity' && '评估文化元素的真实性'}
                        </p>
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">阈值 ({rule.threshold}%)</label>
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
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">自动操作</label>
                        <select
                          value={rule.auto_action}
                          onChange={(e) => {
                            setAuditRules(prev => prev.map(r => 
                              r.id === rule.id ? { ...r, auto_action: e.target.value as any } : r
                            ));
                          }}
                          className={`w-full p-2 rounded-lg text-sm ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border`}
                        >
                          <option value="none">无</option>
                          <option value="flag">标记</option>
                          <option value="reject">自动拒绝</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className={`flex-1 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    toast.success('审核规则已保存');
                    setShowRulesModal(false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  保存规则
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
