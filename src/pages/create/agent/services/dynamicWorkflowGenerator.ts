/**
 * 动态工作流生成器 - Dynamic Workflow Generator
 * 
 * 功能特性:
 * - 意图驱动工作流: 根据用户意图自动生成工作流
 * - 模板库: 预设多种工作流模板
 * - 动态编排: 根据上下文动态调整工作流步骤
 * - 条件分支: 支持条件判断和分支执行
 * - 并行执行: 支持步骤并行化
 * - 自适应优化: 根据执行历史优化工作流
 */

import { v4 as uuidv4 } from 'uuid';
import { IntentType } from './intentRecognition';
import { indexedDBStorage, StoreName } from './indexedDBStorage';

// 工作流定义
export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  intentTypes: IntentType[];
  steps: WorkflowStep[];
  variables: WorkflowVariable[];
  metadata: WorkflowMetadata;
  createdAt: number;
  updatedAt: number;
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
}

// 工作流步骤
export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  description?: string;
  config: StepConfig;
  dependencies: string[];
  condition?: StepCondition;
  retryPolicy?: RetryPolicy;
  timeout?: number;
  onError?: ErrorHandler;
}

// 步骤类型
export type StepType =
  | 'agent_call'
  | 'api_call'
  | 'condition'
  | 'parallel'
  | 'sequential'
  | 'loop'
  | 'wait'
  | 'transform'
  | 'user_input'
  | 'output'
  | 'custom';

// 步骤配置
export interface StepConfig {
  // Agent调用配置
  agentType?: string;
  prompt?: string;
  context?: Record<string, any>;
  
  // API调用配置
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  
  // 条件配置
  condition?: string;
  trueBranch?: string[];
  falseBranch?: string[];
  
  // 并行配置
  parallelSteps?: WorkflowStep[];
  
  // 循环配置
  loopCondition?: string;
  maxIterations?: number;
  loopBody?: WorkflowStep[];
  
  // 等待配置
  waitDuration?: number;
  waitForEvent?: string;
  
  // 转换配置
  transformScript?: string;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
  
  // 用户输入配置
  inputType?: 'text' | 'select' | 'multiselect' | 'confirm';
  inputPrompt?: string;
  inputOptions?: string[];
  
  // 输出配置
  outputFormat?: 'json' | 'text' | 'markdown';
  outputTemplate?: string;
  
  // 自定义配置
  customHandler?: string;
  customConfig?: Record<string, any>;
}

// 步骤条件
export interface StepCondition {
  type: 'expression' | 'variable' | 'function';
  expression?: string;
  variable?: string;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'exists';
  value?: any;
  handler?: string;
}

// 重试策略
export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

// 错误处理
export interface ErrorHandler {
  action: 'retry' | 'skip' | 'fail' | 'fallback';
  fallbackStep?: string;
  errorMessage?: string;
}

// 工作流变量
export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  required: boolean;
  description?: string;
}

// 工作流元数据
export interface WorkflowMetadata {
  author: string;
  tags: string[];
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number;
  prerequisites?: string[];
}

// 工作流执行上下文
export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  variables: Record<string, any>;
  stepResults: Map<string, StepResult>;
  executionPath: string[];
  startTime: number;
  currentStep?: string;
  parentContext?: string;
}

// 步骤执行结果
export interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  output?: any;
  error?: Error;
  retryCount: number;
}

// 工作流执行结果
export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  status: 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime: number;
  duration: number;
  results: Map<string, StepResult>;
  output?: any;
  error?: Error;
  executionPath: string[];
}

// 工作流模板
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  intentTypes: IntentType[];
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  template: Partial<Workflow>;
  parameters: TemplateParameter[];
}

// 模板参数
export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

// 工作流生成配置
export interface WorkflowGenerationConfig {
  intentType: IntentType;
  userQuery: string;
  context?: Record<string, any>;
  complexity?: 'simple' | 'medium' | 'complex';
  preferredAgents?: string[];
  constraints?: WorkflowConstraint[];
}

// 工作流约束
export interface WorkflowConstraint {
  type: 'time' | 'resource' | 'dependency' | 'quality';
  description: string;
  limit: number;
  priority: 'low' | 'medium' | 'high';
}

// 工作流优化建议
export interface WorkflowOptimization {
  type: 'parallelization' | 'caching' | 'simplification' | 'reordering';
  description: string;
  impact: 'high' | 'medium' | 'low';
  steps: string[];
  expectedImprovement: number;
}

