import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Image as ImageIcon, Video, Sparkles, CheckCircle2, Download, Share2, Upload, MessageCircle } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { GenerationTask, GenerationStatus } from '@/services/aiGenerationService';

interface InlineGenerationCardProps {
  task: GenerationTask;
  onSave?: () => void;
  onPublish?: () => void;
  onShare?: () => void;
  onShareToFriend?: () => void;
  onDelete?: () => void;
}

// 风格选项
const STYLE_OPTIONS = [
  { id: 'traditional', name: '传统国风', icon: '🏮', description: '古典雅致，传统文化韵味' },
  { id: 'modern', name: '现代简约', icon: '✨', description: '简洁明快，现代设计感' },
  { id: 'vibrant', name: '鲜艳活泼', icon: '🎨', description: '色彩丰富，充满活力' },
  { id: 'ink', name: '水墨意境', icon: '🖌️', description: '水墨风格，诗意盎然' },
  { id: 'cyberpunk', name: '赛博朋克', icon: '🌃', description: '未来科技，霓虹光影' },
  { id: 'cute', name: '可爱萌系', icon: '🐱', description: '软萌可爱，治愈系风格' },
];

export const InlineGenerationCard: React.FC<InlineGenerationCardProps> = ({
  task,
  onSave,
  onPublish,
  onShare,
  onShareToFriend,
  onDelete
}) => {
  const { isDark } = useTheme();
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

  // 生成状态显示
  const renderGeneratingState = () => (
    <div className={`p-6 rounded-3xl ${isDark ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/50'} shadow-xl backdrop-blur-xl`}>
      {/* 头部区域 */}
      <div className="flex items-center gap-5 mb-6">
        {/* 动态图标 */}
        <div className="relative">
          <motion.div 
            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30' : 'bg-gradient-to-br from-indigo-100 to-purple-100'
            }`}
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {task.type === 'image' ? (
              <ImageIcon className="w-8 h-8 text-indigo-500" />
            ) : (
              <Video className="w-8 h-8 text-indigo-500" />
            )}
          </motion.div>
          {/* 脉冲动画 */}
          <motion.div
            className={`absolute inset-0 rounded-2xl ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-400/20'}`}
            animate={{ scale: [1, 1.3, 1.5], opacity: [0.5, 0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
              正在生成{task.type === 'image' ? '图片' : '视频'}
            </h4>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-indigo-500"
            >
              ...
            </motion.span>
          </div>
          <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {'prompt' in task.params ? task.params.prompt : 'AI生成内容'}
          </p>
        </div>
        
        {/* 旋转加载器 */}
        <div className="relative">
          <svg className="w-12 h-12 -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={isDark ? '#374151' : '#e5e7eb'}
              strokeWidth="3"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="125.6"
              animate={{ strokeDashoffset: [125.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {Math.round(Math.max(0, Math.min(100, task.progress)))}%
          </div>
        </div>
      </div>
      
      {/* 进度条 */}
      <div className="relative">
        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700/50' : 'bg-gray-200/50'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          />
        </div>
        {/* 进度光效 */}
        <motion.div
          className="absolute top-0 h-3 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ left: ['-20%', '120%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      {/* 底部信息 */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${task.status === 'processing' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {task.status === 'pending' ? '准备中...' : 
             task.status === 'processing' ? 'AI正在创作中...' : 
             task.status === 'completed' ? '生成完成' : 
             task.status === 'failed' ? '生成失败' : '生成中...'}
          </span>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          预计还需 {Math.max(1, Math.round((100 - task.progress) / 100 * 30))} 秒
        </span>
      </div>
    </div>
  );

  // 风格选择界面
  const renderStyleSelector = () => (
    <div className={`p-5 rounded-2xl ${isDark ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50/90 border border-gray-200/50'} shadow-xl backdrop-blur-xl`}>
      {/* 头部标题区域 */}
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${
            isDark ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-gradient-to-br from-amber-100 to-orange-100'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
        </motion.div>
        <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          选择创作风格
        </h3>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          选择一种风格，让AI为您创作更精准的作品
        </p>
      </div>

      {/* 风格选项网格 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {STYLE_OPTIONS.map((style, index) => (
          <motion.button
            key={style.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ 
              scale: 1.02, 
              y: -2,
              transition: { type: 'spring', stiffness: 400, damping: 15 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedStyle(style.id);
              setShowStyleSelector(false);
              toast.success(`已选择「${style.name}」风格，正在重新生成...`);
            }}
            className={`group relative p-3 rounded-xl border-2 text-left transition-all duration-300 overflow-hidden ${
              selectedStyle === style.id
                ? 'border-indigo-500 shadow-md shadow-indigo-500/20'
                : isDark
                  ? 'border-gray-700/50 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                  : 'border-gray-200/50 bg-white/50 hover:border-indigo-300 hover:bg-white hover:shadow-md'
            }`}
          >
            {/* 选中状态指示器 */}
            {selectedStyle === style.id && (
              <motion.div
                layoutId="selectedIndicator"
                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center"
              >
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}

            {/* 图标容器 */}
            <div className={`w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110 ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}>
              {style.icon}
            </div>

            {/* 文字内容 */}
            <h4 className={`font-semibold text-sm mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {style.name}
            </h4>
            <p className={`text-[10px] leading-tight line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {style.description}
            </p>

            {/* 悬停光效 */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
              isDark 
                ? 'bg-gradient-to-br from-indigo-500/5 to-purple-500/5' 
                : 'bg-gradient-to-br from-indigo-50 to-purple-50'
            }`} />
          </motion.button>
        ))}
      </div>

      {/* 底部操作区 */}
      <div className="flex items-center justify-center pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowStyleSelector(false)}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            isDark 
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          跳过，使用默认风格
        </motion.button>
      </div>
    </div>
  );

  // 完成状态显示
  const renderCompletedState = () => {
    // 检查是否有有效的结果URL
    const resultUrl = task.result?.urls?.[0];
    
    // 如果没有结果URL，显示错误状态
    if (!resultUrl) {
      return (
        <div className={`relative p-6 rounded-3xl ${isDark ? 'bg-gradient-to-br from-red-900/30 to-gray-900/80 border border-red-700/30' : 'bg-gradient-to-br from-red-50 to-gray-50/80 border border-red-200/50'} shadow-xl backdrop-blur-xl`}>
          {/* 头部区域 */}
          <div className="flex items-center gap-5 mb-6">
            {/* 错误图标 */}
            <div className="relative">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-gradient-to-br from-red-500/30 to-orange-500/30' : 'bg-gradient-to-br from-red-100 to-orange-100'
              }`}>
                {task.type === 'image' ? (
                  <ImageIcon className="w-8 h-8 text-red-500" />
                ) : (
                  <Video className="w-8 h-8 text-red-500" />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  生成失败
                </h4>
              </div>
              <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                未能获取到生成结果，请重试
              </p>
            </div>
            
            {/* 错误图标 */}
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-500 text-xl">✕</span>
            </div>
          </div>
          
          {/* 重试按钮 */}
          <button
            onClick={() => window.location.reload()}
            className={`w-full py-3 rounded-xl font-medium transition-all ${
              isDark
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            刷新页面重试
          </button>
        </div>
      );
    }
    
    return (
    <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
      {/* 生成结果展示 */}
      <div className="relative rounded-xl overflow-hidden mb-4 group">
        {task.type === 'image' ? (
          <img
            src={resultUrl}
            alt="Generated"
            className="w-full max-h-96 object-contain"
            onError={(e) => {
              console.error('[InlineGenerationCard] 图片加载失败:', resultUrl);
              (e.target as HTMLImageElement).src = '';
            }}
          />
        ) : (
          <video
            src={resultUrl}
            controls
            className="w-full max-h-96"
          />
        )}
        
        {/* 悬浮操作按钮 */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const link = document.createElement('a');
              link.href = resultUrl;
              link.download = `generated-${Date.now()}.${task.type === 'image' ? 'png' : 'mp4'}`;
              link.click();
              toast.success('下载成功');
            }}
            className="p-2 rounded-lg bg-black/50 text-white backdrop-blur-sm"
          >
            <Download className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* 操作按钮组 - 手机端：发布+分享 水平对齐；PC端：保存+发布 */}
      <div className="flex flex-wrap gap-2">
        {/* PC端显示保存到创作中心按钮，手机端隐藏 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSave}
          className={`hidden md:flex flex-1 py-2.5 px-4 rounded-xl font-medium items-center justify-center gap-2 transition-all ${
            isDark
              ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          保存到创作中心
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPublish}
          className={`flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            isDark
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          发布到津脉广场
        </motion.button>
        
        {/* 手机端分享按钮，与发布按钮水平对齐 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShare}
          className={`md:hidden flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          分享
        </motion.button>
      </div>
      
      {/* PC端保持原来的两个按钮 */}
      <div className="hidden md:flex gap-2 mt-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShare}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
            isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          分享生成记录
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShareToFriend}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
            isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          分享给好友
        </motion.button>
      </div>

      {/* 风格调整选项 */}
      <button
        onClick={() => setShowStyleSelector(true)}
        className={`mt-3 text-sm flex items-center gap-1 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <Sparkles className="w-4 h-4" />
        不满意？尝试其他风格
      </button>
    </div>
    );
  };

  // 失败状态显示
  const renderFailedState = () => {
    // 判断错误类型
    const isContentPolicyError = task.error?.includes('inappropriate content') || 
                                  task.error?.includes('敏感内容') || 
                                  task.error?.includes('内容审核') ||
                                  task.errorType === 'content_policy'
    const isTimeoutError = task.error?.includes('timeout') || 
                           task.error?.includes('超时') ||
                           task.errorType === 'timeout'
    const isAuthError = task.error?.includes('API Key') || 
                        task.error?.includes('Unauthorized') ||
                        task.errorType === 'auth'
    
    // 获取错误标题和描述
    let errorTitle = '生成失败'
    let errorDescription = task.error || '生成过程中出现错误，请重试'
    let buttonText = '重新生成'
    
    if (isContentPolicyError) {
      errorTitle = '内容审核未通过'
      errorDescription = '提示词包含敏感内容，请尝试修改描述，避免使用敏感词汇'
      buttonText = '修改提示词重试'
    } else if (isTimeoutError) {
      errorTitle = '生成超时'
      errorDescription = '生成请求超时，请稍后重试'
      buttonText = '重新生成'
    } else if (isAuthError) {
      errorTitle = '认证失败'
      errorDescription = 'API 认证失败，请联系管理员'
      buttonText = '重新生成'
    }
    
    return (
    <div className={`relative p-6 rounded-3xl ${isDark ? 'bg-gradient-to-br from-red-900/30 to-gray-900/80 border border-red-700/30' : 'bg-gradient-to-br from-red-50 to-gray-50/80 border border-red-200/50'} shadow-xl backdrop-blur-xl`}>
      {/* 删除按钮 */}
      {onDelete && (
        <button
          onClick={onDelete}
          className={`absolute top-3 right-3 p-1.5 rounded-full transition-all ${
            isDark
              ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/20'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-100'
          }`}
          title="删除"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      {/* 头部区域 */}
      <div className="flex items-center gap-5 mb-6">
        {/* 错误图标 */}
        <div className="relative">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-gradient-to-br from-red-500/30 to-orange-500/30' : 'bg-gradient-to-br from-red-100 to-orange-100'
          }`}>
            {task.type === 'image' ? (
              <ImageIcon className="w-8 h-8 text-red-500" />
            ) : (
              <Video className="w-8 h-8 text-red-500" />
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {errorTitle}
            </h4>
          </div>
          <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {errorDescription}
          </p>
        </div>
        
        {/* 错误图标 */}
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <span className="text-red-500 text-xl">✕</span>
        </div>
      </div>
      
      {/* 重试按钮 */}
      <button
        onClick={() => {
          // 触发重新生成事件
          const retryEvent = new CustomEvent('retryGeneration', { 
            detail: { taskId: task.id, prompt: task.params?.prompt || '', isContentPolicyError }
          });
          window.dispatchEvent(retryEvent);
        }}
        className={`w-full py-3 rounded-xl font-medium transition-all ${
          isDark
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-red-50 text-red-600 hover:bg-red-100'
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
  };

  // 调试：在控制台输出任务状态
  console.log('[InlineGenerationCard] 任务状态:', task.status, '任务ID:', task.id, 'result:', task.result, 'urls:', task.result?.urls);

  return (
    <AnimatePresence mode="wait">
      {showStyleSelector ? (
        <motion.div
          key="style-selector"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {renderStyleSelector()}
        </motion.div>
      ) : task.status === 'completed' ? (
        <motion.div
          key="completed"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {renderCompletedState()}
        </motion.div>
      ) : task.status === 'failed' ? (
        <motion.div
          key="failed"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {renderFailedState()}
        </motion.div>
      ) : (
        <motion.div
          key="generating"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {renderGeneratingState()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InlineGenerationCard;
