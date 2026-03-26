import React, { useState, useEffect } from 'react';
import { User, Bot, Wand2, Brain, Zap, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, HelpCircle, MessageSquare, CheckSquare, ListTodo, Star, Sparkles, FileText } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ChatMessage as ChatMessageType, SkillCallInfo, RequirementPhase, MerchandiseCategory } from '../types';
import { getIntentDisplayName, getIntentColor } from '../services/intentService';
import { MerchandiseTypeCollector } from './MerchandiseTypeCollector';
import { ThinkingProcessPanel } from './ThinkingProcessPanel';
import AIFeedbackModal from '@/components/Feedback/AIFeedbackModal';

// 获取当前用户头像
const getCurrentUserAvatar = (): string => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.avatar_url || user.avatar || '';
    }
  } catch {
    // 忽略解析错误
  }
  return '';
};

interface ChatMessageProps {
  message: ChatMessageType;
  isLast?: boolean;
  onSendMessage?: (content: string) => void;
}

const SkillStatusIcon: React.FC<{ status: SkillCallInfo['status'] }> = ({ status }) => {
  switch (status) {
    case 'thinking':
      return <Brain className="w-4 h-4 text-blue-500 animate-pulse" />;
    case 'recognizing':
      return <Brain className="w-4 h-4 text-purple-500" />;
    case 'calling':
      return <Zap className="w-4 h-4 text-yellow-500" />;
    case 'executing':
      return <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
};

const PhaseIcon: React.FC<{ phase?: RequirementPhase }> = ({ phase }) => {
  switch (phase) {
    case 'analyzing':
      return <Brain className="w-4 h-4 text-purple-500" />;
    case 'collecting':
      return <HelpCircle className="w-4 h-4 text-blue-500" />;
    case 'confirming':
      return <CheckSquare className="w-4 h-4 text-green-500" />;
    case 'executing':
      return <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <MessageSquare className="w-4 h-4 text-gray-400" />;
  }
};

const PhaseLabel: React.FC<{ phase?: RequirementPhase }> = ({ phase }) => {
  const labels: Record<string, string> = {
    analyzing: '需求分析',
    collecting: '信息收集',
    confirming: '确认信息',
    executing: '执行中',
    completed: '已完成',
    error: '出错',
  };
  return <span>{phase ? labels[phase] || phase : ''}</span>;
};

/**
 * 子步骤可视化组件
 * 用于展示批量生成时的子步骤进度
 */
interface SubStepVisualizerProps {
  steps: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
  }>;
  currentStepName?: string;
}

const SubStepVisualizer: React.FC<SubStepVisualizerProps> = ({ steps, currentStepName }) => {
  const { isDark } = useTheme();
  
  if (!steps || steps.length === 0) return null;
  
  return (
    <div className={`mt-3 p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isRunning = step.status === 'running';
          const isPending = step.status === 'pending';
          
          return (
            <div 
              key={index}
              className={`flex items-center gap-3 transition-all duration-300 ${
                isRunning ? 'opacity-100' : isCompleted ? 'opacity-80' : 'opacity-50'
              }`}
            >
              {/* 状态图标 */}
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCompleted 
                  ? 'bg-green-500' 
                  : isRunning 
                    ? 'bg-blue-500 animate-pulse' 
                    : isDark ? 'bg-gray-600' : 'bg-gray-300'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3 text-white" />
                ) : isRunning ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-500'}`} />
                )}
              </div>
              
              {/* 步骤名称 */}
              <span className={`text-sm ${
                isRunning 
                  ? isDark ? 'text-blue-400 font-medium' : 'text-blue-600 font-medium'
                  : isCompleted 
                    ? isDark ? 'text-gray-300' : 'text-gray-600'
                    : isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {step.name}
                {isRunning && (
                  <span className="ml-1 animate-pulse">...</span>
                )}
              </span>
              
              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div className={`absolute left-2.5 top-5 w-0.5 h-6 ${
                  isCompleted 
                    ? 'bg-green-500' 
                    : isDark ? 'bg-gray-600' : 'bg-gray-300'
                }`} style={{ transform: 'translateX(-50%)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 根据意图类型获取开始按钮文字
 */
const getStartButtonText = (intent: string | undefined): string => {
  if (!intent) return '开始生成';

  const buttonTexts: Record<string, string> = {
    'text-generation': '开始撰写',
    'brand-copy': '开始撰写',
    'marketing-copy': '开始撰写',
    'social-copy': '开始撰写',
    'video-script': '开始撰写',
    'image-generation': '开始生成',
    'logo-design': '开始设计',
    'poster-design': '开始设计',
    'color-scheme': '开始生成',
    'ui-design': '开始设计',
    'batch-generation': '开始批量生成',
    'image-editing': '开始编辑',
    'image-beautification': '开始美化',
    'image-style-transfer': '开始转换',
    'creative-idea': '开始创意',
    'event-planning': '开始策划',
    'data-report': '开始分析',
    'web-search': '开始搜索',
    'general': '开始',
    'greeting': '开始',
    'help': '开始',
  };

  return buttonTexts[intent] || '开始生成';
};

/**
 * 进度条组件
 * 用于展示任务进度
 */
const ProgressBar: React.FC<{ progress: number; label?: string; isDark?: boolean }> = ({ 
  progress, 
  label, 
  isDark = false 
}) => (
  <div className="w-full">
    {label && (
      <div className={`text-xs mb-1.5 flex justify-between ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <span>{label}</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
    )}
    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

