import * as React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ScheduledTask {
  id: string;
  title: string;
  content: string;
  time: number;
  published: boolean;
  targetMode: 'style' | 'topic';
  targetValue: string;
}

interface ScheduledPostProps {
  isDark: boolean;
  scheduled: ScheduledTask[];
  onScheduledChange: (tasks: ScheduledTask[]) => void;
  scheduledTitle: string;
  onScheduledTitleChange: (title: string) => void;
  scheduledContent: string;
  onScheduledContentChange: (content: string) => void;
  scheduledTime: string;
  onScheduledTimeChange: (time: string) => void;
  mode: 'style' | 'topic';
  onModeChange: (mode: 'style' | 'topic') => void;
  selectedStyle: string;
  onSelectedStyleChange: (style: string) => void;
  selectedTopic: string;
  onSelectedTopicChange: (topic: string) => void;
  STYLE_LIST: string[];
  TOPIC_LIST: string[];
  now: number;
  threads: { id: string; title: string; content: string; createdAt: number; replies: Array<{ id: string; content: string; createdAt: number }>; pinned?: boolean; topic?: string; upvotes?: number }[];
  onThreadsChange: (threads: { id: string; title: string; content: string; createdAt: number; replies: Array<{ id: string; content: string; createdAt: number }>; pinned?: boolean; topic?: string; upvotes?: number }[]) => void;
}

