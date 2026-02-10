import { useState, useEffect, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { scoreAuthenticity } from '@/services/authenticityService';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  creator: string;
  creator_id: string;
  type: 'post' | 'comment' | 'activity';
  status: 'pending' | 'approved' | 'rejected';
  created_at: number;
  thumbnail?: string;
  authenticity_score?: number;
  cultural_elements?: string[];
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
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

export default function ContentAudit() {
  const { isDark } = useTheme();
  const { user: currentUser } = useContext(AuthContext);
  
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
      
      // 转换数据格式
      const formattedContents: ContentItem[] = result.contents.map((item: any) => ({
        id: item.id,
        title: item.title || item.content?.substring(0, 50) + '...' || '无标题',
        content: item.content || item.description || '',
        creator: item.author || '未知用户',
        creator_id: item.creator_id || item.author_id,
        type: item.type || 'work',
        status: item.status || 'pending',
        created_at: new Date(item.created_at).getTime(),
        thumbnail: item.thumbnail || item.cover_url,
        authenticity_score: item.authenticity_score,
        cultural_elements: item.cultural_elements || [],
        likes_count: item.likes || item.likes_count,
        comments_count: item.comments || item.comments_count,
        views_count: item.views || item.views_count,
      }));
      
      setContents(formattedContents);
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
  
  // 获取审核操作记录
  const fetchAuditActions = async (contentId: string) => {
    try {
      // 模拟API调用
      const response = await fetch(`/api/admin/contents/${contentId}/audit-actions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuditActions(data.actions || []);
      } else {
        // 模拟数据
        setAuditActions([
          {
            id: '1',
            content_id: contentId,
            action: 'reject',
            admin_id: 'admin1',
            admin_name: '管理员1',
            reason: '内容不符合平台规范',
            created_at: Date.now() - 86400000 * 2
          }
        ]);
      }
    } catch (error) {
      console.error('获取审核记录失败:', error);
    }
  };
  
  // 评估内容真实性
  const evaluateAuthenticity = (content: string, culturalContext: string = '中国传统文化') => {
    const result = scoreAuthenticity(content, culturalContext);
    return result;
  };
  
  // 处理审核操作
  const handleAuditAction = async (contentId: string, action: 'approve' | 'reject' | 'delete') => {
    if (!currentUser) return;
    
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
        
        // 添加审核记录
        const newAction: AuditAction = {
          id: `action_${Date.now()}`,
          content_id: contentId,
          action,
          admin_id: currentUser.id,
          admin_name: currentUser.username,
          reason: action === 'reject' ? reason : undefined,
          created_at: Date.now()
        };
        setAuditActions(prev => [newAction, ...prev]);
        
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
  
  // 处理内容选择
  const handleContentSelect = (content: ContentItem) => {
    setSelectedContent(content);
    fetchAuditActions(content.id);
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
      <div className="flex flex-col md:flex-row gap-6">
        {/* 左侧内容列表 */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold">内容审核</h2>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
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
              </select>
            </div>
          </div>
          
          {/* 排序选项 */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">共 {filteredAndSortedContents.length} 条内容</div>
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
          <div className={`overflow-y-auto max-h-[calc(100vh-300px)] rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="min-w-full">
              <thead>
                <tr className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                  <th className="px-4 py-3 text-left text-sm font-medium">内容信息</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">类型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">真实性</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">创建时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredAndSortedContents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <div className="text-gray-400">
                        <i className="fas fa-file-alt text-4xl mb-2"></i>
                        <p>暂无符合条件的内容</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedContents.map((content) => {
                    // 评估真实性
                    const authenticityResult = evaluateAuthenticity(content.content);
                    const authenticityScore = content.authenticity_score || authenticityResult.score;
                    
                    return (
                      <tr 
                        key={content.id} 
                        className={`hover:bg-gray-700/50 cursor-pointer ${selectedContent?.id === content.id ? (isDark ? 'bg-gray-700/30' : 'bg-gray-50') : ''}`}
                        onClick={() => handleContentSelect(content)}
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-start">
                            {content.thumbnail && (
                              <img 
                                src={content.thumbnail} 
                                alt={content.title} 
                                className="w-16 h-16 rounded-lg object-cover mr-3 flex-shrink-0" 
                              />
                            )}
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
                            <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              ({getAuthenticityDescription(authenticityScore)})
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(content.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {content.status === 'pending' && (
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
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-100'} text-sm`}>
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
              
              {/* 真实性评估 */}
              <div className="mb-6">
                <h5 className="font-medium mb-2">真实性评估</h5>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                  {(() => {
                    const result = evaluateAuthenticity(selectedContent.content);
                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">真实性评分</span>
                          <span className={`font-bold ${getAuthenticityColor(result.score)}`}>
                            {result.score}%
                          </span>
                        </div>
                        <div className={`w-full bg-gray-300 rounded-full h-2.5 ${isDark ? 'bg-gray-500' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-2.5 rounded-full ${result.score >= 80 ? 'bg-green-500' : result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${result.score}%` }}
                          ></div>
                        </div>
                        {result.feedback.length > 0 && (
                          <div className="mt-2">
                            <h6 className="text-xs font-medium mb-1">评估反馈</h6>
                            <ul className={`list-disc list-inside text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {result.feedback.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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
                      className={`flex-1 px-3 py-2 rounded text-sm bg-red-100 text-red-600 hover:bg-green-200 transition-colors ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      </div>
    </motion.div>
  );
}

// 辅助函数：获取内容类型标签样式
function getTypeBadgeClass(type: string) {
  switch (type) {
    case 'post':
      return 'bg-blue-100 text-blue-600';
    case 'comment':
      return 'bg-purple-100 text-purple-600';
    case 'activity':
      return 'bg-orange-100 text-orange-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}
