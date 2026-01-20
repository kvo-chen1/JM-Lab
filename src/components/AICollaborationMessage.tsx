import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/services/llmService';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

interface AICollaborationMessageProps {
  message: Message;
  index: number;
  userAvatar?: string;
  feedbackRating?: number;
  feedbackComment?: string;
  isFeedbackVisible?: boolean;
  onRating?: (index: number, rating: number) => void;
  onFeedbackSubmit?: (index: number, comment: string) => void;
  onFeedbackCommentChange?: (index: number, comment: string) => void;
  onFeedbackToggle?: (index: number, visible: boolean) => void;
}

const AICollaborationMessage: React.FC<AICollaborationMessageProps> = ({
  message,
  index,
  userAvatar,
  feedbackRating,
  feedbackComment,
  isFeedbackVisible,
  onRating,
  onFeedbackSubmit,
  onFeedbackCommentChange,
  onFeedbackToggle
}) => {
  const { isDark } = useTheme();
  const [isCopied, setIsCopied] = useState(false);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    toast.success('已复制到剪贴板');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 头像 */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-md overflow-hidden ${
          isUser 
            ? (isDark ? 'border border-white/30' : 'border border-white/50') 
            : (isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white')
        }`}>
          {isUser ? (
            <img 
              src={userAvatar || 'https://picsum.photos/id/1005/200/200'} 
              alt="用户头像" 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <i className="fas fa-robot text-base"></i>
          )}
        </div>

        {/* 消息内容 */}
        <div className={`flex-1 min-w-0 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <motion.div 
            className={`relative rounded-2xl p-3.5 sm:p-4.5 shadow-sm group ${isUser ? (isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-blue-900/20' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-blue-500/20') : (isDark ? 'bg-gray-800 text-gray-100 border border-gray-700/50 shadow-gray-900/20' : 'bg-white text-gray-800 border border-gray-100 shadow-gray-200/50')}`}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            
            {/* AI 消息的 Markdown 渲染 */}
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            ) : (
              <div className={`markdown-body text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                <ReactMarkdown
                  components={{
                    // 代码块样式
                    code({node, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match && !String(children).includes('\n');
                      return isInline ? (
                        <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-gray-700 text-blue-300' : 'bg-gray-100 text-blue-600'}`} {...props}>
                          {children}
                        </code>
                      ) : (
                        <div className="relative group/code my-3">
                          <div className={`absolute top-0 right-0 px-2 py-1 text-xs text-gray-500 bg-opacity-50 rounded-bl-md rounded-tr-md ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            {match ? match[1] : 'text'}
                          </div>
                          <pre className={`p-3.5 sm:p-4.5 rounded-xl overflow-x-auto text-xs font-mono ${isDark ? 'bg-gray-900 border border-gray-700/50' : 'bg-gray-50 border border-gray-200/50'}`}>
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      );
                    },
                    // 链接样式
                    a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                    // 列表样式
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    // 标题样式
                    h1: ({node, ...props}) => <h1 className="text-lg sm:text-xl font-bold mb-2 mt-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base sm:text-lg font-bold mb-2 mt-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm sm:text-base font-bold mb-1 mt-2" {...props} />,
                    // 段落样式
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-500 dark:text-gray-400 my-2" {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* 复制按钮 - 仅 AI 消息显示 */}
            {!isUser && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                <button
                  onClick={handleCopy}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-800'}`}
                  title="复制内容"
                >
                  {isCopied ? <i className="fas fa-check text-green-500"></i> : <i className="fas fa-copy"></i>}
                </button>
              </div>
            )}
          </motion.div>

          {/* 时间戳 */}
          <div className={`mt-1 text-xs text-gray-400 opacity-75 px-1`}>
            {formatTime(message.timestamp)}
          </div>

          {/* 评分和反馈区域 - 仅 AI 消息显示 */}
          {!isUser && (
            <div className={`mt-1 w-full max-w-full ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex flex-col gap-1.5">
                {/* 评分按钮 */}
                {!feedbackRating && onRating && (
                  <div className="flex gap-1 pt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => onRating(index, 1)} className={`p-1.5 rounded-full transition-all hover:scale-110 ${isDark ? 'hover:bg-gray-700 text-gray-500 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'}`} title="非常不满意"><i className="fas fa-thumbs-down"></i></button>
                    <button onClick={() => onRating(index, 2)} className={`p-1.5 rounded-full transition-all hover:scale-110 ${isDark ? 'hover:bg-gray-700 text-gray-500 hover:text-red-300' : 'hover:bg-gray-100 text-gray-400 hover:text-red-400'}`} title="不满意"><i className="fas fa-frown"></i></button>
                    <button onClick={() => onRating(index, 3)} className={`p-1.5 rounded-full transition-all hover:scale-110 ${isDark ? 'hover:bg-gray-700 text-gray-500 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-500'}`} title="一般"><i className="fas fa-meh"></i></button>
                    <button onClick={() => onRating(index, 4)} className={`p-1.5 rounded-full transition-all hover:scale-110 ${isDark ? 'hover:bg-gray-700 text-gray-500 hover:text-green-300' : 'hover:bg-gray-100 text-gray-400 hover:text-green-400'}`} title="满意"><i className="fas fa-smile"></i></button>
                    <button onClick={() => onRating(index, 5)} className={`p-1.5 rounded-full transition-all hover:scale-110 ${isDark ? 'hover:bg-gray-700 text-gray-500 hover:text-green-400' : 'hover:bg-gray-100 text-gray-400 hover:text-green-500'}`} title="非常满意"><i className="fas fa-thumbs-up"></i></button>
                  </div>
                )}
                
                {/* 评分结果显示 */}
                {feedbackRating && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {feedbackRating === 1 && '非常不满意'}
                      {feedbackRating === 2 && '不满意'}
                      {feedbackRating === 3 && '一般'}
                      {feedbackRating === 4 && '满意'}
                      {feedbackRating === 5 && '非常满意'}
                    </span>
                    <div className="flex text-yellow-400 text-xs">
                      {[...Array(feedbackRating)].map((_, i) => <i key={i} className="fas fa-star"></i>)}
                    </div>
                  </div>
                )}
                
                {/* 反馈评论输入框 */}
                {isFeedbackVisible && onFeedbackSubmit && (
                  <div className="pt-1 pb-1">
                    <div className="flex gap-1.5 items-stretch">
                      <input
                        type="text"
                        placeholder="有什么建议可以告诉我..."
                        className={`flex-1 px-3 py-2 text-xs rounded-lg ${isDark ? 'bg-gray-800 text-gray-200 placeholder-gray-500 border border-gray-700' : 'bg-white text-gray-800 placeholder-gray-400 border border-gray-200'} focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
                        value={feedbackComment || ''}
                        onChange={(e) => onFeedbackCommentChange && onFeedbackCommentChange(index, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onFeedbackSubmit(index, feedbackComment || '')}
                        autoFocus
                      />
                      <button
                        onClick={() => onFeedbackSubmit(index, feedbackComment || '')}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} font-medium`}
                      >
                        提交
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AICollaborationMessage;