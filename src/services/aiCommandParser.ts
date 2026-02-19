/**
 * AI复杂指令解析器
 * 增强复杂指令解析和执行能力
 * 实现多步骤指令分解、参数提取、依赖管理
 */

// 指令类型
export type CommandType = 
  | 'single'      // 单条指令
  | 'sequential'  // 顺序执行
  | 'parallel'    // 并行执行
  | 'conditional' // 条件执行
  | 'loop'        // 循环执行
  | 'composite';  // 组合指令

// 指令定义
export interface Command {
  id: string;
  type: CommandType;
  action: string;
  description: string;
  parameters: CommandParameter[];
  dependencies: string[];
  condition?: string;
  loopCondition?: string;
  maxIterations?: number;
  timeout?: number;
  retryCount?: number;
  fallback?: string;
  subCommands?: Command[];
  validation?: ValidationRule[];
}

// 指令参数
export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
  validation?: ValidationRule[];
}

// 验证规则
export interface ValidationRule {
  type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

// 解析结果
export interface ParseResult {
  success: boolean;
  commands: Command[];
  errors: ParseError[];
  warnings: string[];
  metadata: {
    complexity: number;
    estimatedTime: number;
    requiredPermissions: string[];
  };
}

// 解析错误
export interface ParseError {
  type: 'syntax' | 'semantic' | 'validation' | 'dependency';
  message: string;
  position?: { line: number; column: number };
  suggestion?: string;
}

// 执行上下文
export interface ExecutionContext {
  variables: Map<string, any>;
  results: Map<string, any>;
  currentStep: number;
  totalSteps: number;
  startTime: number;
  timeout: number;
}

// 执行结果
export interface ExecutionResult {
  success: boolean;
  commandId: string;
  output: any;
  error?: string;
  executionTime: number;
  retryCount: number;
  subResults?: ExecutionResult[];
}

class AICommandParser {
  // 指令模板库
  private commandTemplates: Map<string, Command> = new Map();
  
  // 自然语言模式
  private nlPatterns = {
    sequential: /(先.*然后|首先.*接着|第一步.*第二步|先.*再.*最后)/,
    parallel: /(同时|一起|一并|顺便.*还|一边.*一边)/,
    conditional: /(如果.*就|假如.*那么|要是.*的话)/,
    loop: /(重复.*次|循环.*遍|直到.*为止|不停地)/,
    comparison: /(比较|对比|和.*相比|哪个更好)/
  };

  constructor() {
    this.initializeTemplates();
  }

