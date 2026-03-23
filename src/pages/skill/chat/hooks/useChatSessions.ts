import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChatSession, ChatMessage } from '../types';

const STORAGE_KEY = 'skill_chat_sessions';
const MAX_SESSIONS = 50; // 最大保存会话数

// 生成唯一ID
const generateId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 从 localStorage 加载会话
const loadSessionsFromStorage = (): ChatSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const sessions = JSON.parse(data);
      // 修复 messageCount 字段，确保与实际消息数量一致
      return Array.isArray(sessions) ? sessions.map(session => ({
        ...session,
        messageCount: session.messages?.length || 0,
        updatedAt: session.messages?.length > 0 
          ? Math.max(session.updatedAt, Date.now()) 
          : session.updatedAt
      })) : [];
    }
  } catch (error) {
    console.error('[useChatSessions] Failed to load sessions:', error);
  }
  return [];
};

// 保存会话到 localStorage
const saveSessionsToStorage = (sessions: ChatSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('[useChatSessions] Failed to save sessions:', error);
  }
};

// 智能提取关键词生成标题
const extractKeywords = (content: string): string => {
  // 常见意图关键词映射
  const intentKeywords: Record<string, string[]> = {
    'Logo设计': ['logo', '标志', '品牌标识', '商标'],
    '海报设计': ['海报', '宣传', 'banner', '招贴'],
    '图片生成': ['图片', '图像', '画图', '生成图', '插画'],
    '文案创作': ['文案', '文字', '写作', '写文章'],
    '品牌文案': ['品牌', '宣传文案', '品牌故事'],
    '营销文案': ['营销', '推广', '广告', '促销'],
    '社媒文案': ['朋友圈', '微博', '小红书', '抖音', '社交媒体'],
    '配色方案': ['配色', '颜色', '色彩', '色调'],
    '创意点子': ['创意', '点子', '想法', '方案', '策划'],
  };

  const lowerContent = content.toLowerCase();

  // 检查是否匹配特定意图
  for (const [title, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some(kw => lowerContent.includes(kw.toLowerCase()))) {
      return title;
    }
  }

  return '';
};

// 生成会话标题
const generateSessionTitle = (messages: ChatMessage[]): string => {
  // 找到第一条用户消息
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return '新会话';

  const content = firstUserMessage.content;

  // 尝试提取意图关键词
  const intentKeyword = extractKeywords(content);
  if (intentKeyword) {
    // 提取主题（关于...的）
    const aboutMatch = content.match(/关于[""']([^""']+)[""']|关于\s*([^，,。！!？?]+)/);
    const topic = aboutMatch ? (aboutMatch[1] || aboutMatch[2])?.trim() : '';

    if (topic && topic.length > 0 && topic.length <= 15) {
      return `${intentKeyword} · ${topic}`;
    }

    // 提取品牌名或产品名
    const brandMatch = content.match(/品牌[叫名为]?\s*[""']?([^""'，,。！!？?\s]+)/i);
    const brandName = brandMatch ? brandMatch[1] : '';

    if (brandName && brandName.length <= 10) {
      return `${intentKeyword} · ${brandName}`;
    }

    return intentKeyword;
  }

  // 默认：截取前20个字符，但尽量在语义完整处截断
  const cleanContent = content.replace(/[\n\r]/g, ' ').trim();
  if (cleanContent.length <= 20) return cleanContent;

  // 尝试在标点处截断
  const punctuationMatch = cleanContent.slice(0, 25).match(/.*?[，,。！!？?]/);
  if (punctuationMatch && punctuationMatch[0].length >= 5) {
    return punctuationMatch[0].slice(0, -1);
  }

  // 尝试在空格处截断
  const spaceIndex = cleanContent.slice(0, 21).lastIndexOf(' ');
  if (spaceIndex > 10) {
    return cleanContent.slice(0, spaceIndex) + '...';
  }

  return cleanContent.slice(0, 20) + '...';
};

// 格式化时间
const formatTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }
  
  // 显示日期
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化：从 localStorage 加载
  useEffect(() => {
    const loadedSessions = loadSessionsFromStorage();
    setSessions(loadedSessions);
    
    // 如果有会话，选中最后一个
    if (loadedSessions.length > 0) {
      setCurrentSessionId(loadedSessions[0].id);
    }
    
    setIsInitialized(true);
  }, []);

  // 自动保存到 localStorage
  useEffect(() => {
    if (isInitialized) {
      saveSessionsToStorage(sessions);
    }
  }, [sessions, isInitialized]);

  // 获取当前会话
  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  // 创建新会话
  const createSession = useCallback((): ChatSession => {
    const newSession: ChatSession = {
      id: generateId(),
      title: '新会话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
    };
    
    console.log('[useChatSessions] 创建新会话:', newSession.id);
    
    // 先设置当前会话 ID
    setCurrentSessionId(newSession.id);
    
    // 再更新会话列表
    setSessions(prev => {
      // 限制最大会话数
      const updatedSessions = [newSession, ...prev].slice(0, MAX_SESSIONS);
      console.log('[useChatSessions] 更新后会话数:', updatedSessions.length);
      return updatedSessions;
    });
    
    return newSession;
  }, []);

  // 初始化完成后，如果没有会话则创建一个新会话
  useEffect(() => {
    if (isInitialized && sessions.length === 0 && !currentSessionId) {
      createSession();
    }
  }, [isInitialized, sessions.length, currentSessionId, createSession]);

  // 切换会话
  const switchSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      return session;
    }
    return null;
  }, [sessions]);

  // 删除会话
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updatedSessions = prev.filter(s => s.id !== sessionId);
      
      // 如果删除的是当前会话，切换到第一个会话或创建新会话
      if (sessionId === currentSessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].id);
        } else {
          // 创建新会话
          const newSession: ChatSession = {
            id: generateId(),
            title: '新会话',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 0,
          };
          updatedSessions.push(newSession);
          setCurrentSessionId(newSession.id);
        }
      }
      
      return updatedSessions;
    });
  }, [currentSessionId]);

  // 重命名会话
  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title: newTitle, updatedAt: Date.now() }
        : session
    ));
  }, []);

  // 更新会话消息
  const updateSessionMessages = useCallback((sessionId: string, messages: ChatMessage[]) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        // 如果是第一条消息，自动生成标题
        const title = session.messages.length === 0 && messages.length > 0
          ? generateSessionTitle(messages)
          : session.title;
        
        return {
          ...session,
          messages,
          title,
          messageCount: messages.length,
          updatedAt: Date.now(),
        };
      }
      return session;
    }));
  }, []);

  // 清空所有会话
  const clearAllSessions = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: '新会话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
    };
    setSessions([newSession]);
    setCurrentSessionId(newSession.id);
  }, []);

  return {
    sessions,
    currentSessionId,
    currentSession,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
    updateSessionMessages,
    clearAllSessions,
    formatTime,
  };
};

export default useChatSessions;
