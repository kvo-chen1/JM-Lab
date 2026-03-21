/**
 * Skill 架构前端使用示例
 * 展示如何在前端组件中使用 useSkill Hook
 */

import React, { useState, useCallback } from 'react';
import { useSkill } from '../hooks/useSkill';
import { SkillCategory } from '../types/skill';

export const SkillDemo: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [responses, setResponses] = useState<Array<{ type: string; content: string }>>([]);

  // 使用 useSkill Hook
  const {
    isProcessing,
    error,
    lastResult,
    processMessage,
    executeSkill,
    getAvailableSkills,
    getSkillsByCategory,
    clearError
  } = useSkill({
    userId: 'demo-user',
    sessionId: 'demo-session',
    autoRegisterDefaultSkills: true
  });

  // 获取所有可用的 Skill
  const availableSkills = getAvailableSkills();
  const creationSkills = getSkillsByCategory(SkillCategory.CREATION);

  // 处理用户输入
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    // 添加用户消息到响应列表
    setResponses(prev => [...prev, { type: 'user', content: inputMessage }]);

    try {
      // 使用 processMessage 自动识别意图并执行最佳 Skill
      const result = await processMessage(inputMessage);

      // 添加 Skill 响应
      setResponses(prev => [...prev, {
        type: result.type,
        content: result.content
      }]);

      // 清空输入
      setInputMessage('');
    } catch (err) {
      console.error('处理失败:', err);
    }
  }, [inputMessage, isProcessing, processMessage]);

  // 直接执行特定 Skill
  const handleExecuteSkill = useCallback(async (skillId: string) => {
    try {
      const result = await executeSkill(skillId, {
        message: '直接执行 Skill',
        parameters: { test: true }
      });

      setResponses(prev => [...prev, {
        type: 'skill',
        content: `执行 ${skillId}: ${result.content}`
      }]);
    } catch (err) {
      console.error('执行失败:', err);
    }
  }, [executeSkill]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Skill 架构演示</h1>

      {/* 状态显示 */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">当前状态</h2>
        <div className="text-sm">
          <p>处理中: {isProcessing ? '是' : '否'}</p>
          <p>可用 Skill 数: {availableSkills.length}</p>
          <p>创作类 Skill: {creationSkills.map(s => s.name).join(', ')}</p>
          {error && (
            <p className="text-red-500">
              错误: {error}
              <button
                onClick={clearError}
                className="ml-2 text-xs underline"
              >
                清除
              </button>
            </p>
          )}
        </div>
      </div>

      {/* 快速执行按钮 */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">快速执行 Skill</h2>
        <div className="flex gap-2 flex-wrap">
          {availableSkills.map(skill => (
            <button
              key={skill.id}
              onClick={() => handleExecuteSkill(skill.id)}
              disabled={isProcessing}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
            >
              执行 {skill.name}
            </button>
          ))}
        </div>
      </div>

      {/* 对话界面 */}
      <div className="mb-6 border rounded">
        <div className="p-4 h-64 overflow-y-auto bg-gray-50">
          {responses.length === 0 ? (
            <p className="text-gray-400 text-center">开始对话...</p>
          ) : (
            responses.map((resp, index) => (
              <div
                key={index}
                className={`mb-2 p-2 rounded ${
                  resp.type === 'user'
                    ? 'bg-blue-100 ml-8'
                    : resp.type === 'image'
                    ? 'bg-green-100'
                    : 'bg-gray-200 mr-8'
                }`}
              >
                <span className="text-xs text-gray-500">[{resp.type}]</span>
                <p className="text-sm">{resp.content}</p>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="text-center text-gray-400">
              处理中...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="输入消息，例如：帮我画一个Logo"
            className="flex-1 px-3 py-2 border rounded"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            发送
          </button>
        </form>
      </div>

      {/* 最后结果 */}
      {lastResult && (
        <div className="p-4 bg-green-50 rounded">
          <h2 className="font-semibold mb-2">最后执行结果</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SkillDemo;
