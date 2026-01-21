import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../hooks/useCreateStore';
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

  const getToolName = () => {
    const tool = toolOptions.find(t => t.id === activeTool);
    return tool ? tool.name : '参数配置';
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

  return (
    <>
      {/* 手机端和平板端属性面板切换按钮 */}
      <button
        onClick={() => updateState({ showPropertiesPanel: !showPropertiesPanel })}
        className={`md:hidden fixed top-20 right-4 z-40 p-3 rounded-full shadow-lg transition-all duration-300 ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
        aria-label={showPropertiesPanel ? '关闭属性面板' : '打开属性面板'}
      >
        <i className={`fas fa-sliders-h text-xl ${showPropertiesPanel ? 'rotate-180' : ''} transition-transform duration-300`}></i>
      </button>

      {/* 电脑端右侧属性面板 / 平板端右侧抽屉 / 手机端右侧抽屉 */}
      <AnimatePresence>
        {/* 电脑端：始终显示右侧属性面板 */}
        <div className={`hidden lg:block w-80 xl:w-96 h-full flex flex-col border-l backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} z-30`}>
          {/* Glass Header */}
          <div className={`h-16 px-6 flex items-center justify-between border-b backdrop-blur-md flex-shrink-0 ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                <i className="fas fa-sliders-h text-sm"></i>
              </span>
              <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {getToolName()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <i className="fas fa-question-circle"></i>
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
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
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} transition-colors relative z-30
                /* 平板端样式：右侧抽屉，固定宽度 */
                hidden md:block lg:hidden fixed top-0 right-0 bottom-0 w-80 h-full shadow-2xl border-l
                /* 手机端样式：右侧抽屉，覆盖80%屏幕宽度 */
                md:hidden fixed top-0 right-0 bottom-0 w-[80%] max-w-xs h-full shadow-2xl border-l`}
            >
              {/* Glass Header */}
              <div className={`h-16 px-6 flex items-center justify-between border-b backdrop-blur-md flex-shrink-0 ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <i className="fas fa-sliders-h text-sm"></i>
                  </span>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {getToolName()}
                  </span>
                </div>
                
                {/* 平板端和手机端关闭按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateState({ showPropertiesPanel: false })}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    aria-label="关闭"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  
                  <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <i className="fas fa-question-circle"></i>
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTool}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
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