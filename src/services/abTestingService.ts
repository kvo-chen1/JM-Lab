import { toast } from 'sonner';

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed';

export interface Variant {
  id: string;
  name: string;
  weight: number;
  payload?: Record<string, any>;
  isControl?: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: ExperimentStatus;
  variants: Variant[];
  targetAudience?: {
    include?: string[];
    exclude?: string[];
    minVersion?: string;
    maxVersion?: string;
  };
  startDate?: string;
  endDate?: string;
  sampleSize?: number;
  primaryMetric?: string;
  secondaryMetrics?: string[];
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  userId?: string;
  timestamp: string;
  metrics: Record<string, number>;
}

interface ABTestingConfig {
  enabled: boolean;
  persistenceKey: string;
  debug: boolean;
}

const DEFAULT_CONFIG: ABTestingConfig = {
  enabled: true,
  persistenceKey: 'ab-testing-assignments',
  debug: false,
};

class ABTestingService {
  private config: ABTestingConfig;
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, Map<string, string>> = new Map();
  private results: ExperimentResult[] = [];
  private listeners: Set<(experiment: Experiment, variant: Variant) => void> = new Set();

  constructor(config: Partial<ABTestingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadAssignments();
    this.loadResults();
  }

  private loadAssignments(): void {
    try {
      const saved = localStorage.getItem(this.config.persistenceKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([userId, experiments]) => {
          this.assignments.set(userId, new Map(Object.entries(experiments as Record<string, string>)));
        });
      }
    } catch (error) {
      console.error('[ABTesting] Failed to load assignments:', error);
    }
  }

  private saveAssignments(): void {
    try {
      const assignmentsObj: Record<string, Record<string, string>> = {};
      this.assignments.forEach((experiments, userId) => {
        assignmentsObj[userId] = Object.fromEntries(experiments);
      });
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(assignmentsObj));
    } catch (error) {
      console.error('[ABTesting] Failed to save assignments:', error);
    }
  }

  private loadResults(): void {
    try {
      const saved = localStorage.getItem('ab-testing-results');
      if (saved) {
        this.results = JSON.parse(saved);
      }
    } catch (error) {
      console.error('[ABTesting] Failed to load results:', error);
    }
  }

  private saveResults(): void {
    try {
      localStorage.setItem('ab-testing-results', JSON.stringify(this.results));
    } catch (error) {
      console.error('[ABTesting] Failed to save results:', error);
    }
  }

  defineExperiment(experiment: Experiment): void {
    this.experiments.set(experiment.id, experiment);
    this.log(`Defined experiment: ${experiment.name}`);
  }

  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  getActiveExperiments(): Experiment[] {
    const now = new Date();
    return this.getAllExperiments().filter(exp => {
      if (exp.status !== 'running') return false;
      if (exp.startDate && new Date(exp.startDate) > now) return false;
      if (exp.endDate && new Date(exp.endDate) < now) return false;
      return true;
    });
  }

  assignVariant(
    experimentId: string,
    userId?: string,
    forceVariantId?: string
  ): Variant | null {
    const experiment = this.getExperiment(experimentId);
    if (!experiment) {
      this.log(`Experiment not found: ${experimentId}`, 'error');
      return null;
    }

    if (experiment.status !== 'running') {
      this.log(`Experiment not running: ${experiment.name}`, 'warn');
      return null;
    }

    const assignmentKey = userId || 'anonymous';
    let userAssignments = this.assignments.get(assignmentKey);
    if (!userAssignments) {
      userAssignments = new Map();
      this.assignments.set(assignmentKey, userAssignments);
    }

    let variantId = forceVariantId || userAssignments.get(experimentId);

    if (!variantId) {
      variantId = this.selectVariant(experiment.variants);
      userAssignments.set(experimentId, variantId);
      this.saveAssignments();
    }

    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) {
      this.log(`Variant not found: ${variantId}`, 'error');
      return null;
    }

    this.log(`Assigned variant: ${experiment.name} → ${variant.name}`);
    this.notifyListeners(experiment, variant);

    return variant;
  }

  private selectVariant(variants: Variant[]): string {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant.id;
      }
    }

    return variants[variants.length - 1].id;
  }

  getAssignedVariant(experimentId: string, userId?: string): Variant | null {
    const experiment = this.getExperiment(experimentId);
    if (!experiment) return null;

    const assignmentKey = userId || 'anonymous';
    const userAssignments = this.assignments.get(assignmentKey);
    const variantId = userAssignments?.get(experimentId);

    if (!variantId) return null;

    return experiment.variants.find(v => v.id === variantId) || null;
  }

  trackMetric(
    experimentId: string,
    metricName: string,
    value: number = 1,
    userId?: string
  ): void {
    const variant = this.getAssignedVariant(experimentId, userId);
    if (!variant) return;

    const result: ExperimentResult = {
      experimentId,
      variantId: variant.id,
      userId,
      timestamp: new Date().toISOString(),
      metrics: { [metricName]: value },
    };

    this.results.push(result);
    this.saveResults();
    this.log(`Tracked metric: ${experimentId} → ${metricName} = ${value}`);
  }

  getExperimentResults(experimentId: string): {
    [variantId: string]: {
      count: number;
      metrics: { [metricName: string]: { sum: number; count: number; avg: number } };
    };
  } {
    const experimentResults = this.results.filter(r => r.experimentId === experimentId);
    const aggregated: {
      [variantId: string]: {
        count: number;
        metrics: { [metricName: string]: { sum: number; count: number; avg: number } };
      };
    } = {};

    for (const result of experimentResults) {
      if (!aggregated[result.variantId]) {
        aggregated[result.variantId] = {
          count: 0,
          metrics: {},
        };
      }

      aggregated[result.variantId].count++;

      for (const [metricName, value] of Object.entries(result.metrics)) {
        if (!aggregated[result.variantId].metrics[metricName]) {
          aggregated[result.variantId].metrics[metricName] = { sum: 0, count: 0, avg: 0 };
        }
        aggregated[result.variantId].metrics[metricName].sum += value;
        aggregated[result.variantId].metrics[metricName].count++;
        aggregated[result.variantId].metrics[metricName].avg =
          aggregated[result.variantId].metrics[metricName].sum /
          aggregated[result.variantId].metrics[metricName].count;
      }
    }

    return aggregated;
  }

  calculateStatisticalSignificance(
    experimentId: string,
    metricName: string
  ): { [variantId: string]: { improvement: number; pValue: number; significant: boolean } } {
    const results = this.getExperimentResults(experimentId);
    const experiment = this.getExperiment(experimentId);
    const controlVariant = experiment?.variants.find(v => v.isControl);

    if (!controlVariant || !results[controlVariant.id]) {
      return {};
    }

    const controlMetrics = results[controlVariant.id].metrics[metricName];
    if (!controlMetrics) return {};

    const significance: { [variantId: string]: { improvement: number; pValue: number; significant: boolean } } = {};

    for (const [variantId, variantResults] of Object.entries(results)) {
      if (variantId === controlVariant.id) continue;

      const variantMetrics = variantResults.metrics[metricName];
      if (!variantMetrics) continue;

      const improvement = ((variantMetrics.avg - controlMetrics.avg) / controlMetrics.avg) * 100;
      const pValue = this.calculatePValue(controlMetrics, variantMetrics);
      const significant = pValue < 0.05;

      significance[variantId] = { improvement, pValue, significant };
    }

    return significance;
  }

  private calculatePValue(
    control: { sum: number; count: number; avg: number },
    variant: { sum: number; count: number; avg: number }
  ): number {
    const pooledSE = Math.sqrt(
      (control.avg * (1 - control.avg)) / control.count +
        (variant.avg * (1 - variant.avg)) / variant.count
    );

    const zScore = (variant.avg - control.avg) / pooledSE;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    return pValue;
  }

  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - prob : prob;
  }

  startExperiment(experimentId: string): boolean {
    const experiment = this.getExperiment(experimentId);
    if (!experiment) return false;

    experiment.status = 'running';
    this.experiments.set(experimentId, experiment);
    toast.success(`实验已启动: ${experiment.name}`);
    return true;
  }

  pauseExperiment(experimentId: string): boolean {
    const experiment = this.getExperiment(experimentId);
    if (!experiment) return false;

    experiment.status = 'paused';
    this.experiments.set(experimentId, experiment);
    toast.success(`实验已暂停: ${experiment.name}`);
    return true;
  }

  completeExperiment(experimentId: string, winningVariantId?: string): boolean {
    const experiment = this.getExperiment(experimentId);
    if (!experiment) return false;

    experiment.status = 'completed';
    this.experiments.set(experimentId, experiment);

    if (winningVariantId) {
      this.log(`Experiment completed, winner: ${winningVariantId}`);
    }

    toast.success(`实验已完成: ${experiment.name}`);
    return true;
  }

  subscribe(
    listener: (experiment: Experiment, variant: Variant) => void
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(experiment: Experiment, variant: Variant): void {
    this.listeners.forEach(listener => listener(experiment, variant));
  }

  private log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    if (!this.config.debug) return;

    const prefix = '[ABTesting]';
    switch (level) {
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'error':
        console.error(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  setConfig(config: Partial<ABTestingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  exportData(): { experiments: Experiment[]; results: ExperimentResult[] } {
    return {
      experiments: this.getAllExperiments(),
      results: [...this.results],
    };
  }

  clearData(): void {
    this.experiments.clear();
    this.assignments.clear();
    this.results = [];
    localStorage.removeItem(this.config.persistenceKey);
    localStorage.removeItem('ab-testing-results');
    toast.success('A/B测试数据已清除');
  }
}

export const abTestingService = new ABTestingService();

export default abTestingService;
