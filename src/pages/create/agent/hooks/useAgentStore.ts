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
  AGENT_CONFIG,
  LLMModelType
} from '../types/agent';
import { setCurrentModelInStorage } from '../services/modelCaller';
// import { getMemoryService } from '../services/memoryService';

// 欢迎消息配置选项
interface WelcomeMessageOptions {
  userName?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  isReturningUser?: boolean;
  previousTaskType?: string;
}

// 根据时间获取问候语
const getGreetingByTime = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

// 获取个性化欢迎消息
const getWelcomeMessage = (options: WelcomeMessageOptions = {}): AgentMessage => {
  const { userName, timeOfDay, isReturningUser, previousTaskType } = options;

  // 基础问候
  const greeting = timeOfDay || getGreetingByTime();
  const namePart = userName ? `，${userName}` : '';

  // 根据用户类型调整内容
  let welcomeContent = '';

  if (isReturningUser && previousTaskType) {
    // 回头客，提及之前的任务类型
    welcomeContent = `${greeting}${namePart}！欢迎回来，我是津脉设计总监。\n\n我可以帮你完成：
• IP形象设计与孵化
• 品牌创意包装设计
• 老字号宣传海报设计
• 其他创意设计需求\n\n上次你关注了${previousTaskType}，今天想要设计什么？我会为你安排最合适的团队成员。`;
  } else if (isReturningUser) {
    // 回头客，无特定任务类型
    welcomeContent = `${greeting}${namePart}！欢迎回来，我是津脉设计总监，很高兴再次为你服务。\n\n我可以帮你完成：
• IP形象设计与孵化
• 品牌创意包装设计
• 老字号宣传海报设计
• 其他创意设计需求\n\n今天想要设计什么？`;
  } else {
    // 新用户
    welcomeContent = `${greeting}${namePart}！我是津脉设计总监，很高兴为你服务。\n\n我可以帮你完成：
• IP形象设计与孵化
• 品牌创意包装设计
• 老字号宣传海报设计
• 其他创意设计需求\n\n请告诉我你想要设计什么？我会根据你的需求安排最合适的团队成员为你服务。`;
  }

  return {
    id: generateId(),
    role: 'director',
    content: welcomeContent,
    timestamp: Date.now(),
    type: 'text'
  };
};

// 从localStorage获取用户信息
const getUserInfoFromStorage = (): WelcomeMessageOptions => {
  try {
    const userInfo = localStorage.getItem('agent-user-info');
    if (userInfo) {
      return JSON.parse(userInfo);
    }
  } catch (e) {
    console.warn('[AgentStore] Failed to parse user info:', e);
  }
  return {};
};

// 保存用户信息到localStorage
export const saveUserInfo = (options: WelcomeMessageOptions): void => {
  try {
    localStorage.setItem('agent-user-info', JSON.stringify(options));
  } catch (e) {
    console.warn('[AgentStore] Failed to save user info:', e);
  }
};

interface AgentActions {
  // 消息操作
  addMessage: (message: Omit<AgentMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<AgentMessage>) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;
  setMessages: (messages: AgentMessage[]) => void; // 新增：直接设置消息列表

  // Agent切换
  setCurrentAgent: (agent: AgentType) => void;
  setIsTyping: (isTyping: boolean) => void;

  // LLM模型切换
  setCurrentModel: (model: LLMModelType) => void;

  // 任务管理
  createTask: (type: DesignTask['type'], title: string, description: string) => void;
  updateTask: (updates: Partial<DesignTask>) => void;
  updateTaskRequirements: (requirements: Partial<DesignTask['requirements']>) => void;
  setTaskStage: (stage: TaskStage) => void;
  completeTask: () => void;
  setTasks: (tasks: DesignTask[]) => void; // 新增：直接设置任务列表

  // 生成内容管理
  addOutput: (output: Omit<GeneratedOutput, 'id' | 'createdAt'>) => void;
  updateOutput: (id: string, updates: Partial<GeneratedOutput>) => void;
  selectOutput: (id: string | null) => void;
  deleteOutput: (id: string) => void;
  clearOutputs: () => void;
  setGeneratedContent: (content: GeneratedOutput[]) => void; // 新增：直接设置生成内容

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

  // 需求收集管理
  setRequirementStage: (stage: RequirementStage) => void;
  updateRequirementInfo: (info: Partial<CollectedRequirementInfo>) => void;
  setRequirementConfirmed: (confirmed: boolean) => void;
  addPendingQuestion: (question: string) => void;
  removePendingQuestion: (question: string) => void;
  setSummaryShown: (shown: boolean) => void;
  setAssignmentShown: (shown: boolean) => void;
  resetRequirementCollection: () => void;
  incrementQuestionCount: () => void;
  setLastSummaryAt: (count: number) => void;

