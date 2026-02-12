import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wand2,
  Lightbulb,
  MessageSquare,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface AIAssistantPanelProps {
  formData: {
    title: string;
    description: string;
    tags: string[];
    files: File[];
  };
  eventTitle?: string;
  onSuggestionApply?: (field: string, value: string) => void;
}

interface Suggestion {
  id: string;
  type: 'title' | 'description' | 'tags' | 'general';
  title: string;
  content: string;
  reason: string;
  applied: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Suggestion[];
}

// 模拟AI分析函数
const analyzeContent = (formData: AIAssistantPanelProps['formData'], eventTitle?: string): Suggestion[] => {
  const suggestions: Suggestion[] = [];

  // 标题分析
  if (formData.title) {
    if (formData.title.length < 10) {
      suggestions.push({
        id: 'title-1',
        type: 'title',
        title: '标题可以更有吸引力',
        content: `${formData.title} - 融合传统与现代的创意设计`,
        reason: '当前标题较短，建议增加描述性词汇以吸引更多关注',
        applied: false
      });
    }
    if (!formData.title.includes('2024') && !formData.title.includes('2025')) {
      suggestions.push({
        id: 'title-2',
        type: 'title',
        title: '添加时间元素',
        content: `【2024】${formData.title}`,
        reason: '添加年份可以增加时效性和专业感',
        applied: false
      });
    }
  }

  // 描述分析
  if (formData.description) {
    if (formData.description.length < 50) {
      suggestions.push({
        id: 'desc-1',
        type: 'description',
        title: '描述可以更加详细',
        content: `${formData.description}\n\n创作理念：\n本作品灵感来源于中国传统文化，通过现代设计手法重新诠释传统元素。在色彩运用上，采用了具有东方韵味的配色方案；在构图上，借鉴了传统绘画的留白艺术。`,
        reason: '详细的描述可以帮助评委和观众更好地理解你的创作思路',
        applied: false
      });
    }
    if (!formData.description.includes('灵感') && !formData.description.includes('创作')) {
      suggestions.push({
        id: 'desc-2',
        type: 'description',
        title: '添加创作背景',
        content: `${formData.description}\n\n创作背景：\n这件作品的诞生源于对传统文化的深入思考。希望通过现代设计语言，让更多年轻人了解和喜爱中国传统美学。`,
        reason: '分享创作故事可以增加作品的感染力和记忆点',
        applied: false
      });
    }
  } else {
    suggestions.push({
      id: 'desc-3',
      type: 'description',
      title: '建议添加作品描述',
      content: '作品描述是展示你创作思路的重要窗口。建议从以下几个方面展开：\n1. 创作灵感来源\n2. 设计理念和思路\n3. 使用的技法和工具\n4. 想要传达的情感或信息',
      reason: '没有描述的作品难以让评委和观众理解你的创作意图',
      applied: false
    });
  }

  // 标签分析
  if (formData.tags.length < 3) {
    suggestions.push({
      id: 'tags-1',
      type: 'tags',
      title: '建议添加更多标签',
      content: '国潮、传统纹样、创新设计、视觉艺术、文化传承',
      reason: '更多相关标签可以增加作品的曝光率和被发现的机会',
      applied: false
    });
  }

  // 文件分析
  if (formData.files.length === 0) {
    suggestions.push({
      id: 'files-1',
      type: 'general',
      title: '请上传作品文件',
      content: '建议上传高清图片或视频来展示你的作品。可以包含：\n- 作品主图\n- 细节特写\n- 创作过程\n- 应用场景展示',
      reason: '视觉内容是作品展示的核心',
      applied: false
    });
  }

  return suggestions;
};

