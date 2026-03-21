/**
 * ResultView 组件
 * 显示 Skill 执行结果
 */

import React, { useState } from 'react';
import type { SkillResult } from '../../types/skill';

interface ResultViewProps {
  result: SkillResult | null;
  executionTime: number;
}

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  executionTime,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getResultTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      text: '#9B59B6',
      image: '#27AE60',
      video: '#E74C3C',
      audio: '#F39C12',
      structured: '#3498DB',
      delegation: '#1ABC9C',
      workflow: '#9B59B6',
    };
    return colors[type] || '#95A5A6';
  };

  const getResultTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      case 'text':
        return '📝';
      case 'audio':
        return '🎵';
      case 'structured':
        return '📊';
      default:
        return '📄';
    }
  };

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>执行结果将显示在这里</p>
          <p className="text-sm mt-1">在左侧选择 Skill 并执行测试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">执行结果</h2>
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${getResultTypeColor(result.type)}20`,
              color: getResultTypeColor(result.type),
            }}
          >
            {getResultTypeIcon(result.type)} {result.type.toUpperCase()}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              result.success
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {result.success ? '✓ 成功' : '✗ 失败'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            耗时: {executionTime}ms
          </span>
          <button
            onClick={handleCopy}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                已复制
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                复制
              </>
            )}
          </button>
        </div>
      </div>

      {/* 结果内容 */}
      <div className="flex-1 overflow-auto p-4">
        {/* 内容展示 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            内容
          </label>
          <div className="p-3 bg-gray-800 rounded-lg">
            {result.type === 'image' || result.type === 'video' ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-300 break-all">{result.content}</p>
                {result.content.startsWith('http') && (
                  <a
                    href={result.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    查看资源 →
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{result.content}</p>
            )}
          </div>
        </div>

        {/* 元数据 */}
        {result.metadata && Object.keys(result.metadata).length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              元数据
            </label>
            <pre className="p-3 bg-gray-800 rounded-lg text-xs text-gray-300 overflow-auto">
              {JSON.stringify(result.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* 错误信息 */}
        {result.error && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-red-400 mb-2">
              错误信息
            </label>
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">
                <span className="font-medium">代码:</span> {result.error.code}
              </p>
              <p className="text-sm text-red-400 mt-1">
                <span className="font-medium">消息:</span> {result.error.message}
              </p>
              <p className="text-sm text-red-400 mt-1">
                <span className="font-medium">可重试:</span> {result.error.retryable ? '是' : '否'}
              </p>
            </div>
          </div>
        )}

        {/* 后续建议 */}
        {result.followUpSkills && result.followUpSkills.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              建议后续执行
            </label>
            <div className="flex flex-wrap gap-2">
              {result.followUpSkills.map((skillId, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded"
                >
                  {skillId}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 原始 JSON */}
      <div className="px-4 py-3 border-t border-gray-700">
        <details className="text-sm">
          <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
            查看原始 JSON
          </summary>
          <pre className="mt-2 p-3 bg-gray-800 rounded-lg text-xs text-gray-400 overflow-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default ResultView;
