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
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

export default function Studio() {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const { 
    showCollaborationPanel, updateState, 
    showAIReview, 
    showModelSelector,
    showInspirationPanel,
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
    
    if (toolParam) {
      setActiveTool(toolParam as any);
    }
    
    if (promptParam) {
      setPrompt(promptParam);
    }
  }, [searchParams, setActiveTool, setPrompt]);
  
  return (
    <div className={`flex h-full overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 电脑端左侧工具栏 */}
      <div className="hidden lg:flex">
        <ToolSidebar />
      </div>
      
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
      <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden lg:mb-0 mb-24">
        <CanvasArea />
      </div>

      {/* 电脑端右侧属性面板 */}
      <div className="hidden lg:flex">
        <PropertiesPanel />
      </div>

      {/* 移动端底部工具栏 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <ToolSidebar />
      </div>

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
      </AnimatePresence>
    </div>
  );
}