  // 引用管理
  setPendingMention: (mention: { type: 'work' | 'brand' | 'style'; name: string; id?: string } | null) => void;
  clearPendingMention: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialState: AgentState = {
  messages: [],
  currentAgent: 'director',
  isTyping: false,
  currentModel: 'qwen',
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
  currentDelegation: null,
  // 需求收集状态
  requirementCollection: {
    stage: 'initial',
    collectedInfo: {},
    pendingQuestions: [],
    confirmed: false,
    summaryShown: false,
    assignmentShown: false,
    questionCount: 0,
    lastSummaryAt: 0
  },
  // 待处理的引用
  pendingMention: null
};

export const useAgentStore = create<AgentState & AgentActions>()(
  persist(
    (set, get) => {
      // 获取用户信息并生成个性化欢迎消息
      const userInfo = getUserInfoFromStorage();
      const welcomeMessage = getWelcomeMessage({
        ...userInfo,
        previousTaskType: undefined
      });

      // 从持久化状态恢复时，同步模型到 storage
      const state = get();
      if (state?.currentModel) {
        setCurrentModelInStorage(state.currentModel);
      }

      return {
        ...initialState,

        // 初始化欢迎消息
        messages: [welcomeMessage],

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

      clearMessages: () => set((state) => {
        const userInfo = getUserInfoFromStorage();
        const welcomeMessage = getWelcomeMessage({
          ...userInfo,
          previousTaskType: state.currentTask?.type,
          isReturningUser: state.messages.length > 2
        });
        return { messages: [welcomeMessage] };
      }),

      // 新增：直接设置消息列表（用于资源管理器清理）
      setMessages: (messages) => set({ messages }),

      // Agent切换
      setCurrentAgent: (agent) => set({ currentAgent: agent }),
      setIsTyping: (isTyping) => set({ isTyping }),

      // LLM模型切换
      setCurrentModel: (model) => {
        set({ currentModel: model });
        // 同步到 modelCaller 的 storage
        setCurrentModelInStorage(model);
        console.log('[AgentStore] LLM模型已切换为:', model);
      },

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

      // 新增：直接设置任务列表（用于资源管理器清理）
      setTasks: (tasks) => set({
        currentTask: tasks.length > 0 ? tasks[tasks.length - 1] : null
      }),

      // 生成内容管理
      addOutput: (output) => set((state) => {
        const newOutput: GeneratedOutput = {
          ...output,
          id: generateId(),
          createdAt: Date.now()
        };

        // 记录到记忆服务 (暂时禁用)
        // const memoryService = getMemoryService();
        // if (output.style) {
        //   memoryService.recordStylePreference(output.style, true);
        // }
        // if (state.currentTask) {
        //   memoryService.recordTaskType(state.currentTask.type);
        // }

        return {
          generatedOutputs: [...state.generatedOutputs, newOutput],
          selectedOutput: newOutput.id
        };
      }),

      updateOutput: (id, updates) => set((state) => ({
        generatedOutputs: state.generatedOutputs.map(out =>
          out.id === id ? { ...out, ...updates } : out
        )
      })),

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

      // 新增：直接设置生成内容列表（用于资源管理器清理）
      setGeneratedContent: (content) => set({ generatedOutputs: content }),

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

      resetState: () => {
        const userInfo = getUserInfoFromStorage();
        const welcomeMessage = getWelcomeMessage({
          ...userInfo,
          isReturningUser: true
        });
        return set({
          ...initialState,
          messages: [welcomeMessage]
        });
      },

      // 需求收集管理
      setRequirementStage: (stage) => set((state) => ({
        requirementCollection: {
          ...state.requirementCollection,
          stage
        }
      })),

      updateRequirementInfo: (info) => set((state) => ({
        requirementCollection: {
          ...state.requirementCollection,
          collectedInfo: {
            ...state.requirementCollection.collectedInfo,
            ...info
          }
        }
      })),

      setRequirementConfirmed: (confirmed) => set((state) => ({
        requirementCollection: {
          ...state.requirementCollection,
          confirmed
        }
      })),

      addPendingQuestion: (question) => set((state) => ({
        requirementCollection: {
          ...state.requirementCollection,
          pendingQuestions: [...state.requirementCollection.pendingQuestions, question]
        }
      })),

      removePendingQuestion: (question) => set((state) => ({
        requirementCollection: {
          ...state.requirementCollection,
          pendingQuestions: state.requirementCollection.pendingQuestions.filter(q => q !== question)
        }
      })),

      setSummaryShown: (shown) => set((state) => ({
        requirementCollection: {
          ...state.requirementCollection,
          summaryShown: shown
        }
      })),

      setAssignmentShown: (shown) => set((state) => ({
        requirementCollection: {
          ...state.requirementCollection,
          assignmentShown: shown
        }
      })),

      resetRequirementCollection: () => set((state) => ({
        requirementCollection: {
          stage: 'initial',
          collectedInfo: {},
          pendingQuestions: [
            '项目类型是什么？（品牌设计/IP设计/包装设计/海报设计/动画视频等）',
            '目标受众是谁？（年龄、性别、职业、喜好）',
            '你喜欢什么风格？（温馨/科技/简约/复古/华丽等）',
            '主要使用场景是什么？（线上推广/线下物料/印刷/视频等）',
            '时间要求如何？（紧急/正常/宽松）',
            '有参考案例或竞品吗？'
          ],
          confirmed: false,
          summaryShown: false,
          assignmentShown: false,
          questionCount: 0,
          lastSummaryAt: 0
        }
      })),

      incrementQuestionCount: () => set((state) => ({
        requirementCollection: {
          ...state.requirementCollection,
          questionCount: state.requirementCollection.questionCount + 1
        }
      })),

      setLastSummaryAt: (count) => set((state) => ({
        requirementCollection: {
          ...state.requirementCollection,
          lastSummaryAt: count
        }
      })),

      // 引用管理
      setPendingMention: (mention) => set({ pendingMention: mention }),
      clearPendingMention: () => set({ pendingMention: null })
    }},
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
