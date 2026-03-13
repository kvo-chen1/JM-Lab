import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Trash2,
  Archive,
  CheckCircle,
  Circle,
  ChevronDown,
  Filter,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react';
import type {
  Notification,
  NotificationCategory,
  NotificationType,
  NotificationPriority,
  NotificationFilterOptions
} from '../../types/notification';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_TYPES } from '../../types/notification';
import { notificationBatchService } from '../../services/notificationBatchService';

interface NotificationBatchOperationsProps {
  notifications: Notification[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onBatchComplete: () => void;
  userId: string;
  isDark?: boolean;
}

const NotificationBatchOperations: React.FC<NotificationBatchOperationsProps> = ({
  notifications,
  selectedIds,
  onSelectionChange,
  onBatchComplete,
  userId,
  isDark = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'delete' | null>(null);
  const [filters, setFilters] = useState<NotificationFilterOptions>({});

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (filters.categories && filters.categories.length > 0) {
      result = result.filter(n => filters.categories!.includes(n.category));
    }

    if (filters.types && filters.types.length > 0) {
      result = result.filter(n => filters.types!.includes(n.type));
    }

    if (filters.priorities && filters.priorities.length > 0) {
      result = result.filter(n => filters.priorities!.includes(n.priority));
    }

    if (filters.unreadOnly) {
      result = result.filter(n => !n.isRead);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, filters]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  const selectedCount = selectedIds.size;

  const isAllSelected = useMemo(() => {
    return filteredNotifications.length > 0 && filteredNotifications.every(n => selectedIds.has(n.id));
  }, [filteredNotifications, selectedIds]);

  const isPartialSelected = useMemo(() => {
    return selectedCount > 0 && !isAllSelected;
  }, [selectedCount, isAllSelected]);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      const newSelected = new Set(filteredNotifications.map(n => n.id));
      onSelectionChange(newSelected);
    }
  }, [isAllSelected, filteredNotifications, onSelectionChange]);

  const toggleSelect = useCallback((id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  }, [selectedIds, onSelectionChange]);

  const executeBatchOperation = useCallback(async (
    operation: 'mark_read' | 'mark_unread' | 'archive' | 'delete'
  ) => {
    if (selectedCount === 0) return;

    setIsProcessing(true);
    try {
      const result = await notificationBatchService.executeBatchOperation(
        {
          operation,
          notificationIds: Array.from(selectedIds)
        },
        userId
      );

      if (result.success) {
        onSelectionChange(new Set());
        onBatchComplete();
      }
    } catch (error) {
      console.error('Batch operation error:', error);
    } finally {
      setIsProcessing(false);
      setShowConfirm(null);
    }
  }, [selectedIds, selectedCount, userId, onSelectionChange, onBatchComplete]);

  const markAllAsRead = useCallback(async () => {
    setIsProcessing(true);
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      if (unreadIds.length === 0) return;

      const result = await notificationBatchService.batchMarkAsRead(unreadIds, userId);
      if (result.success) {
        onBatchComplete();
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [notifications, userId, onBatchComplete]);

  const updateFilter = useCallback(<K extends keyof NotificationFilterOptions>(
    key: K,
    value: NotificationFilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between p-3 rounded-lg ${
        isDark ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            disabled={filteredNotifications.length === 0}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              isAllSelected
                ? 'bg-blue-500 text-white'
                : isPartialSelected
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${filteredNotifications.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isAllSelected ? (
              <CheckCircle className="w-4 h-4" />
            ) : isPartialSelected ? (
              <div className="w-4 h-4 rounded border-2 border-current flex items-center justify-center">
                <div className="w-2 h-0.5 bg-current" />
              </div>
            ) : (
              <Circle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isAllSelected ? '取消全选' : '全选'}
            </span>
          </button>

          {selectedCount > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              已选择 {selectedCount} 项
            </motion.span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showFilters || Object.keys(filters).some(k => filters[k as keyof NotificationFilterOptions])
                ? 'bg-purple-500 text-white'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={isProcessing}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isDark
                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Check className="w-4 h-4" />
              全部已读 ({unreadCount})
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    分类
                  </label>
                  <select
                    multiple
                    value={filters.categories || []}
                    onChange={(e) => updateFilter('categories',
                      Array.from(e.target.selectedOptions, option => option.value as NotificationCategory)
                    )}
                    className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {NOTIFICATION_CATEGORIES.map(cat => (
                      <option key={cat.category} value={cat.category}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    优先级
                  </label>
                  <select
                    multiple
                    value={filters.priorities || []}
                    onChange={(e) => updateFilter('priorities',
                      Array.from(e.target.selectedOptions, option => option.value as NotificationPriority)
                    )}
                    className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="low">低优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="high">高优先级</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    状态
                  </label>
                  <div className="mt-1 space-y-1">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.unreadOnly || false}
                        onChange={(e) => updateFilter('unreadOnly', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        仅未读
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    搜索
                  </label>
                  <input
                    type="text"
                    value={filters.searchQuery || ''}
                    onChange={(e) => updateFilter('searchQuery', e.target.value)}
                    placeholder="搜索通知..."
                    className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <button
                  onClick={clearFilters}
                  className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  清除筛选
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
          >
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              已选择 {selectedCount} 项
            </span>

            <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

            <div className="flex items-center gap-2">
              <button
                onClick={() => executeBatchOperation('mark_read')}
                disabled={isProcessing}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isDark
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                } ${isProcessing ? 'opacity-50' : ''}`}
              >
                <Check className="w-4 h-4" />
                标记已读
              </button>

              <button
                onClick={() => executeBatchOperation('archive')}
                disabled={isProcessing}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isDark
                    ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                    : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                } ${isProcessing ? 'opacity-50' : ''}`}
              >
                <Archive className="w-4 h-4" />
                归档
              </button>

              <button
                onClick={() => setShowConfirm('delete')}
                disabled={isProcessing}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isDark
                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                } ${isProcessing ? 'opacity-50' : ''}`}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>

              <button
                onClick={() => onSelectionChange(new Set())}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm === 'delete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md p-6 rounded-xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-2xl`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    确认删除
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    此操作不可撤销
                  </p>
                </div>
              </div>

              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                您确定要删除选中的 {selectedCount} 条通知吗？删除后将无法恢复。
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={() => executeBatchOperation('delete')}
                  disabled={isProcessing}
                  className={`px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors ${
                    isProcessing ? 'opacity-50' : ''
                  }`}
                >
                  {isProcessing ? '删除中...' : '确认删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {filteredNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
              selectedIds.has(notification.id)
                ? isDark
                  ? 'bg-blue-900/30 border border-blue-500/50'
                  : 'bg-blue-50 border border-blue-200'
                : isDark
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-white hover:bg-gray-50 border border-gray-100'
            }`}
            onClick={() => toggleSelect(notification.id)}
          >
            <div
              className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors ${
                selectedIds.has(notification.id)
                  ? 'bg-blue-500 border-blue-500'
                  : isDark
                  ? 'border-gray-600'
                  : 'border-gray-300'
              }`}
            >
              {selectedIds.has(notification.id) && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: NOTIFICATION_TYPES[notification.type]?.color }}
                />
                <span className={`text-sm font-medium ${
                  notification.isRead
                    ? isDark ? 'text-gray-400' : 'text-gray-600'
                    : isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {notification.title}
                </span>
                {!notification.isRead && (
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
              <p className={`text-sm line-clamp-2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {notification.content}
              </p>
            </div>

            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {formatTime(notification.createdAt)}
            </span>
          </motion.div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>没有符合条件的通知</p>
          </div>
        )}
      </div>
    </div>
  );
};

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default NotificationBatchOperations;