// 预设工作流模板库
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template_code_generation',
    name: '代码生成工作流',
    description: '根据需求生成、优化和验证代码的完整工作流',
    intentTypes: ['code_generation', 'optimization'],
    category: 'development',
    complexity: 'medium',
    template: {
      name: '智能代码生成工作流',
      description: '分析需求、生成代码、代码审查和优化',
      steps: [
        {
          id: 'step_1_analyze',
          name: '需求分析',
          type: 'agent_call',
          config: {
            agentType: 'analyzer',
            prompt: '分析用户的代码需求，提取关键要求和技术约束'
          },
          dependencies: []
        },
        {
          id: 'step_2_generate',
          name: '代码生成',
          type: 'agent_call',
          config: {
            agentType: 'programmer',
            prompt: '基于分析结果生成代码'
          },
          dependencies: ['step_1_analyze']
        },
        {
          id: 'step_3_review',
          name: '代码审查',
          type: 'agent_call',
          config: {
            agentType: 'reviewer',
            prompt: '审查生成的代码，检查潜在问题'
          },
          dependencies: ['step_2_generate']
        },
        {
          id: 'step_4_condition',
          name: '质量检查',
          type: 'condition',
          config: {
            condition: 'review.qualityScore >= 0.8',
            trueBranch: ['step_5_output'],
            falseBranch: ['step_2_generate']
          },
          dependencies: ['step_3_review']
        },
        {
          id: 'step_5_output',
          name: '输出结果',
          type: 'output',
          config: {
            outputFormat: 'markdown',
            outputTemplate: '## 生成的代码\n\n{code}\n\n## 说明\n\n{explanation}'
          },
          dependencies: ['step_4_condition']
        }
      ],
      variables: [
        { name: 'requirements', type: 'string', required: true, description: '代码需求描述' },
        { name: 'language', type: 'string', required: false, defaultValue: 'typescript', description: '编程语言' },
        { name: 'qualityThreshold', type: 'number', required: false, defaultValue: 0.8, description: '质量阈值' }
      ]
    },
    parameters: [
      { name: 'language', type: 'select', description: '目标编程语言', required: true, options: ['typescript', 'javascript', 'python', 'java', 'go'] },
      { name: 'includeTests', type: 'boolean', description: '是否包含测试代码', required: false, defaultValue: false }
    ]
  },
  {
    id: 'template_design_creation',
    name: '设计方案生成工作流',
    description: '创建完整的设计方案，包括需求分析、概念设计和详细设计',
    intentTypes: ['design_creation', 'requirement_analysis'],
    category: 'design',
    complexity: 'complex',
    template: {
      name: '设计方案生成工作流',
      description: '从需求到完整设计方案的端到端工作流',
      steps: [
        {
          id: 'step_1_requirements',
          name: '需求收集',
          type: 'agent_call',
          config: { agentType: 'requirement_analyst' },
          dependencies: []
        },
        {
          id: 'step_2_research',
          name: '竞品调研',
          type: 'parallel',
          config: {
            parallelSteps: [
              { id: 'research_1', name: '竞品分析', type: 'agent_call', config: {}, dependencies: [] },
              { id: 'research_2', name: '用户研究', type: 'agent_call', config: {}, dependencies: [] },
              { id: 'research_3', name: '技术调研', type: 'agent_call', config: {}, dependencies: [] }
            ]
          },
          dependencies: ['step_1_requirements']
        },
        {
          id: 'step_3_concept',
          name: '概念设计',
          type: 'agent_call',
          config: { agentType: 'concept_designer' },
          dependencies: ['step_2_research']
        },
        {
          id: 'step_4_detailed',
          name: '详细设计',
          type: 'sequential',
          config: {
            loopBody: [
              { id: 'design_module', name: '模块设计', type: 'agent_call', config: {}, dependencies: [] }
            ]
          },
          dependencies: ['step_3_concept']
        },
        {
          id: 'step_5_review',
          name: '设计评审',
          type: 'agent_call',
          config: { agentType: 'design_reviewer' },
          dependencies: ['step_4_detailed']
        },
        {
          id: 'step_6_output',
          name: '生成文档',
          type: 'output',
          config: { outputFormat: 'markdown' },
          dependencies: ['step_5_review']
        }
      ],
      variables: [
        { name: 'projectDescription', type: 'string', required: true },
        { name: 'targetUsers', type: 'string', required: false },
        { name: 'constraints', type: 'object', required: false }
      ]
    },
    parameters: [
      { name: 'designDepth', type: 'select', description: '设计深度', required: true, options: ['concept', 'detailed', 'full'], defaultValue: 'detailed' },
      { name: 'includePrototype', type: 'boolean', description: '包含原型设计', required: false, defaultValue: true }
    ]
  },
  {
    id: 'template_debugging',
    name: '智能调试工作流',
    description: '系统化的代码调试和问题诊断工作流',
    intentTypes: ['debugging', 'optimization'],
    category: 'development',
    complexity: 'medium',
    template: {
      name: '智能调试工作流',
      description: '自动诊断和修复代码问题',
      steps: [
        {
          id: 'step_1_analyze',
          name: '问题分析',
          type: 'agent_call',
          config: { agentType: 'debugger' },
          dependencies: []
        },
        {
          id: 'step_2_reproduce',
          name: '复现验证',
          type: 'condition',
          config: {
            condition: 'canReproduce',
            trueBranch: ['step_3_diagnose'],
            falseBranch: ['step_1_analyze']
          },
          dependencies: ['step_1_analyze']
        },
        {
          id: 'step_3_diagnose',
          name: '根因诊断',
          type: 'agent_call',
          config: { agentType: 'root_cause_analyzer' },
          dependencies: ['step_2_reproduce']
        },
        {
          id: 'step_4_fix',
          name: '生成修复',
          type: 'agent_call',
          config: { agentType: 'fix_generator' },
          dependencies: ['step_3_diagnose']
        },
        {
          id: 'step_5_verify',
          name: '修复验证',
          type: 'agent_call',
          config: { agentType: 'tester' },
          dependencies: ['step_4_fix']
        }
      ],
      variables: [
        { name: 'errorDescription', type: 'string', required: true },
        { name: 'codeContext', type: 'string', required: false },
        { name: 'stackTrace', type: 'string', required: false }
      ]
    },
    parameters: [
      { name: 'autoFix', type: 'boolean', description: '自动应用修复', required: false, defaultValue: false },
      { name: 'testAfterFix', type: 'boolean', description: '修复后运行测试', required: false, defaultValue: true }
    ]
  },
  {
    id: 'template_content_creation',
    name: '内容创作工作流',
    description: '创建高质量内容的完整工作流，包括研究、写作和编辑',
    intentTypes: ['writing', 'content_creation'],
    category: 'content',
    complexity: 'medium',
    template: {
      name: '内容创作工作流',
      description: '从研究到发布的端到端内容创作',
      steps: [
        {
          id: 'step_1_research',
          name: '主题研究',
          type: 'agent_call',
          config: { agentType: 'researcher' },
          dependencies: []
        },
        {
          id: 'step_2_outline',
          name: '生成大纲',
          type: 'agent_call',
          config: { agentType: 'outliner' },
          dependencies: ['step_1_research']
        },
        {
          id: 'step_3_write',
          name: '内容撰写',
          type: 'loop',
          config: {
            loopCondition: 'sectionIndex < totalSections',
            maxIterations: 10,
            loopBody: [
              { id: 'write_section', name: '撰写章节', type: 'agent_call', config: {}, dependencies: [] }
            ]
          },
          dependencies: ['step_2_outline']
        },
        {
          id: 'step_4_edit',
          name: '内容编辑',
          type: 'agent_call',
          config: { agentType: 'editor' },
          dependencies: ['step_3_write']
        },
        {
          id: 'step_5_polish',
          name: '润色优化',
          type: 'agent_call',
          config: { agentType: 'polisher' },
          dependencies: ['step_4_edit']
        }
      ],
      variables: [
        { name: 'topic', type: 'string', required: true },
        { name: 'contentType', type: 'string', required: true },
        { name: 'targetAudience', type: 'string', required: false },
        { name: 'tone', type: 'string', required: false, defaultValue: 'professional' }
      ]
    },
    parameters: [
      { name: 'wordCount', type: 'number', description: '目标字数', required: false, defaultValue: 1000 },
      { name: 'includeImages', type: 'boolean', description: '建议配图', required: false, defaultValue: false }
    ]
  },
  {
    id: 'template_data_analysis',
    name: '数据分析工作流',
    description: '自动化数据分析和洞察提取工作流',
    intentTypes: ['data_analysis', 'requirement_analysis'],
    category: 'analysis',
    complexity: 'complex',
    template: {
      name: '数据分析工作流',
      description: '从数据清洗到洞察报告的完整流程',
      steps: [
        {
          id: 'step_1_ingest',
          name: '数据接入',
          type: 'api_call',
          config: { method: 'GET' },
          dependencies: []
        },
        {
          id: 'step_2_clean',
          name: '数据清洗',
          type: 'transform',
          config: { transformScript: 'cleanData' },
          dependencies: ['step_1_ingest']
        },
        {
          id: 'step_3_explore',
          name: '探索性分析',
          type: 'agent_call',
          config: { agentType: 'data_explorer' },
          dependencies: ['step_2_clean']
        },
        {
          id: 'step_4_analyze',
          name: '深度分析',
          type: 'parallel',
          config: {
            parallelSteps: [
              { id: 'statistical', name: '统计分析', type: 'agent_call', config: {}, dependencies: [] },
              { id: 'trend', name: '趋势分析', type: 'agent_call', config: {}, dependencies: [] },
              { id: 'correlation', name: '相关性分析', type: 'agent_call', config: {}, dependencies: [] }
            ]
          },
          dependencies: ['step_3_explore']
        },
        {
          id: 'step_5_visualize',
          name: '生成可视化',
          type: 'agent_call',
          config: { agentType: 'visualizer' },
          dependencies: ['step_4_analyze']
        },
        {
          id: 'step_6_report',
          name: '生成报告',
          type: 'output',
          config: { outputFormat: 'markdown' },
          dependencies: ['step_5_visualize']
        }
      ],
      variables: [
        { name: 'dataSource', type: 'string', required: true },
        { name: 'analysisGoal', type: 'string', required: true },
        { name: 'metrics', type: 'array', required: false }
      ]
    },
    parameters: [
      { name: 'timeRange', type: 'string', description: '分析时间范围', required: false },
      { name: 'granularity', type: 'select', description: '数据粒度', required: false, options: ['hourly', 'daily', 'weekly', 'monthly'], defaultValue: 'daily' }
    ]
  }
];

