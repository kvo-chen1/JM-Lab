import * as React from 'react';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { TianjinAvatar } from './TianjinStyleComponents';
import { useTranslation } from 'react-i18next';

// 类型定义
export type Thread = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  replies: Array<{ id: string; content: string; createdAt: number }>;
  pinned?: boolean;
  topic?: string;
  upvotes?: number;
};

export type ChatMessage = {
  id?: string;
  user: string;
  text: string;
  avatar: string;
  createdAt?: number;
  pinned?: boolean;
  time?: string;
};

interface DiscussionSectionProps {
  isDark: boolean;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  showModeration?: boolean;
  onDelete?: (id?: string) => void;
  onTogglePin?: (id?: string) => void;
}

interface CommunityDiscussionProps {
  isDark: boolean;
  threads: Thread[];
  onThreadsChange: (threads: Thread[]) => void;
  mode: 'style' | 'topic';
  selectedStyle: string;
  selectedTopic: string;
  newTitle: string;
  onNewTitleChange: (title: string) => void;
  newContent: string;
  onNewContentChange: (content: string) => void;
  threadSearch: string;
  onThreadSearchChange: (search: string) => void;
  threadSort: 'new' | 'reply' | 'hot';
  onThreadSortChange: (sort: 'new' | 'reply' | 'hot') => void;
  favOnly: boolean;
  onFavOnlyChange: (only: boolean) => void;
  favoriteThreads: string[];
  onFavoriteThreadsChange: (threads: string[]) => void;
  replyText: Record<string, string>;
  onReplyTextChange: (text: Record<string, string>) => void;
  threadDraft: { title?: string; content?: string; mode?: 'style' | 'topic'; selected?: string } | null;
  onThreadDraftChange: (draft: { title?: string; content?: string; mode?: 'style' | 'topic'; selected?: string } | null) => void;
  hotTopics: Array<[string, number]>;
  STYLE_LIST: string[];
  TOPIC_LIST: string[];
  onModeChange: (mode: 'style' | 'topic') => void;
  onSelectedStyleChange: (style: string) => void;
  onSelectedTopicChange: (topic: string) => void;
  onInsertRandomIdea: () => void;
  upvoteGuard: Record<string, boolean>;
  onUpvoteGuardChange: (guard: Record<string, boolean>) => void;
}

// 轻量消息流组件（用于社群讨论区）
export const DiscussionSection: React.FC<DiscussionSectionProps> = ({
  isDark,
  messages,
  onSend,
  showModeration,
  onDelete,
  onTogglePin
}) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      onSend(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div>
      <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="text-sm opacity-60 text-center py-4">暂无消息，快来发第一条消息吧！</div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <div className="flex items-start">
                <TianjinAvatar 
                  src={msg.avatar} 
                  alt={msg.user} 
                  size="sm" 
                  className="mr-3" 
                  variant="heritage" // 使用非遗风格变体
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{msg.user}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                    </div>
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{msg.text}</div>
                  {showModeration && (
                    <div className="mt-2 flex items-center gap-2">
                      <button 
                        onClick={() => onTogglePin?.(msg.id)} 
                        className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} px-2 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-300'} transition-colors`}
                      >
                        {msg.pinned ? '取消置顶' : '置顶'}
                      </button>
                      <button 
                        onClick={() => onDelete?.(msg.id)} 
                        className={`${isDark ? 'bg-red-700 text-white' : 'bg-red-500 text-white'} px-2 py-1 rounded-lg text-xs transition-colors`}
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center gap-2">
        <input 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
          onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
          placeholder={t('community.discussion.placeholder')}
          className={`flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600 focus:ring-purple-500' : 'bg-white text-gray-900 ring-1 ring-gray-300 focus:ring-pink-300'}`} 
        />
        <button 
          onClick={handleSend} 
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white transition-colors hover:opacity-90"
        >
          {t('community.discussion.send')}
        </button>
      </div>
    </div>
  );
};

