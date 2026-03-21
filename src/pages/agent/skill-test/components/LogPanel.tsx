/**
 * LogPanel 组件
 * 显示执行日志
 */

import React from 'react';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
}

interface LogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs, onClear }) => {
  const getLevelColor = (level: LogEntry['level']) => {
    const colors = {
      info: '#3498DB',
      success: '#27AE60',
      warning: '#F39C12',
      error: '#E74C3C',
    };
    return colors[level];
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✓';
      case 'warning':
        return '⚠️';
      case 'error':
        return '✗';
      default:
        return '•';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">执行日志</h2>
          <p className="text-sm text-gray-400">共 {logs.length} 条记录</p>
        </div>
        <button
          onClick={onClear}
          disabled={logs.length === 0}
          className="text-xs text-gray-400 hover:text-gray-300 disabled:opacity-50 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          清除
        </button>
      </div>

      {/* 日志列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>暂无日志</p>
            <p className="text-sm mt-1">执行测试后将显示日志</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-gray-800/50 border border-gray-700/50 text-sm"
              >
                <div className="flex items-start gap-2">
                  <span
                    className="text-xs font-mono mt-0.5"
                    style={{ color: getLevelColor(log.level) }}
                  >
                    {getLevelIcon(log.level)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono">
                        {formatTime(log.timestamp)}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${getLevelColor(log.level)}20`,
                          color: getLevelColor(log.level),
                        }}
                      >
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-300 mt-1">{log.message}</p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                          详情
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-900 rounded text-xs text-gray-400 overflow-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogPanel;
