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

        // 先重置 Agent Store 到初始状态，确保清除所有状态包括 selectedStyle
        useAgentStore.getState().resetState();

        // 额外确保 selectedStyle 和相关状态被清除
        useAgentStore.setState({
          selectedStyle: null,
          selectedOutput: null,
          generatedOutputs: []
        });

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

      // 切换会话
      switchSession: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return;

        // 先保存当前会话
        get().saveCurrentSession();

        // 切换到新会话
        set({ currentSessionId: sessionId });

        // 恢复会话状态到 Agent Store
        const snapshot = session.stateSnapshot;
        useAgentStore.setState({
          messages: snapshot.messages,
          currentAgent: snapshot.currentAgent,
          currentTask: snapshot.currentTask,
          taskStage: snapshot.taskStage,
          generatedOutputs: snapshot.generatedOutputs,
          selectedOutput: snapshot.selectedOutput,
          selectedStyle: snapshot.selectedStyle,
          delegationHistory: snapshot.delegationHistory
        });
      },

      // 删除会话
      deleteSession: (sessionId: string) => {
        set((state) => {
          const newSessions = state.sessions.filter(s => s.id !== sessionId);

          // 如果删除的是当前会话，切换到第一个可用会话或创建新会话
          if (state.currentSessionId === sessionId) {
            if (newSessions.length > 0) {
              const nextSession = newSessions[0];
              // 恢复第一个会话的状态
              const snapshot = nextSession.stateSnapshot;
              useAgentStore.setState({
                messages: snapshot.messages,
                currentAgent: snapshot.currentAgent,
                currentTask: snapshot.currentTask,
                taskStage: snapshot.taskStage,
                generatedOutputs: snapshot.generatedOutputs,
                selectedOutput: snapshot.selectedOutput,
                selectedStyle: snapshot.selectedStyle,
                delegationHistory: snapshot.delegationHistory
              });
              return {
                sessions: newSessions,
                currentSessionId: nextSession.id
              };
            } else {
              // 没有会话了，创建一个新会话
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
  const conversationStore = useConversationStore.getState();
  const agentStore = useAgentStore.getState();

  // 如果没有当前会话，自动创建一个
  if (!conversationStore.currentSessionId && agentStore.messages.length > 1) {
    const title = agentStore.currentTask?.title || generateSessionTitle();
    conversationStore.createSession(title);
  } else if (conversationStore.currentSessionId) {
    // 保存当前会话
    conversationStore.saveCurrentSession();
  }
};
