import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2, 
  Play, 
  RotateCcw,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import batchSubmissionService, { BatchWorkItem } from '../../services/batchSubmissionService';

interface BatchSubmissionPanelProps {
  onClose?: () => void;
}

const getStatusIcon = (status: BatchWorkItem['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-gray-400" />;
    case 'validating':
    case 'uploading':
    case 'submitting':
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

const getStatusText = (status: BatchWorkItem['status']) => {
  switch (status) {
    case 'pending':
      return '等待中';
    case 'validating':
      return '验证中';
    case 'uploading':
      return '上传中';
    case 'submitting':
      return '提交中';
    case 'success':
      return '成功';
    case 'error':
      return '失败';
  }
};

export function BatchSubmissionPanel({ onClose }: BatchSubmissionPanelProps) {
  const [queue, setQueue] = useState<BatchWorkItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    files: [] as File[],
  });

  const stats = batchSubmissionService.getStats();

  const refreshQueue = useCallback(() => {
    setQueue(batchSubmissionService.getQueue());
    setIsRunning(batchSubmissionService.isSubmissionRunning());
  }, []);

  useEffect(() => {
    batchSubmissionService.setConfig({
      onProgress: () => refreshQueue(),
      onComplete: () => {
        refreshQueue();
        toast.success('批量提交完成！');
      },
    });
    refreshQueue();
  }, [refreshQueue]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleAddItem = () => {
    if (!newItem.title.trim()) {
      toast.error('请输入作品标题');
      return;
    }
    if (newItem.files.length === 0) {
      toast.error('请至少上传一个文件');
      return;
    }

    batchSubmissionService.addToQueue({
      id: Date.now().toString(),
      ...newItem,
    });

    setNewItem({
      title: '',
      description: '',
      tags: [],
      files: [],
    });
    setShowAddForm(false);
    refreshQueue();
    toast.success('作品已添加到队列');
  };

  const handleRemoveItem = (id: string) => {
    if (isRunning) {
      toast.error('提交进行中，无法删除');
      return;
    }
    batchSubmissionService.removeFromQueue(id);
    refreshQueue();
    toast.success('已从队列中移除');
  };

  const handleStartSubmission = async () => {
    if (queue.length === 0) {
      toast.error('队列为空，请先添加作品');
      return;
    }

    try {
      await batchSubmissionService.startSubmission();
    } catch (error) {
      console.error('批量提交失败:', error);
    }
  };

  const handleRetryFailed = async () => {
    const failedItems = queue.filter(item => item.status === 'error');
    if (failedItems.length === 0) {
      toast.error('没有失败的作品');
      return;
    }

    try {
      await batchSubmissionService.retryFailedItems();
    } catch (error) {
      console.error('重试失败:', error);
    }
  };

  const handleClearQueue = () => {
    if (isRunning) {
      toast.error('提交进行中，无法清空');
      return;
    }
    batchSubmissionService.clearQueue();
    refreshQueue();
    toast.success('队列已清空');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewItem(prev => ({
        ...prev,
        files: [...prev.files, ...Array.from(e.target.files!)],
      }));
    }
  };

  const removeFile = (index: number) => {
    setNewItem(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">批量提交作品</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              一次添加多个作品，自动按顺序提交
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">总计</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">等待中</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.processing}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">处理中</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success}</div>
              <div className="text-xs text-green-600 dark:text-green-400">成功</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.error}</div>
              <div className="text-xs text-red-600 dark:text-red-400">失败</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={isRunning}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              添加作品
            </button>
            <button
              onClick={handleStartSubmission}
              disabled={isRunning || queue.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
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
              {isRunning ? '提交中...' : '开始提交'}
            </button>
            <button
              onClick={handleRetryFailed}
              disabled={isRunning || stats.error === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重试失败
            </button>
            <button
              onClick={handleClearQueue}
              disabled={isRunning || queue.length === 0}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              清空
            </button>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      作品标题 *
                    </label>
                    <input
                      type="text"
                      value={newItem.title}
                      onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="输入作品标题"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      作品描述
                    </label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="输入作品描述"
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      上传文件 *
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full"
                    />
                    {newItem.files.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {newItem.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{file.name}</span>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddItem}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 rounded-lg text-white font-medium transition-all"
                    >
                      添加到队列
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queue.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">队列是空的，点击"添加作品"开始</p>
              </div>
            ) : (
              queue.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden"
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(item.status)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getStatusText(item.status)}
                          {item.progress !== undefined && ` (${item.progress}%)`}
                        </div>
                      </div>
                      {item.progress !== undefined && item.status !== 'success' && item.status !== 'error' && (
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            className="h-full bg-gradient-to-r from-red-600 to-orange-500"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isRunning && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                        <div className="p-4 space-y-3">
                          {item.description && (
                            <div>
                              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">描述</div>
                              <div className="text-gray-700 dark:text-gray-300">{item.description}</div>
                            </div>
                          )}
                          {item.tags.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">标签</div>
                              <div className="flex flex-wrap gap-2">
                                {item.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.files.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">文件</div>
                              <div className="space-y-1">
                                {item.files.map((file, index) => (
                                  <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                    {file.name}
                                  </div>
                                ))}
                              </div>
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

export default BatchSubmissionPanel;