/**
 * 带取消按钮的加载状态组件
 */
interface LoadingWithCancelProps {
  message: string;
  onCancel?: () => void;
  progress?: number;
  isDark?: boolean;
  subMessage?: string;
}

const LoadingWithCancel: React.FC<LoadingWithCancelProps> = ({ 
  message, 
  onCancel, 
  progress, 
  isDark = false,
  subMessage
}) => (
  <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="relative">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
      </div>
      <div className="flex-1">
        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          {message}
        </span>
        {subMessage && (
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {subMessage}
          </p>
        )}
      </div>
      {onCancel && (
        <button 
          onClick={onCancel}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            isDark 
              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50' 
              : 'border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300'
          }`}
        >
          取消
        </button>
      )}
    </div>
    {progress !== undefined && (
      <ProgressBar progress={progress} isDark={isDark} />
    )}
  </div>
);

/**
 * 按字段分组展示建议回复
 * 修复：将建议按字段分组，并添加字段标签和图标
 */
interface GroupedSuggestionsProps {
  suggestions: string[];
  onSelect?: (content: string) => void;
  isDark: boolean;
}

const GroupedSuggestions: React.FC<GroupedSuggestionsProps> = ({ suggestions, onSelect, isDark }) => {
  // 按字段分组
  const grouped = React.useMemo(() => {
    const groups: Record<string, string[]> = {};
    
    suggestions.forEach(suggestion => {
      // 解析建议格式："💡 字段名：具体示例"
      const match = suggestion.match(/^([💡📦🎨📝✨👥📌🎯🏢])\s*([^：:]+)[：:](.+)$/);
      
      if (match) {
        const [, emoji, fieldName, example] = match;
        const key = `${emoji} ${fieldName}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(example.trim());
      } else {
        // 无法解析的建议，放入"其他"分组
        if (!groups['其他']) {
          groups['其他'] = [];
        }
        groups['其他'].push(suggestion);
      }
    });
    
    return groups;
  }, [suggestions]);

  // 点击状态（用于动画效果）
  const [clickedButton, setClickedButton] = React.useState<string | null>(null);

  // 处理点击事件（带动画效果）
  const handleClick = (fullText: string, displayText: string) => {
    setClickedButton(displayText);
    
    // 300ms 后清除点击状态
    setTimeout(() => {
      setClickedButton(null);
    }, 300);
    
    // 调用 onSelect
    onSelect?.(fullText);
  };

  // 如果没有分组，直接展示所有建议
  if (Object.keys(grouped).length === 0) {
    return (
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleClick(suggestion, suggestion)}
            disabled={!onSelect}
            className={`text-xs px-2 py-1 rounded-full border transition-all duration-200 ${
              clickedButton === suggestion
                ? 'scale-95 opacity-70'
                : ''
            } ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            } ${!onSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([fieldLabel, examples]) => (
        <div key={fieldLabel} className="flex flex-wrap items-start gap-2">
          <span className={`text-xs font-medium whitespace-nowrap mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {fieldLabel}:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {examples.map((example, index) => {
              const fullText = `${fieldLabel}：${example}`;
              const isClicked = clickedButton === example;
              
              return (
                <button
                  key={index}
                  onClick={() => handleClick(fullText, example)}
                  disabled={!onSelect}
                  className={`text-xs px-2 py-1 rounded-full border transition-all duration-200 ${
                    isClicked
                      ? 'scale-95 opacity-70 shadow-inner'
                      : 'hover:shadow-sm'
                  } ${
                    isDark
                      ? 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  } ${!onSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={`点击发送：${fullText}`}
                >
                  {example}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const SkillCallCard: React.FC<{ 
  skillCall: SkillCallInfo;
  onSendMessage?: (content: string) => void;
}> = ({ skillCall, onSendMessage }) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMerchandiseIds, setSelectedMerchandiseIds] = useState<string[]>([]);
  
  // 处理周边类型确认
  const handleConfirmMerchandise = () => {
    if (!skillCall.merchandiseSelection || selectedMerchandiseIds.length === 0) return;
    
    const selectedNames = skillCall.merchandiseSelection.categories
      .filter(c => selectedMerchandiseIds.includes(c.id))
      .map(c => c.name)
      .join('、');
    
    if (onSendMessage) {
      onSendMessage(`我选择了周边类型：${selectedNames}`);
    }
  };
  
  const statusText = {
    thinking: '正在思考...',
    recognizing: '识别意图中...',
    calling: '准备调用技能...',
    executing: '执行中...',
    completed: '执行完成',
    error: '执行出错',
  };

  const phaseColors = {
    analyzing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    collecting: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    confirming: 'bg-green-500/10 text-green-500 border-green-500/20',
    executing: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const hasRequirementInfo = skillCall.collectedInfo || skillCall.missingFields || skillCall.progress;

  return (
    <div className={`mt-3 rounded-xl border overflow-hidden ${
      isDark 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-white/50 border-gray-200'
    }`}>
      {/* 头部 - 始终显示 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-3 py-2.5 flex items-center justify-between transition-colors ${
          isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <PhaseIcon phase={skillCall.phase} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            <PhaseLabel phase={skillCall.phase} />
          </span>
          {skillCall.intent !== 'analyzing' && skillCall.intent !== 'error' && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>
              {getIntentDisplayName(skillCall.intent as any)}
            </span>
          )}
          {/* 进度指示 */}
          {skillCall.progress && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              {skillCall.progress.current}/{skillCall.progress.total}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        )}
      </button>
      
      {/* 详细信息 - 展开时显示 */}
      {isExpanded && (
        <div className={`px-3 pb-3 pt-1 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="space-y-2 text-sm">
            {/* 意图 */}
            {skillCall.intent !== 'analyzing' && (
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-purple-500" />
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>意图:</span>
                <span className={`font-medium bg-gradient-to-r ${getIntentColor(skillCall.intent as any)} bg-clip-text text-transparent`}>
                  {getIntentDisplayName(skillCall.intent as any)}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  {(skillCall.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
            
            {/* 技能 */}
            <div className="flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-blue-500" />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>技能:</span>
              <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {skillCall.skillName}
              </span>
            </div>
            
            {/* 已收集信息 */}
            {skillCall.collectedInfo && Object.keys(skillCall.collectedInfo).length > 0 && (
              <div className={`mt-3 p-2 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                <div className={`flex items-center gap-1.5 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">已收集信息</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(skillCall.collectedInfo).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-xs">
                      <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} min-w-[60px]`}>{key}:</span>
                      <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} break-all`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 缺失信息 */}
            {skillCall.missingFields && skillCall.missingFields.length > 0 && (
              <div className={`mt-3 p-2 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <div className={`flex items-center gap-1.5 mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  <ListTodo className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">待收集信息</span>
                </div>
                <div className="space-y-1">
                  {skillCall.missingFields.map((field) => (
                    <div key={field.key} className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{field.label}</span>
                      {field.required && (
                        <span className={`text-[10px] px-1 rounded ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                          必填
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 建议回复 - 按字段分组展示 */}
            {skillCall.suggestions && skillCall.suggestions.length > 0 && (
              <div className="mt-3">
                <div className={`text-xs mb-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  💡 建议回复（点击可直接使用）：
                </div>
                <GroupedSuggestions
                  suggestions={skillCall.suggestions}
                  onSelect={onSendMessage}
                  isDark={isDark}
                />
              </div>
            )}

            {/* 确认信息阶段的开始按钮 */}
            {skillCall.phase === 'confirming' && skillCall.intent && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => onSendMessage?.(getStartButtonText(skillCall.intent))}
                    className={`px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2 ${
                      isDark ? 'from-blue-600 to-blue-700' : ''
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {getStartButtonText(skillCall.intent)}
                  </button>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    或继续补充信息
                  </span>
                </div>
              </div>
            )}
            
            {/* 进度条 */}
            {skillCall.progress && skillCall.progress.total > 0 && (
              <div className="mt-3">
                <div className={`flex items-center justify-between text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>收集进度</span>
                  <span>{Math.round((skillCall.progress.current / skillCall.progress.total) * 100)}%</span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${(skillCall.progress.current / skillCall.progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* 参数 */}
            {skillCall.params && Object.keys(skillCall.params).length > 0 && (
              <div className={`mt-2 p-2 rounded-lg text-xs font-mono ${
                isDark ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-600'
              }`}>
                <div className={`mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>参数:</div>
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(skillCall.params, null, 2)}
                </pre>
              </div>
            )}
            
            {/* 错误信息 */}
            {skillCall.error && (
              <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                <div className="font-medium mb-1">错误:</div>
                {skillCall.error}
              </div>
            )}
            
            {/* 周边类型选择器 */}
            {skillCall.merchandiseSelection && skillCall.phase === 'collecting' && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <MerchandiseTypeCollector
                  categories={skillCall.merchandiseSelection.categories}
                  selectedIds={selectedMerchandiseIds}
                  onSelect={(ids) => setSelectedMerchandiseIds(ids)}
                />
                
                {/* 快捷操作按钮 */}
                {selectedMerchandiseIds.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={handleConfirmMerchandise}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      确认选择（{selectedMerchandiseIds.length}个）
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSendMessage?.('帮我推荐合适的周边类型')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border-2 ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-purple-500/50'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-purple-500/50'
                        }`}
                      >
                        💡 帮我推荐
                      </button>
                      <button
                        onClick={() => onSendMessage?.('我想了解更多关于周边类型的信息')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border-2 ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-purple-500/50'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-purple-500/50'
                        }`}
                      >
                        ℹ️ 了解更多
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast, onSendMessage }) => {
  const { isDark } = useTheme();
  const isUser = message.role === 'user';
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // 获取当前用户头像
  useEffect(() => {
    const avatar = getCurrentUserAvatar();
    setUserAvatar(avatar);
  }, []);
  
  // 格式化内容，支持完整的 Markdown 样式
  const formatContent = (content: string) => {
    if (!content) return null;

    // 按行分割内容
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const key = `line-${currentIndex++}`;

      // 处理代码块
      if (line.startsWith('```')) {
        const codeBlockEnd = lines.findIndex((l, idx) => idx > i && l.startsWith('```'));
        if (codeBlockEnd !== -1) {
          const codeLines = lines.slice(i + 1, codeBlockEnd);
          const code = codeLines.join('\n');
          elements.push(
            <pre
              key={key}
              className={`my-2 p-3 rounded-lg overflow-x-auto text-xs font-mono ${
                isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <code>{code}</code>
            </pre>
          );
          i = codeBlockEnd;
          continue;
        }
      }

      // 处理标题
      const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const headerClasses = {
          1: 'text-xl font-bold my-3',
          2: 'text-lg font-semibold my-2.5',
          3: 'text-base font-semibold my-2',
          4: 'text-sm font-medium my-1.5',
        };
        const HeaderTag = `h${level}` as keyof JSX.IntrinsicElements;
        elements.push(
          <HeaderTag
            key={key}
            className={`${headerClasses[level as keyof typeof headerClasses]} ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            {formatInlineStyles(text)}
          </HeaderTag>
        );
        continue;
      }

      // 处理无序列表
      const unorderedListMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
      if (unorderedListMatch) {
        const indent = unorderedListMatch[1].length;
        const text = unorderedListMatch[2];
        elements.push(
          <div
            key={key}
            className={`flex items-start gap-2 my-1 ${indent > 0 ? 'ml-4' : ''}`}
          >
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isDark ? 'bg-purple-400' : 'bg-purple-500'
            }`} />
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {formatInlineStyles(text)}
            </span>
          </div>
        );
        continue;
      }

      // 处理有序列表
      const orderedListMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
      if (orderedListMatch) {
        const indent = orderedListMatch[1].length;
        const num = orderedListMatch[2];
        const text = orderedListMatch[3];
        elements.push(
          <div
            key={key}
            className={`flex items-start gap-2 my-1 ${indent > 0 ? 'ml-4' : ''}`}
          >
            <span className={`text-sm font-medium flex-shrink-0 min-w-[1.5rem] ${
              isDark ? 'text-purple-400' : 'text-purple-500'
            }`}>
              {num}.
            </span>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {formatInlineStyles(text)}
            </span>
          </div>
        );
        continue;
      }

      // 处理引用块
      if (line.startsWith('>')) {
        const quoteText = line.slice(1).trim();
        elements.push(
          <blockquote
            key={key}
            className={`my-2 pl-3 border-l-2 italic ${
              isDark 
                ? 'border-purple-500/50 text-gray-400' 
                : 'border-purple-400 text-gray-500'
            }`}
          >
            <span className="text-sm">{formatInlineStyles(quoteText)}</span>
          </blockquote>
        );
        continue;
      }

      // 处理分隔线
      if (/^---+$|^\*\*\*+$|^___+$/.test(line.trim())) {
        elements.push(
          <hr
            key={key}
            className={`my-3 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          />
        );
        continue;
      }

      // 处理普通段落（非空行）
      if (line.trim()) {
        elements.push(
          <p
            key={key}
            className={`my-1.5 text-sm leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {formatInlineStyles(line)}
          </p>
        );
      } else {
        // 空行添加间距
        elements.push(<div key={key} className="h-2" />);
      }
    }

    return elements;
  };

  // 处理行内样式（粗体、斜体、行内代码、链接）
  const formatInlineStyles = (text: string): React.ReactNode => {
    if (!text) return text;

    // 处理链接 [text](url)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(formatBoldAndItalic(text.slice(lastIndex, match.index)));
      }
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline hover:opacity-80 ${
            isDark ? 'text-purple-400' : 'text-purple-600'
          }`}
        >
          {match[1]}
        </a>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(formatBoldAndItalic(text.slice(lastIndex)));
    }

    return parts.length > 0 ? parts : formatBoldAndItalic(text);
  };

  // 处理粗体和斜体
  const formatBoldAndItalic = (text: string): React.ReactNode => {
    // 处理粗体 **text**
    const boldPattern = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = boldPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(formatItalicAndCode(text.slice(lastIndex, match.index)));
      }
      parts.push(
        <strong
          key={`bold-${match.index}`}
          className={isDark ? 'text-gray-100 font-semibold' : 'text-gray-900 font-semibold'}
        >
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(formatItalicAndCode(text.slice(lastIndex)));
    }

    return parts.length > 0 ? parts : formatItalicAndCode(text);
  };

  // 处理斜体和行内代码
  const formatItalicAndCode = (text: string): React.ReactNode => {
    // 处理斜体 *text* 或 _text_
    const italicPattern = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|_([^_]+)_/g;
    // 处理行内代码 `code`
    const codePattern = /`([^`]+)`/g;

    // 先处理代码，再处理斜体
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codePattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(formatItalicOnly(beforeText));
      }
      parts.push(
        <code
          key={`code-${match.index}`}
          className={`px-1.5 py-0.5 rounded text-xs font-mono ${
            isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {match[1]}
        </code>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(formatItalicOnly(text.slice(lastIndex)));
    }

    return parts.length > 0 ? parts : formatItalicOnly(text);
  };

  // 仅处理斜体
  const formatItalicOnly = (text: string): React.ReactNode => {
    const italicPattern = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|_([^_]+)_/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = italicPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <em
          key={`italic-${match.index}`}
          className={`italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
        >
          {match[1] || match[2]}
        </em>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {isUser && userAvatar ? (
        // 使用真实用户头像
        <img
          src={userAvatar}
          alt="用户头像"
          className="flex-shrink-0 w-9 h-9 rounded-xl object-cover shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20"
        />
      ) : (
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30' 
            : 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/30'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>
      )}
      
      {/* Message Content */}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 消息气泡 */}
        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
          isUser 
            ? `bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md shadow-blue-500/20` 
            : isDark
              ? 'bg-gray-800 text-gray-100 rounded-bl-md border border-gray-700'
              : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
        }`}>
          <div className="leading-relaxed">
            {formatContent(message.content)}
          </div>
        </div>

        {/* Thinking Process Panel */}
        {!isUser && message.skillCall && (
          <ThinkingProcessPanel
            steps={message.skillCall.thinkingSteps}
            analysisDetails={message.skillCall.analysisDetails}
            isProcessing={message.skillCall.status === 'thinking' || message.skillCall.status === 'recognizing'}
          />
        )}

        {/* Skill Call Info */}
        {!isUser && message.skillCall && (
          <SkillCallCard
            skillCall={message.skillCall}
            onSendMessage={onSendMessage}
          />
        )}
        
        {/* Attachments - 支持用户和 agent 消息 */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 space-y-3">
            {message.attachments.map((attachment, index) => (
              <div 
                key={`${attachment.id || index}`} 
                className="animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                {attachment.type === 'image' && attachment.url && (
                  <div className={`rounded-xl overflow-hidden border shadow-lg transition-all hover:shadow-xl ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    {/* 新生成标记 */}
                    {attachment.status === 'completed' && (
                      <div className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-medium ${
                        isDark 
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-500 text-white'
                      }`}>
                        ✓ 完成
                      </div>
                    )}
                    {!imageLoaded[index] && (
                      <div className={`w-full h-32 flex items-center justify-center ${
                        isDark ? 'bg-gray-800' : 'bg-gray-100'
                      }`}>
                        <Loader2 className={`w-6 h-6 animate-spin ${
                          isDark ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                      </div>
                    )}
                    <img 
                      src={attachment.url} 
                      alt={attachment.title || 'Image'}
                      className={`max-w-full h-auto transition-opacity duration-300 ${
                        imageLoaded[index] ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setImageLoaded(prev => ({ ...prev, [index]: true }))}
                      onError={() => setImageLoaded(prev => ({ ...prev, [index]: true }))}
                    />
                    {attachment.title && (
                      <div className={`px-3 py-2 text-xs border-t ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-gray-400' 
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}>
                        {attachment.title}
                      </div>
                    )}
                    {/* 图片元数据 */}
                    {attachment.metadata && (
                      <div className={`px-3 py-2 text-xs border-t ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-gray-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        {attachment.metadata.width && attachment.metadata.height && (
                          <span>{attachment.metadata.width}×{attachment.metadata.height}</span>
                        )}
                        {attachment.metadata.size && (
                          <span className="ml-2">{(attachment.metadata.size / 1024 / 1024).toFixed(2)} MB</span>
                        )}
                        {attachment.metadata.format && (
                          <span className="ml-2 uppercase">{attachment.metadata.format}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {attachment.type === 'text' && (
                  <div className={`rounded-xl border overflow-hidden ${
                    isDark 
                      ? 'bg-gray-800/50 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {/* 文本附件头部 */}
                    <div className={`flex items-center justify-between px-3 py-2 border-b ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                        <span className={`text-xs font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {attachment.title || '文案内容'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(attachment.content || '');
                          toast.success('文案已复制到剪贴板');
                        }}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          isDark 
                            ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                        }`}
                      >
                        复制
                      </button>
                    </div>
                    {/* 文本内容 - 使用 Markdown 渲染 */}
                    <div className={`p-4 max-h-96 overflow-y-auto ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {formatContent(attachment.content || '')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Timestamp */}
        <span className={`text-xs mt-2 block ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          {(() => {
            const msgDate = new Date(message.timestamp);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
            const diffDays = Math.floor((today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24));

            const timeStr = msgDate.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            });

            if (diffDays === 0) {
              return timeStr;
            } else if (diffDays === 1) {
              return `昨天 ${timeStr}`;
            } else if (diffDays < 7) {
              const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
              return `${weekdays[msgDate.getDay()]} ${timeStr}`;
            } else if (msgDate.getFullYear() === now.getFullYear()) {
              return `${msgDate.getMonth() + 1}月${msgDate.getDate()}日 ${timeStr}`;
            } else {
              return `${msgDate.getFullYear()}年${msgDate.getMonth() + 1}月${msgDate.getDate()}日 ${timeStr}`;
            }
          })()}
        </span>

        {/* Feedback Button - only for AI messages and last message */}
        {!isUser && isLast && (
          <div className="mt-2">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                isDark
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              <Star className="w-3 h-3" />
              <span>评价</span>
            </button>
          </div>
        )}

        {/* AI Feedback Modal */}
        <AIFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          aiModel="jinmai-skill"
          aiName="津小脉Skill"
          messageId={message.id}
          userQuery=""
          aiResponse={message.content}
        />
      </div>
    </div>
  );
};

export default ChatMessage;
