import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { StylePreset } from '../types/workheart';

interface StylePresetCardProps {
  preset: StylePreset;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function StylePresetCard({ 
  preset, 
  isSelected, 
  onClick, 
  onEdit, 
  onDelete 
}: StylePresetCardProps) {
  const { isDark } = useTheme();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`group relative rounded-xl border cursor-pointer overflow-hidden transition-all ${
        isSelected
          ? isDark 
            ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/30' 
            : 'border-red-500 bg-red-50 ring-2 ring-red-500/20'
          : isDark 
            ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800' 
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* 缩略图区域 */}
      <div className={`h-24 flex items-center justify-center ${
        isDark ? 'bg-slate-800' : 'bg-slate-50'
      }`}>
        {preset.thumbnail ? (
          <img 
            src={preset.thumbnail} 
            alt={preset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <i className={`fas fa-palette text-3xl ${
              isDark ? 'text-slate-600' : 'text-slate-300'
            }`}></i>
          </div>
        )}
        
        {/* 选中标记 */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
          >
            <i className="fas fa-check text-xs"></i>
          </motion.div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        <h3 className={`font-semibold text-sm mb-1 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          {preset.name}
        </h3>
        {preset.description && (
          <p className={`text-xs mb-2 line-clamp-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {preset.description}
          </p>
        )}
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-1">
          {preset.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                isDark 
                  ? 'bg-slate-700 text-slate-300' 
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tag}
            </span>
          ))}
          {preset.tags.length > 3 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              isDark 
                ? 'bg-slate-700 text-slate-400' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              +{preset.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* 悬停操作 */}
      <div className={`absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
        onEdit || onDelete ? '' : 'hidden'
      }`}>
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <i className="fas fa-pencil-alt"></i>
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              isDark 
                ? 'bg-slate-700 text-red-400 hover:bg-red-500/20' 
                : 'bg-white text-red-500 hover:bg-red-50 shadow-sm'
            }`}
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        )}
      </div>
    </motion.div>
  );
}
