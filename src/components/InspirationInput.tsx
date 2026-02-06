import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import TagSelector from './TagSelector';
import { aiRecommendationService } from '@/services/aiRecommendationService';
import { aiCreativeAssistantService, CreativeSuggestion } from '@/services/aiCreativeAssistantService';
import { useNavigate } from 'react-router-dom';

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
  enableRandomInspiration?: boolean;
  enablePromptOptimization?: boolean;
  enableDesignWorkshopRedirect?: boolean;
}

const DEFAULT_TAGS = [
  '国潮风格', '非遗元素', '科创思维', '地域素材', '节日庆典', '文创产品',
  '杨柳青年画', '传统纹样', '红蓝配色', '泥人张风格', '风筝魏', '海河风光',
  '天津民俗', '历史建筑', '饮食文化', '艺术传承'
];

// 扩展的随机灵感库
const RANDOM_INSPIRATIONS = [
  // 国潮风格
  '杨柳青风格的现代包装设计',
  '天津之眼与赛博朋克融合',
  '泥人张风格的3D角色建模',
  '海河夜景的国潮插画',
  '传统纹样的现代应用',
  '非遗元素的数字化表达',
  '京剧脸谱与国潮服饰结合',
  '青花瓷元素的现代UI设计',
  '中国龙元素的赛博朋克风格',
  '传统剪纸艺术的动态演绎',
  // 地域特色
  '天津狗不理包子的趣味插画',
  '十八街麻花的创意包装设计',
  '耳朵眼炸糕的品牌视觉设计',
  '古文化街的文化旅游海报',
  '五大道历史建筑的插画系列',
  '天津港的现代工业风格设计',
  // 非遗元素
  '风筝魏的传统工艺展示',
  '杨柳青年画的现代演绎',
  '泥人张彩塑的3D建模',
  '天津快板的文化传播设计',
  '评剧元素的艺术海报',
  // 科创思维
  'AI生成的传统山水画',
  '元宇宙中的非遗展示',
  '数字孪生天津城市景观',
  'VR体验天津传统文化',
  '区块链数字藏品设计',
  // 文创产品
  '天津特色冰箱贴设计',
  '传统纹样的手机壳设计',
  '非遗元素的帆布包图案',
  '天津地标的文创T恤',
  '文化主题的笔记本封面',
  // 节日庆典
  '春节主题的国潮海报',
  '元宵节的花灯设计',
  '端午节的龙舟插画',
  '中秋节的月饼包装',
  '传统婚礼的视觉设计'
];

// 提示词优化模板
const PROMPT_TEMPLATES = {
  style: [
    '采用{style}风格',
    '以{style}为主调',
    '融合{style}元素'
  ],
  color: [
    '使用{color}配色方案',
    '主色调为{color}',
    '搭配{color}色彩'
  ],
  element: [
    '融入{element}元素',
    '添加{element}细节',
    '以{element}为核心'
  ],
  mood: [
    '营造{mood}的氛围',
    '传达{mood}的情感',
    '展现{mood}的气质'
  ],
  technique: [
    '使用{technique}技法',
    '采用{technique}工艺',
    '运用{technique}表现'
  ]
};

