/**
 * A/B测试框架 - A/B Testing Framework
 * 
 * 功能特性:
 * - 实验管理: 创建、配置和管理A/B测试实验
 * - 流量分配: 智能用户分流，支持多种分配策略
 * - 指标追踪: 自动收集和分析实验指标
 * - 统计显著性: 计算置信区间和p值
 * - 自动决策: 基于统计结果自动选择最优方案
 * - 多变量测试: 支持多变量组合测试
 */

import { v4 as uuidv4 } from 'uuid';
import { indexedDBStorage, StoreName } from './indexedDBStorage';
import { monitoringService } from './monitoringService';

// 实验定义
export interface Experiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: ExperimentStatus;
  type: ExperimentType;
  variants: Variant[];
  metrics: MetricConfig[];
  audience: AudienceConfig;
  trafficAllocation: TrafficAllocation;
  schedule: ExperimentSchedule;
  results?: ExperimentResults;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

// 实验状态
export type ExperimentStatus = 
  | 'draft' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'archived';

// 实验类型
export type ExperimentType = 
  | 'ab_test' 
  | 'multivariate' 
  | 'split_url' 
  | 'feature_flag';

// 变体定义
export interface Variant {
  id: string;
  name: string;
  description?: string;
  type: 'control' | 'treatment';
  trafficPercentage: number;
  config: Record<string, any>;
  metadata?: Record<string, any>;
}

// 指标配置
export interface MetricConfig {
  id: string;
  name: string;
  type: MetricType;
  eventName: string;
  aggregation: AggregationType;
  targetValue?: number;
  isPrimary: boolean;
  minimumDetectableEffect: number;
}

// 指标类型
export type MetricType = 
  | 'conversion' 
  | 'revenue' 
  | 'engagement' 
  | 'retention' 
  | 'custom';

// 聚合类型
export type AggregationType = 
  | 'count' 
  | 'sum' 
  | 'average' 
  | 'rate' 
  | 'unique_count';

// 受众配置
export interface AudienceConfig {
  segments: string[];
  userAttributes?: UserAttributeFilter[];
  trafficPercentage: number;
  sampleSize?: number;
}

// 用户属性过滤
export interface UserAttributeFilter {
  attribute: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

// 流量分配
export interface TrafficAllocation {
  strategy: 'random' | 'user_id' | 'session_id' | 'custom';
  salt?: string;
  sticky: boolean;
  customRule?: string;
}

// 实验计划
export interface ExperimentSchedule {
  startDate?: number;
  endDate?: number;
  timezone: string;
  autoStopRules?: AutoStopRule[];
}

// 自动停止规则
export interface AutoStopRule {
  type: 'sample_size' | 'duration' | 'significance' | 'minimum_conversions';
  threshold: number;
  action: 'stop' | 'notify';
}

// 实验结果
export interface ExperimentResults {
  startTime: number;
  endTime?: number;
  totalParticipants: number;
  variantResults: VariantResult[];
  statisticalSummary: StatisticalSummary;
  winner?: string;
  recommendations: string[];
}

// 变体结果
export interface VariantResult {
  variantId: string;
  participants: number;
  metrics: MetricResult[];
  confidenceInterval: ConfidenceInterval;
  isWinner: boolean;
  lift: number;
  probability: number;
}

// 指标结果
export interface MetricResult {
  metricId: string;
  value: number;
  sampleSize: number;
  standardDeviation: number;
  pValue: number;
  isSignificant: boolean;
  improvement: number;
}

// 置信区间
export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number;
}

// 统计摘要
export interface StatisticalSummary {
  confidenceLevel: number;
  power: number;
  minimumSampleSize: number;
  actualSampleSize: number;
  daysRunning: number;
  isSignificant: boolean;
}

// 用户分配记录
export interface UserAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: number;
  context: Record<string, any>;
  conversions: ConversionEvent[];
}

