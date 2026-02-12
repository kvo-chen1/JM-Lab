import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../hooks/useCreateStore';
import { TOOL_OPTIONS } from '@/constants/creativeData';
import { useNavigate } from 'react-router-dom';

interface ToolSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function ToolSidebar({ isCollapsed, setIsCollapsed }: ToolSidebarProps) {
  const { isDark } = useTheme();
  const activeTool = useCreateStore((state) => state.activeTool);
  const setActiveTool = useCreateStore((state) => state.setActiveTool);
  const showPropertiesPanel = useCreateStore((state) => state.showPropertiesPanel);
  const updateState = useCreateStore((state) => state.updateState);
  const navigate = useNavigate();

  const extraTools = [
    { id: 'wizard', name: '共创向导', icon: 'hat-wizard', path: '/create/wizard', color: '#3B82F6' }
  ];

  const handleExtraToolClick = (tool: { id: string, path: string }) => {
    navigate(tool.path);
  };

  // 获取工具对应的颜色
  const getToolColor = (toolId: string) => {
    const tool = TOOL_OPTIONS.find(t => t.id === toolId);
    return tool?.color || '#C02C38';
  };

  return (
    <>
      {/* 电脑端：左侧垂直工具栏 (大屏幕 - lg及以上) */}
        <motion.div
          id="guide-step-create-sidebar"
          initial={false}
          animate={{
            width: isCollapsed ? 0 : 104,
            opacity: isCollapsed ? 0 : 1
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`hidden lg:flex h-full flex-col items-center pt-4 pb-6 border-r backdrop-blur-xl overflow-hidden ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} z-20`}
        >
          {/* Logo/标题区域 */}
          <div className="mb-4 px-2 text-center">
            <div className={`text-xs font-bold tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              创作中心
            </div>
          </div>

          {/* 工具列表 - 允许垂直滚动 */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                className="flex flex-col space-y-2 w-full px-2 overflow-y-auto custom-scrollbar flex-1 min-w-[104px]"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {TOOL_OPTIONS.map((tool) => {
                  const isActive = activeTool === tool.id;
                  const toolColor = tool.color;
                  return (
                    <motion.button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`transition-all relative group flex-shrink-0 rounded-xl p-3 ${isActive ? 'shadow-lg' : isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50/80'} w-full flex flex-col items-center justify-center`}
                      style={{
                        backgroundColor: isActive ? `${toolColor}15` : 'transparent',
                        color: isActive ? toolColor : isDark ? '#9CA3AF' : '#6B7280'
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      title={tool.name}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                          style={{ backgroundColor: toolColor, boxShadow: `0 0 8px ${toolColor}66` }}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 32 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      
                      <div 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-all duration-300 ${isActive ? 'scale-110' : ''}`}
                        style={{ 
                          backgroundColor: isActive ? `${toolColor}25` : isDark ? '#374151' : '#F3F4F6'
                        }}
                      >
                        <i 
                          className={`fas fa-${tool.icon} text-lg transition-transform group-hover:scale-110 duration-300`}
                          style={{ color: isActive ? toolColor : isDark ? '#9CA3AF' : '#6B7280' }}
                        />
                      </div>
                      <span className="text-[10px] font-medium tracking-wide">{tool.name}</span>
                      
                      {/* Tooltip on hover */}
                      <div className={`absolute block left-full ml-3 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border translate-x-2 group-hover:translate-x-0 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
                        <div className="font-medium">{tool.name}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{tool.description}</div>
                        {/* Arrow */}
                        <div className={`absolute top-1/2 -left-1 w-2 h-2 -mt-1 transform rotate-45 border-l border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}></div>
                      </div>
                    </motion.button>
                  );
                })}

                {/* 分隔线 */}
                <div className={`transition-all duration-300 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} w-12 h-px mx-auto my-4`}></div>

                {/* 额外工具 */}
                {extraTools.map((tool) => (
                    <motion.button
                      key={tool.id}
                      onClick={() => handleExtraToolClick(tool)}
                      className={`transition-all relative group flex-shrink-0 rounded-xl p-3 ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-blue-50/50'} w-full flex flex-col items-center justify-center`}
                      style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5"
                        style={{ backgroundColor: isDark ? '#374151' : '#F3F4F6' }}
                      >
                        <i 
                          className={`fas fa-${tool.icon} text-lg transition-transform group-hover:scale-110 duration-300`}
                          style={{ color: tool.color }}
                        />
                      </div>
                      <span className="text-[10px] font-medium tracking-wide">{tool.name}</span>
                      
                      {/* Tooltip on hover */}
                      <div className={`absolute block left-full ml-3 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border translate-x-2 group-hover:translate-x-0 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
                        <div className="font-medium">{tool.name}</div>
                        {/* Arrow */}
                        <div className={`absolute top-1/2 -left-1 w-2 h-2 -mt-1 transform rotate-45 border-l border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}></div>
                      </div>
                    </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      {/* 平板端：水平工具栏 (中等屏幕 - md至lg) */}
      <div className={`hidden md:flex lg:hidden fixed bottom-0 left-0 right-0 h-20 flex-row items-center justify-around py-2 border-t backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} z-50`}>
        {/* 工具列表 */}
        <div className="flex flex-row space-x-1 w-full px-2 justify-center">
          {TOOL_OPTIONS.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <motion.button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`transition-all relative group flex-shrink-0 rounded-xl p-2 ${isActive ? 'shadow-md' : ''} flex flex-col items-center justify-center min-w-[64px]`}
                style={{
                  backgroundColor: isActive ? `${tool.color}15` : 'transparent',
                  color: isActive ? tool.color : isDark ? '#9CA3AF' : '#6B7280'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                title={tool.name}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicatorMobile"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 rounded-t-full"
                    style={{ backgroundColor: tool.color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
                  style={{ backgroundColor: isActive ? `${tool.color}25` : isDark ? '#374151' : '#F3F4F6' }}
                >
                  <i 
                    className={`fas fa-${tool.icon} text-sm`}
                    style={{ color: isActive ? tool.color : isDark ? '#9CA3AF' : '#6B7280' }}
                  />
                </div>
                <span className="text-[9px] font-medium">{tool.name}</span>
              </motion.button>
            );
          })}

          {/* 分隔线 */}
          <div className={`transition-all duration-300 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} h-12 w-px mx-1`}></div>

          {/* 额外工具 */}
          {extraTools.map((tool) => (
              <motion.button
                key={tool.id}
                onClick={() => handleExtraToolClick(tool)}
                className={`transition-all relative group flex-shrink-0 rounded-xl p-2 flex flex-col items-center justify-center min-w-[64px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
                  style={{ backgroundColor: isDark ? '#374151' : '#F3F4F6' }}
                >
                  <i 
                    className={`fas fa-${tool.icon} text-sm`}
                    style={{ color: tool.color }}
                  />
                </div>
                <span className="text-[9px] font-medium">{tool.name}</span>
              </motion.button>
          ))}
        </div>
      </div>

      {/* 手机端：垂直悬浮工具列表 */}
      <AnimatePresence>
        {showPropertiesPanel && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`flex md:hidden fixed top-32 right-2 flex-col gap-2 z-40`}
          >
            {TOOL_OPTIONS.map((tool, index) => {
              const isActive = activeTool === tool.id;
              return (
                <motion.button
                  key={tool.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setActiveTool(tool.id)}
                  className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all ${isActive ? 'ring-2 ring-white' : ''}`}
                  style={{
                    backgroundColor: isActive ? tool.color : isDark ? '#1F2937' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280'
                  }}
                >
                  <i className={`fas fa-${tool.icon} text-sm`}></i>
                </motion.button>
              );
            })}
            
            {/* 额外工具 */}
            {extraTools.map((tool, index) => (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (TOOL_OPTIONS.length + index) * 0.05 }}
                onClick={() => {
                   handleExtraToolClick(tool);
                   updateState({ showPropertiesPanel: false });
                }}
                className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all`}
                style={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  color: tool.color
                }}
              >
                <i className={`fas fa-${tool.icon} text-sm`}></i>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
