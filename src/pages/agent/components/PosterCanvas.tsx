/**
 * 海报画布组件
 * 在 Agent 画布区域显示海报设计
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Rnd } from 'react-rnd';
import { useTheme } from '@/hooks/useTheme';
import {
  shadowSystem,
  type PosterLayout,
  type LayoutArea,
} from '@/config/posterLayouts';
import {
  Image,
  Type,
  Move,
  RotateCw,
  Maximize2,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import type { EditableElement, ImageMap, TextContent } from '../hooks/usePosterDesign';

interface PosterCanvasProps {
  layout: PosterLayout;
  images: ImageMap;
  textContent: TextContent;
  editableElements: EditableElement[];
  selectedElementId: string | null;
  isEditMode: boolean;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<EditableElement>) => void;
  onDeleteElement: (id: string) => void;
  onUpdateTextContent: (updates: Partial<TextContent>) => void;
}

// 装饰元素渲染
const DecorationElement: React.FC<{
  decoration: NonNullable<PosterLayout['decorations']>[number];
  layoutWidth: number;
  layoutHeight: number;
}> = ({ decoration, layoutWidth, layoutHeight }) => {
  const { type, x, y, size, color, opacity = 1 } = decoration;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    opacity,
    pointerEvents: 'none',
  };

  switch (type) {
    case 'circle':
      return (
        <div
          style={{
            ...style,
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color,
            transform: 'translate(-50%, -50%)',
          }}
        />
      );
    case 'line':
      return (
        <div
          style={{
            ...style,
            width: `${size}%`,
            height: 2,
            backgroundColor: color,
          }}
        />
      );
    case 'dot':
      return (
        <div
          style={{
            ...style,
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color,
            transform: 'translate(-50%, -50%)',
          }}
        />
      );
    default:
      return null;
  }
};

export default function PosterCanvas({
  layout,
  images,
  textContent,
  editableElements,
  selectedElementId,
  isEditMode,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onUpdateTextContent,
}: PosterCanvasProps) {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLDivElement>(null);

  // 获取区域对应的图片
  const getAreaImage = (area: LayoutArea): string | undefined => {
    switch (area.type) {
      case 'main':
        return images.mainPoster;
      case 'threeViews':
        return images.threeViews;
      case 'emojis':
        return images.emojiSheet;
      case 'actions':
        return images.actionSheet;
      case 'colors':
        return images.colorPalette;
      case 'merchandise':
        return images.merchandiseMockup;
      default:
        return undefined;
    }
  };

  // 获取阴影样式
  const getShadowStyle = (shadow?: LayoutArea['shadow']): string => {
    if (!shadow || shadow === 'none') return 'none';
    return shadowSystem[shadow] || shadowSystem.md;
  };

  // 渲染区域内容
  const renderAreaContent = (area: LayoutArea) => {
    const imageUrl = getAreaImage(area);

    if (area.type === 'decoration') {
      return <div className="w-full h-full" style={area.style} />;
    }

    if (area.type === 'title') {
      return (
        <div className="w-full h-full flex items-center justify-center p-2" style={area.style}>
          <input
            type="text"
            value={textContent.title}
            onChange={(e) => onUpdateTextContent({ title: e.target.value })}
            placeholder={area.label}
            className="w-full text-center bg-transparent border-none outline-none placeholder-gray-400/50"
            style={{ ...area.style, fontFamily: 'inherit' }}
          />
        </div>
      );
    }

    if (area.type === 'subtitle') {
      return (
        <div className="w-full h-full flex items-center justify-center p-2" style={area.style}>
          <textarea
            value={textContent.subtitle}
            onChange={(e) => onUpdateTextContent({ subtitle: e.target.value })}
            placeholder={area.label}
            className="w-full h-full text-center bg-transparent border-none outline-none placeholder-gray-400/50 resize-none"
            style={{ ...area.style, fontFamily: 'inherit' }}
            rows={2}
          />
        </div>
      );
    }

    if (imageUrl) {
      return (
        <div className="w-full h-full p-1 overflow-hidden" style={{ borderRadius: area.borderRadius || '12px' }}>
          <img
            src={imageUrl}
            alt={area.label}
            className="w-full h-full object-contain"
            style={{ borderRadius: 'inherit' }}
            crossOrigin="anonymous"
          />
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400/60 bg-gray-100/30 m-1" style={{ borderRadius: area.borderRadius || '12px' }}>
        <Image className="w-8 h-8 mb-2 opacity-40" />
        <span className="text-xs">{area.label}</span>
      </div>
    );
  };

  const selectedElement = editableElements.find((el) => el.id === selectedElementId);

  return (
    <div className="flex flex-col h-full">
      {/* 画布区域 */}
      <div className="flex-1 overflow-auto p-8 relative bg-gray-100 dark:bg-gray-950">
        <div
          ref={canvasRef}
          className="mx-auto"
          style={{
            width: layout.width,
            height: layout.height,
          }}
        >
          <div
            className="relative w-full h-full overflow-hidden"
            style={{
              background: layout.background || '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={() => onSelectElement(null)}
          >
            {/* 装饰元素 */}
            {layout.decorations?.map((deco, index) => (
              <DecorationElement
                key={index}
                decoration={deco}
                layoutWidth={layout.width}
                layoutHeight={layout.height}
              />
            ))}

            {/* 布局区域 */}
            {isEditMode ? (
              editableElements.map((element) => (
                <Rnd
                  key={element.id}
                  size={{
                    width: `${element.actualWidth}%`,
                    height: `${element.actualHeight}%`,
                  }}
                  position={{
                    x: (element.actualX / 100) * layout.width,
                    y: (element.actualY / 100) * layout.height,
                  }}
                  onDragStop={(e, d) => {
                    const newX = (d.x / layout.width) * 100;
                    const newY = (d.y / layout.height) * 100;
                    onUpdateElement(element.id, { actualX: newX, actualY: newY });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    const newWidth = (parseInt(ref.style.width) / layout.width) * 100;
                    const newHeight = (parseInt(ref.style.height) / layout.height) * 100;
                    const newX = (position.x / layout.width) * 100;
                    const newY = (position.y / layout.height) * 100;
                    onUpdateElement(element.id, {
                      actualWidth: newWidth,
                      actualHeight: newHeight,
                      actualX: newX,
                      actualY: newY,
                    });
                  }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onSelectElement(element.id);
                  }}
                  bounds="parent"
                  className={`overflow-hidden transition-shadow ${
                    selectedElementId === element.id
                      ? 'ring-2 ring-blue-500 ring-offset-2 z-50'
                      : 'hover:ring-1 hover:ring-blue-300'
                  }`}
                  style={{
                    borderRadius: element.borderRadius || '0',
                    boxShadow: getShadowStyle(element.shadow),
                    transform: `rotate(${element.actualRotate}deg)`,
                    backdropFilter: element.glass ? 'blur(10px)' : undefined,
                    background: element.glass ? 'rgba(255, 255, 255, 0.1)' : undefined,
                    border: element.glass ? '1px solid rgba(255, 255, 255, 0.2)' : undefined,
                    zIndex: selectedElementId === element.id ? 100 : element.zIndex || 1,
                  }}
                >
                  {renderAreaContent(element)}
                </Rnd>
              ))
            ) : (
              editableElements.map((element) => (
                <motion.div
                  key={element.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: editableElements.indexOf(element) * 0.05,
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="absolute overflow-hidden"
                  style={{
                    left: `${element.actualX}%`,
                    top: `${element.actualY}%`,
                    width: `${element.actualWidth}%`,
                    height: `${element.actualHeight}%`,
                    zIndex: element.zIndex || 1,
                    borderRadius: element.borderRadius || '0',
                    boxShadow: getShadowStyle(element.shadow),
                    transform: `rotate(${element.actualRotate}deg)`,
                    backdropFilter: element.glass ? 'blur(10px)' : undefined,
                    background: element.glass ? 'rgba(255, 255, 255, 0.1)' : undefined,
                    border: element.glass ? '1px solid rgba(255, 255, 255, 0.2)' : undefined,
                  }}
                >
                  {renderAreaContent(element)}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 属性编辑面板 - 仅在编辑模式且有选中元素时显示 */}
      {isEditMode && selectedElement && (
        <div className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              编辑: {selectedElement.label}
            </h3>
            <button
              onClick={() => onDeleteElement(selectedElement.id)}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* 位置 */}
            <div>
              <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1 mb-1`}>
                <Move className="w-3 h-3" /> 位置 X
              </label>
              <input
                type="number"
                value={Math.round(selectedElement.actualX)}
                onChange={(e) => onUpdateElement(selectedElement.id, { actualX: Number(e.target.value) })}
                className={`w-full px-2 py-1.5 rounded-lg text-sm ${
                  isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
                }`}
              />
            </div>
            <div>
              <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1 mb-1`}>
                <Move className="w-3 h-3" /> 位置 Y
              </label>
              <input
                type="number"
                value={Math.round(selectedElement.actualY)}
                onChange={(e) => onUpdateElement(selectedElement.id, { actualY: Number(e.target.value) })}
                className={`w-full px-2 py-1.5 rounded-lg text-sm ${
                  isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
                }`}
              />
            </div>

            {/* 尺寸 */}
            <div>
              <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1 mb-1`}>
                <Maximize2 className="w-3 h-3" /> 宽度
              </label>
              <input
                type="number"
                value={Math.round(selectedElement.actualWidth)}
                onChange={(e) => onUpdateElement(selectedElement.id, { actualWidth: Number(e.target.value) })}
                className={`w-full px-2 py-1.5 rounded-lg text-sm ${
                  isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
                }`}
              />
            </div>
            <div>
              <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1 mb-1`}>
                <Maximize2 className="w-3 h-3" /> 高度
              </label>
              <input
                type="number"
                value={Math.round(selectedElement.actualHeight)}
                onChange={(e) => onUpdateElement(selectedElement.id, { actualHeight: Number(e.target.value) })}
                className={`w-full px-2 py-1.5 rounded-lg text-sm ${
                  isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
                }`}
              />
            </div>
          </div>

          {/* 旋转 */}
          <div className="mt-3">
            <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1 mb-1`}>
              <RotateCw className="w-3 h-3" /> 旋转角度
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedElement.actualRotate}
                onChange={(e) => onUpdateElement(selectedElement.id, { actualRotate: Number(e.target.value) })}
                className="flex-1"
              />
              <input
                type="number"
                value={selectedElement.actualRotate}
                onChange={(e) => onUpdateElement(selectedElement.id, { actualRotate: Number(e.target.value) })}
                className={`w-16 px-2 py-1.5 rounded-lg text-sm text-center ${
                  isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
