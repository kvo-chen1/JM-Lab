import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ConversationSession,
  AgentStateSnapshot,
  AgentMessage
} from '../types/agent';
import { useAgentStore } from './useAgentStore';

interface ConversationActions {
  // 会话管理
  createSession: (title?: string, description?: string) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  updateSessionDescription: (sessionId: string, description: string) => void;

  // 保存当前会话状态
  saveCurrentSession: () => void;

  // 获取会话列表
  getSessions: () => ConversationSession[];

  // 获取当前会话
  getCurrentSession: () => ConversationSession | null;

  // 清空所有会话
  clearAllSessions: () => void;

  // 恢复会话状态到 Agent Store
  restoreSessionToAgent: (sessionId: string) => boolean;

  // 验证会话状态完整性
  validateSessionState: (snapshot: AgentStateSnapshot) => boolean;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 生成默认会话标题
const generateSessionTitle = (): string => {
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return `新会话 ${dateStr} ${timeStr}`;
};

// 欢迎消息
const getWelcomeMessage = (): AgentMessage => ({
  id: generateId(),
  role: 'director',
  content: '你好！我是津脉设计总监，很高兴为你服务。\n\n我可以帮你完成：\n• IP形象设计与孵化\n• 品牌创意包装设计\n• 老字号宣传海报设计\n• 其他创意设计需求\n\n请告诉我你想要设计什么？我会根据你的需求安排最合适的团队成员为你服务。',
  timestamp: Date.now(),
  type: 'text'
});

// 创建初始状态快照
const createInitialSnapshot = (): AgentStateSnapshot => ({
  messages: [getWelcomeMessage()],
  currentAgent: 'director',
  currentTask: null,
  taskStage: 'requirement',
  generatedOutputs: [],
  selectedOutput: null,
  selectedStyle: null,
  delegationHistory: []
});

interface ConversationStoreState {
  sessions: ConversationSession[];
  currentSessionId: string | null;
}

export const useConversationStore = create<ConversationStoreState & ConversationActions>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,

      // 创建新会话
      createSession: (title?: string, description?: string) => {
        const sessionId = generateId();
        
        // 调试：记录创建会话前的状态
        const beforeState = useAgentStore.getState();
        console.log('[ConversationStore] 创建会话前 selectedStyle:', beforeState.selectedStyle);

        // 先重置 Agent Store 到初始状态，确保清除所有状态包括 selectedStyle
        useAgentStore.getState().resetState();
        
        // 调试：记录 resetState 后的状态
        const afterResetState = useAgentStore.getState();
        console.log('[ConversationStore] resetState 后 selectedStyle:', afterResetState.selectedStyle);

        // 额外确保 selectedStyle 和相关状态被清除
        useAgentStore.setState({
          selectedStyle: null,
          selectedOutput: null,
          generatedOutputs: []
        });
        
        // 调试：记录最终状态
        const finalState = useAgentStore.getState();
        console.log('[ConversationStore] 创建会话后 selectedStyle:', finalState.selectedStyle);

        const newSession: ConversationSession = {
          id: sessionId,
          title: title || generateSessionTitle(),
          description: description || '新开始的设计对话',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 1,
          stateSnapshot: createInitialSnapshot()
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: sessionId
        }));

        return sessionId;
      },

      // 验证会话状态完整性
      validateSessionState: (snapshot: AgentStateSnapshot): boolean => {
        if (!snapshot) {
          console.warn('[ConversationStore] 会话状态快照为空');
          return false;
        }
        // 验证必要字段
        if (!Array.isArray(snapshot.messages)) {
          console.warn('[ConversationStore] 会话消息不是数组');
          return false;
        }
        if (!snapshot.currentAgent) {
          console.warn('[ConversationStore] 当前 Agent 未设置');
          return false;
        }
        return true;
      },

      // 恢复会话状态到 Agent Store
      restoreSessionToAgent: (sessionId: string): boolean => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) {
          console.warn('[ConversationStore] 未找到会话:', sessionId);
          return false;
        }

        const snapshot = session.stateSnapshot;

        // 验证状态完整性
        if (!get().validateSessionState(snapshot)) {
          console.warn('[ConversationStore] 会话状态验证失败，使用默认状态');
          // 使用默认状态恢复
          useAgentStore.setState({
            messages: snapshot.messages?.length > 0 ? snapshot.messages : [getWelcomeMessage()],
            currentAgent: snapshot.currentAgent || 'director',
            currentTask: snapshot.currentTask || null,
            taskStage: snapshot.taskStage || 'requirement',
            generatedOutputs: snapshot.generatedOutputs || [],
            selectedOutput: snapshot.selectedOutput || null,
            selectedStyle: snapshot.selectedStyle || null,
            delegationHistory: snapshot.delegationHistory || []
          });
          return true;
        }

        // 完整恢复状态
        console.log('[ConversationStore] 恢复会话状态:', sessionId, '消息数:', snapshot.messages.length);
        useAgentStore.setState({
          messages: snapshot.messages,
          currentAgent: snapshot.currentAgent,
          currentTask: snapshot.currentTask,
          taskStage: snapshot.taskStage,
          generatedOutputs: snapshot.generatedOutputs || [],
          selectedOutput: snapshot.selectedOutput || null,
          selectedStyle: snapshot.selectedStyle || null,
          delegationHistory: snapshot.delegationHistory || []
        });
        return true;
      },

      // 切换会话
      switchSession: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) {
          console.warn('[ConversationStore] 切换会话失败，未找到会话:', sessionId);
          return;
        }

        if (sessionId === get().currentSessionId) {
          console.log('[ConversationStore] 已是当前会话，无需切换');
          return;
        }

        console.log('[ConversationStore] 切换会话:', sessionId, '->', session.title);

        // 先保存当前会话
        get().saveCurrentSession();

        // 切换到新会话
        set({ currentSessionId: sessionId });

        // 恢复会话状态
        const restored = get().restoreSessionToAgent(sessionId);
        if (!restored) {
          console.error('[ConversationStore] 会话状态恢复失败');
        }
      },

      // 删除会话
      deleteSession: (sessionId: string) => {
        set((state) => {
          const newSessions = state.sessions.filter(s => s.id !== sessionId);

          // 如果删除的是当前会话，切换到第一个可用会话或创建新会话
          if (state.currentSessionId === sessionId) {
            if (newSessions.length > 0) {
              const nextSession = newSessions[0];
              console.log('[ConversationStore] 删除当前会话，切换到:', nextSession.id);
              // 使用 restoreSessionToAgent 恢复会话状态
              setTimeout(() => {
                get().restoreSessionToAgent(nextSession.id);
              }, 0);
              return {
                sessions: newSessions,
                currentSessionId: nextSession.id
              };
            } else {
              // 没有会话了，重置状态
              console.log('[ConversationStore] 删除最后一个会话，重置状态');
              useAgentStore.getState().resetState();
              return {
                sessions: [],
                currentSessionId: null
              };
            }
          }

          return { sessions: newSessions };
        });
      },

      // 更新会话标题
      updateSessionTitle: (sessionId: string, title: string) => {
        set((state) => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s
          )
        }));
      },

      // 更新会话描述
      updateSessionDescription: (sessionId: string, description: string) => {
        set((state) => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId ? { ...s, description, updatedAt: Date.now() } : s
          )
        }));
      },

      // 保存当前会话状态
      saveCurrentSession: () => {
        const { currentSessionId, sessions } = get();
        if (!currentSessionId) return;

        const agentState = useAgentStore.getState();
        const snapshot: AgentStateSnapshot = {
          messages: agentState.messages,
          currentAgent: agentState.currentAgent,
          currentTask: agentState.currentTask,
          taskStage: agentState.taskStage,
          generatedOutputs: agentState.generatedOutputs,
          selectedOutput: agentState.selectedOutput,
          selectedStyle: agentState.selectedStyle,
          delegationHistory: agentState.delegationHistory
        };

        set({
          sessions: sessions.map(s =>
            s.id === currentSessionId
              ? {
                  ...s,
                  stateSnapshot: snapshot,
                  messageCount: agentState.messages.length,
                  updatedAt: Date.now()
                }
              : s
          )
        });
      },

      // 获取会话列表
      getSessions: () => get().sessions,

      // 获取当前会话
      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find(s => s.id === currentSessionId) || null;
      },

      // 清空所有会话
      clearAllSessions: () => {
        set({ sessions: [], currentSessionId: null });
        useAgentStore.getState().resetState();
      }
    }),
    {
      name: 'conversation-store',
      partialize: (state) => ({
        sessions: state.sessions.slice(0, 50), // 最多保留50个会话
        currentSessionId: state.currentSessionId
      })
    }
  )
);

