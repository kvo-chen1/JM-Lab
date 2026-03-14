import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Mic,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Wand2,
  Lightbulb,
  Palette,
  History,
  X,
  Send,
  Plus
} from 'lucide-react';

// 快捷功能配置
const QUICK_FEATURES = [
  { id: 'image', icon: ImageIcon, label: '生图', color: 'from-purple-500 to-pink-500', prompt: '帮我生成一张' },
  { id: 'camera', icon: Camera, label: '拍照', color: 'from-blue-500 to-cyan-500', prompt: '分析这张图片' },
  { id: 'inspiration', icon: Lightbulb, label: '灵感', color: 'from-amber-500 to-orange-500', prompt: '给我一些创意灵感' },
  { id: 'design', icon: Palette, label: '设计', color: 'from-emerald-500 to-teal-500', prompt: '帮我设计' },
  { id: 'optimize', icon: Wand2, label: '优化', color: 'from-rose-500 to-pink-500', prompt: '请优化以下内容' },
  { id: 'history', icon: History, label: '历史', color: 'from-slate-500 to-gray-500', prompt: '' },
];

interface MobileAIFeaturesProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isGenerating: boolean;
  onImageUpload?: (file: File) => void;
}

export const MobileAIFeatures: React.FC<MobileAIFeaturesProps> = ({
  input,
  onInputChange,
  onSend,
  isGenerating,
  onImageUpload
}) => {
  const { isDark } = useTheme();
  const [showFeatures, setShowFeatures] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 模拟语音输入
  const handleVoiceStart = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

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
    onInputChange('帮我生成一张天津海河的国潮风格图片');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFeatureClick = (feature: typeof QUICK_FEATURES[0]) => {
    if (feature.id === 'camera') {
      fileInputRef.current?.click();
    } else if (feature.id === 'history') {
      // 触发历史记录事件
      const event = new CustomEvent('showHistory');
      window.dispatchEvent(event);
    } else {
      onInputChange(feature.prompt);
    }
    setShowFeatures(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  return (
    <div className="relative">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 快捷功能面板 */}
      <AnimatePresence>
        {showFeatures && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute bottom-full left-0 right-0 mb-3 p-4 rounded-2xl ${
              isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
            } shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                快捷功能
              </span>
              <button
                onClick={() => setShowFeatures(false)}
                className={`p-1.5 rounded-full ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {QUICK_FEATURES.map((feature, index) => (
                <motion.button
                  key={feature.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleFeatureClick(feature)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl ${
                    isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                  } transition-colors`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {feature.label}
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
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
            onClick={handleVoiceEnd}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              {/* 录音动画 */}
              <div className="relative">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2, 
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-purple-600"
                    style={{ width: '120px', height: '120px', left: '-20px', top: '-20px' }}
                  />
                ))}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl">
                  <Mic className="w-10 h-10 text-white" />
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">{formatTime(recordingTime)}</div>
                <div className="text-white/70 text-sm">正在聆听，点击任意位置停止</div>
              </div>

              {/* 波形动画 */}
              <div className="flex items-center gap-1 h-12">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [10, 30 + Math.random() * 20, 10] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5 + Math.random() * 0.5,
                      delay: i * 0.05
                    }}
                    className="w-1.5 bg-gradient-to-t from-violet-400 to-purple-400 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 输入区域 */}
      <div className={`flex items-end gap-2 p-3 rounded-2xl ${
        isDark
          ? 'bg-slate-800/90 border border-slate-700'
          : 'bg-white/90 border border-slate-200'
      } shadow-xl backdrop-blur-xl`}>
        {/* 快捷功能按钮 */}
        <motion.button
          onClick={() => setShowFeatures(!showFeatures)}
          whileTap={{ scale: 0.9 }}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            showFeatures
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
              : isDark
                ? 'bg-slate-700 text-slate-400 hover:text-slate-200'
                : 'bg-slate-100 text-slate-500 hover:text-slate-700'
          }`}
        >
          {showFeatures ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </motion.button>

        {/* 文本输入 */}
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="输入灵感，开启创作之旅..."
          rows={1}
          disabled={isGenerating}
          className={`flex-1 py-2.5 px-1 bg-transparent border-none outline-none resize-none max-h-24 text-base ${
            isDark
              ? 'text-white placeholder-slate-500'
              : 'text-slate-900 placeholder-slate-400'
          } disabled:opacity-50`}
          style={{ minHeight: '40px' }}
        />

        {/* 语音输入按钮 */}
        <motion.button
          onClick={handleVoiceStart}
          whileTap={{ scale: 0.9 }}
          disabled={isGenerating || isRecording}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isDark
              ? 'bg-slate-700 text-slate-400 hover:text-slate-200'
              : 'bg-slate-100 text-slate-500 hover:text-slate-700'
          } disabled:opacity-50`}
        >
          <Mic className="w-5 h-5" />
        </motion.button>

        {/* 发送按钮 */}
        <motion.button
          onClick={onSend}
          whileTap={{ scale: 0.9 }}
          disabled={!input.trim() || isGenerating}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            input.trim() && !isGenerating
              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
              : isDark
                ? 'bg-slate-700 text-slate-500'
                : 'bg-slate-200 text-slate-400'
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

export default MobileAIFeatures;
