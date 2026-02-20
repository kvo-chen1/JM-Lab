import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import type { OutlineSection } from './types';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  MoreHorizontal,
} from 'lucide-react';

interface OutlineSectionItemProps {
  section: OutlineSection;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canIndent: boolean;
  canOutdent: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<OutlineSection>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onAddChild: () => void;
}

export const OutlineSectionItem: React.FC<OutlineSectionItemProps> = ({
  section,
  depth,
  isSelected,
  isExpanded,
  canMoveUp,
  canMoveDown,
  canIndent,
  canOutdent,
  onSelect,
  onToggleExpand,
  onUpdate,
  onRemove,
  onMove,
  onAddChild,
}) => {
  const { isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(section.isEditing || false);
  const [editName, setEditName] = useState(section.name);
  const [editDescription, setEditDescription] = useState(section.description || '');
  const [showActions, setShowActions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    onUpdate({
      name: editName.trim() || '未命名章节',
      description: editDescription.trim(),
      isEditing: false,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(section.name);
    setEditDescription(section.description || '');
    setIsEditing(false);
    onUpdate({ isEditing: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getLevelColor = (level: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-amber-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-gray-500',
    ];
    return colors[(level - 1) % colors.length];
  };

  const getLevelLabel = (level: number) => {
    const labels = ['一级', '二级', '三级', '四级', '五级', '六级'];
    return labels[level - 1] || `${level}级`;
  };

  return (
    <div
      ref={itemRef}
      className={`group relative ${isSelected ? 'z-10' : ''}`}
      style={{ paddingLeft: `${depth * 24}px` }}
    >
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-2 p-3 rounded-lg transition-all cursor-pointer ${
          isSelected
            ? isDark
              ? 'bg-blue-500/20 border border-blue-500/30'
              : 'bg-blue-50 border border-blue-200'
            : isDark
            ? 'hover:bg-gray-700/50 border border-transparent'
            : 'hover:bg-gray-50 border border-transparent'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-1">
          {section.children && section.children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={`p-1 rounded transition-colors ${
                isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div
            className={`w-2 h-2 rounded-full ${getLevelColor(section.level)}`}
            title={getLevelLabel(section.level)}
          />
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <input
                ref={nameInputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className={`w-full px-2 py-1 text-sm rounded border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="章节名称"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className={`w-full px-2 py-1 text-xs rounded border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-300'
                    : 'bg-white border-gray-300 text-gray-600'
                }`}
                placeholder="章节描述（可选）"
              />
            </div>
          ) : (
            <div onDoubleClick={() => setIsEditing(true)}>
              <h4
                className={`font-medium text-sm truncate ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {section.name}
              </h4>
              {section.description && (
                <p
                  className={`text-xs truncate ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {section.description}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
            className={`p-1.5 rounded transition-colors ${
              isDark
                ? 'hover:bg-gray-600 text-gray-400'
                : 'hover:bg-gray-200 text-gray-500'
            }`}
            title="添加子章节"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className={`p-1.5 rounded transition-colors ${
                isDark
                  ? 'hover:bg-gray-600 text-gray-400'
                  : 'hover:bg-gray-200 text-gray-500'
              }`}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showActions && (
              <div
                className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border py-1 z-50 ${
                  isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowActions(false);
                  }}
                  className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                    isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  编辑
                </button>

                <div
                  className={`border-t my-1 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}
                />

                <button
                  onClick={() => {
                    onMove('up');
                    setShowActions(false);
                  }}
                  disabled={!canMoveUp}
                  className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                    canMoveUp
                      ? isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5 inline mr-2" />
                  上移
                </button>
                <button
                  onClick={() => {
                    onMove('down');
                    setShowActions(false);
                  }}
                  disabled={!canMoveDown}
                  className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                    canMoveDown
                      ? isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5 inline mr-2" />
                  下移
                </button>
                <button
                  onClick={() => {
                    onMove('left');
                    setShowActions(false);
                  }}
                  disabled={!canOutdent}
                  className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                    canOutdent
                      ? isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-2" />
                  减少缩进
                </button>
                <button
                  onClick={() => {
                    onMove('right');
                    setShowActions(false);
                  }}
                  disabled={!canIndent}
                  className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                    canIndent
                      ? isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5 inline mr-2" />
                  增加缩进
                </button>

                <div
                  className={`border-t my-1 ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}
                />

                <button
                  onClick={() => {
                    onRemove();
                    setShowActions(false);
                  }}
                  className={`w-full px-4 py-2 text-sm text-left transition-colors text-red-500 ${
                    isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-2" />
                  删除
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OutlineSectionItem;
