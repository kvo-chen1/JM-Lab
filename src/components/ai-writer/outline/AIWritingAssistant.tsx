import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import type { OutlineSection } from './types';
import {
  Sparkles,
  X,
  Send,
  RefreshCw,
  Copy,
  Check,
  Lightbulb,
  PenTool,
  AlignLeft,
  List,
  Type,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Wand2,
  Zap,
  Brain,
} from 'lucide-react';

interface AIWritingAssistantProps {
  section: OutlineSection;
  onApplyContent: (content: string) => void;
  onClose: () => void;
}

interface AIResponse {
  id: string;
  type: 'suggestion' | 'rewrite' | 'expand' | 'summarize' | 'outline';
  title: string;
  content: string;
  explanation: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const writingPrompts = [
  { icon: <Lightbulb className="w-4 h-4" />, label: '生成要点', prompt: '为这个章节生成5-7个关键要点' },
  { icon: <PenTool className="w-4 h-4" />, label: '润色优化', prompt: '优化这段内容的表达，使其更专业流畅' },
  { icon: <AlignLeft className="w-4 h-4" />, label: '扩写内容', prompt: '基于现有描述，扩写更详细的内容' },
  { icon: <List className="w-4 h-4" />, label: '生成大纲', prompt: '为这个章节生成详细的子章节大纲' },
  { icon: <Type className="w-4 h-4" />, label: '多种写法', prompt: '提供3种不同的写作角度和风格' },
  { icon: <MessageSquare className="w-4 h-4" />, label: '常见问题', prompt: '列出读者可能关心的5个问题' },
];

// 模拟AI响应
const generateMockResponse = (prompt: string, sectionName: string): AIResponse => {
  const responses: Record<string, AIResponse> = {
    '生成要点': {
      id: Date.now().toString(),
      type: 'suggestion',
      title: `${sectionName} - 关键要点`,
      content: `1. 明确${sectionName}的核心目标和预期成果\n2. 分析当前市场环境和竞争态势\n3. 识别关键成功因素和潜在风险\n4. 制定可量化的绩效指标\n5. 建立有效的执行和监控机制\n6. 确保资源的合理配置和利用\n7. 建立持续改进和优化的流程`,
      explanation: '基于章节主题生成的结构化要点，帮助您全面覆盖该主题的关键方面。',
    },
    '润色优化': {
      id: Date.now().toString(),
      type: 'rewrite',
      title: '优化后的表达',
      content: `【专业版】\n${sectionName}是整体战略框架中的关键环节，其有效性直接影响项目成败。本章节将系统阐述核心方法论，提供可落地的执行方案。\n\n【简洁版】\n本章节聚焦${sectionName}，提供实用指南和最佳实践。`,
      explanation: '提供了专业和简洁两个版本，适应不同的文档风格需求。',
    },
    '扩写内容': {
      id: Date.now().toString(),
      type: 'expand',
      title: '扩写建议',
      content: `在${sectionName}部分，建议从以下几个维度展开：\n\n**背景分析**\n详细描述当前面临的挑战和机遇，为后续内容奠定基础。\n\n**方法论**\n介绍采用的理论框架和实践方法，说明选择的理由。\n\n**实施步骤**\n列出具体的执行步骤，包括时间节点和责任人。\n\n**预期成果**\n明确可衡量的目标和成功标准。\n\n**风险管控**\n识别潜在风险并提出应对措施。`,
      explanation: '将简单描述扩展为结构化的详细内容框架。',
    },
    '生成大纲': {
      id: Date.now().toString(),
      type: 'outline',
      title: '子章节建议',
      content: `建议将"${sectionName}"细分为以下子章节：\n\n1.1 ${sectionName}背景与意义\n1.2 现状分析与问题识别\n1.3 目标设定与指标体系\n1.4 策略制定与方案选择\n1.5 实施路径与里程碑\n1.6 资源需求与配置\n1.7 风险评估与应对`,
      explanation: '基于主题深度分析，建议的7个子章节结构。',
    },
    '多种写法': {
      id: Date.now().toString(),
      type: 'rewrite',
      title: '多种写作风格',
      content: `【学术风格】\n本研究从理论层面系统探讨了${sectionName}的内在机制，构建了完整的分析框架。\n\n【商业风格】\n${sectionName}是提升竞争力的关键抓手，本方案提供可落地的执行策略。\n\n【故事风格】\n让我们从一个真实的案例开始，看看${sectionName}如何在实践中发挥作用...`,
      explanation: '三种不同风格，分别适合学术报告、商业计划和故事化叙述。',
    },
    '常见问题': {
      id: Date.now().toString(),
      type: 'suggestion',
      title: '读者可能关心的问题',
      content: `1. 为什么${sectionName}对项目成功至关重要？\n2. 实施${sectionName}需要哪些前提条件？\n3. 如何衡量${sectionName}的成效？\n4. 常见的实施误区有哪些？\n5. 如何根据具体情况调整${sectionName}策略？`,
      explanation: '预判读者疑问，帮助您提前准备解答内容。',
    },
  };

  // 找到匹配的响应
  const matchedKey = Object.keys(responses).find(key => prompt.includes(key));
  return matchedKey ? responses[matchedKey] : {
    id: Date.now().toString(),
    type: 'suggestion',
    title: 'AI建议',
    content: `基于"${sectionName}"的主题，建议：\n\n1. 明确核心论点，确保逻辑清晰\n2. 使用数据和案例支撑观点\n3. 考虑不同读者的需求层次\n4. 保持内容的专业性和可读性平衡\n5. 添加具体的行动建议和下一步计划`,
    explanation: '通用写作建议，适用于大多数商业文档场景。',
  };
};

export const AIWritingAssistant: React.FC<AIWritingAssistantProps> = ({
  section,
  onApplyContent,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'quick' | 'chat'>('quick');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);

  const handleQuickPrompt = useCallback(async (prompt: string) => {
    setIsLoading(true);
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const response = generateMockResponse(prompt, section.name);
    setResponses(prev => [response, ...prev]);
    setExpandedResponse(response.id);
    setIsLoading(false);
    
    toast.success('AI建议已生成');
  }, [section.name]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // 模拟AI响应
    await new Promise(resolve => setTimeout(resolve, 2000));

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `关于"${section.name}"，我建议：\n\n1. 从用户痛点出发，建立情感共鸣\n2. 使用具体数据和案例增强说服力\n3. 结构清晰，层次分明\n4. 结尾要有明确的行动号召\n\n需要我针对某个具体点详细展开吗？`,
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  }, [inputMessage, section.name]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (content: string) => {
    onApplyContent(content);
    toast.success('内容已应用');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`fixed right-0 top-0 bottom-0 w-[450px] border-l shadow-2xl z-[150] flex flex-col ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* 头部 */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500`}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI写作助手
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              为 "{section.name}" 提供智能建议
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab 切换 */}
      <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('quick')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'quick'
              ? isDark
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-purple-600 border-b-2 border-purple-600'
              : isDark
              ? 'text-gray-400 hover:text-gray-300'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" />
          快速提示
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? isDark
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-purple-600 border-b-2 border-purple-600'
              : isDark
              ? 'text-gray-400 hover:text-gray-300'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Brain className="w-4 h-4" />
          智能对话
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'quick' ? (
          <div className="h-full flex flex-col">
            {/* 快捷提示按钮 */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                选择需要的帮助类型
              </p>
              <div className="grid grid-cols-2 gap-2">
                {writingPrompts.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(item.prompt)}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-50'
                    }`}
                  >
                    <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 响应列表 */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {isLoading && responses.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent mb-4"
                  />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    AI正在思考中...
                  </p>
                </div>
              )}

              {responses.map((response) => (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border overflow-hidden ${
                    isDark
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => setExpandedResponse(
                      expandedResponse === response.id ? null : response.id
                    )}
                    className={`w-full flex items-center justify-between p-4 ${
                      isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                      }`}>
                        <Wand2 className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {response.title}
                        </h4>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {response.explanation}
                        </p>
                      </div>
                    </div>
                    {expandedResponse === response.id ? (
                      <ChevronUp className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedResponse === response.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <pre className={`text-sm whitespace-pre-wrap font-sans mb-4 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {response.content}
                          </pre>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApply(response.content)}
                              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                            >
                              应用内容
                            </button>
                            <button
                              onClick={() => handleCopy(response.content, response.id)}
                              className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                                isDark
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {copiedId === response.id ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  已复制
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  复制
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {responses.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <Sparkles className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    点击上方按钮获取AI写作建议
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 对话模式 */
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <Brain className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    向AI助手提问，获取个性化写作建议
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      '如何优化这个章节的结构？',
                      '请帮我检查逻辑是否通顺',
                      '这个描述是否足够清晰？',
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(suggestion)}
                        className={`block w-full px-4 py-2 rounded-lg text-sm text-left transition-colors ${
                          isDark
                            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white rounded-2xl rounded-tr-sm'
                        : isDark
                        ? 'bg-gray-800 text-gray-200 rounded-2xl rounded-tl-sm'
                        : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                    } px-4 py-3`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-purple-200' : isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-purple-500"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-purple-500"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 输入框 */}
            <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入您的问题..."
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm border ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AIWritingAssistant;
