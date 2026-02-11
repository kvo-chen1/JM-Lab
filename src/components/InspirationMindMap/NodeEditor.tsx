import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Sparkles,
  Lightbulb,
  BookOpen,
  Edit3,
  CheckCircle2,
  Trash2,
  Copy,
  RefreshCw,
  Wand2,
  Palette,
  MessageSquare,
  History,
  Tag,
} from 'lucide-react';
import type { MindNode, NodeCategory, AISuggestion } from './types';

interface NodeEditorProps {
  node: MindNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, updates: Partial<MindNode>) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onRequestAISuggestion: (nodeId: string, type: 'continue' | 'branch' | 'optimize' | 'culture') => void;
  aiSuggestions: AISuggestion[];
}

const categoryConfig: Record<NodeCategory, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  inspiration: { label: '灵感', icon: Lightbulb, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  culture: { label: '文化', icon: BookOpen, color: 'text-red-600', bgColor: 'bg-red-50' },
  ai_generate: { label: 'AI生成', icon: Sparkles, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  manual_edit: { label: '手动编辑', icon: Edit3, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  reference: { label: '参考', icon: BookOpen, color: 'text-green-600', bgColor: 'bg-green-50' },
  final: { label: '成品', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
};

export const NodeEditor: React.FC<NodeEditorProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onRequestAISuggestion,
  aiSuggestions,
}) => {
  const [editedNode, setEditedNode] = useState<Partial<MindNode>>({});
  const [activeTab, setActiveTab] = useState<'content' | 'ai' | 'history' | 'style'>('content');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (node) {
      setEditedNode({ ...node });
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const category = categoryConfig[node.category];
  const CategoryIcon = category.icon;

  const handleSave = () => {
    onSave(node.id, editedNode);
    onClose();
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(node.id);
      setShowDeleteConfirm(false);
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleRequestAI = async (type: 'continue' | 'branch' | 'optimize' | 'culture') => {
    setIsGenerating(true);
    onRequestAISuggestion(node.id, type);
    setTimeout(() => setIsGenerating(false), 1500);
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    setEditedNode(prev => ({
      ...prev,
      aiPrompt: suggestion.prompt,
      aiGeneratedContent: suggestion.content,
    }));
    setActiveTab('content');
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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="bg-gradient-to-r from-[#D4A574] to-[#E8C9A0] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${category.bgColor}`}>
                <CategoryIcon className={`w-5 h-5 ${category.color}`} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">编辑节点</h3>
                <p className="text-white/80 text-sm">{category.label}节点 · 第{node.version}版</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* 标签页切换 */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'content', label: '内容', icon: Edit3 },
              { id: 'ai', label: 'AI助手', icon: Sparkles },
              { id: 'history', label: '历史', icon: History },
              { id: 'style', label: '样式', icon: Palette },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#D4A574] border-b-2 border-[#D4A574] bg-[#D4A574]/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 内容区域 */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {activeTab === 'content' && (
              <div className="space-y-4">
                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    节点标题
                  </label>
                  <input
                    type="text"
                    value={editedNode.title || ''}
                    onChange={(e) => setEditedNode(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all"
                    placeholder="输入节点标题..."
                  />
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述
                  </label>
                  <textarea
                    value={editedNode.description || ''}
                    onChange={(e) => setEditedNode(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all resize-none"
                    placeholder="描述这个节点的内容..."
                  />
                </div>

                {/* AI提示词 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI提示词
                  </label>
                  <textarea
                    value={editedNode.aiPrompt || ''}
                    onChange={(e) => setEditedNode(prev => ({ ...prev, aiPrompt: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all resize-none bg-purple-50/50"
                    placeholder="用于生成内容的AI提示词..."
                  />
                </div>

                {/* AI生成内容 */}
                {editedNode.aiGeneratedContent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-purple-500" />
                      AI生成内容
                    </label>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-gray-800 whitespace-pre-wrap">{editedNode.aiGeneratedContent}</p>
                    </div>
                  </div>
                )}

                {/* 用户笔记 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    个人笔记
                  </label>
                  <textarea
                    value={editedNode.userNote || ''}
                    onChange={(e) => setEditedNode(prev => ({ ...prev, userNote: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all resize-none bg-blue-50/50"
                    placeholder="记录你的想法和灵感..."
                  />
                </div>

                {/* 标签 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500" />
                    标签
                  </label>
                  <input
                    type="text"
                    value={editedNode.tags?.join(', ') || ''}
                    onChange={(e) => setEditedNode(prev => ({
                      ...prev,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4A574] focus:border-transparent transition-all"
                    placeholder="用逗号分隔标签..."
                  />
                  {editedNode.tags && editedNode.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editedNode.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-[#D4A574]/20 text-[#8B6914] text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI创作助手
                  </h4>
                  <p className="text-sm text-purple-700 mb-4">
                    让AI帮你继续创作、生成分支或优化内容
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRequestAI('continue')}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all text-left"
                    >
                      <RefreshCw className={`w-4 h-4 text-purple-500 ${isGenerating ? 'animate-spin' : ''}`} />
                      <div>
                        <div className="font-medium text-gray-900">继续创作</div>
                        <div className="text-xs text-gray-500">基于当前节点延伸</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleRequestAI('branch')}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all text-left"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="font-medium text-gray-900">生成分支</div>
                        <div className="text-xs text-gray-500">创建相关子节点</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleRequestAI('optimize')}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all text-left"
                    >
                      <Wand2 className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="font-medium text-gray-900">优化内容</div>
                        <div className="text-xs text-gray-500">改进现有内容</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleRequestAI('culture')}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all text-left"
                    >
                      <BookOpen className="w-4 h-4 text-red-500" />
                      <div>
                        <div className="font-medium text-gray-900">文化融合</div>
                        <div className="text-xs text-gray-500">融入天津元素</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* AI建议列表 */}
                {aiSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">AI建议</h4>
                    {aiSuggestions.map((suggestion) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            suggestion.type === 'continue' ? 'bg-blue-100 text-blue-700' :
                            suggestion.type === 'branch' ? 'bg-amber-100 text-amber-700' :
                            suggestion.type === 'optimize' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {suggestion.type === 'continue' ? '继续' :
                             suggestion.type === 'branch' ? '分支' :
                             suggestion.type === 'optimize' ? '优化' : '文化'}
                          </span>
                          <button
                            onClick={() => handleApplySuggestion(suggestion)}
                            className="text-xs text-[#D4A574] hover:text-[#8B6914] font-medium"
                          >
                            应用
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{suggestion.content}</p>
                        <p className="text-xs text-gray-500">提示: {suggestion.prompt}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">版本历史</h4>
                  <span className="text-sm text-gray-500">当前版本: v{node.version}</span>
                </div>
                {node.history && node.history.length > 0 ? (
                  <div className="space-y-3">
                    {node.history.map((record, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#D4A574]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-[#8B6914]">
                            v{record.version}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {record.action === 'create' ? '创建' :
                               record.action === 'edit' ? '编辑' :
                               record.action === 'ai_generate' ? 'AI生成' : '优化'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(record.timestamp).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          {record.changes && (
                            <ul className="text-xs text-gray-600 space-y-1">
                              {record.changes.map((change, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                                  {change}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>暂无历史记录</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'style' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    节点样式
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['default', 'highlight', 'subtle'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setEditedNode(prev => ({ ...prev, style }))}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          editedNode.style === style
                            ? 'border-[#D4A574] bg-[#D4A574]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-full h-8 rounded mb-2 ${
                          style === 'default' ? 'bg-[#D4A574]' :
                          style === 'highlight' ? 'bg-gradient-to-r from-[#D4A574] to-[#E8C9A0]' :
                          'bg-gray-200'
                        }`} />
                        <span className="text-sm">
                          {style === 'default' ? '默认' :
                           style === 'highlight' ? '高亮' : '简约'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    节点图标
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[Lightbulb, BookOpen, Sparkles, Edit3, CheckCircle2, Tag].map((Icon, index) => (
                      <button
                        key={index}
                        className="p-3 rounded-lg border border-gray-200 hover:border-[#D4A574] hover:bg-[#D4A574]/5 transition-all"
                      >
                        <Icon className="w-5 h-5 mx-auto text-gray-600" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 底部操作栏 */}
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  showDeleteConfirm
                    ? 'bg-red-500 text-white'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {showDeleteConfirm ? '确认删除' : '删除'}
              </button>
              <button
                onClick={() => onDuplicate(node.id)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                复制
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-[#D4A574] hover:bg-[#C49464] text-white rounded-lg transition-colors shadow-md"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NodeEditor;
