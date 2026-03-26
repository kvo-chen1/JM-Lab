import React, { useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { IsolatedElement } from '../hooks/useCanvasStore';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  GripVertical,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';

interface ElementListPanelProps {
  elements: IsolatedElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onReorderElements: (elementIds: string[]) => void;
}

export const ElementListPanel: React.FC<ElementListPanelProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onDeleteElement,
  onReorderElements,
}) => {
  const { isDark } = useTheme();

  // 按 zIndex 排序的元素
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  // 处理拖拽排序
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;
    
    // 重新排序
    const newOrder = [...sortedElements];
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    // 更新 zIndex
    const reorderedIds = newOrder.map(el => el.id);
    onReorderElements(reorderedIds);
  }, [sortedElements, onReorderElements]);

  // 全选/取消全选
  const allVisible = elements.every(el => el.isVisible);
  const handleToggleAllVisibility = useCallback(() => {
    elements.forEach(el => {
      if (el.isVisible === allVisible) {
        onToggleVisibility(el.id);
      }
    });
  }, [elements, allVisible, onToggleVisibility]);

  return (
    <div className={`w-56 h-full flex flex-col ${isDark ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'}`}>
      {/* 头部 */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>元素列表</h3>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {elements.length} 个元素
          </span>
        </div>
      </div>

      {/* 工具栏 */}
      <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleAllVisibility}
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {allVisible ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            全选
          </button>
        </div>
      </div>

      {/* 元素列表 */}
      <div className="flex-1 overflow-y-auto">
        {sortedElements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4">
            <Layers className={`w-8 h-8 mb-2 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              暂无分离的元素
            </p>
          </div>
        ) : (
          <div className="py-2">
            {sortedElements.map((element, index) => (
              <div
                key={element.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => onSelectElement(element.id)}
                className={`
                  group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer
                  transition-colors duration-150
                  ${selectedElementId === element.id
                    ? isDark 
                      ? 'bg-purple-500/20 border border-purple-500/30' 
                      : 'bg-purple-50 border border-purple-200'
                    : isDark
                      ? 'hover:bg-gray-800 border border-transparent'
                      : 'hover:bg-gray-50 border border-transparent'
                  }
                `}
              >
                {/* 拖拽手柄 */}
                <GripVertical className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'} cursor-grab active:cursor-grabbing`} />
                
                {/* 缩略图 */}
                <div className={`
                  w-10 h-10 rounded border overflow-hidden flex-shrink-0
                  ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}
                  ${!element.isVisible ? 'opacity-30' : ''}
                `}>
                  <img
                    src={element.isolatedImageUrl}
                    alt={element.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 元素信息 */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {element.name}
                  </p>
                  <p className={`text-[10px] ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {element.type === 'product' ? '产品' : 
                     element.type === 'text' ? '文字' : 
                     element.type === 'logo' ? 'Logo' : 
                     element.type === 'background' ? '背景' : '装饰'}
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* 可见性切换 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(element.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      element.isVisible
                        ? isDark
                          ? 'text-gray-400 hover:text-gray-200'
                          : 'text-gray-500 hover:text-gray-700'
                        : 'text-purple-500'
                    }`}
                  >
                    {element.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* 锁定切换 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(element.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      element.isLocked
                        ? 'text-purple-500'
                        : isDark
                          ? 'text-gray-400 hover:text-gray-200'
                          : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {element.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* 删除 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement(element.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isDark
                        ? 'text-gray-400 hover:text-red-400'
                        : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 状态指示器（始终显示） */}
                <div className="flex items-center gap-1">
                  {!element.isVisible && (
                    <EyeOff className={`w-3 h-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  )}
                  {element.isLocked && (
                    <Lock className={`w-3 h-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          拖拽可调整图层顺序
        </p>
      </div>
    </div>
  );
};

export default ElementListPanel;
