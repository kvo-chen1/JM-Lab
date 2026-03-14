import { supabase } from '@/lib/supabase';

// 用户行为事件类型
export type AnalyticsEventType = 
  | 'page_view'
  | 'click'
  | 'scroll'
  | 'hover'
  | 'form_submit'
  | 'search'
  | 'error'
  | 'performance';

// 用户行为事件数据
export interface AnalyticsEvent {
  id?: string;
  user_id?: string;
  session_id: string;
  event_type: AnalyticsEventType;
  page_url: string;
  element_selector?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  device_info?: {
    userAgent: string;
    platform: string;
    screenWidth: number;
    screenHeight: number;
  };
}

// 页面性能数据
export interface PerformanceData {
  user_id?: string;
  session_id: string;
  page_url: string;
  load_time: number;
  dom_content_loaded: number;
  first_paint?: number;
  first_contentful_paint?: number;
  largest_contentful_paint?: number;
  time_to_interactive?: number;
  timestamp: string;
}

// 用户会话信息
export interface UserSession {
  session_id: string;
  user_id?: string;
  start_time: string;
  end_time?: string;
  page_views: number;
  duration?: number;
  referrer?: string;
  landing_page: string;
  exit_page?: string;
}

class AnalyticsService {
  private readonly EVENTS_TABLE = 'analytics_events';
  private readonly PERFORMANCE_TABLE = 'performance_metrics';
  private readonly SESSIONS_TABLE = 'user_sessions';
  private sessionId: string;
  private flushInterval: NodeJS.Timeout | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private isTracking: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initSession();
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 初始化会话
   */
  private async initSession() {
    if (typeof window === 'undefined') return;

    const session: UserSession = {
      session_id: this.sessionId,
      user_id: this.getUserId(),
      start_time: new Date().toISOString(),
      page_views: 0,
      referrer: document.referrer,
      landing_page: window.location.href
    };

    try {
      await supabase.from(this.SESSIONS_TABLE).insert(session);
    } catch (error) {
      console.error('[Analytics] 初始化会话失败:', error);
    }

    // 启动定期刷新
    this.startFlushInterval();

    // 监听页面卸载
    window.addEventListener('beforeunload', () => this.endSession());
  }

