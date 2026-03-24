import React, { useState, useEffect } from 'react';
import { User, Bot, Wand2, Brain, Zap, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, HelpCircle, MessageSquare, CheckSquare, ListTodo, Star } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ChatMessage as ChatMessageType, SkillCallInfo, RequirementPhase, MerchandiseCategory } from '../types';
import { getIntentDisplayName, getIntentColor } from '../services/intentService';
import { MerchandiseTypeCollector } from './MerchandiseTypeCollector';
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
            
            {/* 建议回复 */}
            {skillCall.suggestions && skillCall.suggestions.length > 0 && (
              <div className="mt-3">
                <div className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>建议回复:</div>
                <div className="flex flex-wrap gap-2">
                  {skillCall.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage?.(suggestion)}
                      disabled={!onSendMessage}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                      } ${!onSendMessage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {suggestion}
                    </button>
                  ))}
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
  
  // 格式化内容，支持 Markdown 样式的代码块
  const formatContent = (content: string) => {
    // 简单处理代码块
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim();
        return (
          <pre
            key={index}
            className={`mt-2 p-3 rounded-lg overflow-x-auto text-xs font-mono ${
              isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <code>{code}</code>
          </pre>
        );
      }
      // 处理行内代码
      const inlineParts = part.split(/(`[^`]+`)/g);
      return (
        <span key={index}>
          {inlineParts.map((inlinePart, inlineIndex) => {
            if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
              return (
                <code
                  key={inlineIndex}
                  className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {inlinePart.slice(1, -1)}
                </code>
              );
            }
            // 处理粗体
            const boldParts = inlinePart.split(/(\*\*[^*]+\*\*)/g);
            return (
              <span key={inlineIndex}>
                {boldParts.map((boldPart, boldIndex) => {
                  if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                    return (
                      <strong
                        key={boldIndex}
                        className={isDark ? 'text-gray-100' : 'text-gray-900'}
                      >
                        {boldPart.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={boldIndex}>{boldPart}</span>;
                })}
              </span>
            );
          })}
        </span>
      );
    });
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
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {formatContent(message.content)}
          </div>
        </div>
        
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
              <div key={index}>
                {attachment.type === 'image' && attachment.url && (
                  <div className={`rounded-xl overflow-hidden border shadow-lg transition-all hover:shadow-xl ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
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
                  <div className={`p-3 rounded-xl border text-sm ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-300' 
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    {attachment.content}
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
