import React, { useEffect, useState } from 'react';
import ToolSidebar from './components/ToolSidebar';
import PropertiesPanel from './components/PropertiesPanel';
import CanvasArea from './components/CanvasArea';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from './hooks/useCreateStore';
import AIReview from '@/components/AIReview';
import ModelSelector from '@/components/ModelSelector';
import PublishToSquareModal from '@/components/PublishToSquareModal';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAutoSave } from '@/hooks/useAutoSave';
import { toast } from 'sonner';

export default function Studio() {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // 启用自动保存
  useAutoSave();

  const {
    showAIReview,
    showModelSelector,
    showPublishModal,
    prompt,
    aiExplanation,
    selectedResult,
    generatedResults,
    setPrompt,
    setActiveTool,
    setAutoGenerate,
    updateState
  } = useCreateStore();
  
  const reviewWorkId = selectedResult ? String(selectedResult) : 'draft';

  // Sync URL params to store
  useEffect(() => {
    const toolParam = searchParams.get('tool');
    const promptParam = searchParams.get('prompt');
    const eventParam = searchParams.get('event');
    
    if (toolParam) {
      setActiveTool(toolParam as any);
    }
    
    if (promptParam) {
      setPrompt(promptParam);
    }
    
    if (eventParam) {
      updateState({ currentEventId: eventParam });
    }
  }, [searchParams, setActiveTool, setPrompt, updateState]);

  // 读取从灵感输入面板传递的数据
  useEffect(() => {
    const workshopData = localStorage.getItem('workshopInspirationData');
    if (workshopData) {
      try {
        const data = JSON.parse(workshopData);
        // 检查数据是否在5分钟内（避免过期数据）
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          if (data.prompt) {
            setPrompt(data.prompt);
            // 设置自动生成标志，让SketchPanel自动开始生成
            setAutoGenerate(true);
            toast.success('已从灵感面板导入创意，正在生成...');
          }
        }
        // 清除已使用的数据
        localStorage.removeItem('workshopInspirationData');
      } catch (error) {
        console.error('读取灵感数据失败:', error);
      }
    }
  }, [setPrompt, setAutoGenerate]);
  
  // 读取从模板页面传递的数据
  useEffect(() => {
    const state = location.state as {
      templatePrompt?: string;
      templateId?: number;
      templateName?: string;
      templateStyle?: string;
      templateCategory?: string;
    } | null;
    
    if (state?.templatePrompt) {
      // 设置提示词
      setPrompt(state.templatePrompt);
      // 设置自动生成标志
      setAutoGenerate(true);
      
      toast.success(`已加载"${state.templateName}"模板，正在生成...`);
      
      // 清除 location state，避免刷新时重复触发
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setPrompt, setAutoGenerate]);
  
  return (
    <div className={`flex h-full ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 左侧工具栏 - 内部处理响应式显示 */}
      <ToolSidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      
      {/* Main Canvas Area - 主画布区域 */}
      <div id="guide-step-create-canvas" className="flex-1 relative flex flex-col min-w-0 overflow-hidden
        /* 手机端和平板端：为底部工具栏留出空间 */
        md:mb-0 mb-24">
        <CanvasArea isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      </div>

      {/* 右侧属性面板 - 内部处理响应式显示 */}
      <PropertiesPanel />

      {/* Modals / Overlays */}
      <AnimatePresence>
        {showAIReview && (
          <AIReview 
            workId={reviewWorkId}
            prompt={prompt}
            aiExplanation={aiExplanation}
            selectedResult={selectedResult}
            generatedResults={generatedResults.map(result => ({
              ...result,
              score: result.score ?? 0
            }))}
            onClose={() => updateState({ showAIReview: false })} 
          />
        )}
        {showModelSelector && (
          <ModelSelector 
            isOpen={showModelSelector}
            onClose={() => updateState({ showModelSelector: false })} 
          />
        )}
        {showPublishModal && (
          <PublishToSquareModal 
            isOpen={showPublishModal}
            onClose={() => updateState({ showPublishModal: false })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
