import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  createReport,
  REPORT_TYPE_CONFIG,
  type ReportType,
  type ReportTargetType
} from '@/services/reportService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetAuthorId?: string;
  targetTitle?: string;
}

// 举报类型分组
const reportTypeGroups = [
  {
    title: '',
    types: [
      { type: 'spam' as ReportType, icon: '💰' },
      { type: 'provocative' as ReportType, icon: '🔥' },
      { type: 'pornographic' as ReportType, icon: '🔞' },
      { type: 'personal_attack' as ReportType, icon: '⚡' },
    ]
  },
  {
    title: '',
    types: [
      { type: 'illegal' as ReportType, icon: '🚨' },
      { type: 'political_rumor' as ReportType, icon: '🏛️' },
      { type: 'social_rumor' as ReportType, icon: '📢' },
      { type: 'false_info' as ReportType, icon: '❌' },
    ]
  },
  {
    title: '',
    types: [
      { type: 'external_link' as ReportType, icon: '🔗' },
      { type: 'other' as ReportType, icon: '📝' },
    ]
  }
];

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetAuthorId,
  targetTitle
}: ReportModalProps) {
  const { isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error('请选择举报理由');
      return;
    }

    setIsSubmitting(true);

    const result = await createReport({
      target_type: targetType,
      target_id: targetId,
      target_author_id: targetAuthorId,
      report_type: selectedType,
      description: description.trim() || undefined
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      toast.error(result.error || '举报失败，请重试');
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setDescription('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* 弹窗 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 ${
              isDark ? 'bg-[#1a1a2e]' : 'bg-white'
            } rounded-2xl shadow-2xl overflow-hidden`}
          >
            {isSuccess ? (
              // 成功状态
              <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6"
                >
                  <Check className="w-10 h-10 text-green-500" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">举报已提交</h3>
                <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  感谢您的反馈，我们会尽快处理
                </p>
              </div>
            ) : (
              <>
                {/* 头部 */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold">我要举报</h3>
                  </div>
                  <button
                    onClick={handleClose}
                    className={`p-2 rounded-full transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 内容 */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {/* 被举报内容提示 */}
                  {targetTitle && (
                    <div className={`mb-6 p-3 rounded-lg text-sm ${
                      isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>举报内容：</span>
                      <span className="ml-1 line-clamp-1">{targetTitle}</span>
                    </div>
                  )}

                  {/* 举报理由选择 */}
                  <div className="mb-6">
                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      请选择举报的理由：
                    </p>

                    <div className="space-y-3">
                      {reportTypeGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="grid grid-cols-2 gap-3">
                          {group.types.map(({ type, icon }) => {
                            const config = REPORT_TYPE_CONFIG[type];
                            const isSelected = selectedType === type;

                            return (
                              <motion.button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                  isSelected
                                    ? isDark
                                      ? 'border-red-500 bg-red-500/10'
                                      : 'border-red-500 bg-red-50'
                                    : isDark
                                      ? 'border-gray-700 hover:border-gray-600'
                                      : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <span className="text-lg">{icon}</span>
                                <span className="text-sm font-medium">{config.label}</span>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
                                  >
                                    <Check className="w-3 h-3 text-white" />
                                  </motion.div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 补充说明 */}
                  <div>
                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      为帮助审核人员更快处理，请补充问题类型和出现位置等详细信息
                    </p>
                    <div className="relative">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="请输入详细描述..."
                        maxLength={200}
                        rows={4}
                        className={`w-full p-4 rounded-xl resize-none transition-all ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        } border focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                      />
                      <span className={`absolute bottom-3 right-3 text-xs ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {description.length}/200
                      </span>
                    </div>
                  </div>
                </div>

                {/* 底部按钮 */}
                <div className={`flex gap-3 px-6 py-4 border-t ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <button
                    onClick={handleClose}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedType || isSubmitting}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      !selectedType || isSubmitting
                        ? 'opacity-50 cursor-not-allowed bg-gray-400'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        提交中...
                      </span>
                    ) : (
                      '确定'
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
