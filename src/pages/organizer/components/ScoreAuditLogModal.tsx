import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  History,
  Star,
  Send,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  User,
  Clock,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { workScoringService, ScoreAuditLog } from '@/services/workScoringService';

interface ScoreAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string | null;
  isDark: boolean;
}

export function ScoreAuditLogModal({
  isOpen,
  onClose,
  submissionId,
  isDark,
}: ScoreAuditLogModalProps) {
  const [logs, setLogs] = useState<ScoreAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && submissionId) {
      loadLogs();
    }
  }, [isOpen, submissionId]);

  const loadLogs = async () => {
    if (!submissionId) return;
    setIsLoading(true);
    try {
      const data = await workScoringService.getScoreAuditLogs(submissionId, 50);
      setLogs(data);
    } catch (error) {
      console.error('加载评分日志失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'score':
        return <Star className="w-4 h-4" />;
      case 'update_score':
        return <Edit3 className="w-4 h-4" />;
      case 'delete_score':
        return <Trash2 className="w-4 h-4" />;
      case 'publish':
        return <Eye className="w-4 h-4" />;
      case 'unpublish':
        return <EyeOff className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'score':
        return '提交评分';
      case 'update_score':
        return '更新评分';
      case 'delete_score':
        return '删除评分';
      case 'publish':
        return '发布结果';
      case 'unpublish':
        return '取消发布';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'score':
        return 'bg-blue-500/20 text-blue-500';
      case 'update_score':
        return 'bg-amber-500/20 text-amber-500';
      case 'delete_score':
        return 'bg-red-500/20 text-red-500';
      case 'publish':
        return 'bg-emerald-500/20 text-emerald-500';
      case 'unpublish':
        return 'bg-gray-500/20 text-gray-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg rounded-2xl shadow-2xl max-h-[80vh] flex flex-col ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          {/* 头部 */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <History className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  操作日志
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  评分和发布操作记录
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 内容 */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <History className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  暂无操作记录
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border ${
                      isDark
                        ? 'bg-gray-700/30 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                        </div>
                        <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {getActionText(log.action)}
                        </span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>

                    {/* 操作人 */}
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <User className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        {log.judgeName || '未知用户'}
                      </span>
                    </div>

                    {/* 评分变化 */}
                    {(log.oldScore !== undefined || log.newScore !== undefined) && (
                      <div className="flex items-center gap-2 mt-2">
                        {log.oldScore !== undefined && (
                          <span className={`text-sm line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {log.oldScore}分
                          </span>
                        )}
                        <span className="text-gray-400">→</span>
                        {log.newScore !== undefined && (
                          <span className="text-sm font-medium text-red-500">
                            {log.newScore}分
                          </span>
                        )}
                      </div>
                    )}

                    {/* 备注 */}
                    {log.comment && (
                      <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {log.comment}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 底部 */}
          <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={onClose}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              关闭
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
