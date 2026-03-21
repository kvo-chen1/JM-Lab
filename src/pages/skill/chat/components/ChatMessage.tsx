import React from 'react';
import { User, Bot, Wand2, Brain, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { ChatMessage as ChatMessageType, SkillCallInfo } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
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

const SkillCallCard: React.FC<{ skillCall: SkillCallInfo }> = ({ skillCall }) => {
  const statusText = {
    thinking: '正在思考...',
    recognizing: '识别意图中...',
    calling: '准备调用技能...',
    executing: '执行中...',
    completed: '执行完成',
    error: '执行出错',
  };

  return (
    <div className="mt-3 p-3 bg-white/50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <SkillStatusIcon status={skillCall.status} />
        <span className="text-sm font-medium text-gray-700">
          {statusText[skillCall.status]}
        </span>
      </div>
      
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-gray-600">意图识别:</span>
          <span className="font-medium text-purple-600">{skillCall.intent}</span>
          <span className="text-xs text-gray-400">({(skillCall.confidence * 100).toFixed(0)}%)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-gray-600">调用技能:</span>
          <span className="font-medium text-blue-600">{skillCall.skillName}</span>
        </div>
        
        {skillCall.params && Object.keys(skillCall.params).length > 0 && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
            <div className="text-gray-400 mb-1">参数:</div>
            {JSON.stringify(skillCall.params, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      
      {/* Message Content */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-md' 
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {/* Skill Call Info */}
        {!isUser && message.skillCall && (
          <SkillCallCard skillCall={message.skillCall} />
        )}
        
        {/* Attachments */}
        {!isUser && message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => (
              <div key={index}>
                {attachment.type === 'image' && attachment.url && (
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img 
                      src={attachment.url} 
                      alt={attachment.title || 'Generated image'}
                      className="max-w-full h-auto"
                    />
                  </div>
                )}
                {attachment.type === 'text' && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 text-sm text-gray-700">
                    {attachment.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Timestamp */}
        <span className="text-xs text-gray-400 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