// 社区讨论区组件（发帖+置顶+回复）
export const CommunityDiscussion: React.FC<CommunityDiscussionProps> = ({
  isDark,
  threads,
  onThreadsChange,
  mode,
  selectedStyle,
  selectedTopic,
  newTitle,
  onNewTitleChange,
  newContent,
  onNewContentChange,
  threadSearch,
  onThreadSearchChange,
  threadSort,
  onThreadSortChange,
  favOnly,
  onFavOnlyChange,
  favoriteThreads,
  onFavoriteThreadsChange,
  replyText,
  onReplyTextChange,
  threadDraft,
  onThreadDraftChange,
  hotTopics,
  STYLE_LIST,
  TOPIC_LIST,
  onModeChange,
  onSelectedStyleChange,
  onSelectedTopicChange,
  onInsertRandomIdea,
  upvoteGuard,
  onUpvoteGuardChange
}) => {
  const { t } = useTranslation();
  const [debouncedThreadSearch, setDebouncedThreadSearch] = useState('');

  // 搜索输入防抖
  React.useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedThreadSearch(threadSearch.trim());
    }, 300);
    return () => clearTimeout(h);
  }, [threadSearch]);

  // 提交新帖子
  const submitThread = () => {
    const t = newTitle.trim();
    const c = newContent.trim();
    const BANNED = ['广告', '违规'];
    
    if (!t || !c) return;
    if (BANNED.some(w => t.includes(w) || c.includes(w))) return;
    
    const thread: Thread = {
      id: `t-${Date.now()}`,
      title: t,
      content: c,
      createdAt: Date.now(),
      replies: [],
      topic: mode === 'style' ? selectedStyle : selectedTopic,
      upvotes: 0
    };
    
    const next = [thread, ...threads];
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    
    onNewTitleChange('');
    onNewContentChange('');
    toast.success(t('community.discussion.postCreated'));
  };

  // 恢复草稿
  const restoreDraft = () => {
    if (!threadDraft) return;
    
    onNewTitleChange(threadDraft.title || '');
    onNewContentChange(threadDraft.content || '');
    
    if (threadDraft.mode) {
      onModeChange(threadDraft.mode);
      if (threadDraft.mode === 'style' && threadDraft.selected) {
        onSelectedStyleChange(threadDraft.selected);
      }
      if (threadDraft.mode === 'topic' && threadDraft.selected) {
        onSelectedTopicChange(threadDraft.selected);
      }
    }
  };

  // 清除草稿
  const clearDraft = () => {
    onThreadDraftChange(null);
    try {
      localStorage.removeItem('jmzf_thread_draft');
    } catch {}
  };

  // 添加回复
  const addReply = (id: string) => {
    const text = (replyText[id] || '').trim();
    if (!text) return;
    
    const next = threads.map(t => 
      t.id === id 
        ? { ...t, replies: [...t.replies, { id: `r-${Date.now()}`, content: text, createdAt: Date.now() }] }
        : t
    );
    
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    
    onReplyTextChange({ ...replyText, [id]: '' });
    toast.success('回复已添加');
  };

  // 点赞帖子
  const upvote = (id: string) => {
    if (upvoteGuard[id]) {
      toast.info('已点过赞');
      return;
    }
    
    const next = threads.map(t => 
      t.id === id 
        ? { ...t, upvotes: (t.upvotes || 0) + 1 }
        : t
    );
    
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    
    const guardNext = { ...upvoteGuard, [id]: true };
    onUpvoteGuardChange(guardNext);
    localStorage.setItem('jmzf_upvote_guard', JSON.stringify(guardNext));
  };

  // 切换收藏
  const toggleFavoriteThread = (id: string) => {
    const next = favoriteThreads.includes(id)
      ? favoriteThreads.filter(x => x !== id)
      : [id, ...favoriteThreads];
    
    onFavoriteThreadsChange(next);
  };

  // 切换置顶
  const togglePin = (id: string) => {
    const next = threads.map(t => 
      t.id === id 
        ? { ...t, pinned: !t.pinned }
        : t
    );
    
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    toast.success('置顶状态已更新');
  };

  // 删除帖子
  const removeThread = (id: string) => {
    const next = threads.filter(t => t.id !== id);
    
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    toast.success('帖子已删除');
  };

  // 删除回复
  const removeReply = (tid: string, rid: string) => {
    const next = threads.map(t => 
      t.id === tid 
        ? { ...t, replies: t.replies.filter(r => r.id !== rid) }
        : t
    );
    
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    toast.success('回复已删除');
  };

  // 过滤并排序帖子
  const filteredThreads = useMemo(() => {
    return threads
      .filter(t => (mode === 'style' ? t.topic === selectedStyle : t.topic === selectedTopic))
      .filter(t => favOnly ? favoriteThreads.includes(t.id) : true)
      .filter(t => debouncedThreadSearch ? (t.title.includes(debouncedThreadSearch) || t.content.includes(debouncedThreadSearch)) : true)
      .sort((a, b) => {
        const pinDiff = Number(b.pinned) - Number(a.pinned);
        if (pinDiff !== 0) return pinDiff;
        if (threadSort === 'new') return b.createdAt - a.createdAt;
        if (threadSort === 'reply') return (b.replies.length) - (a.replies.length);
        return ((b.upvotes || 0) + b.replies.length) - ((a.upvotes || 0) + a.replies.length);
      });
  }, [threads, mode, selectedStyle, selectedTopic, favOnly, favoriteThreads, debouncedThreadSearch, threadSort]);

  return (
    <>
      {/* 子社区切换与标签选择 */}
      <div className={`mb-6 rounded-2xl p-4 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 shadow-lg' : 'bg-white ring-1 ring-gray-200 shadow-lg'}`}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm opacity-70">{t('community.discussion.subCommunity')}</span>
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }} 
            onClick={() => onModeChange('style')} 
            className={`${mode === 'style' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-4 py-2 rounded-full text-sm transition-colors hover:opacity-90`}
          >
            {t('community.discussion.mode.style')}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }} 
            onClick={() => onModeChange('topic')} 
            className={`${mode === 'topic' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-4 py-2 rounded-full text-sm transition-colors hover:opacity-90`}
          >
            {t('community.discussion.mode.topic')}
          </motion.button>
        </div>
        
        {mode === 'style' ? (
          <div className="flex flex-wrap gap-2">
            {STYLE_LIST.map(s => {
              const count = threads.filter(t => t.topic === s).length;
              return (
                <motion.button 
                  key={s}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectedStyleChange(s)}
                  className={`${selectedStyle === s ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-colors hover:opacity-90`}
                >
                  <span>{t(`community.styles.${s}`) || s}</span>
                  <span className={`${selectedStyle === s ? 'bg-white text-red-600 ring-1 ring-red-200' : (isDark ? 'bg-gray-600 text-white ring-1 ring-gray-700' : 'bg-gray-300 text-gray-900 ring-1 ring-gray-300')} text-xs px-2 py-0.5 rounded-full`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {TOPIC_LIST.map(s => {
              const count = threads.filter(t => t.topic === s).length;
              return (
                <motion.button 
                  key={s}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectedTopicChange(s)}
                  className={`${selectedTopic === s ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-colors hover:opacity-90`}
                >
                  <span>{t(`community.topics.${s}`) || s}</span>
                  <span className={`${selectedTopic === s ? 'bg-white text-red-600 ring-1 ring-red-200' : (isDark ? 'bg-gray-600 text-white ring-1 ring-gray-700' : 'bg-gray-300 text-gray-900 ring-1 ring-gray-300')} text-xs px-2 py-0.5 rounded-full`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* 话题热榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className={`rounded-2xl p-4 lg:col-span-1 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 shadow-lg' : 'bg-white ring-1 ring-gray-200 shadow-lg'}`}>
          <div className="font-medium mb-3">
            <span className="flex items-center gap-2">{t('community.discussion.hotTopics')}</span>
          </div>
          <ul>
            {hotTopics.map(([t, score], i) => {
              const maxHeat = hotTopics.length ? hotTopics[0][1] : 1;
              const pct = Math.max(6, Math.round((score / Math.max(1, maxHeat)) * 100));
              return (
                <li key={t} className="py-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="mr-3">{i + 1}. {t}</span>
                    <span className="opacity-70">{score}</span>
                  </div>
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} w-full h-2 rounded-full mt-1`}>
                    <div 
                      style={{ width: `${pct}%` }} 
                      className={`h-2 rounded-full ${isDark ? 'bg-red-500' : 'bg-red-600'} transition-all duration-300`}
                    ></div>
                  </div>
                </li>
              );
            })}
            {hotTopics.length === 0 && (
              <li className="text-sm opacity-60">{t('community.discussion.noData')}</li>
            )}
          </ul>
        </div>

        {/* 社区讨论区 */}
        <div className={`rounded-2xl p-4 lg:col-span-2 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 shadow-lg' : 'bg-white ring-1 ring-gray-200 shadow-lg'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">
              {mode === 'style' ? (t(`community.styles.${selectedStyle}`) || selectedStyle) : (t(`community.topics.${selectedTopic}`) || selectedTopic)} {t('community.discussion.subCommunityDiscussion')}
            </div>
            <div className="flex items-center gap-2">
              <input 
                value={threadSearch} 
                onChange={e => onThreadSearchChange(e.target.value)}
                className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-2 h-12 md:h-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
                placeholder={t('community.discussion.searchDiscussion')}
                aria-label="搜索讨论"
              />
              <select 
                value={threadSort}
                onChange={e => onThreadSortChange(e.target.value as 'new' | 'reply' | 'hot')}
                className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-2 h-12 md:h-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
              >
                <option value="new">{t('community.discussion.sort.new')}</option>
                <option value="reply">{t('community.discussion.sort.reply')}</option>
                <option value="hot">{t('community.discussion.sort.hot')}</option>
              </select>
              <button 
                onClick={() => onFavOnlyChange(!favOnly)}
                className={`${favOnly ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-4 py-2 h-12 md:h-10 rounded-lg text-sm transition-colors`}
              >
                {favOnly ? t('community.discussion.filter.favOnly') : t('community.discussion.filter.all')}
              </button>
              <button 
                onClick={onInsertRandomIdea}
                className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-4 py-2 h-12 md:h-10 rounded-lg text-sm transition-colors`}
              >
                {t('community.discussion.randomIdea')}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input 
              value={newTitle}
              onChange={e => onNewTitleChange(e.target.value)}
              className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-2 h-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
              placeholder={t('community.discussion.postTitlePlaceholder')}
              aria-label="帖子标题"
            />
            <button 
              onClick={submitThread}
              disabled={!newTitle.trim() || !newContent.trim()}
              aria-disabled={!newTitle.trim() || !newContent.trim()}
              className={`px-3 py-2 h-12 rounded-lg transition-colors ${(!newTitle.trim() || !newContent.trim()) ? (isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600') : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'}`}
            >
              {t('community.discussion.postSubmit')}
            </button>
          </div>
          
          {threadDraft && (threadDraft.title || threadDraft.content) && (
            <div className="flex items-center justify-between mb-2">
              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>
                {t('community.discussion.draftDetected')}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={restoreDraft}
                  className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
                >
                  {t('community.discussion.restoreDraft')}
                </button>
                <button 
                  onClick={clearDraft}
                  className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
                >
                  {t('community.discussion.clearDraft')}
                </button>
              </div>
            </div>
          )}
          
          <textarea 
            value={newContent}
            onChange={e => onNewContentChange(e.target.value)}
            className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full h-24 px-3 py-2 rounded-lg border mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
            placeholder={t('community.discussion.postContentPlaceholder')}
          />
          
          <div className="space-y-3">
            {filteredThreads.map(t => (
              <motion.div 
                key={t.id} 
                whileHover={{ y: -2 }} 
                className={`${isDark ? 'bg-gray-700 ring-1 ring-gray-700' : 'bg-gray-50 ring-1 ring-gray-200'} rounded-xl p-4`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium flex items-center gap-2">
                    {t.title}
                    {t.topic && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ring-1 ${isDark ? 'bg-gray-800 text-gray-300 ring-gray-600' : 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
                        #{t.topic}
                      </span>
                    )}
                    {t.pinned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white">置顶</span>}
                    {/* New Badge: 24小时内的新帖 */}
                    {(Date.now() - t.createdAt) < 24 * 60 * 60 * 1000 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500 text-white">新</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => upvote(t.id)}
                      aria-label="点赞帖子"
                      className="px-3 py-1 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      点赞 {t.upvotes || 0}
                    </button>
                    <button 
                      onClick={() => toggleFavoriteThread(t.id)}
                      aria-label="收藏帖子"
                      className={`${favoriteThreads.includes(t.id) ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} transition-colors`}
                    >
                      {favoriteThreads.includes(t.id) ? '已收藏' : '收藏'}
                    </button>
                    <button 
                      onClick={() => togglePin(t.id)}
                      aria-label={t.pinned ? '取消置顶' : '置顶'}
                      className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} transition-colors`}
                    >
                      {t.pinned ? '取消置顶' : '置顶'}
                    </button>
                    <button 
                      onClick={() => removeThread(t.id)}
                      aria-label="删除帖子"
                      className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} transition-colors`}
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className={`text-sm opacity-80 mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.content}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input 
                    value={replyText[t.id] || ''}
                    onChange={e => onReplyTextChange({ ...replyText, [t.id]: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addReply(t.id);
                      }
                    }}
                    className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} flex-1 px-3 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
                    placeholder={t('community.discussion.replyPlaceholder')}
                    aria-label="回复内容"
                  />
                  <button 
                    onClick={() => addReply(t.id)}
                    aria-label="添加回复"
                    className={`${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-1 rounded-lg text-xs hover:opacity-90 transition-colors`}
                  >
                    {t('community.discussion.reply')}
                  </button>
                </div>
                {t.replies.length > 0 && (
                  <div className="mt-3 text-sm">
                    {t.replies.map(r => (
                      <div 
                        key={r.id} 
                        className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border-t py-2 flex items-center justify-between`}
                      >
                        <span>{r.content}</span>
                        <button 
                          onClick={() => removeReply(t.id, r.id)}
                          aria-label="删除回复"
                          className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-2 py-0.5 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} transition-colors`}
                        >
                          {t('community.discussion.delete')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
            {filteredThreads.length === 0 && (
              <div className="text-sm opacity-60">{t('community.discussion.noThreadsPlaceholder')}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};