export function AIAssistantPanel({ formData, eventTitle, onSuggestionApply }: AIAssistantPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是你的AI创作助手。我可以帮你优化作品提交，提供创作建议。点击"获取建议"开始分析你的作品吧！'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions');

  // 获取AI建议
  const handleGetSuggestions = useCallback(async () => {
    setIsAnalyzing(true);
    
    // 模拟AI分析延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newSuggestions = analyzeContent(formData, eventTitle);
    setSuggestions(newSuggestions);
    
    if (newSuggestions.length > 0) {
      toast.success(`发现 ${newSuggestions.length} 条优化建议`);
    } else {
      toast.success('你的作品已经很完善了！');
    }
    
    setIsAnalyzing(false);
  }, [formData, eventTitle]);

  // 应用建议
  const handleApplySuggestion = useCallback((suggestion: Suggestion) => {
    if (onSuggestionApply) {
      onSuggestionApply(suggestion.type, suggestion.content);
    }
    
    setSuggestions(prev => 
      prev.map(s => s.id === suggestion.id ? { ...s, applied: true } : s)
    );
    
    toast.success('建议已应用');
  }, [onSuggestionApply]);

  // 发送消息
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // 模拟AI回复
    await new Promise(resolve => setTimeout(resolve, 1000));

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '我理解你的问题。基于你的作品，我建议你可以考虑增加更多文化元素的解读，这样能让作品更有深度和故事性。'
    };

    setMessages(prev => [...prev, assistantMessage]);
  }, [inputMessage]);

  // 评分分析
  const getScoreAnalysis = () => {
    let score = 0;
    const items = [
      { check: formData.title.length >= 10, points: 20, label: '标题完整性' },
      { check: formData.description.length >= 100, points: 25, label: '描述详细度' },
      { check: formData.tags.length >= 3, points: 15, label: '标签数量' },
      { check: formData.files.length > 0, points: 30, label: '文件上传' },
      { check: formData.description.includes('灵感') || formData.description.includes('创作'), points: 10, label: '创作故事' }
    ];

    items.forEach(item => {
      if (item.check) score += item.points;
    });

    return { score, items };
  };

  const { score, items } = getScoreAnalysis();

  return (
    <>
      {/* 悬浮按钮 */}
      <motion.button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-24 right-6 z-40 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* 展开面板 */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* 面板 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 right-6 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {/* 头部 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Wand2 className="w-5 h-5" />
                    <span className="font-semibold">AI创作助手</span>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 标签切换 */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'suggestions'
                      ? 'text-purple-500 border-b-2 border-purple-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Lightbulb className="w-4 h-4" />
                    优化建议
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'text-purple-500 border-b-2 border-purple-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    智能对话
                  </div>
                </button>
              </div>

              {/* 内容区域 */}
              <div className="h-96 overflow-y-auto p-4">
                {activeTab === 'suggestions' ? (
                  <div className="space-y-4">
                    {/* 评分卡片 */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">作品完整度</span>
                        <span className="text-2xl font-bold text-purple-500">{score}分</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-xs">
                            {item.check ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                            )}
                            <span className={item.check ? 'text-emerald-600' : 'text-amber-600'}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 获取建议按钮 */}
                    <button
                      onClick={handleGetSuggestions}
                      disabled={isAnalyzing}
                      className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          AI分析中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          获取AI建议
                        </>
                      )}
                    </button>

                    {/* 建议列表 */}
                    {suggestions.length > 0 && (
                      <div className="space-y-3">
                        {suggestions.map((suggestion) => (
                          <motion.div
                            key={suggestion.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              suggestion.applied
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                suggestion.type === 'title' ? 'bg-blue-100 text-blue-600' :
                                suggestion.type === 'description' ? 'bg-green-100 text-green-600' :
                                suggestion.type === 'tags' ? 'bg-purple-100 text-purple-600' :
                                'bg-amber-100 text-amber-600'
                              }`}>
                                {suggestion.type === 'title' && <Target className="w-4 h-4" />}
                                {suggestion.type === 'description' && <TrendingUp className="w-4 h-4" />}
                                {suggestion.type === 'tags' && <Zap className="w-4 h-4" />}
                                {suggestion.type === 'general' && <Lightbulb className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                  {suggestion.title}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
                                {!suggestion.applied && suggestion.type !== 'general' && (
                                  <button
                                    onClick={() => handleApplySuggestion(suggestion)}
                                    className="mt-2 text-xs text-purple-500 hover:text-purple-600 font-medium"
                                  >
                                    应用建议 →
                                  </button>
                                )}
                                {suggestion.applied && (
                                  <span className="mt-2 text-xs text-emerald-500 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    已应用
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 对话界面 */
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            message.role === 'user'
                              ? 'bg-purple-500 text-white rounded-br-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-bl-md'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 输入框（仅在对话标签显示） */}
              {activeTab === 'chat' && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="输入你的问题..."
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
