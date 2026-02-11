import { motion } from 'framer-motion';
import {
  Clock,
  Edit3,
  Trash2,
  Zap,
  LayoutGrid,
  Search,
  Box,
  Grid3X3,
  Sparkles
} from 'lucide-react';

interface ActiveSessionCardProps {
  draft: {
    name?: string;
    prompt?: string;
    currentStep?: number;
    updatedAt: number;
    activeTool?: 'layout' | 'trace' | 'mockup' | 'tile' | 'aiWriter';
    generatedResults?: any[];
    selectedResult?: number | null;
  } | null;
  isDark: boolean;
  onResume: () => void;
  onClear: () => void;
}

const toolTypeConfig: Record<'layout' | 'trace' | 'mockup' | 'tile' | 'aiWriter', { name: string; icon: any; color: string; bgColor: string }> = {
  layout: { name: '版式设计', icon: LayoutGrid, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  trace: { name: '文化溯源', icon: Search, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  mockup: { name: '模型预览', icon: Box, color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  tile: { name: '图案平铺', icon: Grid3X3, color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  aiWriter: { name: 'AI写作', icon: Sparkles, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' }
};

export default function ActiveSessionCard({
  draft,
  isDark,
  onResume,
  onClear
}: ActiveSessionCardProps) {
  if (!draft) return null;

  const toolType = draft.activeTool || 'layout';
  const config = toolTypeConfig[toolType] || toolTypeConfig.layout;
  const Icon = config.icon;

  const getThumbnail = () => {
    if (draft.generatedResults && draft.generatedResults.length > 0 && draft.selectedResult) {
      const selected = draft.generatedResults.find((r: any) => r.id === draft.selectedResult);
      return selected ? selected.imageUrl : draft.generatedResults[0].imageUrl;
    }
    if (draft.generatedResults && draft.generatedResults.length > 0) {
      return draft.generatedResults[0].imageUrl;
    }
    return null;
  };

  const thumbnail = getThumbnail();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl border overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'
          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
      } shadow-xl`}
    >
      {/* 头部 */}
      <div className="relative">
        {/* 背景装饰 */}
        <div className={`absolute inset-0 opacity-10 ${config.bgColor}`}>
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 blur-3xl" />
        </div>

        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {draft.name || '未命名创作'}
                  </h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium">
                    <Zap className="w-3 h-3" />
                    自动保存
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(draft.updatedAt).toLocaleString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>·</span>
                  <span>步骤 {draft.currentStep}/3</span>
                  <span>·</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${config.bgColor} text-gray-700 dark:text-gray-300`}>
                    {config.name}
                  </span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={onClear}
                className={`p-2.5 rounded-xl transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="清除会话"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={onResume}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-lg shadow-primary-500/25 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit3 className="w-4 h-4" />
                继续编辑
              </motion.button>
            </div>
          </div>

          {/* 预览区域 */}
          <div className="mt-6 flex gap-6">
            {/* 缩略图 */}
            <div className={`w-48 h-32 rounded-xl overflow-hidden flex-shrink-0 ${config.bgColor} flex items-center justify-center`}>
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Icon className="w-10 h-10 mb-2 opacity-50" />
                  <span className="text-xs">暂无预览</span>
                </div>
              )}
            </div>

            {/* 提示词预览 */}
            <div className="flex-1 min-w-0">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">提示词</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {draft.prompt || '（无提示词）'}
                </p>
              </div>

              {/* 进度指示器 */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>创作进度</span>
                  <span>{Math.round(((draft.currentStep || 0) / 3) * 100)}%</span>
                </div>
                <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${config.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${((draft.currentStep || 0) / 3) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  {['输入灵感', 'AI生成', '编辑导出'].map((step, index) => (
                    <div
                      key={step}
                      className={`flex items-center gap-1 text-xs ${
                        index < (draft.currentStep || 0)
                          ? 'text-primary-500 font-medium'
                          : 'text-gray-400'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          index < (draft.currentStep || 0)
                            ? 'bg-primary-500 text-white'
                            : isDark
                            ? 'bg-gray-700 text-gray-500'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {index < (draft.currentStep || 0) ? '✓' : index + 1}
                      </div>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
