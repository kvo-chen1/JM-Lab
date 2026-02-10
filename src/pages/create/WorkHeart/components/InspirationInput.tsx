import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { PRESET_TAGS } from '../types/workheart';
import { 
  usePrompt, 
  useSelectedTags, 
  useCurrentBrand,
  useWorkHeartStore 
} from '../hooks/useWorkHeartStore';

// AI建议示例
const AI_SUGGESTIONS = [
  '杨柳青风格的现代包装设计',
  '天津之眼与赛博朋克融合',
  '泥人张风格的3D角色建模',
  '海河夜景的国潮插画',
  '传统相声元素的现代海报',
  '五大道的复古明信片风格'
];

export default function InspirationInput() {
  const { isDark } = useTheme();
  const prompt = usePrompt();
  const selectedTags = useSelectedTags();
  const currentBrand = useCurrentBrand();
  const { setPrompt, toggleTag, setBrand } = useWorkHeartStore();
  
  const [isRecording, setIsRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 品牌选项
  const brandOptions = [
    { value: '', label: '不指定品牌' },
    { value: 'mahua', label: '桂发祥十八街麻花' },
    { value: 'baozi', label: '狗不理包子' },
    { value: 'niuren', label: '泥人张彩塑' },
    { value: 'erduoyan', label: '耳朵眼炸糕' },
    { value: 'laomeihua', label: '老美华鞋店' },
    { value: 'dafulai', label: '大福来锅巴菜' },
    { value: 'guorenzhang', label: '果仁张' },
    { value: 'chatangli', label: '茶汤李' }
  ];

  // 处理语音输入
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('您的浏览器不支持语音输入');
      return;
    }

    setIsRecording(true);
    
    // 模拟语音输入（实际项目中使用真实的Web Speech API）
    setTimeout(() => {
      setIsRecording(false);
      const randomSuggestion = AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)];
      setPrompt(randomSuggestion);
      toast.success('语音输入完成');
    }, 2000);
  };

  // 添加自定义标签
  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    toggleTag(customTagInput.trim());
    setCustomTagInput('');
  };

  // 快速应用建议
  const applySuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={`rounded-xl border ${
      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      {/* 头部工具栏 */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        isDark ? 'border-slate-700' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-4">
          {/* 品牌选择 */}
          <div className="relative">
            <select
              value={currentBrand}
              onChange={(e) => setBrand(e.target.value)}
              className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              } border`}
            >
              {brandOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <i className={`fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}></i>
          </div>

          {/* 标签显示 */}
          <div className="flex items-center gap-1">
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              已选标签:
            </span>
            <div className="flex gap-1">
              {selectedTags.length > 0 ? (
                <>
                  {selectedTags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isDark 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                  {selectedTags.length > 2 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark 
                        ? 'bg-slate-700 text-slate-400' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      +{selectedTags.length - 2}
                    </span>
                  )}
                </>
              ) : (
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  无
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧工具 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className={`p-2 rounded-lg transition-colors ${
              showSuggestions
                ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                : isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="AI建议"
          >
            <i className="fas fa-lightbulb"></i>
          </button>
          <button
            onClick={handleVoiceInput}
            disabled={isRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? isDark ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-red-100 text-red-600'
                : isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="语音输入"
          >
            <i className={`fas ${isRecording ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
          </button>
        </div>
      </div>

      {/* 标签选择区 */}
      <div className={`px-4 py-3 border-b ${
        isDark ? 'border-slate-700' : 'border-slate-100'
      }`}>
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleTag(tag)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  isSelected
                    ? isDark 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-blue-500 border-blue-500 text-white'
                    : isDark 
                      ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {tag}
              </motion.button>
            );
          })}
          
          {/* 自定义标签输入 */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
              placeholder="+ 自定义"
              className={`w-20 text-xs px-2 py-1.5 rounded-full border outline-none transition-colors ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500' 
                  : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 文本输入区 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想要的画面，例如：一只拿着糖葫芦的赛博朋克风格醒狮..."
          className={`w-full h-32 p-4 resize-none outline-none text-sm leading-relaxed bg-transparent ${
            isDark 
              ? 'text-white placeholder-slate-500' 
              : 'text-slate-700 placeholder-slate-400'
          }`}
        />
        
        {/* 字数统计 */}
        <div className={`absolute bottom-2 right-4 text-xs ${
          isDark ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {prompt.length} 字
        </div>
      </div>

      {/* AI建议下拉 */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t overflow-hidden ${
              isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'
            }`}
          >
            <div className="p-3">
              <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <i className="fas fa-magic mr-1"></i>
                AI 创意建议
              </p>
              <div className="flex flex-wrap gap-2">
                {AI_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => applySuggestion(suggestion)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
