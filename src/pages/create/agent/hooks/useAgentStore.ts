import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AgentState,
  AgentMessage,
  DesignTask,
  GeneratedOutput,
  ToolCall,
  TaskStage,
  PRESET_STYLES,
  DERIVATIVE_OPTIONS,
  AgentType,
  DelegationTask,
  AGENT_CONFIG
} from '../types/agent';

interface AgentActions {
  // 消息操作
  addMessage: (message: Omit<AgentMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<AgentMessage>) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;

  // Agent切换
  setCurrentAgent: (agent: AgentType) => void;
  setIsTyping: (isTyping: boolean) => void;

  // 任务管理
  createTask: (type: DesignTask['type'], title: string, description: string) => void;
  updateTask: (updates: Partial<DesignTask>) => void;
  updateTaskRequirements: (requirements: Partial<DesignTask['requirements']>) => void;
  setTaskStage: (stage: TaskStage) => void;
  completeTask: () => void;

  // 生成内容管理
  addOutput: (output: Omit<GeneratedOutput, 'id' | 'createdAt'>) => void;
  selectOutput: (id: string | null) => void;
  deleteOutput: (id: string) => void;
  clearOutputs: () => void;

  // 风格选择
  selectStyle: (styleId: string | null) => void;

  // 画布操作
  setCanvasZoom: (zoom: number) => void;
  setCanvasPosition: (position: { x: number; y: number }) => void;
  setSelectedTool: (tool: 'select' | 'move' | 'hand') => void;
  resetCanvas: () => void;

  // UI状态
  setShowStyleSelector: (show: boolean) => void;
  setShowSatisfactionModal: (show: boolean) => void;
  setShowThinkingProcess: (show: boolean) => void;
  toggleChatCollapsed: () => void;

  // 工具调用
  addToolCall: (toolCall: Omit<ToolCall, 'id'>) => string;
  updateToolCall: (id: string, updates: Partial<ToolCall>) => void;
  removeToolCall: (id: string) => void;
  clearToolCalls: () => void;

  // Agent 编排相关操作
  delegateToAgent: (toAgent: AgentType, taskDescription: string, context: string) => string;
  completeDelegation: (delegationId: string, result?: string) => void;
  addToAgentQueue: (agents: AgentType[]) => void;
  processNextInQueue: () => AgentType | null;
  clearAgentQueue: () => void;
  setCollaborating: (isCollaborating: boolean, agents?: AgentType[]) => void;
  addCollaborationResult: (agent: AgentType, result: string) => void;

  // 批量更新
  updateState: (updates: Partial<AgentState>) => void;
  resetState: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialState: AgentState = {
  messages: [],
  currentAgent: 'director',
  isTyping: false,
  currentTask: null,
  taskStage: 'requirement',
  generatedOutputs: [],
  selectedOutput: null,
  selectedStyle: null,
  canvasZoom: 100,
  canvasPosition: { x: 0, y: 0 },
  selectedTool: 'select',
  showStyleSelector: false,
  showSatisfactionModal: false,
  showThinkingProcess: false,
  isChatCollapsed: false,
  activeToolCalls: [],
  // Agent 编排相关状态
  agentQueue: [],
  delegationHistory: [],
  isCollaborating: false,
  collaborationAgents: [],
  currentDelegation: null
};

// 欢迎消息
const getWelcomeMessage = (): AgentMessage => ({
  id: generateId(),
  role: 'director',
  content: '你好！我是津脉设计总监，很高兴为你服务。\n\n我可以帮你完成：\n• IP形象设计与孵化\n• 品牌创意包装设计\n• 老字号宣传海报设计\n• 其他创意设计需求\n\n请告诉我你想要设计什么？我会根据你的需求安排最合适的团队成员为你服务。',
  timestamp: Date.now(),
  type: 'text'
});

export const useAgentStore = create<AgentState & AgentActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 初始化欢迎消息
      messages: [getWelcomeMessage()],

      // 消息操作
      addMessage: (message) => {
        const id = generateId();
        set((state) => ({
          messages: [...state.messages, {
            ...message,
            id,
            timestamp: Date.now()
          }]
        }));
        return id;
      },

      updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map(msg =>
          msg.id === id ? { ...msg, ...updates } : msg
        )
      })),

      deleteMessage: (id) => set((state) => ({
        messages: state.messages.filter(msg => msg.id !== id)
      })),

      clearMessages: () => set({
        messages: [getWelcomeMessage()]
      }),

      // Agent切换
      setCurrentAgent: (agent) => set({ currentAgent: agent }),
      setIsTyping: (isTyping) => set({ isTyping }),

      // 任务管理
      createTask: (type, title, description) => set({
        currentTask: {
          id: generateId(),
          type,
          title,
          requirements: { description },
          status: 'requirement',
          outputs: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        taskStage: 'requirement'
      }),

      updateTask: (updates) => set((state) => ({
        currentTask: state.currentTask ? {
          ...state.currentTask,
          ...updates,
          updatedAt: Date.now()
        } : null
      })),

      updateTaskRequirements: (requirements) => set((state) => ({
        currentTask: state.currentTask ? {
          ...state.currentTask,
          requirements: {
            ...state.currentTask.requirements,
            ...requirements
          },
          updatedAt: Date.now()
        } : null
      })),

      setTaskStage: (stage) => set({ taskStage: stage }),

      completeTask: () => set((state) => ({
        currentTask: state.currentTask ? {
          ...state.currentTask,
          status: 'completed',
          updatedAt: Date.now()
        } : null,
        taskStage: 'completed'
      })),

      // 生成内容管理
      addOutput: (output) => set((state) => {
        const newOutput: GeneratedOutput = {
          ...output,
          id: generateId(),
          createdAt: Date.now()
        };
        return {
          generatedOutputs: [...state.generatedOutputs, newOutput],
          selectedOutput: newOutput.id
        };
      }),

      selectOutput: (id) => set({ selectedOutput: id }),

      deleteOutput: (id) => set((state) => ({
        generatedOutputs: state.generatedOutputs.filter(out => out.id !== id),
        selectedOutput: state.selectedOutput === id
          ? (state.generatedOutputs.find(out => out.id !== id)?.id || null)
          : state.selectedOutput
      })),

      clearOutputs: () => set({
        generatedOutputs: [],
        selectedOutput: null
      }),

      // 风格选择
      selectStyle: (styleId) => set({ selectedStyle: styleId }),

      // 画布操作
      setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
      setCanvasPosition: (position) => set({ canvasPosition: position }),
      setSelectedTool: (tool) => set({ selectedTool: tool }),
      resetCanvas: () => set({
        canvasZoom: 100,
        canvasPosition: { x: 0, y: 0 },
        selectedTool: 'select'
      }),

      // UI状态
      setShowStyleSelector: (show) => set({ showStyleSelector: show }),
      setShowSatisfactionModal: (show) => set({ showSatisfactionModal: show }),
      setShowThinkingProcess: (show) => set({ showThinkingProcess: show }),
      toggleChatCollapsed: () => set((state) => ({
        isChatCollapsed: !state.isChatCollapsed
      })),

      // 工具调用
      addToolCall: (toolCall) => {
        const id = generateId();
        set((state) => ({
          activeToolCalls: [...state.activeToolCalls, { ...toolCall, id }]
        }));
        return id;
      },

      updateToolCall: (id, updates) => set((state) => ({
        activeToolCalls: state.activeToolCalls.map(tc =>
          tc.id === id ? { ...tc, ...updates } : tc
        )
      })),

      removeToolCall: (id) => set((state) => ({
        activeToolCalls: state.activeToolCalls.filter(tc => tc.id !== id)
      })),

      clearToolCalls: () => set({ activeToolCalls: [] }),

      // Agent 编排相关操作
      delegateToAgent: (toAgent, taskDescription, context) => {
        const id = generateId();
        const fromAgent = get().currentAgent;

        const delegationTask: DelegationTask = {
          id,
          fromAgent,
          toAgent,
          taskDescription,
          context,
          status: 'in_progress',
          createdAt: Date.now()
        };

        set((state) => ({
          delegationHistory: [...state.delegationHistory, delegationTask],
          currentDelegation: delegationTask,
          currentAgent: toAgent
        }));

        return id;
      },

      completeDelegation: (delegationId, result) => set((state) => ({
        delegationHistory: state.delegationHistory.map(d =>
          d.id === delegationId
            ? { ...d, status: 'completed', completedAt: Date.now(), result }
            : d
        ),
        currentDelegation: null
      })),

      addToAgentQueue: (agents) => set((state) => ({
        agentQueue: [...state.agentQueue, ...agents]
      })),

      processNextInQueue: () => {
        const { agentQueue } = get();
        if (agentQueue.length === 0) return null;

        const nextAgent = agentQueue[0];
        set((state) => ({
          agentQueue: state.agentQueue.slice(1),
          currentAgent: nextAgent
        }));

        return nextAgent;
      },

      clearAgentQueue: () => set({ agentQueue: [] }),

      setCollaborating: (isCollaborating, agents = []) => set({
        isCollaborating,
        collaborationAgents: agents
      }),

      addCollaborationResult: (agent, result) => set((state) => {
        // 添加协作结果作为消息
        const collaborationMessage: AgentMessage = {
          id: generateId(),
          role: agent,
          content: result,
          timestamp: Date.now(),
          type: 'collaboration',
          metadata: {
            collaborationInfo: {
              participatingAgents: state.collaborationAgents,
              taskDescription: '协作任务',
              progress: 100
            }
          }
        };

        return {
          messages: [...state.messages, collaborationMessage]
        };
      }),

      // 批量更新
      updateState: (updates) => set((state) => ({ ...state, ...updates })),

      resetState: () => set({
        ...initialState,
        messages: [getWelcomeMessage()]
      })
    }),
    {
      name: 'agent-store',
      partialize: (state) => ({
        messages: state.messages.slice(-50), // 只保留最近50条消息
        currentTask: state.currentTask,
        generatedOutputs: state.generatedOutputs,
        selectedStyle: state.selectedStyle,
        delegationHistory: state.delegationHistory
      })
    }
  )
);

// 导出预设数据
export { PRESET_STYLES, DERIVATIVE_OPTIONS, AGENT_CONFIG };

// 导出辅助函数
export function getCurrentAgentConfig() {
  const { currentAgent } = useAgentStore.getState();
  return AGENT_CONFIG[currentAgent as keyof typeof AGENT_CONFIG] || AGENT_CONFIG.director;
}
