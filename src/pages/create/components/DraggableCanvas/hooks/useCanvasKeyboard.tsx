import React, { useEffect, useCallback, useRef, useState } from 'react';
import type { ToolMode } from '../CanvasControls';
import type { WorkPosition } from './useWorkDrag';

interface KeyboardShortcut {
  keys: string[];
  handler: (event: KeyboardEvent) => void;
  description: string;
  category: 'canvas' | 'work' | 'view' | 'tool';
}

interface UseCanvasKeyboardProps {
  // 画布控制
  position: { x: number; y: number };
  setPosition: (pos: { x: number; y: number }) => void;
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  resetPosition: () => void;

  // 工具模式
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;

  // 作品管理
  works: { id: number }[];
  selectedWorkId: number | null;
  onSelectWork: (id: number | null) => void;
  onDeleteWork: (id: number) => void;
  onDuplicateWork?: (id: number) => void;
  workPositions: Map<number, WorkPosition>;
  onPositionChange?: (workId: number, position: WorkPosition) => void;
}

export function useCanvasKeyboard({
  position,
  setPosition,
  scale,
  zoomIn,
  zoomOut,
  resetZoom,
  resetPosition,
  toolMode,
  setToolMode,
  works,
  selectedWorkId,
  onSelectWork,
  onDeleteWork,
  onDuplicateWork,
  workPositions,
  onPositionChange,
}: UseCanvasKeyboardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const isListening = useRef(false);

  // 检查是否在输入元素中
  const isInputElement = useCallback((target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
  }, []);

  // 移动画布
  const moveCanvas = useCallback((dx: number, dy: number) => {
    setPosition({
      x: position.x + dx,
      y: position.y + dy,
    });
  }, [position, setPosition]);

  // 微调作品位置
  const nudgeWork = useCallback((dx: number, dy: number) => {
    if (selectedWorkId === null || !onPositionChange) return;

    const currentPos = workPositions.get(selectedWorkId);
    if (currentPos) {
      onPositionChange(selectedWorkId, {
        ...currentPos,
        x: currentPos.x + dx,
        y: currentPos.y + dy,
      });
    }
  }, [selectedWorkId, workPositions, onPositionChange]);

  // 选择下一个作品
  const selectNextWork = useCallback((direction: 'next' | 'prev') => {
    if (works.length === 0) return;

    if (selectedWorkId === null) {
      onSelectWork(works[0].id);
      return;
    }

    const currentIndex = works.findIndex(w => w.id === selectedWorkId);
    if (currentIndex === -1) {
      onSelectWork(works[0].id);
      return;
    }

    let newIndex: number;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % works.length;
    } else {
      newIndex = (currentIndex - 1 + works.length) % works.length;
    }

    onSelectWork(works[newIndex].id);
  }, [works, selectedWorkId, onSelectWork]);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // 忽略全屏请求失败
      });
    } else {
      document.exitFullscreen().catch(() => {
        // 忽略退出全屏失败
      });
    }
  }, []);

  // 定义快捷键
  const shortcuts: KeyboardShortcut[] = [
    // 画布移动
    {
      keys: ['ArrowUp'],
      handler: (e) => {
        if (selectedWorkId !== null && toolMode === 'select') {
          // 微调选中作品
          e.preventDefault();
          nudgeWork(0, e.shiftKey ? -10 : -1);
        } else {
          // 移动画布
          e.preventDefault();
          moveCanvas(0, e.shiftKey ? -50 : -10);
        }
      },
      description: '向上移动（Shift加速）',
      category: 'canvas',
    },
    {
      keys: ['ArrowDown'],
      handler: (e) => {
        if (selectedWorkId !== null && toolMode === 'select') {
          e.preventDefault();
          nudgeWork(0, e.shiftKey ? 10 : 1);
        } else {
          e.preventDefault();
          moveCanvas(0, e.shiftKey ? 50 : 10);
        }
      },
      description: '向下移动（Shift加速）',
      category: 'canvas',
    },
    {
      keys: ['ArrowLeft'],
      handler: (e) => {
        if (selectedWorkId !== null && toolMode === 'select') {
          e.preventDefault();
          nudgeWork(e.shiftKey ? -10 : -1, 0);
        } else {
          e.preventDefault();
          moveCanvas(e.shiftKey ? -50 : -10, 0);
        }
      },
      description: '向左移动（Shift加速）',
      category: 'canvas',
    },
    {
      keys: ['ArrowRight'],
      handler: (e) => {
        if (selectedWorkId !== null && toolMode === 'select') {
          e.preventDefault();
          nudgeWork(e.shiftKey ? 10 : 1, 0);
        } else {
          e.preventDefault();
          moveCanvas(e.shiftKey ? 50 : 10, 0);
        }
      },
      description: '向右移动（Shift加速）',
      category: 'canvas',
    },

    // 缩放
    {
      keys: ['Ctrl', 'Plus'],
      handler: (e) => {
        e.preventDefault();
        zoomIn();
      },
      description: '放大画布',
      category: 'canvas',
    },
    {
      keys: ['Ctrl', 'Equal'],
      handler: (e) => {
        e.preventDefault();
        zoomIn();
      },
      description: '放大画布',
      category: 'canvas',
    },
    {
      keys: ['Ctrl', 'Minus'],
      handler: (e) => {
        e.preventDefault();
        zoomOut();
      },
      description: '缩小画布',
      category: 'canvas',
    },
    {
      keys: ['Ctrl', '0'],
      handler: (e) => {
        e.preventDefault();
        resetZoom();
        resetPosition();
      },
      description: '重置画布',
      category: 'canvas',
    },

    // 工具切换
    {
      keys: ['v'],
      handler: (e) => {
        if (isInputElement(e.target)) return;
        e.preventDefault();
        setToolMode('select');
      },
      description: '选择工具',
      category: 'tool',
    },
    {
      keys: ['h'],
      handler: (e) => {
        if (isInputElement(e.target)) return;
        e.preventDefault();
        setToolMode('pan');
      },
      description: '抓手工具',
      category: 'tool',
    },
    {
      keys: ['m'],
      handler: (e) => {
        if (isInputElement(e.target)) return;
        e.preventDefault();
        setToolMode('select');
      },
      description: '移动工具',
      category: 'tool',
    },

    // 作品导航
    {
      keys: ['Tab'],
      handler: (e) => {
        if (isInputElement(e.target)) return;
        e.preventDefault();
        selectNextWork(e.shiftKey ? 'prev' : 'next');
      },
      description: '切换作品（Shift反向）',
      category: 'work',
    },
    {
      keys: ['Escape'],
      handler: (e) => {
        if (showHelp) {
          setShowHelp(false);
        } else if (selectedWorkId !== null) {
          onSelectWork(null);
        }
      },
      description: '取消选择/关闭帮助',
      category: 'work',
    },

    // 作品操作
    {
      keys: ['Delete'],
      handler: (e) => {
        if (isInputElement(e.target)) return;
        if (selectedWorkId !== null) {
          onDeleteWork(selectedWorkId);
        }
      },
      description: '删除选中作品',
      category: 'work',
    },
    {
      keys: ['Backspace'],
      handler: (e) => {
        if (isInputElement(e.target)) return;
        if (selectedWorkId !== null) {
          e.preventDefault();
          onDeleteWork(selectedWorkId);
        }
      },
      description: '删除选中作品',
      category: 'work',
    },
    {
      keys: ['Ctrl', 'd'],
      handler: (e) => {
        if (isInputElement(e.target)) return;
        e.preventDefault();
        if (selectedWorkId !== null && onDuplicateWork) {
          onDuplicateWork(selectedWorkId);
        }
      },
      description: '复制选中作品',
      category: 'work',
    },

    // 视图操作
    {
      keys: ['F11'],
      handler: (e) => {
        e.preventDefault();
        toggleFullscreen();
      },
      description: '切换全屏',
      category: 'view',
    },
    {
      keys: ['F1'],
      handler: (e) => {
        e.preventDefault();
        setShowHelp(true);
      },
      description: '显示快捷键帮助',
      category: 'view',
    },
  ];

  // 处理键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 空格键特殊处理：交给 useCanvasPan 处理，这里不拦截
    if (e.code === 'Space') {
      return;
    }

    // 在输入元素中禁用大部分快捷键
    if (isInputElement(e.target)) {
      // 只允许 ESC 关闭帮助
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false);
      }
      return;
    }

    // 检查是否匹配任何快捷键
    for (const shortcut of shortcuts) {
      const keys = shortcut.keys;
      const ctrlCmd = keys.includes('Ctrl') && (e.ctrlKey || e.metaKey);
      const alt = keys.includes('Alt') && e.altKey;
      const shift = keys.includes('Shift') && e.shiftKey;
      const key = keys.find(k => !['Ctrl', 'Alt', 'Shift'].includes(k));

      if (key) {
        const keyMatch =
          e.key.toLowerCase() === key.toLowerCase() ||
          e.key === key ||
          (key === 'Plus' && (e.key === '+' || e.key === '=')) ||
          (key === 'Equal' && e.key === '=') ||
          (key === 'Minus' && e.key === '-');

        if (
          ctrlCmd === keys.includes('Ctrl') &&
          alt === keys.includes('Alt') &&
          shift === keys.includes('Shift') &&
          keyMatch
        ) {
          shortcut.handler(e);
          break;
        }
      }
    }
  }, [shortcuts, isInputElement, showHelp]);

  // 监听键盘事件
  useEffect(() => {
    if (!isListening.current) {
      window.addEventListener('keydown', handleKeyDown);
      isListening.current = true;

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        isListening.current = false;
      };
    }
  }, [handleKeyDown]);

  // 帮助模态框组件
  const HelpModal = useCallback(() => {
    if (!showHelp) return null;

    const categories = {
      canvas: '画布操作',
      work: '作品操作',
      view: '视图操作',
      tool: '工具切换',
    };

    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={() => setShowHelp(false)}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              键盘快捷键
            </h2>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {(Object.keys(categories) as Array<keyof typeof categories>).map(category => {
            const categoryShortcuts = shortcuts.filter(s => s.category === category);
            if (categoryShortcuts.length === 0) return null;

            return (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {categories[category]}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((k, i) => (
                          <kbd
                            key={i}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300"
                          >
                            {k === 'Ctrl' ? 'Ctrl' :
                             k === 'Shift' ? 'Shift' :
                             k === 'Alt' ? 'Alt' :
                             k === 'Plus' ? '+' :
                             k === 'Equal' ? '=' :
                             k === 'Minus' ? '-' :
                             k === 'ArrowUp' ? '↑' :
                             k === 'ArrowDown' ? '↓' :
                             k === 'ArrowLeft' ? '←' :
                             k === 'ArrowRight' ? '→' :
                             k.toUpperCase()}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            提示：在输入框中时，大部分快捷键将被禁用。按 F1 可随时查看此帮助。
          </p>
        </div>
      </div>
    );
  }, [showHelp, shortcuts]);

  return {
    showHelp,
    setShowHelp,
    HelpModal,
  };
}
