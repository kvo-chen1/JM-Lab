/**
 * TestPanel 组件
 * 测试执行面板，包含输入、参数配置和执行控制
 */

import React, { useState, useCallback } from 'react';
import type { ISkill } from '../../types/skill';

interface TestPanelProps {
  selectedSkill: ISkill | null;
  onExecute: (message: string, parameters: Record<string, any>, mode: 'auto' | 'manual') => void;
  isProcessing: boolean;
}

// 预设测试用例
const presetTests = [
  { label: '图像生成', message: '帮我画一个Logo', skillId: 'image-generation' },
  { label: '文本生成', message: '写个品牌文案', skillId: 'text-generation' },
  { label: '需求分析', message: '分析一下我的设计需求', skillId: 'requirement-analysis' },
  { label: '问候', message: '你好', skillId: 'intent-recognition' },
  { label: '模糊意图', message: '我不确定想要什么', skillId: 'intent-recognition' },
];

export const TestPanel: React.FC<TestPanelProps> = ({
  selectedSkill,
  onExecute,
  isProcessing,
}) => {
  const [message, setMessage] = useState('');
  const [parameters, setParameters] = useState('{}');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [paramError, setParamError] = useState<string | null>(null);

  const handleExecute = useCallback(() => {
    if (!message.trim() || isProcessing) return;

    let parsedParams: Record<string, any> = {};
    try {
      parsedParams = JSON.parse(parameters);
      setParamError(null);
    } catch (e) {
      setParamError('JSON 格式错误');
      return;
    }

    onExecute(message, parsedParams, mode);
  }, [message, parameters, mode, isProcessing, onExecute]);

  const handlePresetClick = useCallback((preset: typeof presetTests[0]) => {
    setMessage(preset.message);
    if (mode === 'manual' && preset.skillId) {
      // 如果手动模式，可以设置对应的 skill
    }
  }, [mode]);

  const formatJSON = useCallback(() => {
    try {
      const parsed = JSON.parse(parameters);
      setParameters(JSON.stringify(parsed, null, 2));
      setParamError(null);
    } catch (e) {
      setParamError('无法格式化：JSON 格式错误');
    }
  }, [parameters]);

  return (
    <div className="h-full flex flex-col">
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">测试执行</h2>
        <p className="text-sm text-gray-400 mt-1">
          {mode === 'auto' ? '自动识别意图并执行' : `手动执行: ${selectedSkill?.name || '未选择 Skill'}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 执行模式选择 */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('auto')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'auto'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            自动模式
          </button>
          <button
            onClick={() => setMode('manual')}
            disabled={!selectedSkill}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            手动模式
          </button>
        </div>

        {/* 选中的 Skill 信息 */}
        {mode === 'manual' && selectedSkill && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-medium">{selectedSkill.name}</span>
              <span className="text-xs text-gray-400">({selectedSkill.id})</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{selectedSkill.description}</p>
          </div>
        )}

        {/* 消息输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            测试消息
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入测试消息，例如：帮我画一个Logo"
            className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            disabled={isProcessing}
          />
        </div>

        {/* 参数配置 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              参数 (JSON)
            </label>
            <button
              onClick={formatJSON}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              格式化
            </button>
          </div>
          <textarea
            value={parameters}
            onChange={(e) => setParameters(e.target.value)}
            placeholder='{"key": "value"}'
            className={`w-full h-32 px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm ${
              paramError ? 'border-red-500' : 'border-gray-700'
            }`}
            disabled={isProcessing}
          />
          {paramError && (
            <p className="mt-1 text-xs text-red-400">{paramError}</p>
          )}
        </div>

        {/* 预设测试用例 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            快速测试
          </label>
          <div className="flex flex-wrap gap-2">
            {presetTests.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetClick(preset)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 执行按钮 */}
        <button
          onClick={handleExecute}
          disabled={!message.trim() || isProcessing || (mode === 'manual' && !selectedSkill)}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              执行中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {mode === 'auto' ? '自动执行' : '执行 Skill'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TestPanel;
