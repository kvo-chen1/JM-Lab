import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../hooks/useCreateStore';
import { toolOptions } from '../data';
import { useNavigate } from 'react-router-dom';

export default function ToolSidebar() {
  const { isDark } = useTheme();
  const activeTool = useCreateStore((state) => state.activeTool);
  const setActiveTool = useCreateStore((state) => state.setActiveTool);
  const showInspirationPanel = useCreateStore((state) => state.showInspirationPanel);
  const updateState = useCreateStore((state) => state.updateState);
  const navigate = useNavigate();

  const extraTools = [
    { id: 'neo', name: '灵感引擎', icon: 'bolt', path: '/create/inspiration' },
    { id: 'wizard', name: '共创向导', icon: 'hat-wizard', path: '/create/wizard' }
  ];

  const handleExtraToolClick = (tool: { id: string, path: string }) => {
    if (tool.id === 'neo') {
      updateState({ showInspirationPanel: !showInspirationPanel });
    } else {
      navigate(tool.path);
    }
  };

  return (
    <div className={`flex-shrink-0 z-20 overflow-hidden transition-all duration-300 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'}`}
      style={{
        // 电脑端样式：左侧垂直工具栏
        '@media (min-width: 1024px)': {
          width: '96px',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '24px',
          paddingBottom: '24px',
          borderRight: '1px solid',
          backdropFilter: 'blur(24px)'
        },
        // 移动端样式：底部水平导航栏
        '@media (max-width: 1023px)': {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingTop: '12px',
          paddingBottom: '12px',
          borderTop: '1px solid',
          height: '96px',
          backdropFilter: 'blur(24px)'
        }
      }}
    >
      {/* Brand/Logo Placeholder or Top Spacing */}
      <div style={{ display: 'none', '@media (min-width: 1024px)': { display: 'block', marginBottom: '24px' } }}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-900/20 text-red-500' : 'bg-red-50 text-red-600'}`}>
          <i className="fas fa-layer-group text-xl"></i>
        </div>
      </div>

      <div className="flex lg:space-y-3 lg:w-full lg:px-3 space-x-1 lg:flex-col flex-row items-center justify-around w-full">
        {toolOptions.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <motion.button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`transition-all relative group flex-shrink-0 ${isActive ? (isDark ? 'bg-red-900/20 text-red-400 shadow-sm' : 'bg-red-50 text-red-600 shadow-sm') : isDark ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-900'}
                /* 电脑端样式 */
                lg:w-full lg:flex lg:flex-col lg:items-center lg:justify-center lg:py-4 lg:rounded-2xl
                /* 移动端样式 */
                lg:hidden flex flex-col items-center justify-center p-3 rounded-xl min-w-[60px]`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              title={tool.name}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className={`absolute bg-[#C02C38] shadow-[0_0_8px_rgba(192,44,56,0.4)] transition-all duration-300
                    /* 电脑端样式：左侧垂直指示器 */
                    lg:block lg:left-0 lg:top-1/2 lg:-translate-y-1/2 lg:w-1 lg:h-8 lg:rounded-r-full
                    /* 移动端样式：底部水平指示器 */
                    lg:hidden bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full`}
                  initial={{ opacity: 0, height: 0, width: 0 }}
                  animate={{ opacity: 1, height: 'auto', width: 'auto' }}
                  transition={{ duration: 0.2 }}
                />
              )}
              
              <i className={`fas fa-${tool.icon} text-xl mb-1.5 transition-transform group-hover:scale-110 duration-300`}></i>
              <span className="text-[10px] font-medium tracking-wide opacity-90">{tool.name}</span>
              
              {/* Tooltip on hover (Modern) - 只在电脑端显示 */}
              <div className={`absolute lg:block hidden left-full ml-4 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border translate-x-2 group-hover:translate-x-0 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
                {tool.name}
                {/* Arrow */}
                <div className={`absolute top-1/2 -left-1 w-2 h-2 -mt-1 transform rotate-45 border-l border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}></div>
              </div>
            </motion.button>
          );
        })}

        {/* Separator */}
        <div className={`transition-all duration-300 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
          /* 电脑端样式：水平分隔线 */
          lg:block lg:w-12 lg:h-px lg:mx-auto lg:my-6
          /* 移动端样式：垂直分隔线 */
          lg:hidden h-16 w-px mx-1`}></div>

        {/* Extra Tools Links */}
        {extraTools.map((tool) => {
           const isNeoActive = tool.id === 'neo' && showInspirationPanel;
           
           return (
            <motion.button
              key={tool.id}
              onClick={() => handleExtraToolClick(tool)}
              className={`transition-all relative group flex-shrink-0 ${isNeoActive ? 'bg-blue-50 text-[#003366] dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' : isDark ? 'text-gray-400 hover:bg-gray-800/50 hover:text-blue-300' : 'text-gray-500 hover:bg-blue-50/50 hover:text-[#003366]'}
                /* 电脑端样式 */
                lg:w-full lg:flex lg:flex-col lg:items-center lg:justify-center lg:py-4 lg:rounded-2xl
                /* 移动端样式 */
                lg:hidden flex flex-col items-center justify-center p-3 rounded-xl min-w-[60px]`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <i className={`fas fa-${tool.icon} text-xl mb-1.5 transition-transform group-hover:scale-110 duration-300`}></i>
              <span className="text-[10px] font-medium tracking-wide opacity-90">{tool.name}</span>
              
              {/* Tooltip on hover (Modern) - 只在电脑端显示 */}
              <div className={`absolute lg:block hidden left-full ml-4 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border translate-x-2 group-hover:translate-x-0 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
                {tool.name}
                <div className={`absolute top-1/2 -left-1 w-2 h-2 -mt-1 transform rotate-45 border-l border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}></div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
