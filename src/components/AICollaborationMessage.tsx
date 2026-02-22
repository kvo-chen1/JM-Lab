import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/services/llmService';
import { useTheme } from '@/hooks/useTheme';
import SmartMarkdownTable from './SmartMarkdownTable';
import VoiceOutputButton from './VoiceOutputButton';
import AIMessageActions from './AIMessageActions';

interface AICollaborationMessageProps {
  message: Message;
  index: number;
  userAvatar?: string;
  onDelete?: (index: number) => void;
  hideAvatar?: boolean;
}

const AICollaborationMessage: React.FC<AICollaborationMessageProps> = ({
  message,
  index,
  userAvatar,
  onDelete,
  hideAvatar = false
}) => {
  const { isDark } = useTheme();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 350,
        damping: 25,
        delay: index * 0.05 
      }}
    >
      <div className={`flex items-start gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse ml-auto' : 'flex-row'}`}>
        {/* 头像 - 优化样式 */}
        {!hideAvatar && (
          <motion.div 
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg overflow-hidden ${
              isUser 
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 ring-2 ring-white/30' 
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-white/30'
            }`}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            {isUser ? (
              userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt="用户头像" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <i className="fas fa-user text-white text-sm"></i>
              )
            ) : (
              <span className="text-white font-bold">津</span>
            )}
          </motion.div>
        )}

        {/* 消息内容 */}
        <div className={`flex-1 min-w-0 flex flex-col max-w-full ${isUser ? 'items-end' : 'items-start'}`}>
          {/* 气泡容器 - 包含气泡和复制按钮 */}
          <div className={`flex items-start gap-2 max-w-full ${isUser ? 'flex-row-reverse justify-start' : 'flex-row'}`}>
            {/* 气泡 - 优化圆角和阴影 */}
            <motion.div
              className={`relative rounded-2xl p-3 shadow-sm transition-shadow duration-300 hover:shadow-md max-w-full ${
                isUser
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm'
                  : isError
                    ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-900 border border-red-200 rounded-tl-sm'
                    : isDark
                      ? 'bg-gray-800/95 text-gray-100 border border-gray-700/50 rounded-tl-sm backdrop-blur-sm'
                      : 'bg-white/95 text-gray-800 border border-gray-200/50 rounded-tl-sm backdrop-blur-sm shadow-gray-200/50'
              }`}
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              
              {/* 用户消息 */}
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            ) : isError ? (
              /* 错误消息 */
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <i className="fas fa-exclamation-circle text-red-500 mt-1 text-lg"></i>
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 mb-2">抱歉，我暂时无法回答你的问题</p>
                    <div className="text-sm text-red-700 whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* AI 消息的 Markdown 渲染 - 智能检测表格 */
              <div className={`markdown-body text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {message.content.includes('|') && message.content.split('\n').some(line => line.includes('|') && line.trim().startsWith('|')) ? (
                  // 使用智能表格组件渲染
                  <SmartMarkdownTable content={message.content} />
                ) : (
                  // 使用标准Markdown渲染
                  <ReactMarkdown
                    components={{
                      code({node, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match && !String(children).includes('\n');
                        const codeContent = String(children).replace(/\n$/, '');
                        
                        return isInline ? (
                          <code className={`px-1.5 py-0.5 rounded-md text-xs font-mono ${isDark ? 'bg-gray-700 text-blue-300' : 'bg-gray-100 text-blue-600'}`} {...props}>
                            {children}
                          </code>
                        ) : (
                          <div className="relative group/code my-3">
                            {/* 代码块头部 */}
                            <div className={`flex items-center justify-between px-3 py-2 text-xs rounded-t-xl border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                              <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {match ? match[1] : 'text'}
                              </span>
                              <motion.button
                                onClick={() => handleCopyCode(codeContent)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                                  isDark 
                                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Copy className="w-3 h-3" />
                                <span>复制</span>
                              </motion.button>
                            </div>
                            <pre className={`p-3.5 rounded-b-xl overflow-x-auto text-xs font-mono ${isDark ? 'bg-gray-900/80 border border-t-0 border-gray-700/50' : 'bg-gray-50 border border-t-0 border-gray-200/50'}`}>
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      },
                      a: ({node, ...props}) => <a className="text-blue-500 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-3 mt-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3 text-indigo-600 dark:text-indigo-400" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2 mt-2 text-gray-700 dark:text-gray-300" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-400 dark:border-indigo-500 pl-4 italic text-gray-600 dark:text-gray-400 my-3 bg-gray-50/50 dark:bg-gray-800/50 py-2 pr-3 rounded-r-lg" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-indigo-600 dark:text-indigo-400" {...props} />,
                      table: ({node, ...props}) => <MarkdownTable striped hoverable bordered>{props.children}</MarkdownTable>,
                      thead: ({node, ...props}) => <>{props.children}</>,
                      tbody: ({node, ...props}) => <>{props.children}</>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            )}

          </motion.div>
          </div>

          {/* 时间戳、语音输出、操作按钮和删除按钮 - 优化样式 */}
          <div className={`mt-1.5 flex items-center w-full px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">
                {formatTime(message.timestamp)}
              </span>
              {/* 语音输出按钮 - 仅AI消息显示 */}
              {!isUser && !isError && (
                <VoiceOutputButton text={message.content} />
              )}
              {/* 消息操作栏 - 用户消息和AI消息都显示 */}
              {!isError && (
                <div className="flex items-center">
                  <AIMessageActions
                    content={message.content}
                    onQuote={() => {
                      // 触发引用事件，可以通过自定义事件或回调传递给父组件
                      const quoteEvent = new CustomEvent('quoteMessage', { 
                        detail: { content: message.content, index } 
                      });
                      window.dispatchEvent(quoteEvent);
                    }}
                    onDelete={onDelete ? () => onDelete(index) : undefined}
                  />
                </div>
              )}
              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(index)}
                  className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                    isDark
                      ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/20'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-100'
                  }`}
                  title="删除消息"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>


        </div>
      </div>
    </motion.div>
  );
};

export default AICollaborationMessage;
