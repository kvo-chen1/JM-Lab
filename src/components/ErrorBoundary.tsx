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
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新状态，下一次渲染时显示降级UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    errorService.logError(error, {
      componentStack: errorInfo.componentStack,
      componentName: this.constructor.name,
      props: this.props
    });

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 显示错误提示
    toast.error(
      '抱歉，应用程序发生了错误',
      {
        duration: 5000,
        action: {
          label: '刷新页面',
          onClick: () => window.location.reload()
        }
      }
    );
  }

  render() {
    if (this.state.hasError) {
      // 自定义降级UI
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      // 默认降级UI - 使用硬编码文本，避免依赖i18n
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
          <div className="w-full max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">应用程序发生错误</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              抱歉，应用程序遇到了一个问题。请尝试刷新页面或联系支持团队。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                刷新页面
              </button>
              <button
                onClick={() => {
                  const feedbackButton = document.querySelector('[title="用户反馈"]') as HTMLElement;
                  feedbackButton?.click();
                }}
                className="px-6 py-3 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                联系支持
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 p-4 rounded-lg text-left bg-gray-100 dark:bg-gray-800">
                <summary className="cursor-pointer font-medium">错误详情</summary>
                <pre className="mt-2 whitespace-pre-wrap text-sm">
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
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
