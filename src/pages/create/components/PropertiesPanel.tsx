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
    <div className={`w-80 lg:w-96 border-l flex flex-col transition-colors relative z-10 ${
      isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
    }`}>
      {/* Glass Header */}
      <div className={`h-16 px-6 flex items-center justify-between border-b backdrop-blur-md flex-shrink-0 ${
        isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-100'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${
             isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
             <i className="fas fa-sliders-h text-sm"></i>
          </span>
          <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {getToolName()}
          </span>
        </div>
        
        <button className={`p-2 rounded-lg transition-colors ${
          isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
        }`}>
          <i className="fas fa-question-circle"></i>
        </button>
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
  );
}
