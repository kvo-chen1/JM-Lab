import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../hooks/useCreateStore';
import { useNavigate } from 'react-router-dom';
import SketchPanel from './panels/SketchPanel';
import PatternPanel from './panels/PatternPanel';
import FilterPanel from './panels/FilterPanel';
import CulturalTracePanel from './panels/CulturalTracePanel';
import RemixPanel from './panels/RemixPanel';
import LayoutPanel from './panels/LayoutPanel';
import MockupPanel from './panels/MockupPanel';
import TilePanel from './panels/TilePanel';
import { motion, AnimatePresence } from 'framer-motion';
import { toolOptions } from "../data";

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
    const tool = toolOptions.find(t => t.id === activeTool);
    return tool ? tool.name : '参数配置';
  };

  const getToolIcon = () => {
    const tool = toolOptions.find(t => t.id === activeTool);
    return tool ? tool.icon : 'fas fa-tools';
  };

  const renderPanel = () => {
    switch (activeTool) {
      case 'sketch':
        return <SketchPanel />;
      case 'pattern':
        return <PatternPanel />;
      case 'filter':
        return <FilterPanel />;
      case 'trace':
        return <CulturalTracePanel />;
      case 'remix':
        return <RemixPanel />;
      case 'layout':
        return <LayoutPanel />;
      case 'mockup':
        return <MockupPanel />;
      case 'tile':
        return <TilePanel />;
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

  return (
    <>
      {/* 手机端和平板端属性面板切换按钮 */}
      <motion.button
        onClick={() => updateState({ showPropertiesPanel: !showPropertiesPanel })}
        className={`md:hidden fixed top-28 right-2 z-40 p-3 rounded-full shadow-lg transition-all duration-300 ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
        aria-label={showPropertiesPanel ? '关闭属性面板' : '打开属性面板'}
        whileHover={{ scale: 1.1, boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)" }}
        whileTap={{ scale: 0.95 }}
        animate={{
          rotate: showPropertiesPanel ? 180 : 0,
          backgroundColor: showPropertiesPanel ? (isDark ? "#2563eb" : "#2563eb") : (isDark ? "#3b82f6" : "#3b82f6")
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      >
        <i className="fas fa-sliders-h text-xl"></i>
      </motion.button>

      {/* 电脑端右侧属性面板 / 平板端右侧抽屉 */}
      <AnimatePresence>
        {/* 电脑端：始终显示右侧属性面板 */}
        <div id="guide-step-create-properties" className={`hidden lg:block w-80 xl:w-96 h-full flex flex-col border-l backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} z-30`}>
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
                className={`flex items-center justify-center w-8 h-8 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -5, 5, -5, 0],
                  backgroundColor: isDark ? "#1f2937" : "#f3f4f6"
                }}
                transition={{ 
                  rotate: { duration: 0.5 },
                  scale: { type: "spring", stiffness: 400, damping: 17 }
                }}
              >
                <i className={`${getToolIcon()} text-sm`}></i>
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
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool}
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
        </div>

        {/* 平板端和手机端：可切换的右侧抽屉 */}
        {(showPropertiesPanel || window.innerWidth >= 768) && (
          <AnimatePresence>
            <motion.div
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
                  <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <i className={`${getToolIcon()} text-sm`}></i>
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
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTool}
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
          </AnimatePresence>
        )}
      </AnimatePresence>
    </>
  );
}