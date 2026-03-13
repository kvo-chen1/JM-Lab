import { toast } from 'sonner';

export type EventType =
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'work_view'
  | 'work_like'
  | 'work_comment'
  | 'work_share'
  | 'search'
  | 'scroll_depth'
  | 'time_spent'
  | 'conversion'
  | 'error'
  | 'custom';

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  name: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  properties?: Record<string, any>;
  userProperties?: Record<string, any>;
  deviceInfo?: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    language: string;
    timezone: string;
  };
  pageInfo?: {
    url: string;
    path: string;
    referrer: string;
    title: string;
  };
}

export interface AnalyticsSession {
  id: string;
  startTime: string;
  endTime?: string;
  events: AnalyticsEvent[];
  duration?: number;
}

export interface AnalyticsMetric {
  name: string;
  value: number;
  timestamp: string;
  dimensions?: Record<string, string>;
}

interface AnalyticsConfig {
  enabled: boolean;
  samplingRate: number;
  maxEventsPerSession: number;
  sessionTimeout: number;
  autoTrackPageViews: boolean;
  autoTrackScrollDepth: boolean;
  autoTrackTimeSpent: boolean;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  samplingRate: 1.0,
  maxEventsPerSession: 1000,
  sessionTimeout: 30 * 60 * 1000,
  autoTrackPageViews: true,
  autoTrackScrollDepth: true,
  autoTrackTimeSpent: true,
};