  /**
   * 初始化指令模板
   */
  private initializeTemplates(): void {
    // 图片生成模板
    this.registerTemplate({
      id: 'generate_image',
      type: 'single',
      action: 'generate_image',
      description: '生成图片',
      parameters: [
        { name: 'prompt', type: 'string', description: '图片描述', required: true },
        { name: 'style', type: 'enum', description: '风格', required: false, default: '现代', enum: ['传统', '现代', '国潮', '水墨'] },
        { name: 'size', type: 'enum', description: '尺寸', required: false, default: '1024x1024', enum: ['1024x1024', '1024x1792', '1792x1024'] },
        { name: 'cultural_elements', type: 'array', description: '文化元素', required: false }
      ],
      dependencies: [],
      timeout: 60000,
      retryCount: 2,
      validation: [
        { type: 'required', message: '图片描述不能为空' },
        { type: 'pattern', value: /^.{10,500}$/, message: '描述长度应在10-500字之间' }
      ]
    });

    // 设计建议模板
    this.registerTemplate({
      id: 'design_suggestion',
      type: 'single',
      action: 'design_suggestion',
      description: '获取设计建议',
      parameters: [
        { name: 'requirement', type: 'string', description: '设计需求', required: true },
        { name: 'product_type', type: 'enum', description: '产品类型', required: false, enum: ['海报', 'logo', '包装', '文创', '插画'] },
        { name: 'style_preference', type: 'string', description: '风格偏好', required: false },
        { name: 'target_audience', type: 'string', description: '目标受众', required: false }
      ],
      dependencies: [],
      timeout: 10000,
      retryCount: 1
    });

    // 文化查询模板
    this.registerTemplate({
      id: 'cultural_query',
      type: 'single',
      action: 'cultural_query',
      description: '查询文化知识',
      parameters: [
        { name: 'query', type: 'string', description: '查询内容', required: true },
        { name: 'element_type', type: 'enum', description: '元素类型', required: false, enum: ['年画', '彩塑', '风筝', '建筑', '美食', '工艺'] },
        { name: 'detail_level', type: 'enum', description: '详细程度', required: false, default: 'medium', enum: ['brief', 'medium', 'detailed'] }
      ],
      dependencies: [],
      timeout: 5000,
      retryCount: 1
    });

    // 导航模板
    this.registerTemplate({
      id: 'navigate',
      type: 'single',
      action: 'navigate',
      description: '页面导航',
      parameters: [
        { name: 'target', type: 'enum', description: '目标页面', required: true, enum: ['home', 'create', 'market', 'community', 'knowledge', 'profile'] },
        { name: 'params', type: 'object', description: '页面参数', required: false }
      ],
      dependencies: [],
      timeout: 2000,
      retryCount: 0
    });

    // 组合指令：生成设计方案
    this.registerTemplate({
      id: 'create_design_project',
      type: 'composite',
      action: 'create_design_project',
      description: '创建完整设计方案',
      parameters: [
        { name: 'project_name', type: 'string', description: '项目名称', required: true },
        { name: 'requirements', type: 'string', description: '需求描述', required: true },
        { name: 'style', type: 'string', description: '设计风格', required: false }
      ],
      dependencies: [],
      subCommands: [
        {
          id: 'step1_query_culture',
          type: 'single',
          action: 'cultural_query',
          description: '查询相关文化元素',
          parameters: [],
          dependencies: []
        },
        {
          id: 'step2_get_suggestions',
          type: 'single',
          action: 'design_suggestion',
          description: '获取设计建议',
          parameters: [],
          dependencies: ['step1_query_culture']
        },
        {
          id: 'step3_generate_image',
          type: 'single',
          action: 'generate_image',
          description: '生成设计图',
          parameters: [],
          dependencies: ['step2_get_suggestions']
        }
      ],
      timeout: 120000,
      retryCount: 1
    });
  }

  /**
   * 注册指令模板
   */
  registerTemplate(template: Command): void {
    this.commandTemplates.set(template.id, template);
  }

  /**
   * 解析自然语言指令
   */
  parseNaturalLanguage(input: string): ParseResult {
    const errors: ParseError[] = [];
    const warnings: string[] = [];
    const commands: Command[] = [];

    try {
      // 1. 检测指令类型
      const commandType = this.detectCommandType(input);

      // 2. 提取参数
      const parameters = this.extractParameters(input);

      // 3. 识别子指令
      const subCommands = this.identifySubCommands(input);

      // 4. 构建指令
      const command = this.buildCommand({
        type: commandType,
        input,
        parameters,
        subCommands
      });

      if (command) {
        commands.push(command);
      }

      // 5. 验证指令
      const validationResult = this.validateCommand(command);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

    } catch (error) {
      errors.push({
        type: 'syntax',
        message: error instanceof Error ? error.message : '解析失败',
        suggestion: '请尝试用更清晰的表达方式描述您的需求'
      });
    }

    // 计算复杂度
    const complexity = this.calculateComplexity(commands);
    const estimatedTime = this.estimateExecutionTime(commands);

    return {
      success: errors.length === 0,
      commands,
      errors,
      warnings,
      metadata: {
        complexity,
        estimatedTime,
        requiredPermissions: this.extractRequiredPermissions(commands)
      }
    };
  }

