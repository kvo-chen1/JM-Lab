/**
 * SkillTestPage - Skill 架构测试页面
 * 用于测试和验证 Skill 架构的各项功能
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSkill } from '../hooks/useSkill';
import type { ISkill, SkillCategory, SkillResult } from '../types/skill';
import { SkillList } from './components/SkillList';
import { TestPanel } from './components/TestPanel';
import { ResultView } from './components/ResultView';
import { LogPanel, LogEntry } from './components/LogPanel';
import { StatsPanel } from './components/StatsPanel';

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const SkillTestPage: React.FC = () => {
  // 使用 useSkill Hook
  const {
    processMessage,
    executeSkill,
    getAvailableSkills,
    getSkillStats,
    isProcessing,
    error,
    clearError,
    registry,
  } = useSkill({
    userId: 'skill-test-user',
    autoRegisterDefaultSkills: true,
  });

  // 本地状态
  const [skills, setSkills] = useState<ISkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<ISkill | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
  const [result, setResult] = useState<SkillResult | null>(null);
  const [executionTime, setExecutionTime] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [skillStats, setSkillStats] = useState<Map<string, { totalExecutions: number; successfulExecutions: number }>>(new Map());

  // 统计状态
  const [stats, setStats] = useState({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    totalExecutionTime: 0,
    categoryStats: {
      [SkillCategory.CREATION]: 0,
      [SkillCategory.ANALYSIS]: 0,
      [SkillCategory.COGNITION]: 0,
      [SkillCategory.ORCHESTRATION]: 0,
      [SkillCategory.ENHANCEMENT]: 0,
    },
  });

  // 刷新 Skill 列表
  const refreshSkills = useCallback(() => {
    const allSkills = getAvailableSkills();
    setSkills(allSkills);

    // 更新统计
    const newStats = new Map<string, { totalExecutions: number; successfulExecutions: number }>();
    allSkills.forEach(skill => {
      const stat = getSkillStats(skill.id);
      if (stat) {
        newStats.set(skill.id, stat);
      }
    });
    setSkillStats(newStats);
  }, [getAvailableSkills, getSkillStats]);

  // 初始加载
  useEffect(() => {
    refreshSkills();
  }, [refreshSkills]);

  // 添加日志
  const addLog = useCallback((level: LogEntry['level'], message: string, details?: Record<string, any>) => {
    const newLog: LogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      level,
      message,
      details,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  // 清除日志
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 执行测试
  const handleExecute = useCallback(async (
    message: string,
    parameters: Record<string, any>,
    mode: 'auto' | 'manual'
  ) => {
    clearError();
    setResult(null);
    const startTime = Date.now();

    try {
      addLog('info', `开始执行测试: ${message.substring(0, 50)}...`, { mode, parameters });

      let testResult: SkillResult;

      if (mode === 'auto') {
        addLog('info', '使用自动模式，准备识别意图...');
        testResult = await processMessage(message, { parameters });
        addLog('success', '自动执行完成', { type: testResult.type, success: testResult.success });
      } else {
        if (!selectedSkill) {
          addLog('error', '手动模式需要选择 Skill');
          return;
        }
        addLog('info', `手动执行 Skill: ${selectedSkill.name}`);
        testResult = await executeSkill(selectedSkill.id, { message, parameters });
        addLog('success', `Skill ${selectedSkill.name} 执行完成`, { success: testResult.success });
      }

      const time = Date.now() - startTime;
      setExecutionTime(time);
      setResult(testResult);

      // 更新统计
      setStats(prev => {
        const category = mode === 'manual' && selectedSkill
          ? selectedSkill.category
          : SkillCategory.ANALYSIS; // 自动模式默认分析类

        return {
          totalExecutions: prev.totalExecutions + 1,
          successfulExecutions: prev.successfulExecutions + (testResult.success ? 1 : 0),
          failedExecutions: prev.failedExecutions + (testResult.success ? 0 : 1),
          totalExecutionTime: prev.totalExecutionTime + time,
          categoryStats: {
            ...prev.categoryStats,
            [category]: prev.categoryStats[category] + 1,
          },
        };
      });

      // 刷新 Skill 统计
      refreshSkills();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '执行失败';
      addLog('error', errorMessage);
      setExecutionTime(Date.now() - startTime);
    }
  }, [processMessage, executeSkill, selectedSkill, addLog, clearError, refreshSkills]);

  // 计算平均执行时间
  const averageExecutionTime = stats.totalExecutions > 0
    ? stats.totalExecutionTime / stats.totalExecutions
    : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 页面标题 */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Skill 架构测试中心</h1>
              <p className="text-sm text-gray-400 mt-1">
                测试和验证 Skill 架构的各项功能
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshSkills}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                刷新 Skill 列表
              </button>
              <a
                href="/agent"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                返回 Agent →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
            <span className="text-red-400 text-sm">{error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* 左侧：Skill 列表 */}
          <div className="col-span-3 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <SkillList
              skills={skills}
              selectedSkill={selectedSkill}
              onSelectSkill={setSelectedSkill}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              skillStats={skillStats}
            />
          </div>

          {/* 中间：测试面板 */}
          <div className="col-span-4 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <TestPanel
              selectedSkill={selectedSkill}
              onExecute={handleExecute}
              isProcessing={isProcessing}
            />
          </div>

          {/* 右侧：结果和日志 */}
          <div className="col-span-5 flex flex-col gap-6">
            {/* 结果展示 */}
            <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <ResultView result={result} executionTime={executionTime} />
            </div>

            {/* 日志面板 */}
            <div className="h-48 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <LogPanel logs={logs} onClear={clearLogs} />
            </div>
          </div>
        </div>

        {/* 底部统计 */}
        <div className="mt-6 bg-gray-800 rounded-xl border border-gray-700 p-6">
          <StatsPanel
            totalExecutions={stats.totalExecutions}
            successfulExecutions={stats.successfulExecutions}
            failedExecutions={stats.failedExecutions}
            averageExecutionTime={averageExecutionTime}
            categoryStats={stats.categoryStats}
          />
        </div>
      </div>
    </div>
  );
};

export default SkillTestPage;