// 自动保存当前会话的钩子
export const autoSaveSession = () => {
  try {
    const conversationStore = useConversationStore.getState();
    const agentStore = useAgentStore.getState();

    // 如果没有当前会话，但有多条消息，自动创建一个
    if (!conversationStore.currentSessionId && agentStore.messages.length > 1) {
      const title = agentStore.currentTask?.title || generateSessionTitle();
      console.log('[autoSaveSession] 自动创建新会话:', title);
      conversationStore.createSession(title);
    } else if (conversationStore.currentSessionId) {
      // 保存当前会话
      conversationStore.saveCurrentSession();
    }
  } catch (error) {
    console.error('[autoSaveSession] 自动保存失败:', error);
  }
};

// 初始化时恢复会话的辅助函数
export const initializeSession = (): string | null => {
  try {
    const conversationStore = useConversationStore.getState();
    const agentStore = useAgentStore.getState();

    // 如果已经有当前会话，恢复它
    if (conversationStore.currentSessionId) {
      console.log('[initializeSession] 恢复当前会话:', conversationStore.currentSessionId);
      const restored = conversationStore.restoreSessionToAgent(conversationStore.currentSessionId);
      if (restored) {
        return conversationStore.currentSessionId;
      }
    }

    // 如果有本地存储的会话，恢复最新的一个
    const sessions = conversationStore.getSessions();
    if (sessions.length > 0) {
      const latestSession = sessions[0];
      console.log('[initializeSession] 恢复最新会话:', latestSession.id, latestSession.title);
      conversationStore.switchSession(latestSession.id);
      return latestSession.id;
    }

    // 如果 Agent Store 中有消息但没有会话，创建一个新会话
    if (agentStore.messages.length > 1) {
      const title = agentStore.currentTask?.title || generateSessionTitle();
      console.log('[initializeSession] 根据现有消息创建会话:', title);
      return conversationStore.createSession(title);
    }

    console.log('[initializeSession] 没有可恢复的会话');
    return null;
  } catch (error) {
    console.error('[initializeSession] 初始化会话失败:', error);
    return null;
  }
};
