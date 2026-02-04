import React, { Component, ErrorInfo, ReactNode } from 'react';
import errorService from '@/services/errorService';
import { toast } from 'sonner';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorId: string;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
    this.errorId = this.generateErrorId();
  }

  private generateErrorId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新状态，下一次渲染时显示降级UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 构建详细的错误上下文
    const errorContext = {
      componentStack: errorInfo.componentStack,
      componentName: this.constructor.name,
      props: this.sanitizeProps(this.props),
      errorId: this.errorId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // 记录错误信息
    const loggedError = errorService.logError(error, errorContext);

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 显示错误提示，包含错误ID便于追踪
    toast.error(
      `应用程序发生错误 (ID: ${this.errorId})`,
      {
        duration: 8000,
        action: {
          label: '刷新页面',
          onClick: () => window.location.reload()
        }
      }
    );

    // 在控制台输出详细错误信息
    console.error('[ErrorBoundary] 捕获到错误:', {
      errorId: this.errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  /**
   * 清理props中的敏感信息
   */
  private sanitizeProps(props: ErrorBoundaryProps): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized: Record<string, any> = {};

    Object.keys(props).forEach(key => {
      if (key === 'children') {
        sanitized[key] = '[React Children]';
      } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else {
        try {
          sanitized[key] = props[key as keyof ErrorBoundaryProps];
        } catch {
          sanitized[key] = '[Unable to serialize]';
        }
      }
    });

    return sanitized;
  }

  /**
   * 尝试恢复错误状态
   */
  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.errorId = this.generateErrorId();
  };

  render() {
    if (this.state.hasError) {
      // 自定义降级UI
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      // 默认降级UI - 使用硬编码文本，避免依赖i18n
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
          <div className="w-full max-w-md text-center animate-fadeIn">
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <div className="text-4xl">❌</div>
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center animate-pulse">
                <div className="text-2xl">⚡</div>
              </div>
            </div>
            <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold mb-3 text-gray-800 dark:text-gray-100">应用程序发生错误</h1>
            <p className="mb-8 text-gray-600 dark:text-gray-400 leading-relaxed">
              抱歉，应用程序遇到了一个问题。请尝试刷新页面或联系我们的支持团队获取帮助。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3.5 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                刷新页面
              </button>
              <button
                onClick={() => {
                  const feedbackButton = document.querySelector('[title="用户反馈"]') as HTMLElement;
                  feedbackButton?.click();
                }}
                className="px-8 py-3.5 rounded-lg font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                联系支持
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 p-4 rounded-xl text-left bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300">
                <summary className="cursor-pointer font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <span className="text-sm font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">🔍</span>
                  错误详情
                </summary>
                <pre className="mt-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-64">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <br />
                      组件栈:
                      <br />
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                  {this.state.error.stack && (
                    <>
                      <br />
                      错误栈:
                      <br />
                      {this.state.error.stack}
                    </>
                  )}
                  <br />
                  错误名称: {this.state.error.name}
                  <br />
                  错误消息: {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="mt-8 text-xs text-gray-500 dark:text-gray-500 space-y-1">
              <p>错误ID: {this.errorId}</p>
              <p>时间: {new Date().toLocaleString('zh-CN')}</p>
              <button
                onClick={this.handleReset}
                className="mt-4 text-blue-500 hover:text-blue-600 underline"
              >
                尝试恢复
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