class DynamicWorkflowGenerator {
  private workflows: Map<string, Workflow> = new Map();
  private templates: Map<string, WorkflowTemplate> = new Map();
  private executionContexts: Map<string, WorkflowContext> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  // 初始化模板库
  private initializeTemplates(): void {
    WORKFLOW_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // 根据意图生成工作流
  async generateWorkflow(config: WorkflowGenerationConfig): Promise<Workflow> {
    const { intentType, userQuery, context, complexity = 'medium' } = config;

    // 1. 查找匹配的模板
    const matchingTemplates = this.findMatchingTemplates(intentType, complexity);
    
    if (matchingTemplates.length === 0) {
      // 无匹配模板，生成通用工作流
      return this.generateGenericWorkflow(config);
    }

    // 2. 选择最佳模板
    const bestTemplate = matchingTemplates[0];

    // 3. 基于模板创建工作流
    const workflow = await this.instantiateFromTemplate(bestTemplate, config);

    // 4. 根据上下文优化工作流
    const optimizedWorkflow = this.optimizeWorkflow(workflow, context);

    // 5. 保存工作流
    this.workflows.set(optimizedWorkflow.id, optimizedWorkflow);
    await this.saveWorkflow(optimizedWorkflow);

    return optimizedWorkflow;
  }

  // 查找匹配的模板
  private findMatchingTemplates(intentType: IntentType, complexity: string): WorkflowTemplate[] {
    const matches = Array.from(this.templates.values())
      .filter(template => 
        template.intentTypes.includes(intentType) &&
        template.complexity === complexity
      )
      .sort((a, b) => {
        // 按匹配度排序
        const aMatch = a.intentTypes.filter(t => t === intentType).length;
        const bMatch = b.intentTypes.filter(t => t === intentType).length;
        return bMatch - aMatch;
      });

    return matches;
  }

  // 从模板实例化工作流
  private async instantiateFromTemplate(
    template: WorkflowTemplate,
    config: WorkflowGenerationConfig
  ): Promise<Workflow> {
    const workflowId = `wf_${uuidv4()}`;
    const now = Date.now();

    // 处理模板参数
    const processedSteps = this.processTemplateSteps(
      template.template.steps || [],
      config.context || {}
    );

    const workflow: Workflow = {
      id: workflowId,
      name: template.template.name || template.name,
      description: template.template.description || template.description,
      version: '1.0.0',
      intentTypes: template.intentTypes,
      steps: processedSteps,
      variables: template.template.variables || [],
      metadata: {
        author: 'system',
        tags: [template.category, ...template.intentTypes],
        category: template.category,
        complexity: template.complexity,
        estimatedDuration: this.estimateDuration(processedSteps),
        prerequisites: []
      },
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
      successRate: 0,
      avgExecutionTime: 0
    };

    return workflow;
  }

  // 处理模板步骤
  private processTemplateSteps(steps: WorkflowStep[], context: Record<string, any>): WorkflowStep[] {
    return steps.map(step => ({
      ...step,
      id: `${step.id}_${uuidv4().substr(0, 8)}`,
      config: this.processStepConfig(step.config, context)
    }));
  }

  // 处理步骤配置
  private processStepConfig(config: StepConfig, context: Record<string, any>): StepConfig {
    const processed = { ...config };

    // 替换变量引用
    if (processed.prompt) {
      processed.prompt = this.replaceVariables(processed.prompt, context);
    }
    if (processed.endpoint) {
      processed.endpoint = this.replaceVariables(processed.endpoint, context);
    }

    return processed;
  }

  // 替换变量
  private replaceVariables(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? String(context[key]) : match;
    });
  }

  // 生成通用工作流
  private generateGenericWorkflow(config: WorkflowGenerationConfig): Workflow {
    const workflowId = `wf_${uuidv4()}`;
    const now = Date.now();

    // 创建通用步骤序列
    const steps: WorkflowStep[] = [
      {
        id: `step_input_${uuidv4().substr(0, 8)}`,
        name: '输入处理',
        type: 'transform',
        config: {
          inputMapping: { userQuery: 'query' },
          outputMapping: { processedInput: 'input' }
        },
        dependencies: []
      },
      {
        id: `step_process_${uuidv4().substr(0, 8)}`,
        name: '智能处理',
        type: 'agent_call',
        config: {
          agentType: 'general',
          prompt: config.userQuery,
          context: config.context
        },
        dependencies: [`step_input_${uuidv4().substr(0, 8)}`]
      },
      {
        id: `step_output_${uuidv4().substr(0, 8)}`,
        name: '结果输出',
        type: 'output',
        config: {
          outputFormat: 'markdown'
        },
        dependencies: [`step_process_${uuidv4().substr(0, 8)}`]
      }
    ];

    return {
      id: workflowId,
      name: '通用智能工作流',
      description: `基于意图 "${config.intentType}" 自动生成的通用工作流`,
      version: '1.0.0',
      intentTypes: [config.intentType],
      steps,
      variables: [
        { name: 'userQuery', type: 'string', required: true, description: '用户查询' }
      ],
      metadata: {
        author: 'system',
        tags: ['generic', config.intentType],
        category: 'generic',
        complexity: 'simple',
        estimatedDuration: 30,
        prerequisites: []
      },
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
      successRate: 0,
      avgExecutionTime: 0
    };
  }

  // 优化工作流
  private optimizeWorkflow(workflow: Workflow, context?: Record<string, any>): Workflow {
    const optimized = { ...workflow };

    // 1. 并行化优化
    optimized.steps = this.optimizeParallelization(optimized.steps);

    // 2. 缓存优化
    optimized.steps = this.optimizeCaching(optimized.steps);

    // 3. 根据上下文调整
    if (context) {
      optimized.steps = this.adjustForContext(optimized.steps, context);
    }

    return optimized;
  }

  // 并行化优化
  private optimizeParallelization(steps: WorkflowStep[]): WorkflowStep[] {
    // 识别可以并行执行的步骤
    const dependencyGraph = this.buildDependencyGraph(steps);
    const levels = this.calculateExecutionLevels(dependencyGraph);

    // 为同一级别的步骤创建并行容器
    const optimized: WorkflowStep[] = [];
    const processed = new Set<string>();

    levels.forEach(levelSteps => {
      if (levelSteps.length > 1) {
        // 创建并行步骤
        const parallelStep: WorkflowStep = {
          id: `parallel_${uuidv4().substr(0, 8)}`,
          name: '并行执行',
          type: 'parallel',
          config: {
            parallelSteps: levelSteps.map(id => steps.find(s => s.id === id)!)
          },
          dependencies: []
        };
        optimized.push(parallelStep);
        levelSteps.forEach(id => processed.add(id));
      } else if (levelSteps.length === 1) {
        const step = steps.find(s => s.id === levelSteps[0])!;
        if (!processed.has(step.id)) {
          optimized.push(step);
          processed.add(step.id);
        }
      }
    });

    return optimized.length > 0 ? optimized : steps;
  }

  // 构建依赖图
  private buildDependencyGraph(steps: WorkflowStep[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    
    steps.forEach(step => {
      graph.set(step.id, new Set(step.dependencies));
    });

    return graph;
  }

  // 计算执行层级
  private calculateExecutionLevels(graph: Map<string, Set<string>>): string[][] {
    const levels: string[][] = [];
    const processed = new Set<string>();
    const allNodes = Array.from(graph.keys());

    while (processed.size < allNodes.length) {
      const currentLevel: string[] = [];

      allNodes.forEach(node => {
        if (processed.has(node)) return;

        const deps = graph.get(node) || new Set();
        const allDepsProcessed = Array.from(deps).every(dep => processed.has(dep));

        if (allDepsProcessed) {
          currentLevel.push(node);
        }
      });

      if (currentLevel.length === 0) break;

      levels.push(currentLevel);
      currentLevel.forEach(node => processed.add(node));
    }

    return levels;
  }

  // 缓存优化
  private optimizeCaching(steps: WorkflowStep[]): WorkflowStep[] {
    return steps.map(step => {
      // 为昂贵的操作添加缓存
      if (step.type === 'agent_call' || step.type === 'api_call') {
        return {
          ...step,
          config: {
            ...step.config,
            cacheKey: `${step.id}_${step.type}`,
            cacheTTL: 300000 // 5分钟缓存
          }
        };
      }
      return step;
    });
  }

  // 根据上下文调整
  private adjustForContext(steps: WorkflowStep[], context: Record<string, any>): WorkflowStep[] {
    return steps.map(step => {
      const adjusted = { ...step };

      // 根据上下文调整超时
      if (context.timeout && adjusted.timeout) {
        adjusted.timeout = Math.min(adjusted.timeout, context.timeout);
      }

      // 根据上下文调整重试策略
      if (context.retryPolicy && adjusted.retryPolicy) {
        adjusted.retryPolicy = {
          ...adjusted.retryPolicy,
          ...context.retryPolicy
        };
      }

      return adjusted;
    });
  }

  // 执行工作流
  async executeWorkflow(
    workflowId: string,
    variables: Record<string, any>
  ): Promise<WorkflowExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = `exec_${uuidv4()}`;
    const startTime = Date.now();

    // 创建执行上下文
    const context: WorkflowContext = {
      workflowId,
      executionId,
      variables: { ...variables },
      stepResults: new Map(),
      executionPath: [],
      startTime
    };

    this.executionContexts.set(executionId, context);

    try {
      // 执行工作流步骤
      await this.executeSteps(workflow.steps, context);

      // 收集结果
      const endTime = Date.now();
      const result: WorkflowExecutionResult = {
        executionId,
        workflowId,
        status: 'completed',
        startTime,
        endTime,
        duration: endTime - startTime,
        results: context.stepResults,
        output: this.extractOutput(context),
        executionPath: context.executionPath
      };

      // 更新工作流统计
      await this.updateWorkflowStats(workflow, result);

      return result;
    } catch (error) {
      const endTime = Date.now();
      return {
        executionId,
        workflowId,
        status: 'failed',
        startTime,
        endTime,
        duration: endTime - startTime,
        results: context.stepResults,
        error: error as Error,
        executionPath: context.executionPath
      };
    } finally {
      this.executionContexts.delete(executionId);
    }
  }

  // 执行步骤
  private async executeSteps(steps: WorkflowStep[], context: WorkflowContext): Promise<void> {
    for (const step of steps) {
      await this.executeStep(step, context);
    }
  }

  // 执行单个步骤
  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<StepResult> {
    context.currentStep = step.id;
    context.executionPath.push(step.id);

    const result: StepResult = {
      stepId: step.id,
      status: 'running',
      startTime: Date.now(),
      retryCount: 0
    };

    context.stepResults.set(step.id, result);

    try {
      // 检查条件
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        result.status = 'skipped';
        result.endTime = Date.now();
        return result;
      }

      // 执行步骤
      const output = await this.executeStepByType(step, context);
      
      result.status = 'completed';
      result.endTime = Date.now();
      result.output = output;

      return result;
    } catch (error) {
      result.status = 'failed';
      result.endTime = Date.now();
      result.error = error as Error;

      // 错误处理
      if (step.onError) {
        await this.handleStepError(step, result, context);
      }

      throw error;
    }
  }

  // 根据类型执行步骤
  private async executeStepByType(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    switch (step.type) {
      case 'agent_call':
        return this.executeAgentCall(step, context);
      case 'api_call':
        return this.executeApiCall(step, context);
      case 'condition':
        return this.executeCondition(step, context);
      case 'parallel':
        return this.executeParallel(step, context);
      case 'sequential':
        return this.executeSequential(step, context);
      case 'loop':
        return this.executeLoop(step, context);
      case 'wait':
        return this.executeWait(step, context);
      case 'transform':
        return this.executeTransform(step, context);
      case 'user_input':
        return this.executeUserInput(step, context);
      case 'output':
        return this.executeOutput(step, context);
      case 'custom':
        return this.executeCustom(step, context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  // 执行Agent调用
  private async executeAgentCall(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    // 这里应该调用实际的Agent服务
    // 简化实现，返回模拟结果
    return {
      agentType: step.config.agentType,
      prompt: step.config.prompt,
      result: `Agent ${step.config.agentType} execution result`,
      timestamp: Date.now()
    };
  }

  // 执行API调用
  private async executeApiCall(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const { endpoint, method, headers, body } = step.config;
    
    // 这里应该调用实际的API
    // 简化实现
    return {
      endpoint,
      method,
      status: 200,
      data: { message: 'API call simulated' }
    };
  }

  // 执行条件判断
  private async executeCondition(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const condition = step.config.condition;
    const result = this.evaluateCondition({ type: 'expression', expression: condition }, context);

    if (result && step.config.trueBranch) {
      const trueSteps = step.config.trueBranch.map(id => 
        context.stepResults.get(id)
      ).filter(Boolean);
      return { branch: 'true', steps: trueSteps };
    } else if (!result && step.config.falseBranch) {
      const falseSteps = step.config.falseBranch.map(id =>
        context.stepResults.get(id)
      ).filter(Boolean);
      return { branch: 'false', steps: falseSteps };
    }

    return { branch: result ? 'true' : 'false' };
  }

  // 执行并行步骤
  private async executeParallel(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const parallelSteps = step.config.parallelSteps || [];
    const results = await Promise.all(
      parallelSteps.map(s => this.executeStep(s, context))
    );
    return { parallelResults: results };
  }

  // 执行顺序步骤
  private async executeSequential(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const loopBody = step.config.loopBody || [];
    await this.executeSteps(loopBody, context);
    return { executed: loopBody.length };
  }

  // 执行循环
  private async executeLoop(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const { loopCondition, maxIterations = 10, loopBody = [] } = step.config;
    let iterations = 0;
    const results = [];

    while (iterations < maxIterations) {
      if (loopCondition && !this.evaluateCondition({ type: 'expression', expression: loopCondition }, context)) {
        break;
      }

      for (const bodyStep of loopBody) {
        const result = await this.executeStep(bodyStep, context);
        results.push(result);
      }

      iterations++;
    }

    return { iterations, results };
  }

  // 执行等待
  private async executeWait(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const duration = step.config.waitDuration || 1000;
    await new Promise(resolve => setTimeout(resolve, duration));
    return { waited: duration };
  }

  // 执行转换
  private async executeTransform(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const { inputMapping, outputMapping, transformScript } = step.config;
    
    // 应用输入映射
    const input = inputMapping ? this.applyMapping(context.variables, inputMapping) : context.variables;
    
    // 执行转换
    let output = input;
    if (transformScript) {
      // 这里应该执行实际的转换脚本
      output = { ...input, transformed: true };
    }

    // 应用输出映射
    if (outputMapping) {
      output = this.applyMapping(output, outputMapping);
    }

    return output;
  }

  // 执行用户输入
  private async executeUserInput(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    // 这里应该调用UI获取用户输入
    // 简化实现
    return {
      inputType: step.config.inputType,
      prompt: step.config.inputPrompt,
      value: null // 实际应该从UI获取
    };
  }

  // 执行输出
  private async executeOutput(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const { outputFormat, outputTemplate } = step.config;
    
    let output = this.extractOutput(context);
    
    if (outputTemplate) {
      output = this.replaceVariables(outputTemplate, { ...context.variables, output });
    }

    return {
      format: outputFormat,
      content: output
    };
  }

  // 执行自定义步骤
  private async executeCustom(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const { customHandler, customConfig } = step.config;
    
    // 这里应该调用自定义处理器
    return {
      handler: customHandler,
      config: customConfig,
      executed: true
    };
  }

  // 评估条件
  private evaluateCondition(condition: StepCondition, context: WorkflowContext): boolean {
    switch (condition.type) {
      case 'expression':
        // 简化实现，实际应该使用表达式引擎
        return this.evaluateExpression(condition.expression || '', context);
      case 'variable':
        const value = this.getVariableValue(condition.variable || '', context);
        return this.compareValues(value, condition.operator || 'eq', condition.value);
      case 'function':
        // 调用自定义函数
        return true;
      default:
        return true;
    }
  }

  // 评估表达式
  private evaluateExpression(expression: string, context: WorkflowContext): boolean {
    // 简化实现
    try {
      // 替换变量
      const processed = this.replaceVariables(expression, context.variables);
      // 安全评估（实际应该使用更安全的表达式引擎）
      return eval(processed);
    } catch {
      return false;
    }
  }

  // 获取变量值
  private getVariableValue(path: string, context: WorkflowContext): any {
    const parts = path.split('.');
    let value: any = context.variables;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }

    return value;
  }

  // 比较值
  private compareValues(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case 'eq': return value === compareValue;
      case 'ne': return value !== compareValue;
      case 'gt': return value > compareValue;
      case 'gte': return value >= compareValue;
      case 'lt': return value < compareValue;
      case 'lte': return value <= compareValue;
      case 'contains': return String(value).includes(String(compareValue));
      case 'exists': return value !== undefined && value !== null;
      default: return false;
    }
  }

  // 应用映射
  private applyMapping(data: any, mapping: Record<string, string>): any {
    const result: Record<string, any> = {};
    
    for (const [target, source] of Object.entries(mapping)) {
      result[target] = this.getVariableValue(source, { variables: data } as WorkflowContext);
    }

    return result;
  }

  // 处理步骤错误
  private async handleStepError(
    step: WorkflowStep,
    result: StepResult,
    context: WorkflowContext
  ): Promise<void> {
    if (!step.onError) return;

    switch (step.onError.action) {
      case 'retry':
        if (result.retryCount < (step.retryPolicy?.maxRetries || 0)) {
          result.retryCount++;
          await this.executeStep(step, context);
        }
        break;
      case 'skip':
        result.status = 'skipped';
        break;
      case 'fallback':
        if (step.onError.fallbackStep) {
          // 执行回退步骤
        }
        break;
      case 'fail':
      default:
        throw result.error;
    }
  }

  // 提取输出
  private extractOutput(context: WorkflowContext): any {
    // 获取最后一步的输出
    const lastStep = context.executionPath[context.executionPath.length - 1];
    if (lastStep) {
      const result = context.stepResults.get(lastStep);
      return result?.output;
    }
    return null;
  }

  // 估计执行时间
  private estimateDuration(steps: WorkflowStep[]): number {
    // 简化估计
    return steps.length * 10;
  }

  // 更新工作流统计
  private async updateWorkflowStats(
    workflow: Workflow,
    result: WorkflowExecutionResult
  ): Promise<void> {
    workflow.executionCount++;
    
    const successCount = workflow.executionCount * workflow.successRate;
    const newSuccessCount = successCount + (result.status === 'completed' ? 1 : 0);
    workflow.successRate = newSuccessCount / workflow.executionCount;

    const totalTime = workflow.executionCount * workflow.avgExecutionTime;
    workflow.avgExecutionTime = (totalTime + result.duration) / workflow.executionCount;

    workflow.updatedAt = Date.now();

    await this.saveWorkflow(workflow);
  }

  // 保存工作流
  private async saveWorkflow(workflow: Workflow): Promise<void> {
    try {
      await indexedDBStorage.save(StoreName.CACHE, {
        key: `workflow_${workflow.id}`,
        data: workflow,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  }

  // 分析工作流性能
  analyzeWorkflowPerformance(workflowId: string): WorkflowOptimization[] {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return [];

    const optimizations: WorkflowOptimization[] = [];

    // 检查并行化机会
    const dependencyGraph = this.buildDependencyGraph(workflow.steps);
    const levels = this.calculateExecutionLevels(dependencyGraph);
    const parallelizableSteps = levels.filter(level => level.length > 1);

    if (parallelizableSteps.length > 0) {
      optimizations.push({
        type: 'parallelization',
        description: `发现 ${parallelizableSteps.length} 个可以并行执行的步骤组`,
        impact: 'high',
        steps: parallelizableSteps.flat(),
        expectedImprovement: 0.3
      });
    }

    // 检查缓存机会
    const cacheableSteps = workflow.steps.filter(s => 
      (s.type === 'agent_call' || s.type === 'api_call') && !s.config.cacheKey
    );

    if (cacheableSteps.length > 0) {
      optimizations.push({
        type: 'caching',
        description: `${cacheableSteps.length} 个步骤可以添加缓存`,
        impact: 'medium',
        steps: cacheableSteps.map(s => s.id),
        expectedImprovement: 0.2
      });
    }

    return optimizations;
  }

  // 获取工作流
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  // 获取所有工作流
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  // 获取模板
  getTemplate(templateId: string): WorkflowTemplate | undefined {
    return this.templates.get(templateId);
  }

  // 获取所有模板
  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  // 删除工作流
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    this.workflows.delete(workflowId);
    
    try {
      // 从IndexedDB删除
      const allItems = await indexedDBStorage.getAll(StoreName.CACHE);
      const workflowItem = allItems.find((item: any) => 
        item.key === `workflow_${workflowId}`
      );
      
      if (workflowItem && workflowItem.id) {
        await indexedDBStorage.delete(StoreName.CACHE, workflowItem.id);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      return false;
    }
  }
}

// 创建单例实例
export const dynamicWorkflowGenerator = new DynamicWorkflowGenerator();

// 导出便捷函数
export const generateWorkflow = (config: WorkflowGenerationConfig) =>
  dynamicWorkflowGenerator.generateWorkflow(config);

export const executeWorkflow = (workflowId: string, variables: Record<string, any>) =>
  dynamicWorkflowGenerator.executeWorkflow(workflowId, variables);

export default dynamicWorkflowGenerator;
