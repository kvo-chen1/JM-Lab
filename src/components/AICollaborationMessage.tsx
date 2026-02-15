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
  const isError = message.isError;

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 350,
        damping: 25,
        delay: index * 0.05 
      }}
    >
      <div className={`flex items-start gap-4 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 头像 - 优化样式 */}
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

        {/* 消息内容 */}
        <div className={`flex-1 min-w-0 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* 气泡 - 优化圆角和阴影 */}
          <motion.div 
            className={`relative rounded-2xl p-4 shadow-md transition-shadow duration-300 hover:shadow-lg ${
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
              /* AI 消息的 Markdown 渲染 */
              <div className={`markdown-body text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                <ReactMarkdown
                  components={{
                    code({node, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match && !String(children).includes('\n');
                      return isInline ? (
                        <code className={`px-1.5 py-0.5 rounded-md text-xs font-mono ${isDark ? 'bg-gray-700 text-blue-300' : 'bg-gray-100 text-blue-600'}`} {...props}>
                          {children}
                        </code>
                      ) : (
                        <div className="relative group/code my-3">
                          <div className={`absolute top-0 right-0 px-2 py-1 text-xs text-gray-500 bg-opacity-50 rounded-bl-md rounded-tr-md ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            {match ? match[1] : 'text'}
                          </div>
                          <pre className={`p-3.5 rounded-xl overflow-x-auto text-xs font-mono ${isDark ? 'bg-gray-900/80 border border-gray-700/50' : 'bg-gray-50 border border-gray-200/50'}`}>
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      );
                    },
                    a: ({node, ...props}) => <a className="text-blue-500 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-3 space-y-1.5" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-3 space-y-1.5" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1 leading-relaxed" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-3 mt-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3 text-indigo-600 dark:text-indigo-400" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2 mt-2 text-gray-700 dark:text-gray-300" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-400 dark:border-indigo-500 pl-4 italic text-gray-600 dark:text-gray-400 my-3 bg-gray-50/50 dark:bg-gray-800/50 py-2 pr-3 rounded-r-lg" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-indigo-600 dark:text-indigo-400" {...props} />,
                    table: ({node, ...props}) => <table className={`w-full border-collapse my-4 text-sm ${isDark ? 'border-gray-700' : 'border-gray-200'}`} {...props} />,
                    thead: ({node, ...props}) => <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} {...props} />,
                    tbody: ({node, ...props}) => <tbody {...props} />,
                    tr: ({node, ...props}) => <tr className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`} {...props} />,
                    th: ({node, ...props}) => <th className={`px-4 py-2 text-left font-semibold ${isDark ? 'text-gray-200 border-gray-700' : 'text-gray-700 border-gray-200'}`} {...props} />,
                    td: ({node, ...props}) => <td className={`px-4 py-2 ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'}`} {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* 复制按钮 - 优化位置和样式 */}
            {!isUser && (
              <motion.button
                onClick={handleCopy}
                className={`absolute top-2 right-2 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-800'}`}
                title="复制内容"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCopied ? <i className="fas fa-check text-green-500"></i> : <i className="fas fa-copy text-xs"></i>}
              </motion.button>
            )}
          </motion.div>

          {/* 时间戳 - 优化样式 */}
          <div className={`mt-1.5 text-xs text-gray-400 px-1 font-medium`}>
            {formatTime(message.timestamp)}
          </div>

          {/* 评分和反馈区域 - 仅 AI 消息显示 */}
          {!isUser && onRating && (
            <div className={`mt-2 w-full`}>
              <AnimatePresence>
                {/* 评分按钮 */}
                {!feedbackRating && (
                  <motion.div 
                    className="flex gap-1 pt-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {[
                      { icon: 'fa-thumbs-down', color: 'red', title: '非常不满意' },
                      { icon: 'fa-frown', color: 'orange', title: '不满意' },
                      { icon: 'fa-meh', color: 'blue', title: '一般' },
                      { icon: 'fa-smile', color: 'green', title: '满意' },
                      { icon: 'fa-thumbs-up', color: 'green', title: '非常满意' },
                    ].map((item, i) => (
                      <motion.button 
                        key={i}
                        onClick={() => onRating(index, i + 1)} 
                        className={`p-2 rounded-full transition-all ${isDark ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                        title={item.title}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <i className={`fas ${item.icon}`}></i>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
                
                {/* 评分结果显示 */}
                {feedbackRating && (
                  <motion.div 
                    className="flex items-center gap-2 pt-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {feedbackRating === 1 && '非常不满意'}
                      {feedbackRating === 2 && '不满意'}
                      {feedbackRating === 3 && '一般'}
                      {feedbackRating === 4 && '满意'}
                      {feedbackRating === 5 && '非常满意'}
                    </span>
                    <div className="flex text-yellow-400 text-xs gap-0.5">
                      {[...Array(feedbackRating)].map((_, i) => <i key={i} className="fas fa-star"></i>)}
                    </div>
                  </motion.div>
                )}
                
                {/* 反馈评论输入框 */}
                {isFeedbackVisible && onFeedbackSubmit && (
                  <motion.div 
                    className="pt-2 pb-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="flex gap-2 items-stretch">
                      <input
                        type="text"
                        placeholder="有什么建议可以告诉我..."
                        className={`flex-1 px-4 py-2.5 text-sm rounded-xl ${isDark ? 'bg-gray-800 text-gray-200 placeholder-gray-500 border border-gray-700' : 'bg-white text-gray-800 placeholder-gray-400 border border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all`}
                        value={feedbackComment || ''}
                        onChange={(e) => onFeedbackCommentChange && onFeedbackCommentChange(index, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onFeedbackSubmit(index, feedbackComment || '')}
                        autoFocus
                      />
                      <motion.button
                        onClick={() => onFeedbackSubmit(index, feedbackComment || '')}
                        className={`px-4 py-2 text-sm rounded-xl transition-all font-medium ${isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        提交
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AICollaborationMessage;