  /**
   * 检测指令类型
   */
  private detectCommandType(input: string): CommandType {
    if (this.nlPatterns.sequential.test(input)) return 'sequential';
    if (this.nlPatterns.parallel.test(input)) return 'parallel';
    if (this.nlPatterns.conditional.test(input)) return 'conditional';
    if (this.nlPatterns.loop.test(input)) return 'loop';
    return 'single';
  }

  /**
   * 提取参数
   */
  private extractParameters(input: string): Map<string, any> {
    const params = new Map<string, any>();

    // 提取风格参数
    const styleMatch = input.match(/(国潮|传统|现代|简约|复古|水墨|时尚)风格?/);
    if (styleMatch) {
      params.set('style', styleMatch[1]);
    }

    // 提取文化元素
    const culturalElements = input.match(/(杨柳青年画|泥人张|风筝魏|煎饼果子|十八街麻花|五大道)/g);
    if (culturalElements) {
      params.set('cultural_elements', [...new Set(culturalElements)]);
    }

    // 提取产品类型
    const productMatch = input.match(/(海报|logo|包装|文创|插画|名片|画册)/);
    if (productMatch) {
      params.set('product_type', productMatch[1]);
    }

    // 提取尺寸
    const sizeMatch = input.match(/(\d+)\s*[x×]\s*(\d+)/);
    if (sizeMatch) {
      params.set('size', `${sizeMatch[1]}x${sizeMatch[2]}`);
    }

    // 提取颜色偏好
    const colorMatch = input.match(/(红色|蓝色|绿色|黄色|紫色|橙色|黑色|白色)为主/);
    if (colorMatch) {
      params.set('primary_color', colorMatch[1]);
    }

    // 提取数量
    const quantityMatch = input.match(/(\d+)\s*(张|个|份|套)/);
    if (quantityMatch) {
      params.set('quantity', parseInt(quantityMatch[1]));
    }

    return params;
  }

  /**
   * 识别子指令
   */
  private identifySubCommands(input: string): Command[] {
    const subCommands: Command[] = [];

    // 按标点符号分割
    const segments = input.split(/[，。；！？,;!?]/).filter(s => s.trim());

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (trimmed.length < 5) continue;

      // 尝试匹配模板
      for (const template of this.commandTemplates.values()) {
        if (this.matchesTemplate(trimmed, template)) {
          subCommands.push(this.instantiateTemplate(template, trimmed));
          break;
        }
      }
    }

    return subCommands;
  }

  /**
   * 匹配模板
   */
  private matchesTemplate(input: string, template: Command): boolean {
    const actionPatterns: Record<string, RegExp> = {
      'generate_image': /(生成|创建|画|做|设计).*(图|画|像|片)/,
      'design_suggestion': /(建议|推荐|方案|怎么|如何).*(设计|做|弄)/,
      'cultural_query': /(介绍|说说|讲讲|什么是|查询).*(文化|传统|历史|元素)/,
      'navigate': /(导航|跳转|打开|前往|去|到).*(页面|地方)/
    };

    const pattern = actionPatterns[template.action];
    return pattern ? pattern.test(input) : false;
  }

  /**
   * 实例化模板
   */
  private instantiateTemplate(template: Command, input: string): Command {
    const params = this.extractParameters(input);
    
    return {
      ...template,
      id: `${template.id}_${Date.now()}`,
      parameters: template.parameters.map(p => ({
        ...p,
        value: params.get(p.name) ?? p.default
      }))
    };
  }

