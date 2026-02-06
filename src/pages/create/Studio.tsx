import React, { useEffect } from 'react';
import ToolSidebar from './components/ToolSidebar';
import PropertiesPanel from './components/PropertiesPanel';
import CanvasArea from './components/CanvasArea';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from './hooks/useCreateStore';
import CollaborationPanel from '@/components/CollaborationPanel';
import AIReview from '@/components/AIReview';
import ModelSelector from '@/components/ModelSelector';
import InspirationPanel from '@/components/InspirationPanel';
import CreateWorkForm from '@/components/CreateWorkForm';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useAutoSave } from '@/hooks/useAutoSave';
import { toast } from 'sonner';

export default function Studio() {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  
  // 启用自动保存
  useAutoSave();

  const { 
    showCollaborationPanel, updateState, 
    showAIReview, 
    showModelSelector,
    showInspirationPanel,
    showPublishModal,
    prompt,
    aiExplanation,
    selectedResult,
    generatedResults,
    setPrompt,
    setActiveTool
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
            toast.success('已从灵感面板导入创意');
          }
        }
        // 清除已使用的数据
        localStorage.removeItem('workshopInspirationData');
      } catch (error) {
        console.error('读取灵感数据失败:', error);
      }
    }
  }, [setPrompt]);
  
  return (
    <div className={`flex h-full ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 左侧工具栏 - 内部处理响应式显示 */}
      <ToolSidebar />
      
      {/* Inspiration Panel Drawer - 灵感面板抽屉 */}
      <AnimatePresence>
        {showInspirationPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`border-r h-full overflow-hidden relative z-10 ${isDark ? 'border-gray-800 bg-gray-900 shadow-2xl' : 'border-gray-200 bg-white shadow-xl'}`}
          >
            <div className="w-80 h-full">
              <InspirationPanel 
                onClose={() => updateState({ showInspirationPanel: false })}
                onApply={(content) => {
                  if (content.prompt) {
                    const newPrompt = prompt ? `${prompt} ${content.prompt}` : content.prompt;
                    setPrompt(newPrompt);
                    // toast.success('已添加到提示词');
                  }
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas Area - 主画布区域 */}
      <div id="guide-step-create-canvas" className="flex-1 relative flex flex-col min-w-0 overflow-hidden
        /* 手机端和平板端：为底部工具栏留出空间 */
        md:mb-0 mb-24">
        <CanvasArea />
      </div>

      {/* 右侧属性面板 - 内部处理响应式显示 */}
      <PropertiesPanel />

      {/* Modals / Overlays */}
      <AnimatePresence>
        {showCollaborationPanel && (
          <CollaborationPanel 
            isOpen={showCollaborationPanel}
            onClose={() => updateState({ showCollaborationPanel: false })} 
          />
        )}
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
        {showPublishModal && selectedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="relative w-full max-w-2xl">
                <CreateWorkForm 
                  onClose={() => updateState({ showPublishModal: false })}
                  onSuccess={() => {
                    updateState({ showPublishModal: false });
                  }}
                  initialImage={generatedResults.find(r => r.id === selectedResult)?.thumbnail}
                  initialTitle={`AI创作-${new Date().toLocaleDateString()}`}
                  initialDescription={prompt}
                />
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
