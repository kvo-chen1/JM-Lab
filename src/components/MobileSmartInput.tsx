import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Mic, 
  Send, 
  Sparkles, 
  Image, 
  Video, 
  Lightbulb,
  X
} from 'lucide-react';

interface MobileSmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onVoiceInput?: (text: string) => void;
  isGenerating?: boolean;
  placeholder?: string;
}

// 快捷操作配置
const QUICK_ACTIONS = [
  { id: 'image', icon: Image, label: '生图', color: 'from-purple-500 to-pink-500' },
  { id: 'video', icon: Video, label: '视频', color: 'from-blue-500 to-cyan-500' },
  { id: 'inspiration', icon: Lightbulb, label: '灵感', color: 'from-amber-500 to-orange-500' },
  { id: 'ai', icon: Sparkles, label: 'AI', color: 'from-emerald-500 to-teal-500' },
];

export const MobileSmartInput: React.FC<MobileSmartInputProps> = ({
  value,
  onChange,
  onSubmit,
  onVoiceInput,
  isGenerating = false,
  placeholder = '输入消息...'
}) => {
  const { isDark } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 自动调整输入框高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  // 模拟语音输入
  const handleVoiceStart = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    // 开始计时
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    // 模拟3秒后结束录音
    setTimeout(() => {
      handleVoiceEnd();
    }, 3000);
  };

  const handleVoiceEnd = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    // 模拟语音转文字
    if (onVoiceInput) {
      onVoiceInput('帮我生成一张天津海河的图片');
    }
  };

  // 格式化录音时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickAction = (actionId: string) => {
    const actionTexts: Record<string, string> = {
      image: '帮我生成一张',
      video: '帮我生成一段视频',
      inspiration: '给我一些创意灵感',
      ai: '帮我'
    };
    
    onChange(actionTexts[actionId] || '');
    setShowQuickActions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* 快捷操作面板 */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute bottom-full left-0 right-0 mb-2 p-3 rounded-2xl ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            } shadow-xl`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                快捷操作
              </span>
              <button
                onClick={() => setShowQuickActions(false)}
                className={`p-1 rounded-full ${isDark ? 'text-gray-500 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <motion.button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 语音输入遮罩 */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={handleVoiceEnd}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              {/* 录音动画 */}
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-24 h-24 rounded-full bg-red-500/30 absolute inset-0"
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-red-500/50 absolute inset-0"
                />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-2xl relative z-10">
                  <Mic className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="text-white text-center">
                <div className="text-2xl font-bold">{formatTime(recordingTime)}</div>
                <div className="text-sm opacity-80">正在录音，点击停止</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 输入框主体 */}
      <div className={`flex items-end gap-2 p-2 rounded-2xl ${
        isDark 
          ? 'bg-gray-800/90 border border-gray-700' 
          : 'bg-white/90 border border-gray-200'
      } shadow-lg backdrop-blur-xl`}>
        {/* 快捷操作按钮 */}
        <motion.button
          onClick={() => setShowQuickActions(!showQuickActions)}
          whileTap={{ scale: 0.9 }}
          className={`p-3 rounded-xl transition-colors ${
            showQuickActions
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
              : isDark
                ? 'bg-gray-700 text-gray-400 hover:text-gray-200'
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-5 h-5" />
        </motion.button>

        {/* 文本输入 */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={placeholder}
          rows={1}
          disabled={isGenerating}
          className={`flex-1 py-3 px-2 bg-transparent border-none outline-none resize-none max-h-32 ${
            isDark 
              ? 'text-white placeholder-gray-500' 
              : 'text-gray-900 placeholder-gray-400'
          } disabled:opacity-50`}
          style={{ minHeight: '44px' }}
        />

        {/* 语音输入按钮 */}
        <motion.button
          onClick={handleVoiceStart}
          whileTap={{ scale: 0.9 }}
          disabled={isGenerating || isRecording}
          className={`p-3 rounded-xl transition-colors ${
            isDark
              ? 'bg-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          <Mic className="w-5 h-5" />
        </motion.button>

        {/* 发送按钮 */}
        <motion.button
          onClick={onSubmit}
          whileTap={{ scale: 0.9 }}
          disabled={!value.trim() || isGenerating}
          className={`p-3 rounded-xl transition-all ${
            value.trim() && !isGenerating
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg'
              : isDark
                ? 'bg-gray-700 text-gray-500'
                : 'bg-gray-200 text-gray-400'
          }`}
        >
          {isGenerating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default MobileSmartInput;
