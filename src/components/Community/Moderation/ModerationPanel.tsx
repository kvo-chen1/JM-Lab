import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// 内容审核类型
export type ModerationContentType = 'post' | 'comment' | 'reply';

// 内容审核状态
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

// 审核内容类型
export interface ModerationContent {
  id: string;
  type: ModerationContentType;
  title?: string;
  content: string;
  author: string;
  authorId: string;
  communityId: string;
  createdAt: Date;
  status: ModerationStatus;
  reason?: string;
  postId?: string; // 用于评论和回复
}

// 审核规则类型
export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  type: 'keyword' | 'sensitive' | 'regex';
  value: string;
  severity: 'low' | 'medium' | 'high';
  action: 'flag' | 'reject' | 'auto_approve';
  enabled: boolean;
}

interface ModerationPanelProps {
  isDark: boolean;
  communityId: string;
  isAdmin: boolean;
  pendingContent: ModerationContent[];
  approvedContent: ModerationContent[];
  rejectedContent: ModerationContent[];
  rules: ModerationRule[];
  onApproveContent: (id: string, reason?: string) => void;
  onRejectContent: (id: string, reason: string) => void;
  onAddRule: (rule: Omit<ModerationRule, 'id'>) => void;
  onUpdateRule: (rule: ModerationRule) => void;
  onDeleteRule: (id: string) => void;
}

