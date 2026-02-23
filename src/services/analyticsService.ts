/**
 * 数据分析服务
 * 用于收集和上报用户行为数据
 */

class AnalyticsService {
  private sessionId: string;
  private deviceType: string;
  private browser: string;
  private os: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.deviceType = this.detectDeviceType();
    this.browser = this.detectBrowser();
    this.os = this.detectOS();
    
    // 初始化时记录设备信息
    this.recordDeviceInfo();
    
    // 记录页面浏览
    this.recordPageView();
    
    // 监听页面离开
    this.setupPageLeaveTracking();
  }

  // 生成会话ID
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 检测设备类型
  private detectDeviceType(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/mobile|android|iphone|ipad|ipod|windows phone/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // 检测浏览器
  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  // 检测操作系统
  private detectOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
  }

  // 记录设备信息
  private async recordDeviceInfo(): Promise<void> {
    try {
      await fetch('/api/analytics/device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_type: this.deviceType,
          device_name: navigator.platform,
          user_agent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.warn('记录设备信息失败:', error);
    }
  }

  // 记录页面浏览
  private async recordPageView(): Promise<void> {
    try {
      await fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_path: window.location.pathname,
          page_title: document.title,
          referrer: document.referrer,
          session_id: this.sessionId,
          device_type: this.deviceType,
          browser: this.browser,
          os: this.os,
        }),
      });
    } catch (error) {
      console.warn('记录页面浏览失败:', error);
    }
  }

  // 设置页面离开追踪
  private setupPageLeaveTracking(): void {
    let startTime = Date.now();
    
    // 页面可见性变化时记录停留时间
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        this.updatePageDuration(duration);
      } else {
        startTime = Date.now();
      }
    });

    // 页面卸载时记录
    window.addEventListener('beforeunload', () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      this.updatePageDuration(duration);
    });
  }

  // 更新页面停留时间
  private async updatePageDuration(duration: number): Promise<void> {
    // 这里可以实现一个批量上报机制
    // 暂时使用 sendBeacon 确保数据在页面关闭时也能发送
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        page_path: window.location.pathname,
        duration: duration,
        session_id: this.sessionId,
      });
      navigator.sendBeacon('/api/analytics/pageview/duration', new Blob([data], { type: 'application/json' }));
    }
  }

  // 记录用户活动
  public async trackActivity(
    activityType: string,
    activityName: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await fetch('/api/analytics/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_type: activityType,
          activity_name: activityName,
          description: description || null,
          metadata: metadata || null,
        }),
      });
    } catch (error) {
      console.warn('记录用户活动失败:', error);
    }
  }

  // 记录流量来源
  public async trackTrafficSource(): Promise<void> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');

      // 判断来源类型
      let sourceType = 'direct';
      let sourceName = '直接访问';

      if (utmSource) {
        sourceName = utmSource;
        if (utmSource.includes('google') || utmSource.includes('baidu')) {
          sourceType = 'search';
        } else if (utmSource.includes('wechat') || utmSource.includes('weibo') || utmSource.includes('douyin')) {
          sourceType = 'social';
        } else {
          sourceType = 'other';
        }
      } else if (document.referrer) {
        const referrer = document.referrer.toLowerCase();
        if (referrer.includes('google') || referrer.includes('baidu')) {
          sourceType = 'search';
          sourceName = '搜索引擎';
        } else if (referrer.includes('wechat') || referrer.includes('weibo') || referrer.includes('douyin')) {
          sourceType = 'social';
          sourceName = '社交媒体';
        } else if (referrer) {
          sourceType = 'referral';
          sourceName = '外部链接';
        }
      }

      await fetch('/api/analytics/traffic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_type: sourceType,
          source_name: sourceName,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          referrer_url: document.referrer || null,
          landing_page: window.location.pathname,
        }),
      });
    } catch (error) {
      console.warn('记录流量来源失败:', error);
    }
  }

  // 追踪事件
  public trackEvent(eventName: string, eventData?: Record<string, any>): void {
    this.trackActivity('event', eventName, undefined, eventData);
  }

  // 追踪页面浏览
  public trackPageView(pagePath?: string, pageTitle?: string): void {
    this.recordPageView();
  }
}

// 创建单例实例
export const analyticsService = new AnalyticsService();

export default analyticsService;