const InspirationInput = memo(function InspirationInput({ 
  onGenerate, 
  onApply, 
  className = '',
  enableRandomInspiration = true,
  enablePromptOptimization = true,
  enableDesignWorkshopRedirect = true
}: InspirationInputProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceInputActive, setVoiceInputActive] = useState(false);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [realTimeSuggestions, setRealTimeSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionTimeout, setSuggestionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [showOptimizedPrompt, setShowOptimizedPrompt] = useState(false);
  const [creativeSuggestions, setCreativeSuggestions] = useState<CreativeSuggestion[]>([]);
  
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
    if (suggestionTimeout) {
      clearTimeout(suggestionTimeout);
    }

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
      }, 500);

      setSuggestionTimeout(timeout);
    } else {
      setRealTimeSuggestions([]);
    }

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
    setOptimizedPrompt('');
    setShowOptimizedPrompt(false);
    setCreativeSuggestions([]);
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

  // 随机灵感功能
  const handleRandomInspiration = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_INSPIRATIONS.length);
    const randomInspiration = RANDOM_INSPIRATIONS[randomIndex];
    
    // 随机选择1-3个相关标签
    const relevantTags = DEFAULT_TAGS
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1);
    
    setPrompt(randomInspiration);
    setSelectedTags(relevantTags);
    
    // 生成创意建议
    const suggestions = aiCreativeAssistantService.generateCreativeSuggestions(randomInspiration, 3);
    setCreativeSuggestions(suggestions);
    
    toast.success('随机灵感已生成！');
    
    // 自动优化提示词
    if (enablePromptOptimization) {
      optimizePrompt(randomInspiration, relevantTags);
    }
  }, [enablePromptOptimization]);

  // 优化提示词
  const optimizePrompt = useCallback((basePrompt: string, tags: string[]) => {
    const style = tags.find(t => t.includes('风格')) || '国潮';
    const color = tags.find(t => t.includes('配色')) || '传统中国色';
    const element = tags.find(t => t.includes('元素')) || '传统纹样';
    const mood = '文化底蕴与现代美感并存';
    const technique = '数字艺术';

    const templates = [
      `创作一个${basePrompt}，${PROMPT_TEMPLATES.style[0].replace('{style}', style)}，${PROMPT_TEMPLATES.color[0].replace('{color}', color)}，${PROMPT_TEMPLATES.element[0].replace('{element}', element)}，${PROMPT_TEMPLATES.mood[0].replace('{mood}', mood)}，${PROMPT_TEMPLATES.technique[0].replace('{technique}', technique)}，高清细节，专业品质`,
      `${basePrompt}设计，${PROMPT_TEMPLATES.style[1].replace('{style}', style)}，${PROMPT_TEMPLATES.color[1].replace('{color}', color)}，${PROMPT_TEMPLATES.element[1].replace('{element}', element)}，${PROMPT_TEMPLATES.mood[1].replace('{mood}', mood)}，${PROMPT_TEMPLATES.technique[1].replace('{technique}', technique)}，适合印刷和数字展示`,
      `以${basePrompt}为主题，${PROMPT_TEMPLATES.style[2].replace('{style}', style)}，${PROMPT_TEMPLATES.color[2].replace('{color}', color)}，${PROMPT_TEMPLATES.element[2].replace('{element}', element)}，${PROMPT_TEMPLATES.mood[2].replace('{mood}', mood)}，${PROMPT_TEMPLATES.technique[2].replace('{technique}', technique)}，具有商业应用价值`
    ];

    const optimized = templates[Math.floor(Math.random() * templates.length)];
    setOptimizedPrompt(optimized);
    setShowOptimizedPrompt(true);
    
    return optimized;
  }, []);

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

  // 跳转到设计工坊生成
  const handleGenerateInWorkshop = () => {
    const finalPrompt = prompt.trim() || optimizedPrompt;
    if (!finalPrompt && selectedTags.length === 0) {
      toast.warning('请输入提示词或选择标签');
      return;
    }

    // 保存当前输入到本地存储，以便设计工坊页面读取
    const workshopData = {
      prompt: finalPrompt,
      tags: selectedTags,
      timestamp: Date.now(),
      source: 'inspiration-input'
    };
    localStorage.setItem('workshopInspirationData', JSON.stringify(workshopData));

    // 跳转到设计工坊
    navigate('/create');
    toast.success('正在跳转到设计工坊...');
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

  // 应用优化后的提示词
  const handleApplyOptimizedPrompt = () => {
    if (optimizedPrompt) {
      setPrompt(optimizedPrompt);
      setShowOptimizedPrompt(false);
      toast.success('已应用优化后的提示词');
    }
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
            {/* 随机灵感按钮 */}
            {enableRandomInspiration && (
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRandomInspiration}
                className="p-2 rounded-full transition-all text-white/60 hover:bg-white/10 hover:text-yellow-300"
                aria-label="随机灵感"
                title="随机灵感"
                tabIndex={0}
              >
                <i className="fas fa-dice text-xl"></i>
              </motion.button>
            )}
            
            {/* 灵感加持按钮 */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const randomSuggestion = RANDOM_INSPIRATIONS[Math.floor(Math.random() * RANDOM_INSPIRATIONS.length)];
                setPrompt(randomSuggestion);
                toast.success('灵感加持成功');
              }}
              className="p-2 rounded-full transition-all text-white/60 hover:bg-white/10"
              aria-label="开启灵感加持"
              tabIndex={0}
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
              tabIndex={0}
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
              tabIndex={0}
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
            tabIndex={0}
          >
            <i className="fas fa-lightbulb text-xl"></i>
            {isGenerating ? '生成中...' : '灵感'}
          </motion.button>
          
          {enableDesignWorkshopRedirect ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateInWorkshop}
              className="h-16 px-8 rounded-2xl bg-white text-black hover:bg-gray-100 font-bold transition-all shadow-xl flex items-center gap-2"
              tabIndex={0}
            >
              <i className="fas fa-wand-magic-sparkles text-xl"></i>
              生成
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApply}
              className="h-16 px-8 rounded-2xl bg-white text-black hover:bg-gray-100 font-bold transition-all shadow-xl flex items-center gap-2"
              tabIndex={0}
            >
              <i className="fas fa-check text-xl"></i>
              应用
            </motion.button>
          )}
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

      {/* 优化后的提示词展示 */}
      <AnimatePresence>
        {showOptimizedPrompt && optimizedPrompt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <i className="fas fa-magic text-yellow-300"></i>
                优化后的提示词
              </h4>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApplyOptimizedPrompt}
                  className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                >
                  应用
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowOptimizedPrompt(false)}
                  className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full text-white/60 transition-colors"
                >
                  关闭
                </motion.button>
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{optimizedPrompt}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 创意建议展示 */}
      <AnimatePresence>
        {creativeSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {creativeSuggestions.map((suggestion) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-white/10 rounded-xl border border-white/10 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => handleApplySuggestion(suggestion.content)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white">
                    {suggestion.type === 'theme' && '主题'}
                    {suggestion.type === 'style' && '风格'}
                    {suggestion.type === 'color' && '色彩'}
                    {suggestion.type === 'element' && '元素'}
                    {suggestion.type === 'layout' && '布局'}
                    {suggestion.type === 'concept' && '概念'}
                  </span>
                  <span className="text-xs text-white/40">{suggestion.relevance}% 匹配</span>
                </div>
                <p className="text-sm text-white/90">{suggestion.content}</p>
                <p className="text-xs text-white/50 mt-1">{suggestion.description}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default InspirationInput;
