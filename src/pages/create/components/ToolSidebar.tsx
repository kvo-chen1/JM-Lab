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
    <div className={`w-24 flex flex-col items-center py-6 border-r flex-shrink-0 z-20 overflow-y-auto scrollbar-hide backdrop-blur-xl ${
      isDark 
        ? 'bg-gray-900/90 border-gray-800' 
        : 'bg-white/90 border-gray-100'
    }`}>
      {/* Brand/Logo Placeholder or Top Spacing */}
      <div className="mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isDark ? 'bg-red-900/20 text-red-500' : 'bg-red-50 text-red-600'
        }`}>
          <i className="fas fa-layer-group text-xl"></i>
        </div>
      </div>

      <div className="space-y-3 w-full px-3">
        {toolOptions.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <motion.button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-full flex flex-col items-center justify-center py-4 rounded-2xl transition-all relative group ${
                isActive
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 shadow-sm'
                  : isDark 
                    ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' 
                    : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              title={tool.name}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#C02C38] rounded-r-full shadow-[0_0_8px_rgba(192,44,56,0.4)]"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 24 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <i className={`fas fa-${tool.icon} text-xl mb-1.5 transition-transform group-hover:scale-110 duration-300`}></i>
              <span className="text-[10px] font-medium tracking-wide opacity-90">{tool.name}</span>
              
              {/* Tooltip on hover (Modern) */}
              <div className={`absolute left-full ml-4 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border translate-x-2 group-hover:translate-x-0 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-100 text-gray-800'
              }`}>
                {tool.name}
                {/* Arrow */}
                <div className={`absolute top-1/2 -left-1 w-2 h-2 -mt-1 transform rotate-45 border-l border-b ${
                   isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}></div>
              </div>
            </motion.button>
          );
        })}

        {/* Separator */}
        <div className={`w-12 h-px mx-auto my-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>

        {/* Extra Tools Links */}
        {extraTools.map((tool) => {
           const isNeoActive = tool.id === 'neo' && showInspirationPanel;
           
           return (
            <motion.button
              key={tool.id}
              onClick={() => handleExtraToolClick(tool)}
              className={`w-full flex flex-col items-center justify-center py-4 rounded-2xl transition-all relative group ${
                isNeoActive
                  ? 'bg-blue-50 text-[#003366] dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                  : isDark 
                    ? 'text-gray-400 hover:bg-gray-800/50 hover:text-blue-300' 
                    : 'text-gray-500 hover:bg-blue-50/50 hover:text-[#003366]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <i className={`fas fa-${tool.icon} text-xl mb-1.5 transition-transform group-hover:scale-110 duration-300`}></i>
              <span className="text-[10px] font-medium tracking-wide opacity-90">{tool.name}</span>
              
              <div className={`absolute left-full ml-4 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border translate-x-2 group-hover:translate-x-0 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-100 text-gray-800'
              }`}>
                {tool.name}
                <div className={`absolute top-1/2 -left-1 w-2 h-2 -mt-1 transform rotate-45 border-l border-b ${
                   isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}></div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