export const ModerationPanel: React.FC<ModerationPanelProps> = ({
  isDark,
  communityId,
  isAdmin,
  pendingContent = [],
  approvedContent = [],
  rejectedContent = [],
  rules = [],
  onApproveContent,
  onRejectContent,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'rules'>('pending');
  const [selectedContent, setSelectedContent] = useState<ModerationContent | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ModerationRule | null>(null);
  const [newRule, setNewRule] = useState<Omit<ModerationRule, 'id'>>({
    name: '',
    description: '',
    type: 'keyword',
    value: '',
    severity: 'medium',
    action: 'flag',
    enabled: true,
  });

  // 获取当前标签页的内容
  const getCurrentContent = () => {
    switch (activeTab) {
      case 'pending':
        return pendingContent;
      case 'approved':
        return approvedContent;
      case 'rejected':
        return rejectedContent;
      default:
        return [];
    }
  };

  // 处理内容审核
  const handleApprove = (id: string) => {
    onApproveContent(id);
    toast.success('内容已通过审核');
    setSelectedContent(null);
  };

  const handleReject = (id: string) => {
    if (!rejectionReason.trim()) {
      toast.warning('请输入拒绝原因');
      return;
    }
    onRejectContent(id, rejectionReason.trim());
    toast.success('内容已拒绝');
    setSelectedContent(null);
    setRejectionReason('');
  };

  // 处理规则管理
  const handleAddRule = () => {
    if (!newRule.name.trim() || !newRule.value.trim()) {
      toast.warning('请填写规则名称和值');
      return;
    }
    onAddRule(newRule);
    toast.success('规则已添加');
    setShowAddRuleModal(false);
    setNewRule({
      name: '',
      description: '',
      type: 'keyword',
      value: '',
      severity: 'medium',
      action: 'flag',
      enabled: true,
    });
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;
    onUpdateRule(editingRule);
    toast.success('规则已更新');
    setEditingRule(null);
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm('确定要删除这条规则吗？')) {
      onDeleteRule(id);
      toast.success('规则已删除');
    }
  };

  return (
    <div className={`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 overflow-y-auto`}>
      {/* 审核面板标题 */}
      <div className={`mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <h2 className="text-xl font-bold">内容审核</h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          管理社群内容审核，包括帖子、评论和回复
        </p>
      </div>

      {/* 审核标签页 */}
      <div className="flex border-b mb-4">
        {[
          { id: 'pending', label: '待审核', count: pendingContent.length },
          { id: 'approved', label: '已通过', count: approvedContent.length },
          { id: 'rejected', label: '已拒绝', count: rejectedContent.length },
          { id: 'rules', label: '审核规则', count: rules.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.id ? 
              `${isDark ? 'border-blue-500 text-blue-400' : 'border-blue-500 text-blue-600'} border-b-2` : 
              `${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            {tab.label} <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* 待审核内容 */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* 待审核内容列表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingContent.length === 0 ? (
              <div className={`col-span-full p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <i className="fas fa-check-circle text-4xl mb-2"></i>
                <p>暂无待审核内容</p>
              </div>
            ) : (
              pendingContent.map((content) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${isDark ? 
                    'bg-gray-700 hover:bg-gray-600' : 
                    'bg-gray-100 hover:bg-gray-200'}
                    ${selectedContent?.id === content.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedContent(content)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                        {content.type === 'post' ? '帖子' : content.type === 'comment' ? '评论' : '回复'}
                      </span>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {content.title || `${content.type} #${content.id.substring(0, 8)}`}
                      </span>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(content.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm mb-2 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {content.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      作者: {content.author}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* 内容详情和审核操作 */}
          {selectedContent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} ring-2 ring-blue-500`}
            >
              <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                内容详情
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    类型
                  </label>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 
                    selectedContent.type === 'post' ? 'bg-blue-900 text-blue-300' : 
                    selectedContent.type === 'comment' ? 'bg-green-900 text-green-300' : 
                    'bg-purple-900 text-purple-300' : 
                    selectedContent.type === 'post' ? 'bg-blue-100 text-blue-800' : 
                    selectedContent.type === 'comment' ? 'bg-green-100 text-green-800' : 
                    'bg-purple-100 text-purple-800'}`}>
                    {selectedContent.type === 'post' ? '帖子' : selectedContent.type === 'comment' ? '评论' : '回复'}
                  </span>
                </div>
                
                {selectedContent.title && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      标题
                    </label>
                    <p className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} text-sm`}>
                      {selectedContent.title}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    内容
                  </label>
                  <p className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} text-sm whitespace-pre-wrap`}>
                    {selectedContent.content}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      作者
                    </label>
                    <p className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} text-sm`}>
                      {selectedContent.author} ({selectedContent.authorId})
                    </p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      创建时间
                    </label>
                    <p className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} text-sm`}>
                      {new Date(selectedContent.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 审核操作 */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    拒绝原因 (可选)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                    rows={3}
                    placeholder="请输入拒绝原因 (可选)"
                  ></textarea>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedContent.id)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 
                      'bg-green-600 hover:bg-green-700 text-white' : 
                      'bg-green-500 hover:bg-green-600 text-white'}`}
                  >
                    <i className="fas fa-check mr-2"></i> 批准
                  </button>
                  
                  <button
                    onClick={() => handleReject(selectedContent.id)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 
                      'bg-red-600 hover:bg-red-700 text-white' : 
                      'bg-red-500 hover:bg-red-600 text-white'}`}
                  >
                    <i className="fas fa-times mr-2"></i> 拒绝
                  </button>
                  
                  <button
                    onClick={() => setSelectedContent(null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 
                      'bg-gray-600 hover:bg-gray-700 text-white' : 
                      'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    <i className="fas fa-times mr-2"></i> 取消
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* 已通过内容 */}
      {activeTab === 'approved' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {approvedContent.length === 0 ? (
              <div className={`col-span-full p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <i className="fas fa-check-circle text-4xl mb-2"></i>
                <p>暂无已通过内容</p>
              </div>
            ) : (
              approvedContent.map((content) => (
                <div
                  key={content.id}
                  className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                        {content.type === 'post' ? '帖子' : content.type === 'comment' ? '评论' : '回复'}
                      </span>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {content.title || `${content.type} #${content.id.substring(0, 8)}`}
                      </span>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(content.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm mb-2 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {content.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      作者: {content.author}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 已拒绝内容 */}
      {activeTab === 'rejected' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rejectedContent.length === 0 ? (
              <div className={`col-span-full p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <i className="fas fa-times-circle text-4xl mb-2"></i>
                <p>暂无已拒绝内容</p>
              </div>
            ) : (
              rejectedContent.map((content) => (
                <div
                  key={content.id}
                  className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'}`}>
                        {content.type === 'post' ? '帖子' : content.type === 'comment' ? '评论' : '回复'}
                      </span>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {content.title || `${content.type} #${content.id.substring(0, 8)}`}
                      </span>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(content.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm mb-2 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {content.content}
                  </p>
                  {content.reason && (
                    <div className="mb-2">
                      <span className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>拒绝原因: </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{content.reason}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      作者: {content.author}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 审核规则 */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* 添加规则按钮 */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddRuleModal(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 
                'bg-blue-600 hover:bg-blue-700 text-white' : 
                'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              <i className="fas fa-plus mr-2"></i> 添加规则
            </button>
          </div>

          {/* 规则列表 */}
          <div className="space-y-3">
            {rules.length === 0 ? (
              <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <i className="fas fa-list-alt text-4xl mb-2"></i>
                <p>暂无审核规则</p>
                <button
                  onClick={() => setShowAddRuleModal(true)}
                  className={`mt-3 px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 
                    'bg-blue-600 hover:bg-blue-700 text-white' : 
                    'bg-blue-500 hover:bg-blue-600 text-white'}`}
                >
                  <i className="fas fa-plus mr-2"></i> 添加第一条规则
                </button>
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  {editingRule?.id === rule.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            规则名称
                          </label>
                          <input
                            type="text"
                            value={editingRule.name}
                            onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                            className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                          />
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            规则类型
                          </label>
                          <select
                            value={editingRule.type}
                            onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as any })}
                            className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                          >
                            <option value="keyword">关键词</option>
                            <option value="sensitive">敏感内容</option>
                            <option value="regex">正则表达式</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            规则值
                          </label>
                          <input
                            type="text"
                            value={editingRule.value}
                            onChange={(e) => setEditingRule({ ...editingRule, value: e.target.value })}
                            className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                          />
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            严重程度
                          </label>
                          <select
                            value={editingRule.severity}
                            onChange={(e) => setEditingRule({ ...editingRule, severity: e.target.value as any })}
                            className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                          >
                            <option value="low">低</option>
                            <option value="medium">中</option>
                            <option value="high">高</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            操作
                          </label>
                          <select
                            value={editingRule.action}
                            onChange={(e) => setEditingRule({ ...editingRule, action: e.target.value as any })}
                            className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                          >
                            <option value="flag">标记审核</option>
                            <option value="reject">自动拒绝</option>
                            <option value="auto_approve">自动通过</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            启用状态
                          </label>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingRule.enabled}
                              onChange={(e) => setEditingRule({ ...editingRule, enabled: e.target.checked })}
                              className={`mr-2 ${isDark ? 'accent-blue-500' : 'accent-blue-500'}`}
                            />
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {editingRule.enabled ? '启用' : '禁用'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          规则描述
                        </label>
                        <textarea
                          value={editingRule.description}
                          onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                          className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                          rows={2}
                        ></textarea>
                      </div>
                      
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={handleUpdateRule}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 
                            'bg-green-600 hover:bg-green-700 text-white' : 
                            'bg-green-500 hover:bg-green-600 text-white'}`}
                        >
                          <i className="fas fa-save mr-2"></i> 保存
                        </button>
                        <button
                          onClick={() => setEditingRule(null)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 
                            'bg-gray-600 hover:bg-gray-700 text-white' : 
                            'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        >
                          <i className="fas fa-times mr-2"></i> 取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rule.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            {rule.type}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 
                            rule.severity === 'high' ? 'bg-red-900' : 
                            rule.severity === 'medium' ? 'bg-yellow-900' : 
                            'bg-green-900' : 
                            rule.severity === 'high' ? 'bg-red-100' : 
                            rule.severity === 'medium' ? 'bg-yellow-100' : 
                            'bg-green-100'}`}>
                            {rule.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 
                            rule.action === 'reject' ? 'bg-red-900' : 
                            rule.action === 'flag' ? 'bg-yellow-900' : 
                            'bg-green-900' : 
                            rule.action === 'reject' ? 'bg-red-100' : 
                            rule.action === 'flag' ? 'bg-yellow-100' : 
                            'bg-green-100'}`}>
                            {rule.action === 'flag' ? '标记' : rule.action === 'reject' ? '拒绝' : '自动通过'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 
                            rule.enabled ? 'bg-green-900 text-green-300' : 
                            'bg-gray-600 text-gray-400' : 
                            rule.enabled ? 'bg-green-100 text-green-800' : 
                            'bg-gray-200 text-gray-500'}`}>
                            {rule.enabled ? '启用' : '禁用'}
                          </span>
                          <button
                            onClick={() => setEditingRule(rule)}
                            className={`p-1 rounded ${isDark ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-gray-200 text-blue-600'}`}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className={`p-1 rounded ${isDark ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-gray-200 text-red-600'}`}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{rule.description}</p>
                      <div className={`p-2 rounded-lg text-sm ${isDark ? 'bg-gray-800' : 'bg-gray-200'} font-mono`}>
                        {rule.value}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 添加规则模态框 */}
      {showAddRuleModal && (
        <div className={`fixed inset-0 z-[70] ${isDark ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm flex items-center justify-center p-4`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 max-w-lg w-full`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>添加审核规则</h3>
              <button
                onClick={() => setShowAddRuleModal(false)}
                className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-xl`}
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    规则名称
                  </label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                    placeholder="规则名称"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    规则类型
                  </label>
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value as any })}
                    className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                  >
                    <option value="keyword">关键词</option>
                    <option value="sensitive">敏感内容</option>
                    <option value="regex">正则表达式</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    规则值
                  </label>
                  <input
                    type="text"
                    value={newRule.value}
                    onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                    className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                    placeholder="规则值"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    严重程度
                  </label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as any })}
                    className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    操作
                  </label>
                  <select
                    value={newRule.action}
                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                    className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                  >
                    <option value="flag">标记审核</option>
                    <option value="reject">自动拒绝</option>
                    <option value="auto_approve">自动通过</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  规则描述
                </label>
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                  rows={2}
                  placeholder="规则描述"
                ></textarea>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleAddRule}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 
                    'bg-blue-600 hover:bg-blue-700 text-white' : 
                    'bg-blue-500 hover:bg-blue-600 text-white'}`}
                >
                  <i className="fas fa-save mr-2"></i> 保存
                </button>
                <button
                  onClick={() => {
                    setShowAddRuleModal(false);
                    setNewRule({
                      name: '',
                      description: '',
                      type: 'keyword',
                      value: '',
                      severity: 'medium',
                      action: 'flag',
                      enabled: true,
                    });
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 
                    'bg-gray-600 hover:bg-gray-700 text-white' : 
                    'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                >
                  <i className="fas fa-times mr-2"></i> 取消
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ModerationPanel;
