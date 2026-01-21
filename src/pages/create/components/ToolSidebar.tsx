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
    <>
      {/* 电脑端：左侧垂直工具栏 (大屏幕 - lg及以上) */}
      <div className={`hidden lg:block w-24 h-full flex flex-col items-center py-6 border-r backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} z-20`}>
        {/* Brand/Logo */}
        <div className="mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-900/20 text-red-500' : 'bg-red-50 text-red-600'}`}>
            <i className="fas fa-layer-group text-xl"></i>
          </div>
        </div>

        {/* 工具列表 */}
        <div className="flex flex-col space-y-3 w-full px-3">
          {toolOptions.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <motion.button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`transition-all relative group flex-shrink-0 ${isActive ? (isDark ? 'bg-red-900/20 text-red-400 shadow-sm' : 'bg-red-50 text-red-600 shadow-sm') : isDark ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-900'} w-full flex flex-col items-center justify-center py-4 rounded-2xl`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                title={tool.name}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute bg-[#C02C38] shadow-[0_0_8px_rgba(192,44,56,0.4)] transition-all duration-300 block left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full`}
                    initial={{ opacity: 0, height: 0, width: 0 }}
                    animate={{ opacity: 1, height: 'auto', width: 'auto' }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                
                <i className={`fas fa-${tool.icon} text-xl mb-1.5 transition-transform group-hover:scale-110 duration-300`}></i>
                <span className="text-[10px] font-medium tracking-wide opacity-90">{tool.name}</span>
                
                {/* Tooltip on hover */}
                <div className={`absolute block left-full ml-4 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border translate-x-2 group-hover:translate-x-0 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
                  {tool.name}
                  {/* Arrow */}
                  <div className={`absolute top-1/2 -left-1 w-2 h-2 -mt-1 transform rotate-45 border-l border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}></div>
                </div>
              </motion.button>
            );
          })}

          {/* 分隔线 */}
          <div className={`transition-all duration-300 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} w-12 h-px mx-auto my-6`}></div>

          {/* 额外工具 */}
          {extraTools.map((tool) => {
             const isNeoActive = tool.id === 'neo' && showInspirationPanel;
              
             return (
              <motion.button
                key={tool.id}
                onClick={() => handleExtraToolClick(tool)}
                className={`transition-all relative group flex-shrink-0 ${isNeoActive ? 'bg-blue-50 text-[#003366] dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' : isDark ? 'text-gray-400 hover:bg-gray-800/50 hover:text-blue-300' : 'text-gray-500 hover:bg-blue-50/50 hover:text-[#003366]'} w-full flex flex-col items-center justify-center py-4 rounded-2xl`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                <i className={`fas fa-${tool.icon} text-xl mb-1.5 transition-transform group-hover:scale-110 duration-300`}></i>
                <span className="text-[10px] font-medium tracking-wide opacity-90">{tool.name}</span>
                
                {/* Tooltip on hover */}
                <div className={`absolute block left-full ml-4 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border translate-x-2 group-hover:translate-x-0 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
                  {tool.name}
                  {/* Arrow */}
                  <div className={`absolute top-1/2 -left-1 w-2 h-2 -mt-1 transform rotate-45 border-l border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}></div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 平板端：水平工具栏 (中等屏幕 - md至lg) */}
      <div className={`hidden md:flex lg:hidden fixed bottom-0 left-0 right-0 h-24 flex-row items-center justify-around py-3 border-t backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} z-50`}>
        {/* 工具列表 */}
        <div className="flex flex-row space-x-2 w-full px-4">
          {toolOptions.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <motion.button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`transition-all relative group flex-shrink-0 ${isActive ? (isDark ? 'bg-red-900/20 text-red-400 shadow-sm' : 'bg-red-50 text-red-600 shadow-sm') : isDark ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-900'} flex flex-col items-center justify-center p-3 rounded-xl min-w-[60px]`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                title={tool.name}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute bg-[#C02C38] shadow-[0_0_8px_rgba(192,44,56,0.4)] transition-all duration-300 block bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full`}
                    initial={{ opacity: 0, height: 0, width: 0 }}
                    animate={{ opacity: 1, height: 'auto', width: 'auto' }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                
                <i className={`fas fa-${tool.icon} text-xl mb-1 transition-transform group-hover:scale-110 duration-300`}></i>
                <span className="text-[10px] font-medium tracking-wide opacity-90">{tool.name}</span>
              </motion.button>
            );
          })}

          {/* 分隔线 */}
          <div className={`transition-all duration-300 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} h-16 w-px mx-1`}></div>

          {/* 额外工具 */}
          {extraTools.map((tool) => {
             const isNeoActive = tool.id === 'neo' && showInspirationPanel;
              
             return (
              <motion.button
                key={tool.id}
                onClick={() => handleExtraToolClick(tool)}
                className={`transition-all relative group flex-shrink-0 ${isNeoActive ? 'bg-blue-50 text-[#003366] dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' : isDark ? 'text-gray-400 hover:bg-gray-800/50 hover:text-blue-300' : 'text-gray-500 hover:bg-blue-50/50 hover:text-[#003366]'} flex flex-col items-center justify-center p-3 rounded-xl min-w-[60px]`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                <i className={`fas fa-${tool.icon} text-xl mb-1 transition-transform group-hover:scale-110 duration-300`}></i>
                <span className="text-[10px] font-medium tracking-wide opacity-90">{tool.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 手机端：底部水平工具栏 (小屏幕 - sm及以下) */}
      <div className={`flex md:hidden fixed bottom-0 left-0 right-0 h-24 flex-row items-center justify-around py-3 border-t backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} z-50`}>
        {/* 工具列表 - 只显示图标，不显示文字 */}
        <div className="flex flex-row space-x-2 w-full px-4 justify-center">
          {toolOptions.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <motion.button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`transition-all relative group flex-shrink-0 ${isActive ? (isDark ? 'bg-red-900/20 text-red-400 shadow-sm' : 'bg-red-50 text-red-600 shadow-sm') : isDark ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-900'} flex flex-col items-center justify-center p-3 rounded-xl min-w-[56px]`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                title={tool.name}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute bg-[#C02C38] shadow-[0_0_8px_rgba(192,44,56,0.4)] transition-all duration-300 block bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full`}
                    initial={{ opacity: 0, height: 0, width: 0 }}
                    animate={{ opacity: 1, height: 'auto', width: 'auto' }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                
                <i className={`fas fa-${tool.icon} text-xl transition-transform group-hover:scale-110 duration-300`}></i>
              </motion.button>
            );
          })}

          {/* 分隔线 */}
          <div className={`transition-all duration-300 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} h-16 w-px mx-1`}></div>

          {/* 额外工具 - 只显示图标，不显示文字 */}
          {extraTools.map((tool) => {
             const isNeoActive = tool.id === 'neo' && showInspirationPanel;
              
             return (
              <motion.button
                key={tool.id}
                onClick={() => handleExtraToolClick(tool)}
                className={`transition-all relative group flex-shrink-0 ${isNeoActive ? 'bg-blue-50 text-[#003366] dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' : isDark ? 'text-gray-400 hover:bg-gray-800/50 hover:text-blue-300' : 'text-gray-500 hover:bg-blue-50/50 hover:text-[#003366]'} flex flex-col items-center justify-center p-3 rounded-xl min-w-[56px]`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                <i className={`fas fa-${tool.icon} text-xl transition-transform group-hover:scale-110 duration-300`}></i>
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
}