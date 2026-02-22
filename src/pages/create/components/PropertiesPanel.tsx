import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../hooks/useCreateStore';
import { useNavigate } from 'react-router-dom';
import SketchPanel from './panels/SketchPanel';
import UploadPanel from './panels/UploadPanel';
import { EnhancePanel } from './panels/EnhancePanel';
import { StyleLabPanel } from './panels/StyleLabPanel';
import { SmartLayoutPanel } from './panels/SmartLayoutPanel';
import { CulturePanel } from './panels/CulturePanel';
import { RefinementPanel } from './panels/RefinementPanel';
import { PromptAssistantPanel } from './panels/PromptAssistantPanel';
import PatternPanel from './panels/PatternPanel';
import AIAssistantPanel from './panels/AIAssistantPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { TOOL_OPTIONS } from "../../../constants/creativeData";
import { toast } from 'sonner';
import clsx from 'clsx';

export default function PropertiesPanel() {
  const { isDark } = useTheme();
  const activeTool = useCreateStore((state) => state.activeTool);
  const showPropertiesPanel = useCreateStore((state) => state.showPropertiesPanel);
  const updateState = useCreateStore((state) => state.updateState);
  const navigate = useNavigate();
  
  const handleHelpClick = () => {
    navigate('/help');
  };

  const getToolName = () => {
    const tool = TOOL_OPTIONS.find(t => t.id === activeTool);
    return tool ? tool.name : '参数配置';
  };

  const getToolIcon = () => {
    const tool = TOOL_OPTIONS.find(t => t.id === activeTool);
    return tool ? `fas fa-${tool.icon}` : 'fas fa-tools';
  };

  const getToolColor = () => {
    const tool = TOOL_OPTIONS.find(t => t.id === activeTool);
    return tool ? tool.color : '#A855F7';
  };

  const renderPanel = () => {
    switch (activeTool) {
      case 'ai-assistant':
        // AI助手面板需要固定高度，不随父容器滚动
        // 高度与左侧画布区域对齐，确保输入框与样式预览水平对齐
        return (
          <div className="h-[calc(100vh-96px)] overflow-hidden overscroll-contain">
            <AIAssistantPanel />
          </div>
        );
      case 'sketch':
        return <SketchPanel />;
      case 'upload':
        return <UploadPanel onSelectUpload={(upload) => {
          toast.success(`已选择作品: ${upload.title}`);
        }} />;
      case 'refinement':
        return <RefinementPanel />;
      case 'enhance':
        return <EnhancePanel />;
      case 'style':
        return <StyleLabPanel />;
      case 'prompt':
        return <PromptAssistantPanel />;
      case 'layout':
        return <SmartLayoutPanel />;
      case 'culture':
        return <CulturePanel />;
      case 'pattern':
        return <PatternPanel onSelectPattern={(pattern) => {
          updateState({ selectedPatternId: pattern.id });
          toast.success(`已选择「${pattern.name}」纹样`);
        }} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-center opacity-50">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'}`}>
              <i className="fas fa-tools text-2xl"></i>
            </div>
            <h3 className="text-sm font-medium mb-1">功能开发中</h3>
            <p className="text-xs max-w-[200px]">该工具的高级配置面板正在构建，敬请期待。</p>
          </div>
        );
    }
  };

  // 工具切换动画配置
  const panelAnimationVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      rotateY: -5
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateY: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 0.5,
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      rotateY: 5,
      transition: {
        duration: 0.25,
        ease: "easeInOut"
      }
    }
  };

  const toolColor = getToolColor();

  return (
    <>
      {/* 手机端和平板端属性面板切换按钮 */}
      <motion.button
        onClick={() => updateState({ showPropertiesPanel: !showPropertiesPanel })}
        className={`md:hidden fixed top-28 right-2 z-40 p-3 rounded-full shadow-lg transition-all duration-300 text-white`}
        style={{ backgroundColor: toolColor }}
        aria-label={showPropertiesPanel ? '关闭属性面板' : '打开属性面板'}
        whileHover={{ scale: 1.1, boxShadow: `0 8px 25px ${toolColor}40` }}
        whileTap={{ scale: 0.95 }}
        animate={{
          rotate: showPropertiesPanel ? 180 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      >
        <i className="fas fa-sliders-h text-xl"></i>
      </motion.button>

      {/* 电脑端右侧属性面板 */}
      <div id="guide-step-create-properties" className={`hidden lg:block w-[480px] xl:w-[560px] h-full flex flex-col border-l backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} z-30`}>
        {/* Glass Header */}
        <motion.div
          className={`h-16 px-6 flex items-center justify-between border-b backdrop-blur-md flex-shrink-0 ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-100'}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <motion.span
              className="flex items-center justify-center w-8 h-8 rounded-full relative overflow-hidden"
              style={{ backgroundColor: `${toolColor}20` }}
              whileHover={{
                scale: 1.1,
                boxShadow: `0 4px 12px ${toolColor}40`,
                rotate: [0, -5, 5, -5, 0]
              }}
              transition={{
                rotate: { duration: 0.5 },
                scale: { type: "spring", stiffness: 400, damping: 17 }
              }}
            >
              <div className="relative z-10" style={{ color: toolColor }}>
                <i className={`${getToolIcon()} text-sm`}></i>
              </div>
            </motion.span>
            <motion.span
              className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {getToolName()}
            </motion.span>
          </motion.div>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.button
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleHelpClick}
              aria-label="帮助"
            >
              <i className="fas fa-question-circle"></i>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scrollable Content - AI助手面板时不滚动 */}
        <div className={clsx(
          "flex-1 custom-scrollbar",
          activeTool === 'ai-assistant' ? 'overflow-hidden' : 'overflow-y-auto'
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`desktop-${activeTool}`}
              variants={panelAnimationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative h-full"
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 平板端和手机端：可切换的右侧抽屉 */}
      <AnimatePresence>
        {showPropertiesPanel && (
          <motion.div
            key="mobile-drawer"
            initial={{
              x: '100%',
              opacity: 0,
              scale: 0.98
            }}
            animate={{
              x: 0,
              opacity: 1,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.5
              }
            }}
            exit={{
              x: '100%',
              opacity: 0,
              scale: 0.98,
              transition: {
                duration: 0.3,
                ease: "easeInOut"
              }
            }}
            className={`${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} transition-colors relative z-30
              /* 通用定位：固定在右侧，全高 */
              fixed top-0 right-0 bottom-0 h-full shadow-2xl border-l lg:hidden
              /* 手机端宽度 */
              w-[85%] max-w-xs
              /* 平板端宽度 */
              md:w-80`}
          >
            {/* Glass Header */}
            <div className={`h-16 px-6 flex items-center justify-between border-b backdrop-blur-md flex-shrink-0 ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <span 
                  className="flex items-center justify-center w-8 h-8 rounded-full relative overflow-hidden"
                  style={{ backgroundColor: `${toolColor}20` }}
                >
                  <div className="relative z-10" style={{ color: toolColor }}>
                    <i className={`${getToolIcon()} text-sm`}></i>
                  </div>
                </span>
                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {getToolName()}
                </span>
              </div>

              {/* 平板端和手机端关闭按钮 */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => updateState({ showPropertiesPanel: false })}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  aria-label="关闭"
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fas fa-times"></i>
                </motion.button>

                <motion.button
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleHelpClick}
                  aria-label="帮助"
                >
                  <i className="fas fa-question-circle"></i>
                </motion.button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`mobile-${activeTool}`}
                  variants={panelAnimationVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="relative"
                >
                  {renderPanel()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