  /**
   * 获取用户ID
   */
  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    } catch (e) {
      console.error('[Analytics] 获取用户ID失败:', e);
    }
    return undefined;
  }

  /**
   * 开始定期刷新
   */
  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 5000); // 每5秒刷新一次
  }

  /**
   * 结束会话
   */
  private async endSession() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // 刷新剩余事件
    await this.flushEvents();

    // 更新会话结束信息
    try {
      await supabase
        .from(this.SESSIONS_TABLE)
        .update({
          end_time: new Date().toISOString(),
          exit_page: window.location.href
        })
        .eq('session_id', this.sessionId);
    } catch (error) {
      console.error('[Analytics] 结束会话失败:', error);
    }
  }

  /**
   * 刷新事件队列
   */
  private async flushEvents() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { error } = await supabase.from(this.EVENTS_TABLE).insert(events);
      if (error) throw error;
    } catch (error) {
      console.error('[Analytics] 刷新事件失败:', error);
      // 失败时重新加入队列
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * 追踪事件
   */
  trackEvent(eventType: AnalyticsEventType, metadata?: Record<string, any>, elementSelector?: string) {
    if (typeof window === 'undefined') return;

    const event: AnalyticsEvent = {
      user_id: this.getUserId(),
      session_id: this.sessionId,
      event_type: eventType,
      page_url: window.location.href,
      element_selector: elementSelector,
      metadata,
      timestamp: new Date().toISOString(),
      device_info: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height
      }
    };

    this.eventQueue.push(event);

    // 如果队列过大，立即刷新
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
  }

  /**
   * 追踪页面浏览
   */
  trackPageView(pageUrl?: string, metadata?: Record<string, any>) {
    this.trackEvent('page_view', {
      ...metadata,
      title: document.title,
      url: pageUrl || window.location.href
    });
  }

  /**
   * 追踪点击
   */
  trackClick(elementSelector: string, metadata?: Record<string, any>) {
    this.trackEvent('click', metadata, elementSelector);
  }

  /**
   * 追踪搜索
   */
  trackSearch(query: string, resultsCount?: number, metadata?: Record<string, any>) {
    this.trackEvent('search', {
      query,
      resultsCount,
      ...metadata
    });
  }

  /**
   * 追踪错误
   */
  trackError(error: Error, metadata?: Record<string, any>) {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      ...metadata
    });
  }

  /**
   * 追踪性能指标
   */
  async trackPerformance() {
    if (typeof window === 'undefined') return;

    // 等待性能数据可用
    if ('performance' in window) {
      const timing = performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        const data: PerformanceData = {
          user_id: this.getUserId(),
          session_id: this.sessionId,
          page_url: window.location.href,
          load_time: navigation.loadEventEnd - navigation.startTime,
          dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.startTime,
          timestamp: new Date().toISOString()
        };

        // 获取 paint 数据
        const paints = performance.getEntriesByType('paint');
        paints.forEach(paint => {
          if (paint.name === 'first-paint') {
            data.first_paint = paint.startTime;
          }
          if (paint.name === 'first-contentful-paint') {
            data.first_contentful_paint = paint.startTime;
          }
        });

        try {
          await supabase.from(this.PERFORMANCE_TABLE).insert(data);
        } catch (error) {
          console.error('[Analytics] 追踪性能失败:', error);
        }
      }
    }
  }

  /**
   * 开始自动追踪
   */
  startAutoTracking() {
    if (this.isTracking || typeof window === 'undefined') return;
    this.isTracking = true;

    // 追踪页面浏览
    this.trackPageView();

    // 监听点击事件
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const selector = this.getElementSelector(target);
      this.trackClick(selector, {
        tagName: target.tagName,
        text: target.textContent?.substring(0, 50),
        id: target.id,
        className: target.className
      });
    });

    // 监听滚动
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackEvent('scroll', {
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          documentHeight: document.documentElement.scrollHeight
        });
      }, 500);
    });

    // 追踪性能
    window.addEventListener('load', () => {
      setTimeout(() => this.trackPerformance(), 0);
    });

    // 监听路由变化（用于SPA）
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.trackPageView();
      }
    });
    observer.observe(document, { subtree: true, childList: true });
  }

  /**
   * 获取元素选择器
   */
  private getElementSelector(element: HTMLElement): string {
    const parts: string[] = [];
    let current: HTMLElement | null = element;

    while (current && parts.length < 5) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        parts.unshift(selector);
        break;
      }
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c).slice(0, 3);
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }
      
      parts.unshift(selector);
      current = current.parentElement;
    }

    return parts.join(' > ');
  }

  /**
   * 获取统计数据
   */
  async getStats(days: number = 7): Promise<{
    pageViews: number;
    uniqueVisitors: number;
    avgSessionDuration: number;
    topPages: Array<{ page: string; views: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // 页面浏览量
      const { count: pageViews } = await supabase
        .from(this.EVENTS_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
        .gte('timestamp', startDate.toISOString());

      // 独立访客
      const { data: sessions } = await supabase
        .from(this.SESSIONS_TABLE)
        .select('session_id')
        .gte('start_time', startDate.toISOString());

      const uniqueVisitors = new Set(sessions?.map(s => s.session_id)).size;

      // 平均会话时长
      const { data: sessionDurations } = await supabase
        .from(this.SESSIONS_TABLE)
        .select('duration')
        .gte('start_time', startDate.toISOString())
        .not('duration', 'is', null);

      const avgSessionDuration = sessionDurations && sessionDurations.length > 0
        ? sessionDurations.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionDurations.length
        : 0;

      // 热门页面
      const { data: topPagesData } = await supabase
        .from(this.EVENTS_TABLE)
        .select('page_url')
        .eq('event_type', 'page_view')
        .gte('timestamp', startDate.toISOString());

      const pageCount: Record<string, number> = {};
      topPagesData?.forEach(event => {
        pageCount[event.page_url] = (pageCount[event.page_url] || 0) + 1;
      });

      const topPages = Object.entries(pageCount)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      return {
        pageViews: pageViews || 0,
        uniqueVisitors,
        avgSessionDuration,
        topPages
      };
    } catch (error) {
      console.error('[Analytics] 获取统计失败:', error);
      return {
        pageViews: 0,
        uniqueVisitors: 0,
        avgSessionDuration: 0,
        topPages: []
      }
    }
  }

  /**
   * 增加作品浏览次数
   */
  async incrementWorkViewCount(workId: string): Promise<void> {
    try {
      // 调用 Supabase RPC 函数增加浏览次数
      const { error } = await supabase.rpc('increment_work_view_count', {
        work_id: workId
      });
      
      if (error) {
        console.error('[Analytics] 增加作品浏览次数失败:', error);
      }
    } catch (error) {
      console.error('[Analytics] 增加作品浏览次数异常:', error);
    }
  }
}

// 创建单例
export const analyticsService = new AnalyticsService();

// 自动启动追踪（如果在浏览器环境）
if (typeof window !== 'undefined') {
  analyticsService.startAutoTracking();
}

// 导出独立的 incrementWorkViewCount 函数
export const incrementWorkViewCount = (workId: string) => 
  analyticsService.incrementWorkViewCount(workId);

export default analyticsService;
