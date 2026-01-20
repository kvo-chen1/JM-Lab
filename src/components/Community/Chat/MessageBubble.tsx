import React from 'react';
import type { ChatMessage } from '@/pages/Community';
import { TianjinAvatar } from '@/components/TianjinStyleComponents';

interface MessageBubbleProps {
  isDark: boolean;
  message: ChatMessage;
  isMe: boolean;
  showAvatar?: boolean;
  retrySendMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, reaction: string) => void;
  onReplyToMessage?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  isDark,
  message,
  isMe,
  showAvatar = true,
  retrySendMessage,
  onAddReaction,
  onReplyToMessage
}) => {
  // 渲染发送状态
  const renderSendStatus = () => {
    if (!isMe) return null;
    
    switch (message.sendStatus) {
      case 'sending':
        return <span className="text-xs text-gray-400 ml-1"><i className="fas fa-spinner fa-spin"></i> 发送中...</span>;
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-xs text-red-400 ml-1">
            <span><i className="fas fa-exclamation-circle"></i> 发送失败</span>
            {retrySendMessage && message.id && (
              <button 
                onClick={() => retrySendMessage(message.id!)}
                className="hover:text-blue-400 hover:underline"
              >
                重试
              </button>
            )}
          </div>
        );
      case 'sent':
        return <span className="text-xs text-gray-400 ml-1"><i className="fas fa-check"></i></span>;
      default:
        return null;
    }
  };

  // 渲染图片内容
  const renderImages = () => {
    if (!message.images || message.images.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {message.images.map((image, index) => (
          <div key={index} className="relative group">
            <img 
              src={image.url} 
              alt={`Image ${index + 1}`} 
              className="max-w-[200px] max-h-[200px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(image.url, '_blank')}
            />
            {image.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg truncate">
                {image.name}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // 渲染文件内容
  const renderFiles = () => {
    if (!message.files || message.files.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {message.files.map((file, index) => (
          <div 
            key={index} 
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-500/10 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}
            onClick={() => window.open(file.url, '_blank')}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-blue-100'}`}>
              <i className="fas fa-file text-xl ${isDark ? 'text-gray-300' : 'text-blue-600'}"></i>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{file.name}</div>
              <div className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
            {file.status === 'uploading' && file.progress && (
              <div className="w-24">
                <div className="w-full bg-gray-300 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 text-right mt-0.5">{file.progress}%</div>
              </div>
            )}
            {file.status === 'failed' && (
              <span className="text-xs text-red-400"><i className="fas fa-exclamation-circle"></i></span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // 渲染回复信息
  const renderReplyTo = () => {
    if (!message.replyTo) return null;
    
    return (
      <div className={`mb-2 p-2 rounded-md text-sm ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
        <div className="flex items-start gap-1">
          <span className="font-medium truncate">@{message.replyTo.user}</span>
          <span className="truncate flex-1">: {message.replyTo.text}</span>
        </div>
      </div>
    );
  };

  // 渲染富文本内容
  const renderRichContent = () => {
    if (!message.richContent) return null;
    
    return (
      <div 
        className={`mt-1 p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
        dangerouslySetInnerHTML={{ __html: message.richContent }}
      ></div>
    );
  };

  // 渲染反应按钮
  const renderReactions = () => {
    const reactions = message.reactions || {};
    const reactionOptions = ['👍', '❤️', '😂', '🎉', '😮', '😢'];
    
    return (
      <div className="flex gap-1 mt-1">
        {/* 已有的反应 */}
        {Object.entries(reactions).map(([reaction, users]) => (
          <button 
            key={reaction}
            onClick={() => onAddReaction && message.id && onAddReaction(message.id, reaction)}
            className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 border transition-all ${isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}
          >
            <span>{reaction}</span>
            <span>{users.length}</span>
          </button>
        ))}
        
        {/* 添加反应按钮 */}
        <button 
          className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 border transition-all ${isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}
        >
          <span>😀</span>
        </button>
      </div>
    );
  };

  // 渲染消息操作菜单
  const renderMessageMenu = () => {
    return (
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onReplyToMessage && message.id && onReplyToMessage(message.id)}
          className={`text-xs px-2 py-1 rounded hover:bg-gray-200/20 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`}
        >
          回复
        </button>
      </div>
    );
  };

  return (
    <div className={`flex gap-4 group px-4 py-1 hover:bg-gray-500/5 ${showAvatar ? 'mt-4' : 'mt-0.5'} relative`}>
      {/* Avatar Column */}
      <div className="w-10 flex-shrink-0 pt-0.5">
        {showAvatar && (
             <TianjinAvatar 
             src={message.avatar || ''} 
             alt={message.user} 
             size="sm" 
             className="w-10 h-10 hover:shadow-lg transition-shadow cursor-pointer"
           />
        )}
        {!showAvatar && (
            <div className="w-10 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 text-right pr-2 pt-1 select-none">
                {new Date(message.createdAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        )}
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">
        {/* Message Header */}
        {showAvatar && (
            <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium cursor-pointer hover:underline ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {message.user}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                    {new Date(message.createdAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {renderSendStatus()}
            </div>
        )}
        
        {/* Message Menu */}
        {renderMessageMenu()}
        
        {/* Reply Information */}
        {renderReplyTo()}
        
        {/* Text Content */}
        {message.text && (
          <div className={`text-base leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {message.text}
          </div>
        )}
        
        {/* Images */}
        {renderImages()}
        
        {/* Files */}
        {renderFiles()}
        
        {/* Rich Content */}
        {renderRichContent()}
        
        {/* Reactions */}
        {renderReactions()}
      </div>
    </div>
  );
};