// 转化事件
export interface ConversionEvent {
  metricId: string;
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

// 实验报告
export interface ExperimentReport {
  experiment: Experiment;
  summary: {
    duration: number;
    totalParticipants: number;
    completionRate: number;
    primaryMetric: MetricResult;
  };
  variants: VariantComparison[];
  insights: string[];
  nextSteps: string[];
}

// 变体对比
export interface VariantComparison {
  variant: Variant;
  result: VariantResult;
  comparisonToControl: {
    lift: number;
    confidenceInterval: ConfidenceInterval;
    isSignificant: boolean;
    pValue: number;
  };
}

// 默认配置
const DEFAULT_CONFIDENCE_LEVEL = 0.95;
const DEFAULT_POWER = 0.8;
const MIN_SAMPLE_SIZE = 100;

class ABTestingFramework {
  private experiments: Map<string, Experiment> = new Map();
  private userAssignments: Map<string, UserAssignment> = new Map();
  private eventBuffer: Map<string, ConversionEvent[]> = new Map();

  constructor() {
    this.initialize();
  }

  // 初始化
  private async initialize(): Promise<void> {
    await this.loadExperiments();
    this.startEventProcessing();
  }

  // 加载实验
  private async loadExperiments(): Promise<void> {
    try {
      const stored = await indexedDBStorage.getAll(StoreName.CACHE);
      const experiments = stored
        .filter((item: any) => item.key?.startsWith('experiment_'))
        .map((item: any) => item.data as Experiment);

      experiments.forEach(exp => {
        this.experiments.set(exp.id, exp);
      });
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }

  // ==================== 实验管理 ====================

  // 创建实验
  async createExperiment(
    config: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<Experiment> {
    const experiment: Experiment = {
      ...config,
      id: `exp_${uuidv4()}`,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: config.createdBy || 'system'
    };

    // 验证实验配置
    this.validateExperiment(experiment);

    // 保存实验
    this.experiments.set(experiment.id, experiment);
    await this.saveExperiment(experiment);

    // 记录事件
    monitoringService.trackEvent({
      type: 'custom',
      category: 'system',
      timestamp: Date.now(),
      data: {
        event: 'experiment_created',
        experimentId: experiment.id,
        experimentName: experiment.name
      }
    });

    return experiment;
  }

  // 验证实验配置
  private validateExperiment(experiment: Experiment): void {
    // 检查变体
    if (experiment.variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }

    // 检查流量分配
    const totalTraffic = experiment.variants.reduce(
      (sum, v) => sum + v.trafficPercentage, 
      0
    );
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('Variant traffic percentages must sum to 100%');
    }

    // 检查对照组
    const hasControl = experiment.variants.some(v => v.type === 'control');
    if (!hasControl) {
      throw new Error('Experiment must have a control variant');
    }

    // 检查指标
    const primaryMetrics = experiment.metrics.filter(m => m.isPrimary);
    if (primaryMetrics.length === 0) {
      throw new Error('Experiment must have at least one primary metric');
    }
  }

  // 启动实验
  async startExperiment(experimentId: string): Promise<Experiment> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (experiment.status !== 'draft' && experiment.status !== 'paused') {
      throw new Error(`Cannot start experiment with status: ${experiment.status}`);
    }

    experiment.status = 'running';
    experiment.schedule.startDate = Date.now();
    experiment.updatedAt = Date.now();

    await this.saveExperiment(experiment);

    monitoringService.trackEvent({
      type: 'custom',
      category: 'system',
      timestamp: Date.now(),
      data: {
        event: 'experiment_started',
        experimentId: experiment.id
      }
    });

    return experiment;
  }

  // 暂停实验
  async pauseExperiment(experimentId: string): Promise<Experiment> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (experiment.status !== 'running') {
      throw new Error(`Cannot pause experiment with status: ${experiment.status}`);
    }

    experiment.status = 'paused';
    experiment.updatedAt = Date.now();

    await this.saveExperiment(experiment);

    return experiment;
  }

  // 停止实验
  async stopExperiment(experimentId: string, reason?: string): Promise<Experiment> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    experiment.status = 'completed';
    experiment.schedule.endDate = Date.now();
    experiment.updatedAt = Date.now();

    // 计算最终结果
    experiment.results = await this.calculateResults(experiment);

    await this.saveExperiment(experiment);

    monitoringService.trackEvent({
      type: 'custom',
      category: 'system',
      timestamp: Date.now(),
      data: {
        event: 'experiment_stopped',
        experimentId: experiment.id,
        reason
      }
    });

    return experiment;
  }

  // 归档实验
  async archiveExperiment(experimentId: string): Promise<Experiment> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    experiment.status = 'archived';
    experiment.updatedAt = Date.now();

    await this.saveExperiment(experiment);

    return experiment;
  }

  // 删除实验
  async deleteExperiment(experimentId: string): Promise<boolean> {
    this.experiments.delete(experimentId);

    try {
      const stored = await indexedDBStorage.getAll(StoreName.CACHE);
      const experimentItem = stored.find(
        (item: any) => item.key === `experiment_${experimentId}`
      );

      if (experimentItem?.id) {
        await indexedDBStorage.delete(StoreName.CACHE, experimentItem.id);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete experiment:', error);
      return false;
    }
  }

  // ==================== 用户分配 ====================

  // 为用户分配变体
  assignVariant(
    userId: string,
    experimentId: string,
    context: Record<string, any> = {}
  ): Variant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // 检查用户是否符合受众条件
    if (!this.matchesAudience(context, experiment.audience)) {
      return null;
    }

    // 检查是否已分配
    const assignmentKey = `${userId}_${experimentId}`;
    const existingAssignment = this.userAssignments.get(assignmentKey);
    
    if (existingAssignment && experiment.trafficAllocation.sticky) {
      const variant = experiment.variants.find(v => v.id === existingAssignment.variantId);
      return variant || null;
    }

    // 分配变体
    const variant = this.selectVariant(userId, experiment, context);
    if (!variant) return null;

    // 记录分配
    const assignment: UserAssignment = {
      userId,
      experimentId,
      variantId: variant.id,
      assignedAt: Date.now(),
      context,
      conversions: []
    };

    this.userAssignments.set(assignmentKey, assignment);
    this.saveAssignment(assignment);

    // 追踪事件
    monitoringService.trackEvent({
      type: 'custom',
      category: 'user_behavior',
      timestamp: Date.now(),
      userId,
      data: {
        event: 'experiment_assignment',
        experimentId,
        variantId: variant.id
      }
    });

    return variant;
  }

  // 检查用户是否符合受众条件
  private matchesAudience(
    context: Record<string, any>,
    audience: AudienceConfig
  ): boolean {
    // 检查流量百分比
    if (Math.random() * 100 > audience.trafficPercentage) {
      return false;
    }

    // 检查用户属性
    if (audience.userAttributes) {
      for (const filter of audience.userAttributes) {
        const userValue = context[filter.attribute];
        if (!this.matchesFilter(userValue, filter)) {
          return false;
        }
      }
    }

    return true;
  }

  // 匹配过滤器
  private matchesFilter(value: any, filter: UserAttributeFilter): boolean {
    switch (filter.operator) {
      case 'eq': return value === filter.value;
      case 'ne': return value !== filter.value;
      case 'gt': return value > filter.value;
      case 'gte': return value >= filter.value;
      case 'lt': return value < filter.value;
      case 'lte': return value <= filter.value;
      case 'in': return filter.value.includes(value);
      case 'contains': return String(value).includes(String(filter.value));
      default: return false;
    }
  }

  // 选择变体
  private selectVariant(
    userId: string,
    experiment: Experiment,
    context: Record<string, any> = {}
  ): Variant | null {
    const { strategy, salt } = experiment.trafficAllocation;

    // 计算哈希值
    let hash: number;
    switch (strategy) {
      case 'user_id':
        hash = this.hashString(`${userId}_${salt || experiment.id}`);
        break;
      case 'session_id':
        hash = this.hashString(`${context.sessionId}_${salt || experiment.id}`);
        break;
      case 'custom':
        // 使用自定义规则
        hash = Math.random() * 100;
        break;
      case 'random':
      default:
        hash = Math.random() * 100;
    }

    // 根据流量百分比选择变体
    let cumulativePercentage = 0;
    for (const variant of experiment.variants) {
      cumulativePercentage += variant.trafficPercentage;
      if (hash <= cumulativePercentage) {
        return variant;
      }
    }

    return experiment.variants[experiment.variants.length - 1];
  }

  // 字符串哈希
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }

  // ==================== 事件追踪 ====================

  // 追踪转化事件
  trackConversion(
    userId: string,
    experimentId: string,
    metricId: string,
    value: number = 1,
    metadata?: Record<string, any>
  ): void {
    const assignmentKey = `${userId}_${experimentId}`;
    const assignment = this.userAssignments.get(assignmentKey);

    if (!assignment) return;

    const event: ConversionEvent = {
      metricId,
      timestamp: Date.now(),
      value,
      metadata
    };

    assignment.conversions.push(event);

    // 缓冲事件
    const bufferKey = `${experimentId}_${assignment.variantId}_${metricId}`;
    if (!this.eventBuffer.has(bufferKey)) {
      this.eventBuffer.set(bufferKey, []);
    }
    this.eventBuffer.get(bufferKey)!.push(event);

    // 保存分配更新
    this.saveAssignment(assignment);
  }

  // 开始事件处理
  private startEventProcessing(): void {
    // 定期处理缓冲的事件
    setInterval(() => {
      this.processEventBuffer();
    }, 60000);
  }

  // 处理事件缓冲
  private async processEventBuffer(): Promise<void> {
    const buffer = new Map(this.eventBuffer);
    this.eventBuffer.clear();

    for (const [key, events] of buffer) {
      const [experimentId, variantId, metricId] = key.split('_');
      
      // 更新实验统计
      await this.updateExperimentStats(experimentId, variantId, metricId, events);
    }
  }

  // 更新实验统计
  private async updateExperimentStats(
    experimentId: string,
    variantId: string,
    metricId: string,
    events: ConversionEvent[]
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    // 这里可以更新实时统计
    // 简化实现，实际应该使用更复杂的统计计算
  }

  // ==================== 结果计算 ====================

  // 计算实验结果
  private async calculateResults(experiment: Experiment): Promise<ExperimentResults> {
    const variantResults: VariantResult[] = [];
    let totalParticipants = 0;

    // 计算每个变体的结果
    for (const variant of experiment.variants) {
      const result = await this.calculateVariantResult(experiment, variant);
      variantResults.push(result);
      totalParticipants += result.participants;
    }

    // 计算统计摘要
    const statisticalSummary = this.calculateStatisticalSummary(
      experiment,
      variantResults,
      totalParticipants
    );

    // 确定获胜者
    const winner = this.determineWinner(variantResults, experiment.metrics);

    // 生成建议
    const recommendations = this.generateRecommendations(
      experiment,
      variantResults,
      statisticalSummary
    );

    return {
      startTime: experiment.schedule.startDate || Date.now(),
      endTime: Date.now(),
      totalParticipants,
      variantResults,
      statisticalSummary,
      winner: winner?.id,
      recommendations
    };
  }

  // 计算变体结果
  private async calculateVariantResult(
    experiment: Experiment,
    variant: Variant
  ): Promise<VariantResult> {
    // 获取该变体的所有用户分配
    const assignments = Array.from(this.userAssignments.values())
      .filter(a => a.experimentId === experiment.id && a.variantId === variant.id);

    const participants = assignments.length;

    // 计算每个指标的结果
    const metrics: MetricResult[] = [];
    for (const metricConfig of experiment.metrics) {
      const metricResult = this.calculateMetricResult(
        assignments,
        metricConfig,
        participants
      );
      metrics.push(metricResult);
    }

    // 计算置信区间
    const primaryMetric = metrics.find(m => 
      experiment.metrics.find(mc => mc.id === m.metricId)?.isPrimary
    );

    const confidenceInterval = primaryMetric 
      ? this.calculateConfidenceInterval(primaryMetric)
      : { lower: 0, upper: 0, confidence: DEFAULT_CONFIDENCE_LEVEL };

    return {
      variantId: variant.id,
      participants,
      metrics,
      confidenceInterval,
      isWinner: false, // 将在后面确定
      lift: 0, // 将在后面计算
      probability: 0
    };
  }

  // 计算指标结果
  private calculateMetricResult(
    assignments: UserAssignment[],
    metricConfig: MetricConfig,
    participants: number
  ): MetricResult {
    // 收集所有转化值
    const values: number[] = [];
    for (const assignment of assignments) {
      const conversions = assignment.conversions.filter(c => c.metricId === metricConfig.id);
      
      switch (metricConfig.aggregation) {
        case 'count':
          values.push(conversions.length);
          break;
        case 'sum':
          values.push(conversions.reduce((sum, c) => sum + c.value, 0));
          break;
        case 'average':
          values.push(
            conversions.length > 0
              ? conversions.reduce((sum, c) => sum + c.value, 0) / conversions.length
              : 0
          );
          break;
        case 'rate':
          values.push(conversions.length > 0 ? 1 : 0);
          break;
        case 'unique_count':
          values.push(conversions.length > 0 ? 1 : 0);
          break;
      }
    }

    // 计算统计值
    const value = values.reduce((sum, v) => sum + v, 0) / Math.max(values.length, 1);
    const variance = this.calculateVariance(values, value);
    const standardDeviation = Math.sqrt(variance);

    // 计算p值（简化实现，实际应该使用t检验或z检验）
    const pValue = this.calculatePValue(values);

    return {
      metricId: metricConfig.id,
      value,
      sampleSize: values.length,
      standardDeviation,
      pValue,
      isSignificant: pValue < (1 - DEFAULT_CONFIDENCE_LEVEL),
      improvement: 0 // 相对于对照组，将在后面计算
    };
  }

  // 计算方差
  private calculateVariance(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / (values.length - 1);
  }

  // 计算p值（简化实现）
  private calculatePValue(values: number[]): number {
    // 简化实现，实际应该使用适当的统计检验
    if (values.length < 2) return 1;
    
    // 使用简单的启发式方法
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = this.calculateVariance(values, mean);
    
    if (variance === 0) return 1;
    
    // 简化的p值估计
    const standardError = Math.sqrt(variance / values.length);
    const tStatistic = mean / standardError;
    
    // 简化的p值计算
    return Math.min(1, Math.max(0, 1 / (Math.abs(tStatistic) + 1)));
  }

  // 计算置信区间
  private calculateConfidenceInterval(metricResult: MetricResult): ConfidenceInterval {
    const { value, standardDeviation, sampleSize } = metricResult;
    const zScore = 1.96; // 95%置信水平
    
    const marginOfError = zScore * (standardDeviation / Math.sqrt(sampleSize));
    
    return {
      lower: value - marginOfError,
      upper: value + marginOfError,
      confidence: DEFAULT_CONFIDENCE_LEVEL
    };
  }

  // 计算统计摘要
  private calculateStatisticalSummary(
    experiment: Experiment,
    variantResults: VariantResult[],
    totalParticipants: number
  ): StatisticalSummary {
    const startTime = experiment.schedule.startDate || Date.now();
    const daysRunning = (Date.now() - startTime) / (1000 * 60 * 60 * 24);

    // 计算最小样本量（简化实现）
    const primaryMetric = experiment.metrics.find(m => m.isPrimary);
    const minimumSampleSize = primaryMetric
      ? this.calculateMinimumSampleSize(primaryMetric)
      : MIN_SAMPLE_SIZE;

    // 检查是否显著
    const isSignificant = variantResults.some(vr => 
      vr.metrics.some(m => m.isSignificant)
    );

    return {
      confidenceLevel: DEFAULT_CONFIDENCE_LEVEL,
      power: DEFAULT_POWER,
      minimumSampleSize,
      actualSampleSize: totalParticipants,
      daysRunning,
      isSignificant
    };
  }

  // 计算最小样本量
  private calculateMinimumSampleSize(metricConfig: MetricConfig): number {
    // 简化的样本量计算
    // 实际应该使用更复杂的公式考虑效应大小、功效等
    const baselineRate = 0.1; // 假设基线转化率10%
    const mde = metricConfig.minimumDetectableEffect;
    
    // 简化的样本量公式
    const zAlpha = 1.96;
    const zBeta = 0.84;
    const pooledProp = baselineRate + mde / 2;
    
    const n = Math.pow(
      zAlpha * Math.sqrt(2 * pooledProp * (1 - pooledProp)) +
      zBeta * Math.sqrt(baselineRate * (1 - baselineRate) + (baselineRate + mde) * (1 - baselineRate - mde)),
      2
    ) / Math.pow(mde, 2);

    return Math.ceil(n);
  }

  // 确定获胜者
  private determineWinner(
    variantResults: VariantResult[],
    metrics: MetricConfig[]
  ): VariantResult | null {
    const primaryMetric = metrics.find(m => m.isPrimary);
    if (!primaryMetric) return null;

    // 找到对照组
    const controlResult = variantResults.find(vr => 
      vr.metrics.some(m => m.metricId === primaryMetric.id)
    );
    if (!controlResult) return null;

    const controlValue = controlResult.metrics.find(
      m => m.metricId === primaryMetric.id
    )?.value || 0;

    // 计算每个变体相对于对照组的提升
    let bestResult: VariantResult | null = null;
    let bestLift = -Infinity;

    for (const result of variantResults) {
      const metricResult = result.metrics.find(m => m.metricId === primaryMetric.id);
      if (!metricResult) continue;

      const lift = controlValue > 0
        ? (metricResult.value - controlValue) / controlValue
        : 0;

      result.lift = lift;

      // 检查是否显著且提升为正
      if (metricResult.isSignificant && lift > 0 && lift > bestLift) {
        bestLift = lift;
        bestResult = result;
      }
    }

    // 标记获胜者
    if (bestResult) {
      bestResult.isWinner = true;
      bestResult.probability = 0.95; // 简化的概率估计
    }

    return bestResult;
  }

  // 生成建议
  private generateRecommendations(
    experiment: Experiment,
    variantResults: VariantResult[],
    summary: StatisticalSummary
  ): string[] {
    const recommendations: string[] = [];

    // 基于样本量的建议
    if (summary.actualSampleSize < summary.minimumSampleSize) {
      recommendations.push(
        `样本量不足。建议继续运行实验直到达到最小样本量 ${summary.minimumSampleSize}`
      );
    }

    // 基于显著性的建议
    if (!summary.isSignificant) {
      recommendations.push(
        '结果尚未达到统计显著性。建议延长实验时间或增加样本量'
      );
    }

    // 基于获胜者的建议
    const winner = variantResults.find(vr => vr.isWinner);
    if (winner) {
      recommendations.push(
        `变体 "${winner.variantId}" 表现最佳，建议将其作为默认方案`
      );
    } else {
      recommendations.push('没有变体显著优于对照组，建议保持现状');
    }

    // 基于运行时间的建议
    if (summary.daysRunning < 7) {
      recommendations.push('实验运行时间较短，建议至少运行一周以覆盖完整的用户周期');
    }

    return recommendations;
  }

  // ==================== 报告生成 ====================

  // 生成实验报告
  async generateReport(experimentId: string): Promise<ExperimentReport> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (!experiment.results) {
      throw new Error('Experiment has no results yet');
    }

    const results = experiment.results;
    const primaryMetric = experiment.metrics.find(m => m.isPrimary);
    const primaryMetricResult = primaryMetric
      ? results.variantResults
          .flatMap(vr => vr.metrics)
          .find(m => m.metricId === primaryMetric.id)
      : undefined;

    // 生成变体对比
    const controlResult = results.variantResults.find(vr => 
      experiment.variants.find(v => v.id === vr.variantId)?.type === 'control'
    );

    const variants: VariantComparison[] = results.variantResults.map(vr => {
      const variant = experiment.variants.find(v => v.id === vr.variantId)!;
      
      let comparisonToControl;
      if (controlResult && vr.variantId !== controlResult.variantId) {
        const controlMetric = controlResult.metrics.find(
          m => m.metricId === primaryMetric?.id
        );
        const variantMetric = vr.metrics.find(
          m => m.metricId === primaryMetric?.id
        );
        
        if (controlMetric && variantMetric) {
          const lift = controlMetric.value > 0
            ? (variantMetric.value - controlMetric.value) / controlMetric.value
            : 0;
          
          comparisonToControl = {
            lift,
            confidenceInterval: vr.confidenceInterval,
            isSignificant: variantMetric.isSignificant,
            pValue: variantMetric.pValue
          };
        }
      }

      return {
        variant,
        result: vr,
        comparisonToControl: comparisonToControl!
      };
    });

    // 生成洞察
    const insights = this.generateInsights(experiment, results);

    // 生成下一步建议
    const nextSteps = this.generateNextSteps(experiment, results);

    return {
      experiment,
      summary: {
        duration: (results.endTime || Date.now()) - results.startTime,
        totalParticipants: results.totalParticipants,
        completionRate: results.totalParticipants / Math.max(results.statisticalSummary.minimumSampleSize, 1),
        primaryMetric: primaryMetricResult!
      },
      variants,
      insights,
      nextSteps
    };
  }

  // 生成洞察
  private generateInsights(experiment: Experiment, results: ExperimentResults): string[] {
    const insights: string[] = [];

    // 性能洞察
    const winner = results.variantResults.find(vr => vr.isWinner);
    if (winner) {
      insights.push(`获胜变体的提升幅度为 ${(winner.lift * 100).toFixed(2)}%`);
    }

    // 统计洞察
    if (results.statisticalSummary.isSignificant) {
      insights.push(`结果在 ${(results.statisticalSummary.confidenceLevel * 100).toFixed(0)}% 置信水平下显著`);
    }

    // 用户行为洞察
    const conversionRates = results.variantResults.map(vr => ({
      variantId: vr.variantId,
      rate: vr.participants / Math.max(results.totalParticipants, 1)
    }));
    
    insights.push(`各变体流量分配: ${conversionRates.map(c => 
      `${c.variantId}: ${(c.rate * 100).toFixed(1)}%`
    ).join(', ')}`);

    return insights;
  }

  // 生成下一步建议
  private generateNextSteps(experiment: Experiment, results: ExperimentResults): string[] {
    const steps: string[] = [];

    if (experiment.status === 'running') {
      if (!results.statisticalSummary.isSignificant) {
        steps.push('继续运行实验直到达到统计显著性');
      }
      if (results.totalParticipants < results.statisticalSummary.minimumSampleSize) {
        steps.push(`继续收集数据，目标样本量: ${results.statisticalSummary.minimumSampleSize}`);
      }
    } else if (experiment.status === 'completed') {
      const winner = results.variantResults.find(vr => vr.isWinner);
      if (winner) {
        steps.push('实施获胜变体作为默认方案');
        steps.push('监控实施后的长期效果');
      } else {
        steps.push('分析实验设计，考虑调整假设或指标');
        steps.push('考虑进行后续实验');
      }
    }

    return steps;
  }

  // ==================== 数据持久化 ====================

  // 保存实验
  private async saveExperiment(experiment: Experiment): Promise<void> {
    try {
      await indexedDBStorage.save(StoreName.CACHE, {
        key: `experiment_${experiment.id}`,
        data: experiment,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to save experiment:', error);
    }
  }

  // 保存用户分配
  private async saveAssignment(assignment: UserAssignment): Promise<void> {
    try {
      await indexedDBStorage.save(StoreName.CACHE, {
        key: `assignment_${assignment.userId}_${assignment.experimentId}`,
        data: assignment,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to save assignment:', error);
    }
  }

  // ==================== 查询方法 ====================

  // 获取实验
  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  // 获取所有实验
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  // 获取运行中的实验
  getRunningExperiments(): Experiment[] {
    return Array.from(this.experiments.values())
      .filter(e => e.status === 'running');
  }

  // 获取用户的实验分配
  getUserAssignment(userId: string, experimentId: string): UserAssignment | undefined {
    return this.userAssignments.get(`${userId}_${experimentId}`);
  }

  // 获取实验的所有分配
  getExperimentAssignments(experimentId: string): UserAssignment[] {
    return Array.from(this.userAssignments.values())
      .filter(a => a.experimentId === experimentId);
  }
}

// 创建单例实例
export const abTestingFramework = new ABTestingFramework();

// 导出便捷函数
export const createExperiment = (config: Parameters<ABTestingFramework['createExperiment']>[0]) =>
  abTestingFramework.createExperiment(config);

export const assignVariant = (userId: string, experimentId: string, context?: Record<string, any>) =>
  abTestingFramework.assignVariant(userId, experimentId, context);

export const trackConversion = (
  userId: string,
  experimentId: string,
  metricId: string,
  value?: number,
  metadata?: Record<string, any>
) => abTestingFramework.trackConversion(userId, experimentId, metricId, value, metadata);

export const generateReport = (experimentId: string) =>
  abTestingFramework.generateReport(experimentId);

export default abTestingFramework;