const ScheduledPost: React.FC<ScheduledPostProps> = ({
  isDark,
  scheduled,
  onScheduledChange,
  scheduledTitle,
  onScheduledTitleChange,
  scheduledContent,
  onScheduledContentChange,
  scheduledTime,
  onScheduledTimeChange,
  mode,
  onModeChange,
  selectedStyle,
  onSelectedStyleChange,
  selectedTopic,
  onSelectedTopicChange,
  STYLE_LIST,
  TOPIC_LIST,
  now,
  threads,
  onThreadsChange
}) => {
  const { t } = useTranslation();

  // 格式化倒计时
  const formatRemain = (ms: number) => {
    if (ms <= 0) return t('community.scheduled.expired');
    const m = Math.floor(ms / 60000);
    const d = Math.floor(m / 1440);
    const h = Math.floor((m % 1440) / 60);
    const mm = m % 60;
    if (d > 0) return `${d}${t('community.scheduled.time.days')}${h}${t('community.scheduled.time.hours')}${mm}${t('community.scheduled.time.minutes')}`;
    if (h > 0) return `${h}${t('community.scheduled.time.hours')}${mm}${t('community.scheduled.time.minutes')}`;
    return `${mm}${t('community.scheduled.time.minutes')}`;
  };

  // 发布定时任务
  const publishScheduled = (id: string) => {
    const it = scheduled.find(x => x.id === id);
    if (!it) return;
    
    const thread = {
      id: `t-${Date.now()}`,
      title: it.title,
      content: it.content,
      createdAt: Date.now(),
      replies: [],
      topic: it.targetMode === 'style' ? it.targetValue : it.targetValue,
      upvotes: 0,
    };
    
    const nextThreads = [thread, ...threads];
    onThreadsChange(nextThreads);
    localStorage.setItem('jmzf_threads', JSON.stringify(nextThreads));
    
    const next = scheduled.map(item => 
      item.id === id ? { ...item, published: true } : item
    );
    onScheduledChange(next);
    localStorage.setItem('jmzf_scheduled', JSON.stringify(next));
    toast.success('定时任务已发布');
  };

  // 删除定时任务
  const removeScheduled = (id: string) => {
    const next = scheduled.filter(s => s.id !== id);
    onScheduledChange(next);
    localStorage.setItem('jmzf_scheduled', JSON.stringify(next));
    toast.success('定时任务已删除');
  };

  // 添加定时任务
  const schedulePost = () => {
    const t = scheduledTitle.trim();
    const c = scheduledContent.trim();
    const time = Date.parse(scheduledTime);
    
    if (!t || !c || isNaN(time)) return;
    
    const targetValue = mode === 'style' ? selectedStyle : selectedTopic;
    const item: ScheduledTask = {
      id: `s-${Date.now()}`,
      title: t,
      content: c,
      time,
      published: false,
      targetMode: mode,
      targetValue
    };
    
    const next = [item, ...scheduled];
    onScheduledChange(next);
    localStorage.setItem('jmzf_scheduled', JSON.stringify(next));
    
    onScheduledTitleChange('');
    onScheduledContentChange('');
    onScheduledTimeChange('');
    toast.success('已添加到定时任务');
  };

  return (
    <div className={`mb-6 rounded-2xl p-4 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 shadow-lg' : 'bg-white ring-1 ring-gray-200 shadow-lg'}`}>
      <div className="font-medium mb-3">
        <span className="flex items-center gap-2">🛠️ 话题运营工具</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${isDark ? 'bg-gray-700 ring-1 ring-gray-700' : 'bg-gray-50 ring-1 ring-gray-200'} rounded-xl p-4`}>
          <div className="font-medium mb-2">
            <span className="flex items-center gap-2">⏰ 创建定时发布</span>
          </div>
          <input 
            value={scheduledTitle}
            onChange={e => onScheduledTitleChange(e.target.value)}
            className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full px-3 py-2 rounded-lg border mb-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
            placeholder="标题"
          />
          <textarea 
            value={scheduledContent}
            onChange={e => onScheduledContentChange(e.target.value)}
            className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full h-20 px-3 py-2 rounded-lg border mb-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
            placeholder="内容"
          />
          <input 
            type="datetime-local"
            value={scheduledTime}
            onChange={e => onScheduledTimeChange(e.target.value)}
            className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full px-3 py-2 rounded-lg border mb-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs opacity-70">{t('community.scheduled.targetCommunity')}</span>
            <select 
              value={mode}
              onChange={e => onModeChange(e.target.value as 'style' | 'topic')}
              className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg border text-xs`}
            >
              <option value="style">{t('community.discussion.mode.style')}</option>
              <option value="topic">{t('community.discussion.mode.topic')}</option>
            </select>
            {mode === 'style' ? (
              <select 
                value={selectedStyle}
                onChange={e => onSelectedStyleChange(e.target.value)}
                className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg border text-xs`}
              >
                {STYLE_LIST.map(s => (
                  <option key={s} value={s}>{t(`community.styles.${s}`) || s}</option>
                ))}
              </select>
            ) : (
              <select 
                value={selectedTopic}
                onChange={e => onSelectedTopicChange(e.target.value)}
                className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg border text-xs`}
              >
                {TOPIC_LIST.map(s => (
                  <option key={s} value={s}>{t(`community.topics.${s}`) || s}</option>
                ))}
              </select>
            )}
          </div>
          <button 
            onClick={schedulePost}
            className="bg-red-600 text-white px-3 py-2 rounded-lg w-full hover:bg-red-700 transition-colors shadow-sm"
          >
            {t('community.scheduled.addButton')}
          </button>
        </div>
        <div className={`${isDark ? 'bg-gray-700 ring-1 ring-gray-700' : 'bg-gray-50 ring-1 ring-gray-200'} rounded-xl p-4 md:col-span-2`}>
          <div className="font-medium mb-2">{t('community.scheduled.listTitle')}</div>
          <ul className="space-y-2">
            {scheduled.map(it => (
              <li 
                key={it.id} 
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 flex items-center justify-between ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
              >
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    <span>{it.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${it.published ? 'bg-green-600 text-white' : 'bg-yellow-500 text-white'}`}>
                      {it.published ? t('community.scheduled.statusPublished') : t('community.scheduled.statusPending')}
                    </span>
                  </div>
                  <div className="text-xs opacity-70">
                    {new Date(it.time).toLocaleString()} • {t('community.scheduled.countdown')} {formatRemain(it.time - now)} • {t('community.scheduled.target')} {it.targetMode === 'style' ? (t(`community.styles.${it.targetValue}`) || it.targetValue) : (t(`community.topics.${it.targetValue}`) || it.targetValue)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => publishScheduled(it.id)}
                    disabled={it.published}
                    aria-disabled={it.published}
                    className={`${it.published ? (isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600') : 'bg-red-600 text-white hover:bg-red-700'} px-3 py-1 rounded-lg text-xs transition-colors`}
                  >
                    {t('community.scheduled.publishNow')}
                  </button>
                  <button 
                    onClick={() => removeScheduled(it.id)}
                    className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
                  >
                    {t('community.scheduled.delete')}
                  </button>
                </div>
              </li>
            ))}
            {scheduled.length === 0 && (
              <li className="text-sm opacity-60 rounded-lg border-2 border-dashed p-4 text-center">
                {t('community.scheduled.noTasks')}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScheduledPost;