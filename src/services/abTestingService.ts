/**
 * A/B测试服务
 * 
 * 第四阶段核心组件：
 * - 实验配置管理
 * - 用户分桶算法
 * - 指标收集与统计
 * - 实验结果分析
 */

import { supabase } from '../lib/supabase';

// ============================================
// 类型定义
// ============================================

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startTime?: string;
  endTime?: string;
  trafficAllocation: number;           // 实验流量占比 (0-1)
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  targetingRules?: TargetingRule[];    // 定向规则
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  trafficPercentage: number;           // 流量占比 (0-1)
  config: Record<string, any>;         // 变体配置参数
  isControl: boolean;                  // 是否为对照组
}

export interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'retention' | 'engagement' | 'revenue' | 'custom';
  eventName: string;                   // 追踪的事件名
  aggregation: 'count' | 'sum' | 'average' | 'unique';
  primary: boolean;                    // 是否为主要指标
  minimumDetectableEffect: number;     // 最小可检测效应 (MDE)
}

export interface TargetingRule {
  type: 'user_id' | 'device' | 'location' | 'custom';
  operator: 'in' | 'not_in' | 'eq' | 'neq' | 'gt' | 'lt';
  value: any;
  field?: string;
}

export interface UserAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: string;
  consistent: boolean;                 // 是否保持分配一致性
}

export interface MetricData {
  id: string;
  experimentId: string;
  variantId: string;
  userId: string;
  metricId: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ExperimentResult {
  experimentId: string;
  variantResults: VariantResult[];
  sampleSize: number;
  duration: number;                    // 实验持续天数
  hasSignificantResult: boolean;
  winnerVariantId?: string;
  confidenceLevel: number;
}

export interface VariantResult {
  variantId: string;
  variantName: string;
  isControl: boolean;
  sampleSize: number;
  metrics: MetricResult[];
}

export interface MetricResult {
  metricId: string;
  metricName: string;
  value: number;
  improvement: number;                 // 相对对照组的提升
  confidenceInterval: [number, number];
  pValue: number;
  isSignificant: boolean;
  statisticalPower: number;
}

export interface ABTestConfig {
  defaultConfidenceLevel: number;      // 默认置信水平 (0.95)
  minSampleSize: number;               // 最小样本量
  maxExperimentDuration: number;       // 最大实验天数
  enableConsistentAssignment: boolean; // 启用一致分配
  hashSalt: string;                    // 哈希盐值
}

// ============================================
// A/B测试服务类
// ============================================

class ABTestingService {
  private config: ABTestConfig = {
    defaultConfidenceLevel: 0.95,
    minSampleSize: 100,
    maxExperimentDuration: 30,
    enableConsistentAssignment: true,
    hashSalt: 'recommendation_ab_test_2024'
  };

  private userAssignmentCache: Map<string, UserAssignment> = new Map();

  // ============================================
  // 实验管理
  // ============================================

  /**
   * 创建新实验
   */
  public async createExperiment(
    name: string,
    description: string,
    variants: Omit<ExperimentVariant, 'id'>[],
    metrics: Omit<ExperimentMetric, 'id'>[],
    trafficAllocation: number = 0.1
  ): Promise<Experiment> {
    const experimentId = crypto.randomUUID();
    
    // 验证变体流量分配
    const totalTraffic = variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    if (Math.abs(totalTraffic - 1) > 0.001) {
      throw new Error(`变体流量分配总和必须等于1，当前为${totalTraffic}`);
    }

    // 验证至少有一个对照组
    const hasControl = variants.some(v => v.isControl);
    if (!hasControl) {
      throw new Error('必须指定一个对照组变体');
    }

    const experiment: Experiment = {
      id: experimentId,
      name,
      description,
      status: 'draft',
      trafficAllocation,
      variants: variants.map(v => ({
        ...v,
        id: crypto.randomUUID()
      })),
      metrics: metrics.map(m => ({
        ...m,
        id: crypto.randomUUID()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存到数据库
    const { error } = await supabase
      .from('ab_experiments')
      .insert({
        id: experiment.id,
        name: experiment.name,
        description: experiment.description,
        status: experiment.status,
        traffic_allocation: experiment.trafficAllocation,
        variants: experiment.variants,
        metrics: experiment.metrics,
        created_at: experiment.createdAt,
        updated_at: experiment.updatedAt
      });

    if (error) {
      console.error('创建实验失败:', error);
      throw error;
    }

    return experiment;
  }

  /**
   * 启动实验
   */
  public async startExperiment(experimentId: string): Promise<void> {
    const { error } = await supabase
      .from('ab_experiments')
      .update({
        status: 'running',
        start_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', experimentId);

    if (error) {
      console.error('启动实验失败:', error);
      throw error;
    }
  }

  /**
   * 停止实验
   */
  public async stopExperiment(experimentId: string): Promise<void> {
    const { error } = await supabase
      .from('ab_experiments')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', experimentId);

    if (error) {
      console.error('停止实验失败:', error);
      throw error;
    }
  }

  /**
   * 获取实验详情
   */
  public async getExperiment(experimentId: string): Promise<Experiment | null> {
    const { data, error } = await supabase
      .from('ab_experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDbExperimentToExperiment(data);
  }

  /**
   * 获取所有运行中的实验
   */
  public async getRunningExperiments(): Promise<Experiment[]> {
    const { data, error } = await supabase
      .from('ab_experiments')
      .select('*')
      .eq('status', 'running');

    if (error || !data) {
      return [];
    }

    return data.map(e => this.mapDbExperimentToExperiment(e));
  }

  // ============================================
  // 用户分桶
  // ============================================

  /**
   * 为用户分配实验变体
   */
  public async assignUserToVariant(
    userId: string,
    experimentId: string
  ): Promise<ExperimentVariant | null> {
    // 检查缓存
    const cacheKey = `${userId}:${experimentId}`;
    if (this.userAssignmentCache.has(cacheKey)) {
      const assignment = this.userAssignmentCache.get(cacheKey)!;
      const experiment = await this.getExperiment(experimentId);
      if (experiment) {
        return experiment.variants.find(v => v.id === assignment.variantId) || null;
      }
    }

    // 检查数据库中是否已有分配
    const { data: existingAssignment } = await supabase
      .from('ab_user_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('experiment_id', experimentId)
      .single();

    if (existingAssignment) {
      const assignment: UserAssignment = {
        userId: existingAssignment.user_id,
        experimentId: existingAssignment.experiment_id,
        variantId: existingAssignment.variant_id,
        assignedAt: existingAssignment.assigned_at,
        consistent: existingAssignment.consistent
      };
      this.userAssignmentCache.set(cacheKey, assignment);
      
      const experiment = await this.getExperiment(experimentId);
      if (experiment) {
        return experiment.variants.find(v => v.id === assignment.variantId) || null;
      }
    }

    // 获取实验详情
    const experiment = await this.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // 检查用户是否符合实验条件
    const isEligible = await this.checkUserEligibility(userId, experiment);
    if (!isEligible) {
      return null;
    }

    // 计算用户哈希值
    const hashValue = this.hashUserId(userId, experimentId);
    
    // 根据哈希值分配变体
    let cumulativeProbability = 0;
    let selectedVariant: ExperimentVariant | null = null;

    for (const variant of experiment.variants) {
      cumulativeProbability += variant.trafficPercentage;
      if (hashValue <= cumulativeProbability) {
        selectedVariant = variant;
        break;
      }
    }

    if (!selectedVariant) {
      selectedVariant = experiment.variants[experiment.variants.length - 1];
    }

    // 保存分配结果
    const assignment: UserAssignment = {
      userId,
      experimentId,
      variantId: selectedVariant.id,
      assignedAt: new Date().toISOString(),
      consistent: true
    };

    await supabase.from('ab_user_assignments').insert({
      user_id: assignment.userId,
      experiment_id: assignment.experimentId,
      variant_id: assignment.variantId,
      assigned_at: assignment.assignedAt,
      consistent: assignment.consistent
    });

    this.userAssignmentCache.set(cacheKey, assignment);

    return selectedVariant;
  }

  /**
   * 检查用户是否符合实验条件
   */
  private async checkUserEligibility(
    userId: string,
    experiment: Experiment
  ): Promise<boolean> {
    // 检查流量分配
    const hashValue = this.hashUserId(userId, experiment.id);
    if (hashValue > experiment.trafficAllocation) {
      return false;
    }

    // 检查定向规则
    if (experiment.targetingRules && experiment.targetingRules.length > 0) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!userProfile) {
        return false;
      }

      for (const rule of experiment.targetingRules) {
        if (!this.evaluateTargetingRule(userProfile, rule)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 评估定向规则
   */
  private evaluateTargetingRule(
    userProfile: any,
    rule: TargetingRule
  ): boolean {
    let fieldValue: any;

    switch (rule.type) {
      case 'user_id':
        fieldValue = userProfile.id;
        break;
      case 'device':
        fieldValue = userProfile.device_type;
        break;
      case 'location':
        fieldValue = userProfile.location;
        break;
      case 'custom':
        fieldValue = rule.field ? userProfile[rule.field] : null;
        break;
      default:
        return true;
    }

    switch (rule.operator) {
      case 'eq':
        return fieldValue === rule.value;
      case 'neq':
        return fieldValue !== rule.value;
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(fieldValue);
      case 'gt':
        return fieldValue > rule.value;
      case 'lt':
        return fieldValue < rule.value;
      default:
        return true;
    }
  }

  /**
   * 哈希用户ID
   */
  private hashUserId(userId: string, experimentId: string): number {
    const str = `${userId}:${experimentId}:${this.config.hashSalt}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    // 归一化到 0-1
    return (Math.abs(hash) % 10000) / 10000;
  }

  // ============================================
  // 指标收集
  // ============================================

  /**
   * 追踪实验指标
   */
  public async trackMetric(
    userId: string,
    experimentId: string,
    metricId: string,
    value: number = 1,
    metadata?: Record<string, any>
  ): Promise<void> {
    // 获取用户分配
    const { data: assignment } = await supabase
      .from('ab_user_assignments')
      .select('variant_id')
      .eq('user_id', userId)
      .eq('experiment_id', experimentId)
      .single();

    if (!assignment) {
      return;
    }

    const metricData: MetricData = {
      id: crypto.randomUUID(),
      experimentId,
      variantId: assignment.variant_id,
      userId,
      metricId,
      value,
      timestamp: new Date().toISOString(),
      metadata
    };

    const { error } = await supabase.from('ab_metric_data').insert({
      id: metricData.id,
      experiment_id: metricData.experimentId,
      variant_id: metricData.variantId,
      user_id: metricData.userId,
      metric_id: metricData.metricId,
      value: metricData.value,
      timestamp: metricData.timestamp,
      metadata: metricData.metadata
    });

    if (error) {
      console.error('追踪指标失败:', error);
    }
  }

  /**
   * 批量追踪指标
   */
  public async trackMetricsBatch(
    events: Array<{
      userId: string;
      experimentId: string;
      metricId: string;
      value?: number;
      metadata?: Record<string, any>;
    }>
  ): Promise<void> {
    const batch = events.map(event => ({
      id: crypto.randomUUID(),
      experiment_id: event.experimentId,
      user_id: event.userId,
      metric_id: event.metricId,
      value: event.value ?? 1,
      timestamp: new Date().toISOString(),
      metadata: event.metadata
    }));

    // 获取用户的变体分配
    const userExperimentPairs = events.map(e => `${e.userId}:${e.experimentId}`);
    const { data: assignments } = await supabase
      .from('ab_user_assignments')
      .select('user_id, experiment_id, variant_id')
      .in('user_id', events.map(e => e.userId));

    const assignmentMap = new Map(
      assignments?.map(a => [`${a.user_id}:${a.experiment_id}`, a.variant_id]) || []
    );

    const batchWithVariants = batch.map(item => ({
      ...item,
      variant_id: assignmentMap.get(`${item.user_id}:${item.experiment_id}`)
    })).filter(item => item.variant_id);

    if (batchWithVariants.length > 0) {
      const { error } = await supabase.from('ab_metric_data').insert(batchWithVariants);
      if (error) {
        console.error('批量追踪指标失败:', error);
      }
    }
  }

  // ============================================
  // 实验分析
  // ============================================

  /**
   * 计算实验结果
   */
  public async calculateExperimentResults(experimentId: string): Promise<ExperimentResult | null> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) {
      return null;
    }

    // 获取所有指标数据
    const { data: metricData } = await supabase
      .from('ab_metric_data')
      .select('*')
      .eq('experiment_id', experimentId);

    if (!metricData || metricData.length === 0) {
      return null;
    }

    // 计算每个变体的结果
    const variantResults: VariantResult[] = [];
    let controlVariant: ExperimentVariant | undefined;

    for (const variant of experiment.variants) {
      if (variant.isControl) {
        controlVariant = variant;
      }

      const variantData = metricData.filter(d => d.variant_id === variant.id);
      const sampleSize = new Set(variantData.map(d => d.user_id)).size;

      const metrics: MetricResult[] = [];
      for (const metric of experiment.metrics) {
        const metricValues = variantData
          .filter(d => d.metric_id === metric.id)
          .map(d => d.value);

        const result = this.calculateMetricResult(
          metric,
          metricValues,
          sampleSize
        );
        metrics.push(result);
      }

      variantResults.push({
        variantId: variant.id,
        variantName: variant.name,
        isControl: variant.isControl,
        sampleSize,
        metrics
      });
    }

    // 计算相对对照组的提升
    if (controlVariant) {
      const controlResult = variantResults.find(v => v.isControl);
      if (controlResult) {
        for (const variantResult of variantResults) {
          if (!variantResult.isControl) {
            for (let i = 0; i < variantResult.metrics.length; i++) {
              const controlMetric = controlResult.metrics[i];
              const variantMetric = variantResult.metrics[i];
              
              if (controlMetric.value !== 0) {
                variantMetric.improvement = 
                  (variantMetric.value - controlMetric.value) / controlMetric.value;
              }

              // 计算统计显著性
              variantMetric.isSignificant = this.isStatisticallySignificant(
                controlMetric.value,
                controlResult.sampleSize,
                variantMetric.value,
                variantResult.sampleSize,
                experiment.metrics[i].minimumDetectableEffect
              );
            }
          }
        }
      }
    }

    // 确定获胜变体
    let winnerVariantId: string | undefined;
    let hasSignificantResult = false;

    const primaryMetric = experiment.metrics.find(m => m.primary);
    if (primaryMetric) {
      const significantVariants = variantResults.filter(v => 
        !v.isControl && 
        v.metrics.find(m => m.metricId === primaryMetric.id)?.isSignificant
      );

      if (significantVariants.length > 0) {
        hasSignificantResult = true;
        const winner = significantVariants.reduce((best, current) => {
          const bestMetric = best.metrics.find(m => m.metricId === primaryMetric.id)!;
          const currentMetric = current.metrics.find(m => m.metricId === primaryMetric.id)!;
          return currentMetric.improvement > bestMetric.improvement ? current : best;
        });
        winnerVariantId = winner.variantId;
      }
    }

    // 计算实验持续时间
    const startTime = experiment.startTime ? new Date(experiment.startTime) : new Date();
    const endTime = experiment.endTime ? new Date(experiment.endTime) : new Date();
    const duration = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));

    return {
      experimentId,
      variantResults,
      sampleSize: variantResults.reduce((sum, v) => sum + v.sampleSize, 0),
      duration,
      hasSignificantResult,
      winnerVariantId,
      confidenceLevel: this.config.defaultConfidenceLevel
    };
  }

  /**
   * 计算单个指标结果
   */
  private calculateMetricResult(
    metric: ExperimentMetric,
    values: number[],
    sampleSize: number
  ): MetricResult {
    let value: number;

    switch (metric.aggregation) {
      case 'sum':
        value = values.reduce((a, b) => a + b, 0);
        break;
      case 'average':
        value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        break;
      case 'unique':
        value = new Set(values).size;
        break;
      case 'count':
      default:
        value = values.length;
    }

    // 计算置信区间 (使用正态近似)
    const mean = value;
    const stdDev = values.length > 1 
      ? Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (values.length - 1))
      : 0;
    const standardError = stdDev / Math.sqrt(sampleSize);
    const zScore = 1.96; // 95% 置信区间
    const marginOfError = zScore * standardError;

    return {
      metricId: metric.id,
      metricName: metric.name,
      value,
      improvement: 0,
      confidenceInterval: [mean - marginOfError, mean + marginOfError],
      pValue: 1, // 需要对照组数据才能计算
      isSignificant: false,
      statisticalPower: 0
    };
  }

  /**
   * 判断统计显著性
   */
  private isStatisticallySignificant(
    controlValue: number,
    controlSize: number,
    variantValue: number,
    variantSize: number,
    mde: number
  ): boolean {
    // 简化的显著性检验 (两样本t检验)
    const pooledSE = Math.sqrt(
      (controlValue * (1 - controlValue) / controlSize) +
      (variantValue * (1 - variantValue) / variantSize)
    );

    const zScore = (variantValue - controlValue) / pooledSE;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    return pValue < (1 - this.config.defaultConfidenceLevel);
  }

  /**
   * 标准正态分布CDF
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  // ============================================
  // 样本量计算
  // ============================================

  /**
   * 计算所需样本量
   */
  public calculateRequiredSampleSize(
    baselineConversion: number,
    mde: number,
    power: number = 0.8,
    alpha: number = 0.05
  ): number {
    const zAlpha = this.normalQuantile(1 - alpha / 2);
    const zBeta = this.normalQuantile(power);

    const p1 = baselineConversion;
    const p2 = baselineConversion * (1 + mde);
    const pAvg = (p1 + p2) / 2;

    const n = Math.ceil(
      (2 * pAvg * (1 - pAvg) * Math.pow(zAlpha + zBeta, 2)) / Math.pow(p2 - p1, 2)
    );

    return n;
  }

  /**
   * 标准正态分布分位数
   */
  private normalQuantile(p: number): number {
    if (p < 0 || p > 1) {
      throw new Error('概率必须在0和1之间');
    }

    // 使用近似算法
    const a1 = -3.969683028665376e+01;
    const a2 = 2.209460984245205e+02;
    const a3 = -2.759285104469687e+02;
    const a4 = 1.383577518672690e+02;
    const a5 = -3.066479806614716e+01;
    const a6 = 2.506628277459239e+00;

    const b1 = -5.447609879822406e+01;
    const b2 = 1.615858368580409e+02;
    const b3 = -1.556989798598866e+02;
    const b4 = 6.680131188771972e+01;
    const b5 = -1.328068155288572e+01;

    const c1 = -7.784894002430293e-03;
    const c2 = -3.223964580411365e-01;
    const c3 = -2.400758277161838e+00;
    const c4 = -2.549732539343734e+00;
    const c5 = 4.374664141464968e+00;
    const c6 = 2.938163982698783e+00;

    const d1 = 7.784695709041462e-03;
    const d2 = 3.224671290700398e-01;
    const d3 = 2.445134137142996e+00;
    const d4 = 3.754408661907416e+00;

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q: number, r: number;

    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
             ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
             (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
              ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
  }

  // ============================================
  // 辅助方法
  // ============================================

  private mapDbExperimentToExperiment(data: any): Experiment {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      startTime: data.start_time,
      endTime: data.end_time,
      trafficAllocation: data.traffic_allocation,
      variants: data.variants || [],
      metrics: data.metrics || [],
      targetingRules: data.targeting_rules,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<ABTestConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  public getConfig(): ABTestConfig {
    return { ...this.config };
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.userAssignmentCache.clear();
  }
}

// 导出单例
export const abTestingService = new ABTestingService();
