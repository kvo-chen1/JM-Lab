/**
 * SkillTestPage - Skill 架构测试页面
 * 用于测试和验证 Skill 架构的各项功能
 * 增强版：支持 Agent 选择和调试
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSkill } from '../hooks/useSkill';
import type { ISkill, SkillCategory, SkillResult } from '../types/skill';
import type { AgentType } from '../types/agent';
import { SkillList } from './components/SkillList';
import { TestPanel } from './components/TestPanel';
import { ResultView } from './components/ResultView';
import { LogPanel, LogEntry } from './components/LogPanel';
import { StatsPanel } from './components/StatsPanel';
import { SkillDebugger } from '../components/SkillDebugger';
import { AGENT_CAPABILITY_DESCRIPTIONS } from '../config/agentSkillConfig';
import { 
  User, 
  Sparkles, 
  Palette, 
  PenTool, 
  Type, 
  Video, 
  Search,
  ChevronDown
} from 'lucide-react';

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Agent 图标映射
const agentIconMap: Record<Exclude<AgentType, 'system' | 'user'>, React.ReactNode> = {
  director: <Sparkles className="w-4 h-4" />,
  designer: <Palette className="w-4 h-4" />,
  illustrator: <PenTool className="w-4 h-4" />,
  copywriter: <Type className="w-4 h-4" />,
  animator: <Video className="w-4 h-4" />,
  researcher: <Search className="w-4 h-4" />
};

export const SkillTestPage: React.FC = () => {
  // Agent 选择状态
  const [selectedAgent, setSelectedAgent] = useState<Exclude<AgentType, 'system' | 'user'>>('designer');
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  // 使用 useSkill Hook，传入当前 Agent
  const {
    processMessage,
    executeSkill,
    getAvailableSkills,
    getAgentAvailableSkills,
    getSkillStats,
    isProcessing,
    error,
    clearError,
    registry,
    matcher,
  } = useSkill({
    userId: 'skill-test-user',
    currentAgent: selectedAgent,
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
      ['creation' as SkillCategory]: 0,
      ['analysis' as SkillCategory]: 0,
      ['cognition' as SkillCategory]: 0,
      ['orchestration' as SkillCategory]: 0,
      ['enhancement' as SkillCategory]: 0,
    },
  });

  // 刷新 Skill 列表
  const refreshSkills = useCallback(() => {
    // 获取当前 Agent 可用的 Skill
    const agentSkills = getAgentAvailableSkills();
    setSkills(agentSkills);

    // 更新统计
    const newStats = new Map<string, { totalExecutions: number; successfulExecutions: number }>();
    agentSkills.forEach(skill => {
      const stat = getSkillStats(skill.id);
      if (stat) {
        newStats.set(skill.id, stat);
      }
    });
    setSkillStats(newStats);
  }, [getAgentAvailableSkills, getSkillStats]);

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
      addLog('info', `开始执行测试: ${message.substring(0, 50)}...`, { 
        mode, 
        parameters, 
        agent: selectedAgent 
      });

      let testResult: SkillResult;

      if (mode === 'auto') {
        addLog('info', `使用自动模式 (Agent: ${selectedAgent})，准备识别意图...`);
        testResult = await processMessage(message, { 
          parameters,
          currentAgent: selectedAgent
        });
        addLog('success', '自动执行完成', { 
          type: testResult.type, 
          success: testResult.success,
          agent: selectedAgent
        });
      } else {
        if (!selectedSkill) {
          addLog('error', '手动模式需要选择 Skill');
          return;
        }
        addLog('info', `手动执行 Skill: ${selectedSkill.name} (Agent: ${selectedAgent})`);
        testResult = await executeSkill(selectedSkill.id, { 
          message, 
          parameters,
          currentAgent: selectedAgent
        });
        addLog('success', `Skill ${selectedSkill.name} 执行完成`, { 
          success: testResult.success,
          agent: selectedAgent
        });
      }

      const time = Date.now() - startTime;
      setExecutionTime(time);
      setResult(testResult);

      // 更新统计
      setStats(prev => {
        const category = mode === 'manual' && selectedSkill
          ? selectedSkill.category
          : 'analysis' as SkillCategory; // 自动模式默认分析类

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
                测试和验证 Agent-Skill 融合架构
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Agent 选择器 */}
              <div className="relative">
                <button
                  onClick={() => setShowAgentSelector(!showAgentSelector)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  <span className="text-gray-400">当前 Agent:</span>
                  <span className="flex items-center gap-1.5">
                    {agentIconMap[selectedAgent]}
                    <span className="text-white font-medium">
                      {AGENT_CAPABILITY_DESCRIPTIONS[selectedAgent]?.title || selectedAgent}
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAgentSelector ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Agent 下拉菜单 */}
                {showAgentSelector && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-50">
                    {Object.entries(AGENT_CAPABILITY_DESCRIPTIONS).map(([agent, info]) => (
                      <button
                        key={agent}
                        onClick={() => {
                          setSelectedAgent(agent as Exclude<AgentType, 'system' | 'user'>);
                          setShowAgentSelector(false);
                          addLog('info', `切换到 Agent: ${info.title}`);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedAgent === agent ? 'bg-gray-700' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          selectedAgent === agent 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {agentIconMap[agent as Exclude<AgentType, 'system' | 'user'>]}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${
                            selectedAgent === agent ? 'text-white' : 'text-gray-300'
                          }`}>
                            {info.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {info.skills.length} 个 Skill
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

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

      {/* Skill 调试工具 */}
      <SkillDebugger />
    </div>
  );
};

export default SkillTestPage;