class AnalyticsEnhancedService {
  private config: AnalyticsConfig;
  private session: AnalyticsSession | null = null;
  private events: AnalyticsEvent[] = [];
  private metrics: AnalyticsMetric[] = [];
  private listeners: Set<(event: AnalyticsEvent) => void> = new Set();
  private metricsListeners: Set<(metric: AnalyticsMetric) => void> = new Set();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeSession();
    this.setupAutoTracking();
    this.loadFromStorage();
  }

  private initializeSession(): void {
    const now = new Date().toISOString();
    this.session = {
      id: this.generateSessionId(),
      startTime: now,
      events: [],
    };
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupAutoTracking(): void {
    if (this.config.autoTrackPageViews) {
      this.trackPageView();
      window.addEventListener('popstate', () => this.trackPageView());
    }

    if (this.config.autoTrackScrollDepth) {
      this.setupScrollTracking();
    }

    if (this.config.autoTrackTimeSpent) {
      this.setupTimeSpentTracking();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.persistSession();
      }
    });
  }

  private setupScrollTracking(): void {
    let maxScrollDepth = 0;
    const updateScrollDepth = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
    };

    window.addEventListener('scroll', updateScrollDepth, { passive: true });
    window.addEventListener('beforeunload', () => {
      if (maxScrollDepth > 0) {
        this.track('scroll_depth', { depth: Math.round(maxScrollDepth) });
      }
    });
  }

  private setupTimeSpentTracking(): void {
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      this.track('time_spent', { seconds: timeSpent });
    });
  }

  private loadFromStorage(): void {
    try {
      const savedEvents = localStorage.getItem('analytics-events');
      const savedMetrics = localStorage.getItem('analytics-metrics');

      if (savedEvents) {
        this.events = JSON.parse(savedEvents);
      }
      if (savedMetrics) {
        this.metrics = JSON.parse(savedMetrics);
      }
    } catch (error) {
      console.error('[AnalyticsEnhanced] Failed to load from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const recentEvents = this.events.slice(-this.config.maxEventsPerSession);
      localStorage.setItem('analytics-events', JSON.stringify(recentEvents));
      localStorage.setItem('analytics-metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('[AnalyticsEnhanced] Failed to save to storage:', error);
    }
  }

  private persistSession(): void {
    if (this.session) {
      this.session.endTime = new Date().toISOString();
      this.session.duration = Date.now() - new Date(this.session.startTime).getTime();
      this.session.events = [...this.events];
    }
    this.saveToStorage();
  }

  track(
    name: string,
    properties?: Record<string, any>,
    userProperties?: Record<string, any>
  ): void {
    if (!this.config.enabled) return;

    if (Math.random() > this.config.samplingRate) return;

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type: name.startsWith('custom_') ? 'custom' : (name as EventType),
      name,
      timestamp: new Date().toISOString(),
      sessionId: this.session?.id || this.generateSessionId(),
      properties,
      userProperties,
      deviceInfo: this.getDeviceInfo(),
      pageInfo: this.getPageInfo(),
    };

    this.events.push(event);

    if (this.events.length > this.config.maxEventsPerSession) {
      this.events = this.events.slice(-this.config.maxEventsPerSession);
    }

    this.saveToStorage();
    this.notifyListeners(event);
  }

  trackPageView(properties?: Record<string, any>): void {
    this.track('page_view', {
      ...properties,
      path: window.location.pathname,
      url: window.location.href,
      title: document.title,
    });
  }

  trackClick(elementName: string, properties?: Record<string, any>): void {
    this.track('button_click', {
      element: elementName,
      ...properties,
    });
  }

  trackConversion(
    conversionName: string,
    value?: number,
    properties?: Record<string, any>
  ): void {
    this.track('conversion', {
      conversion: conversionName,
      value,
      ...properties,
    });
    this.recordMetric(conversionName, value || 1);
  }

  trackError(error: Error | string, properties?: Record<string, any>): void {
    this.track('error', {
      error: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      ...properties,
    });
  }

  recordMetric(
    name: string,
    value: number,
    dimensions?: Record<string, string>
  ): void {
    const metric: AnalyticsMetric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      dimensions,
    };

    this.metrics.push(metric);
    this.saveToStorage();
    this.notifyMetricsListeners(metric);
  }

  getMetrics(
    name?: string,
    startDate?: Date,
    endDate?: Date
  ): AnalyticsMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (startDate) {
      filtered = filtered.filter(m => new Date(m.timestamp) >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(m => new Date(m.timestamp) <= endDate);
    }

    return filtered;
  }

  getAggregatedMetric(
    name: string,
    startDate?: Date,
    endDate?: Date
  ): { sum: number; count: number; avg: number; min: number; max: number } {
    const metrics = this.getMetrics(name, startDate, endDate);
    const values = metrics.map(m => m.value);

    if (values.length === 0) {
      return { sum: 0, count: 0, avg: 0, min: 0, max: 0 };
    }

    return {
      sum: values.reduce((a, b) => a + b, 0),
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  getEvents(
    type?: EventType,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): AnalyticsEvent[] {
    let filtered = this.events;

    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }

    if (startDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= endDate);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  private getDeviceInfo(): AnalyticsEvent['deviceInfo'] {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private getPageInfo(): AnalyticsEvent['pageInfo'] {
    return {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
    };
  }

  subscribe(listener: (event: AnalyticsEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToMetrics(listener: (metric: AnalyticsMetric) => void): () => void {
    this.metricsListeners.add(listener);
    return () => this.metricsListeners.delete(listener);
  }

  private notifyListeners(event: AnalyticsEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  private notifyMetricsListeners(metric: AnalyticsMetric): void {
    this.metricsListeners.forEach(listener => listener(metric));
  }

  exportData(): { events: AnalyticsEvent[]; metrics: AnalyticsMetric[] } {
    return {
      events: [...this.events],
      metrics: [...this.metrics],
    };
  }

  clearData(): void {
    this.events = [];
    this.metrics = [];
    this.initializeSession();
    localStorage.removeItem('analytics-events');
    localStorage.removeItem('analytics-metrics');
    toast.success('分析数据已清除');
  }

  setUserId(userId: string): void {
    this.events.forEach(event => {
      event.userId = userId;
    });
    this.saveToStorage();
  }

  setConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const analyticsEnhancedService = new AnalyticsEnhancedService();

export default analyticsEnhancedService;
