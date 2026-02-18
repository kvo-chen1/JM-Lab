import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  X,
  Loader2,
  Send,
} from 'lucide-react';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  isPublishing: boolean;
  isDark: boolean;
}

export function PublishConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isPublishing,
  isDark,
}: PublishConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl shadow-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          {/* 头部 */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              确认发布评分结果
            </h3>
            <button
              onClick={onClose}
              disabled={isPublishing}
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
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-full ${
                isDark ? 'bg-amber-500/20' : 'bg-amber-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${
                  isDark ? 'text-amber-500' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  即将发布 {selectedCount} 个作品的评分结果
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  发布后，创作者将在"我的活动"页面看到评分结果。此操作不可撤销，请确认无误后再发布。
                </p>
              </div>
            </div>

            {/* 提示信息 */}
            <div className={`p-4 rounded-xl text-sm ${
              isDark
                ? 'bg-gray-700/50 text-gray-300'
                : 'bg-gray-50 text-gray-600'
            }`}>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>发布后的评分结果将对创作者可见</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>创作者将收到评分结果通知</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>已发布的评分结果可以随时取消发布</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className={`flex items-center justify-end gap-3 p-6 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={onClose}
              disabled={isPublishing}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } disabled:opacity-50`}
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={isPublishing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>发布中...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>确认发布</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
