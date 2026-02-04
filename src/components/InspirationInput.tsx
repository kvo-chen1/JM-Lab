import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import TagSelector from './TagSelector';
import { aiRecommendationService } from '@/services/aiRecommendationService';

// 为语音识别 API 添加类型定义
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface WindowWithSpeechRecognition extends Window {
  webkitSpeechRecognition?: new () => SpeechRecognition;
  SpeechRecognition?: new () => SpeechRecognition;
}

declare const window: WindowWithSpeechRecognition;

interface InspirationInputProps {
  onGenerate?: (prompt: string, tags: string[]) => void;
  onApply?: (content: { prompt: string; tags: string[] }) => void;
  className?: string;
}

const DEFAULT_TAGS = [
  '国潮风格', '非遗元素', '科创思维', '地域素材', '节日庆典', '文创产品',
  '杨柳青年画', '传统纹样', '红蓝配色', '泥人张风格', '风筝魏', '海河风光',
  '天津民俗', '历史建筑', '饮食文化', '艺术传承'
];

const AI_SUGGESTIONS = [
  '杨柳青风格的现代包装设计',
  '天津之眼与赛博朋克融合',
  '泥人张风格的3D角色建模',
  '海河夜景的国潮插画',
  '传统纹样的现代应用',
  '非遗元素的数字化表达'
];

