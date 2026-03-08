import React, { useEffect, useState, useRef } from 'react';
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
import { toast } from 'sonner';

export default function Studio() {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const hasProcessedTemplateRef = useRef(false);

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
    updateState,
    setGeneratedResults,
    addGeneratedResult
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

  // 读取从作品提交页面传递的数据
  useEffect(() => {
    const submitWorkData = localStorage.getItem('submitWork_to_create');
    if (submitWorkData) {
      try {
        const data = JSON.parse(submitWorkData);
        console.log('[Studio] 读取到作品提交页面的数据:', data);
        
        // 检查数据是否在10分钟内（避免过期数据）
        if (Date.now() - data.timestamp < 10 * 60 * 1000) {
          // 设置提示词（使用描述作为提示词）
          if (data.description) {
            setPrompt(data.description);
            toast.success('已从作品提交页面导入数据', {
              description: '正在准备创作环境...'
            });
          }
          
          // 如果有图片文件，需要特殊处理（File对象无法通过localStorage传递）
          // 这里我们设置一个标志，让 CanvasArea 组件知道需要加载这些图片
          if (data.files && data.files.length > 0) {
            // 存储图片信息供 CanvasArea 使用
            localStorage.setItem('submitWork_images_info', JSON.stringify({
              count: data.files.length,
              title: data.title,
              tags: data.tags,
              timestamp: Date.now()
            }));
            
            toast.info(`检测到 ${data.files.length} 张图片`, {
              description: '请在创作中心上传区域查看'
            });
          }
        }
        
        // 清除已使用的数据
        localStorage.removeItem('submitWork_to_create');
      } catch (error) {
        console.error('读取作品提交数据失败:', error);
      }
    }
  }, [setPrompt]);

  // 读取从品牌向导传递的数据
  useEffect(() => {
    const wizardData = localStorage.getItem('wizard_to_create');
    if (wizardData) {
      try {
        const data = JSON.parse(wizardData);
        console.log('[Studio] 读取到品牌向导的数据:', data);
        
        // 检查数据是否在10分钟内（避免过期数据）
        if (Date.now() - data.timestamp < 10 * 60 * 1000) {
          // 设置提示词（使用描述作为提示词）
          if (data.description) {
            setPrompt(data.description);
            toast.success('已从品牌向导导入数据', {
              description: '正在准备创作环境...'
            });
          }
          
          // 如果有图片URL，添加到 generatedResults 中显示在预览区域
          if (data.imageUrl) {
            // 创建一个新的生成结果对象
            const newResult = {
              id: Date.now(), // 使用时间戳作为唯一ID
              thumbnail: data.imageUrl,
              score: data.culturalScore || 0,
              type: 'image' as const,
              prompt: data.description || ''
            };
            
            // 添加到 generatedResults 中
            addGeneratedResult(newResult);
            
            console.log('[Studio] 已添加品牌向导图片到预览区域:', newResult);
            
            toast.success('图片已导入到预览区域', {
              description: '您可以在创作中心继续编辑'
            });
          }
        }
        
        // 清除已使用的数据
        localStorage.removeItem('wizard_to_create');
      } catch (error) {
        console.error('读取品牌向导数据失败:', error);
      }
    }
  }, [setPrompt, addGeneratedResult]);

  // 读取从 AI 快捷生成传递的数据
  useEffect(() => {
    // 读取图片数据
    const aiGeneratedImageData = sessionStorage.getItem('ai_generated_image');
    if (aiGeneratedImageData) {
      try {
        const data = JSON.parse(aiGeneratedImageData);
        console.log('[Studio] 读取到 AI 生成的图片数据:', data);

        // 设置提示词
        if (data.prompt) {
          setPrompt(data.prompt);
        }

        // 添加生成的图片到预览区域
        if (data.url) {
          const newResult = {
            id: Date.now(),
            thumbnail: data.url,
            score: 85, // AI生成图片默认分数
            type: 'image' as const,
            prompt: data.prompt || ''
          };

          addGeneratedResult(newResult);

          toast.success('AI生成的图片已导入', {
            description: '您可以在创作中心继续编辑和完善'
          });
        }

        // 清除已使用的数据
        sessionStorage.removeItem('ai_generated_image');
      } catch (error) {
        console.error('读取 AI 生成图片数据失败:', error);
      }
    }

    // 读取视频数据
    const aiGeneratedVideoData = sessionStorage.getItem('ai_generated_video');
    if (aiGeneratedVideoData) {
      try {
        const data = JSON.parse(aiGeneratedVideoData);
        console.log('[Studio] 读取到 AI 生成的视频数据:', data);

        // 设置提示词
        if (data.prompt) {
          setPrompt(data.prompt);
        }

        // 添加生成的视频到预览区域
        if (data.url) {
          const newResult = {
            id: Date.now(),
            thumbnail: data.url,
            score: 85, // AI生成视频默认分数
            type: 'video' as const,
            prompt: data.prompt || ''
          };

          addGeneratedResult(newResult);

          toast.success('AI生成的视频已导入', {
            description: '您可以在创作中心继续编辑和完善'
          });
        }

        // 清除已使用的数据
        sessionStorage.removeItem('ai_generated_video');
      } catch (error) {
        console.error('读取 AI 生成视频数据失败:', error);
      }
    }
  }, [setPrompt, addGeneratedResult]);
  
  // 读取从模板页面传递的数据
  useEffect(() => {
    // 防止重复处理同一个模板数据
    if (hasProcessedTemplateRef.current) return;
    
    const state = location.state as {
      templatePrompt?: string;
      templateId?: number;
      templateName?: string;
      templateStyle?: string;
      templateCategory?: string;
    } | null;
    
    if (state?.templatePrompt) {
      hasProcessedTemplateRef.current = true;
      
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
      <div id="guide-step-create-canvas" className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
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