  /**
   * 构建指令
   */
  private buildCommand(config: {
    type: CommandType;
    input: string;
    parameters: Map<string, any>;
    subCommands: Command[];
  }): Command | null {
    const { type, input, parameters, subCommands } = config;

    // 确定主指令
    let mainAction = 'chat';
    let mainTemplate = this.commandTemplates.get('chat');

    for (const [action, pattern] of Object.entries({
      'generate_image': /(图|画|像|片)/,
      'design_suggestion': /(设计|建议|方案)/,
      'cultural_query': /(文化|传统|历史|元素)/,
      'navigate': /(导航|跳转|打开|前往)/
    })) {
      if (pattern.test(input)) {
        mainAction = action;
        mainTemplate = this.commandTemplates.get(action);
        break;
      }
    }

    if (!mainTemplate) return null;

    return {
      ...mainTemplate,
      id: `cmd_${Date.now()}`,
      type: subCommands.length > 1 ? 'composite' : type,
      parameters: mainTemplate.parameters.map(p => ({
        ...p,
        value: parameters.get(p.name) ?? p.default
      })),
      subCommands: subCommands.length > 0 ? subCommands : undefined
    };
  }

  /**
   * 验证指令
   */
  private validateCommand(command: Command | null): { errors: ParseError[]; warnings: string[] } {
    const errors: ParseError[] = [];
    const warnings: string[] = [];

    if (!command) {
      errors.push({
        type: 'semantic',
        message: '无法识别指令',
        suggestion: '请尝试使用更明确的表达方式'
      });
      return { errors, warnings };
    }

    // 验证必填参数
    for (const param of command.parameters) {
      if (param.required && !param.value) {
        errors.push({
          type: 'validation',
          message: `缺少必填参数: ${param.name} (${param.description})`,
          suggestion: `请提供${param.description}`
        });
      }
    }

    // 验证依赖
    if (command.dependencies.length > 0) {
      warnings.push(`此指令依赖: ${command.dependencies.join(', ')}`);
    }

    // 验证子指令
    if (command.subCommands) {
      for (const subCmd of command.subCommands) {
        const subValidation = this.validateCommand(subCmd);
        errors.push(...subValidation.errors);
        warnings.push(...subValidation.warnings);
      }
    }

    return { errors, warnings };
  }

  /**
   * 计算复杂度
   */
  private calculateComplexity(commands: Command[]): number {
    let complexity = 0;

    for (const cmd of commands) {
      switch (cmd.type) {
        case 'single':
          complexity += 1;
          break;
        case 'sequential':
          complexity += 2;
          break;
        case 'parallel':
          complexity += 3;
          break;
        case 'conditional':
          complexity += 2.5;
          break;
        case 'loop':
          complexity += 3;
          break;
        case 'composite':
          complexity += 4;
          break;
      }

      if (cmd.subCommands) {
        complexity += this.calculateComplexity(cmd.subCommands) * 0.5;
      }
    }

    return Math.min(10, complexity);
  }

  /**
   * 估计执行时间
   */
  private estimateExecutionTime(commands: Command[]): number {
    let totalTime = 0;

    for (const cmd of commands) {
      totalTime += cmd.timeout || 5000;

      if (cmd.subCommands) {
        if (cmd.type === 'parallel') {
          totalTime += Math.max(...cmd.subCommands.map(c => c.timeout || 5000));
        } else {
          totalTime += this.estimateExecutionTime(cmd.subCommands);
        }
      }
    }

    return totalTime;
  }

  /**
   * 提取所需权限
   */
  private extractRequiredPermissions(commands: Command[]): string[] {
    const permissions = new Set<string>();

    for (const cmd of commands) {
      switch (cmd.action) {
        case 'generate_image':
          permissions.add('image_generation');
          break;
        case 'navigate':
          permissions.add('navigation');
          break;
        case 'cultural_query':
          permissions.add('knowledge_access');
          break;
      }

      if (cmd.subCommands) {
        this.extractRequiredPermissions(cmd.subCommands).forEach(p => permissions.add(p));
      }
    }

    return Array.from(permissions);
  }