const InspirationInput = memo(function InspirationInput({ onGenerate, onApply, className = '' }: InspirationInputProps) {
  const { isDark } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>(AI_SUGGESTIONS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [voiceInputActive, setVoiceInputActive] = useState(false);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [realTimeSuggestions, setRealTimeSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionTimeout, setSuggestionTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceRecognitionRef = useRef<any>(null);

  // 加载输入历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('inspirationInputHistory');
    if (savedHistory) {
      try {
        setInputHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to load input history:', error);
      }
    }
  }, []);

  // 保存输入历史
  useEffect(() => {
    if (inputHistory.length > 0) {
      localStorage.setItem('inspirationInputHistory', JSON.stringify(inputHistory.slice(0, 10)));
    }
  }, [inputHistory]);

  // 实时获取 AI 建议
  useEffect(() => {
    // 清除之前的定时器
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
    }

    // 当输入内容变化时，延迟获取建议
    if (prompt.trim().length > 2) {
      const timeout = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          const suggestions = await aiRecommendationService.getRecommendations(prompt);
          setRealTimeSuggestions(suggestions);
        } catch (error) {
          console.error('获取实时建议失败:', error);
          setRealTimeSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 500); // 500ms 延迟，避免频繁调用 API

      setSuggestionTimeout(timeout);
    } else {
      setRealTimeSuggestions([]);
    }

    // 清理函数
    return () => {
      if (suggestionTimeout) {
        clearTimeout(suggestionTimeout);
      }
    };
  }, [prompt, suggestionTimeout]);

  // 处理标签选择
  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // 添加自定义标签
  const handleAddCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag && !selectedTags.includes(tag) && !DEFAULT_TAGS.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
      setCustomTagInput('');
      setShowCustomTagInput(false);
      toast.success('自定义标签已添加');
    }
  };

  // 清除输入
  const handleClearInput = () => {
    setPrompt('');
    setSelectedTags([]);
    inputRef.current?.focus();
  };

  // 应用 AI 建议
  const handleApplySuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    inputRef.current?.focus();
  };

  // 应用历史记录
  const handleApplyHistory = (historyItem: string) => {
    setPrompt(historyItem);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  // 开始语音输入
  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = false;
      recognition.interimResults = false;

      setVoiceInputActive(true);
      toast.info('正在聆听...');

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(prev => prev + transcript);
        toast.success('语音输入成功');
      };

      recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error);
        toast.error('语音输入失败，请重试');
      };

      recognition.onend = () => {
        setVoiceInputActive(false);
      };

      recognition.start();
      voiceRecognitionRef.current = recognition;
    } else {
      toast.error('您的浏览器不支持语音识别');
    }
  };

  // 停止语音输入
  const stopVoiceInput = () => {
    if (voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stop();
      setVoiceInputActive(false);
    }
  };

  // 生成灵感
  const handleGenerate = () => {
    const finalPrompt = prompt.trim();
    if (!finalPrompt && selectedTags.length === 0) {
      toast.warning('请输入提示词或选择标签');
      return;
    }

    setIsGenerating(true);
    
    // 保存到历史记录
    if (finalPrompt) {
      setInputHistory(prev => [finalPrompt, ...prev.filter(item => item !== finalPrompt)].slice(0, 10));
    }

    // 调用生成回调
    if (onGenerate) {
      onGenerate(finalPrompt, selectedTags);
    }

    // 模拟生成过程
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('灵感生成成功');
    }, 1500);
  };

  // 应用内容
  const handleApply = () => {
    const finalPrompt = prompt.trim();
    if (!finalPrompt && selectedTags.length === 0) {
      toast.warning('请输入提示词或选择标签');
      return;
    }

    if (onApply) {
      onApply({ prompt: finalPrompt, tags: selectedTags });
    }
    toast.success('内容已应用');
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        handleApply();
      } else {
        handleGenerate();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`w-full max-w-3xl mx-auto backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-3 shadow-2xl transition-all duration-200 hover:bg-white/15 focus-within:bg-white/15 focus-within:border-white/30 focus-within:shadow-3xl hover:shadow-3xl ${className}`}>
      <div className="flex flex-col md:flex-row gap-3">
        {/* 输入框区域 */}
        <div className="flex-grow relative">
          <motion.input
            ref={inputRef}
            type="text"
            placeholder="输入灵感，开启创作之旅..."
            className="w-full h-16 bg-transparent text-white placeholder-white/60 px-6 text-lg outline-none transition-all duration-300"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            whileFocus={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
          
          {/* 功能按钮 */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-4">
            {/* 灵感加持按钮 */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
                setPrompt(randomSuggestion);
                toast.success('灵感加持成功');
              }}
              className="p-2 rounded-full transition-all text-white/60 hover:bg-white/10"
              aria-label="开启灵感加持"
              tabindex={0}
            >
              <i className="fas fa-bolt text-xl"></i>
            </motion.button>
            
            {/* 语音输入按钮 */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={voiceInputActive ? stopVoiceInput : startVoiceInput}
              className={`p-2 rounded-full transition-all ${voiceInputActive ? 'text-red-400 bg-red-400/20' : 'text-white/60 hover:bg-white/10'}`}
              aria-label="开始语音输入"
              tabindex={0}
            >
              <i className="fas fa-microphone text-xl"></i>
            </motion.button>
            
            {/* 清除按钮 */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClearInput}
              className="p-2 rounded-full text-white/60 hover:bg-white/10 transition-colors"
              aria-label="清除所有内容"
              tabindex={0}
            >
              <i className="fas fa-times-circle text-xl"></i>
            </motion.button>
          </div>
          
          {/* 历史记录和建议下拉 */}
          <AnimatePresence>
            {(showHistory || realTimeSuggestions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl shadow-xl z-50"
              >
                <div className="p-3">
                  {/* 实时 AI 建议 */}
                  {realTimeSuggestions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-blue-500 mb-2 flex items-center gap-1">
                        <i className="fas fa-lightbulb"></i>
                        AI 建议
                      </h4>
                      <div className="space-y-1">
                        {realTimeSuggestions.map((suggestion, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                            onClick={() => {
                              setPrompt(suggestion);
                              setShowHistory(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-800 hover:bg-blue-50/50"
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 最近输入历史 */}
                  {showHistory && inputHistory.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">最近输入</h4>
                      <div className="space-y-1">
                        {inputHistory.slice(0, 5).map((item, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                            onClick={() => handleApplyHistory(item)}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-800 hover:bg-white/50"
                          >
                            {item}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-3 p-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-16 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all shadow-lg flex items-center gap-2"
            tabindex={0}
          >
            <i className="fas fa-lightbulb text-xl"></i>
            {isGenerating ? '生成中...' : '灵感'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className="h-16 px-8 rounded-2xl bg-white text-black hover:bg-gray-100 font-bold transition-all shadow-xl flex items-center gap-2"
            tabindex={0}
          >
            <i className="fas fa-wand-magic-sparkles text-xl"></i>
            生成
          </motion.button>
        </div>
      </div>
      
      {/* 标签选择区域 */}
      <TagSelector
        tags={DEFAULT_TAGS}
        selectedTags={selectedTags}
        onTagSelect={handleTagSelect}
        onAddCustomTag={handleAddCustomTag}
        customTagInput={customTagInput}
        onCustomTagChange={setCustomTagInput}
        showCustomTagInput={showCustomTagInput}
        onToggleCustomTagInput={() => setShowCustomTagInput(!showCustomTagInput)}
      />
    </motion.div>
  );
});

export default InspirationInput;
