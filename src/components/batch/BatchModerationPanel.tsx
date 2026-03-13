import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  CheckSquare,
  Square,
  Eye,
  AlertCircle,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import batchModerationService, {
  ModerationItem,
  ModerationAction
} from '../../services/batchModerationService';
import { workService } from '../../services/apiService';

interface BatchModerationPanelProps {
  onClose?: () => void;
}

const getStatusIcon = (status: ModerationItem['status']) => {
  switch (status) {
    case 'idle':
      return <Clock className="w-4 h-4 text-gray-400" />;
    case 'processing':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Clock className="w-4 h-4 text-blue-500" />
        </motion.div>
      );
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

const getCurrentStatusBadge = (status: ModerationItem['currentStatus']) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  const labels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    scheduled: '已排期',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export function BatchModerationPanel({ onClose }: BatchModerationPanelProps) {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<ModerationAction | ''>('');
  const [bulkReason, setBulkReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const stats = batchModerationService.getStats();

  const refreshItems = useCallback(() => {
    setItems(batchModerationService.getItems());
    setIsRunning(batchModerationService.isModerationRunning());
  }, []);

  const loadPendingWorks = useCallback(async () => {
    setIsLoading(true);
    try {
      const works = await workService.getPendingModerationWorks({ limit: 50 });
      batchModerationService.setItems(
        works.map(work => ({
          id: work.id as number,
          title: work.title,
          thumbnail: work.thumbnailUrl,
          author: work.author?.username || '未知作者',
          createdAt: work.createdAt || new Date().toISOString(),
          currentStatus: work.moderationStatus,
        }))
      );
      refreshItems();
      toast.success('已加载待审核作品');
    } catch (error) {
      console.error('加载待审核作品失败:', error);
      toast.error('加载待审核作品失败');
    } finally {
      setIsLoading(false);
    }
  }, [refreshItems]);

  useEffect(() => {
    batchModerationService.setConfig({
      onProgress: () => refreshItems(),
      onComplete: () => {
        refreshItems();
        toast.success('批量审核完成！');
      },
    });
    refreshItems();
  }, [refreshItems]);

  useEffect(() => {
    loadPendingWorks();
  }, [loadPendingWorks]);

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const toggleSelect = (id: number) => {
    batchModerationService.toggleSelect(id);
    refreshItems();
  };

  const handleSelectAll = () => {
    if (stats.selected === stats.total) {
      batchModerationService.deselectAll();
    } else {
      batchModerationService.selectAll();
    }
    refreshItems();
  };

  const setItemAction = (id: number, action: ModerationAction) => {
    batchModerationService.setItemAction(id, action);
    refreshItems();
  };

  const handleApplyBulkAction = () => {
    if (!bulkAction) {
      toast.error('请选择批量操作');
      return;
    }
    if (bulkAction === 'reject' && !bulkReason.trim()) {
      toast.error('拒绝作品时需要填写原因');
      return;
    }

    batchModerationService.setBulkAction(bulkAction, bulkReason);
    refreshItems();
    toast.success(`已批量设置为${bulkAction === 'approve' ? '通过' : '拒绝'}`);
  };

  const setItemFeatured = (id: number, featured: boolean) => {
    batchModerationService.setItemFeatured(id, featured);
    refreshItems();
  };

  const setItemReason = (id: number, reason: string) => {
    batchModerationService.setItemAction(id, 'reject', reason);
    refreshItems();
  };

  const handleStartModeration = async () => {
    try {
      await batchModerationService.startModeration();
    } catch (error) {
      console.error('批量审核失败:', error);
    }
  };

  const handleReset = () => {
    batchModerationService.resetItems();
    refreshItems();
    toast.success('已重置审核状态');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">批量审核作品</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              一次审核多个作品，提升审核效率
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadPendingWorks}
              disabled={isLoading || isRunning}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              {isLoading ? '加载中...' : '刷新列表'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-8 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">总计</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.selected}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">已选</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">待处理</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.processing}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">处理中</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success}</div>
              <div className="text-xs text-green-600 dark:text-green-400">成功</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.error}</div>
              <div className="text-xs text-red-600 dark:text-red-400">失败</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.approved}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">通过</div>
            </div>
            <div className="text-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.rejected}</div>
              <div className="text-xs text-rose-600 dark:text-rose-400">拒绝</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSelectAll}
              disabled={isRunning}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-colors flex items-center gap-2"
            >
              {stats.selected === stats.total && stats.total > 0 ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {stats.selected === stats.total && stats.total > 0 ? '取消全选' : '全选'}
            </button>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">批量操作:</span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as ModerationAction | '')}
                disabled={isRunning || stats.selected === 0}
                className="bg-transparent border-none text-gray-900 dark:text-white focus:outline-none py-2"
              >
                <option value="">选择操作</option>
                <option value="approve">通过</option>
                <option value="reject">拒绝</option>
              </select>
              {bulkAction === 'reject' && (
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="拒绝原因"
                  disabled={isRunning}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              )}
              <button
                onClick={handleApplyBulkAction}
                disabled={isRunning || !bulkAction || stats.selected === 0}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
              >
                应用
              </button>
            </div>

            <button
              onClick={handleStartModeration}
              disabled={isRunning || stats.selected === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? '审核中...' : '开始审核'}
            </button>

            <button
              onClick={handleReset}
              disabled={isRunning}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              重置
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {isLoading ? '加载中...' : '暂无待审核作品'}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden"
                >
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(item.id);
                      }}
                      disabled={isRunning}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {item.selected ? (
                        <CheckSquare className="w-5 h-5 text-red-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {item.title}
                        </h3>
                        {getCurrentStatusBadge(item.currentStatus)}
                        {item.action && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.action === 'approve'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                          }`}>
                            将{''}
                            {item.action === 'approve' ? '通过' : '拒绝'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>作者: {item.author}</span>
                        <span>提交时间: {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}

                      {item.status !== 'idle' && item.status !== 'success' && item.status !== 'error' && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.status === 'processing' ? '处理中' : ''}
                        </span>
                      )}

                      {expandedItems.has(item.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedItems.has(item.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
                      >
                        <div className="p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              审核操作:
                            </span>
                            <button
                              onClick={() => setItemAction(item.id, 'approve')}
                              disabled={isRunning}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                item.action === 'approve'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              通过
                            </button>
                            <button
                              onClick={() => setItemAction(item.id, 'reject')}
                              disabled={isRunning}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                item.action === 'reject'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50'
                              }`}
                            >
                              <XCircle className="w-4 h-4" />
                              拒绝
                            </button>
                          </div>

                          {item.action === 'approve' && (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setItemFeatured(item.id, !item.featured)}
                                disabled={isRunning}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                  item.featured
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                              >
                                <Star className={`w-4 h-4 ${item.featured ? 'fill-current' : ''}`} />
                                {item.featured ? '已设为精选' : '设为精选'}
                              </button>
                            </div>
                          )}

                          {item.action === 'reject' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                拒绝原因:
                              </label>
                              <textarea
                                value={item.reason || ''}
                                onChange={(e) => setItemReason(item.id, e.target.value)}
                                disabled={isRunning}
                                placeholder="请输入拒绝原因"
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                              />
                            </div>
                          )}

                          {item.error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-red-600 dark:text-red-400">{item.error}</div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default BatchModerationPanel;