  /**
   * 执行指令
   */
  async executeCommand(
    command: Command,
    context: ExecutionContext,
    executor: (cmd: Command, ctx: ExecutionContext) => Promise<any>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let retryCount = 0;

    while (retryCount <= (command.retryCount || 0)) {
      try {
        // 检查超时
        if (Date.now() - context.startTime > context.timeout) {
          throw new Error('执行超时');
        }

        // 执行指令
        const output = await executor(command, context);

        return {
          success: true,
          commandId: command.id,
          output,
          executionTime: Date.now() - startTime,
          retryCount
        };

      } catch (error) {
        retryCount++;

        if (retryCount > (command.retryCount || 0)) {
          // 尝试fallback
          if (command.fallback) {
            const fallbackCommand = this.commandTemplates.get(command.fallback);
            if (fallbackCommand) {
              return this.executeCommand(fallbackCommand, context, executor);
            }
          }

          return {
            success: false,
            commandId: command.id,
            output: null,
            error: error instanceof Error ? error.message : '执行失败',
            executionTime: Date.now() - startTime,
            retryCount: retryCount - 1
          };
        }

        // 等待后重试
        await this.delay(1000 * retryCount);
      }
    }

    return {
      success: false,
      commandId: command.id,
      output: null,
      error: '重试次数耗尽',
      executionTime: Date.now() - startTime,
      retryCount
    };
  }

  /**
   * 执行复合指令
   */
  async executeCompositeCommand(
    command: Command,
    context: ExecutionContext,
    executor: (cmd: Command, ctx: ExecutionContext) => Promise<any>
  ): Promise<ExecutionResult> {
    if (!command.subCommands || command.subCommands.length === 0) {
      return this.executeCommand(command, context, executor);
    }

    const subResults: ExecutionResult[] = [];
    const startTime = Date.now();

    for (const subCmd of command.subCommands) {
      // 检查依赖
      const unresolvedDeps = subCmd.dependencies.filter(dep => 
        !subResults.some(r => r.commandId === dep && r.success)
      );

      if (unresolvedDeps.length > 0) {
        subResults.push({
          success: false,
          commandId: subCmd.id,
          output: null,
          error: `依赖未满足: ${unresolvedDeps.join(', ')}`,
          executionTime: 0,
          retryCount: 0
        });
        continue;
      }

      // 执行子指令
      const result = await this.executeCommand(subCmd, context, executor);
      subResults.push(result);

      // 保存结果到上下文
      context.results.set(subCmd.id, result.output);

      // 如果子指令失败且没有fallback，终止执行
      if (!result.success && !subCmd.fallback) {
        break;
      }
    }

    const allSuccess = subResults.every(r => r.success);

    return {
      success: allSuccess,
      commandId: command.id,
      output: subResults.map(r => r.output),
      executionTime: Date.now() - startTime,
      retryCount: 0,
      subResults
    };
  }

  /**
   * 创建执行上下文
   */
  createContext(timeout: number = 60000): ExecutionContext {
    return {
      variables: new Map(),
      results: new Map(),
      currentStep: 0,
      totalSteps: 0,
      startTime: Date.now(),
      timeout
    };
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取指令说明
   */
  getCommandHelp(commandId?: string): string {
    if (commandId) {
      const template = this.commandTemplates.get(commandId);
      if (template) {
        return this.formatCommandHelp(template);
      }
      return `未找到指令: ${commandId}`;
    }

    // 返回所有指令说明
    const helps: string[] = [];
    for (const template of this.commandTemplates.values()) {
      helps.push(this.formatCommandHelp(template));
    }
    return helps.join('\n\n---\n\n');
  }

  /**
   * 格式化指令帮助
   */
  private formatCommandHelp(template: Command): string {
    const params = template.parameters.map(p => {
      const required = p.required ? '(必填)' : '(可选)';
      const type = p.enum ? `[${p.enum.join('|')}]` : p.type;
      return `  - ${p.name}${required}: ${p.description} (${type})`;
    }).join('\n');

    return `
## ${template.description}
指令ID: ${template.id}
类型: ${template.type}

参数:
${params || '  无参数'}

超时: ${template.timeout || 5000}ms
重试次数: ${template.retryCount || 0}
    `.trim();
  }
}

export const aiCommandParser = new AICommandParser();
export default AICommandParser;
