import { useEffect, useCallback, useRef } from 'react';
import { useAgentStore } from './useAgentStore';
import { useConversationStore } from './useConversationStore';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyboardShortcut {
  keys: string[];
  handler: KeyHandler;
  description: string;
  category: 'canvas' | 'chat' | 'session' | 'general';
}

export function useKeyboardControls() {
  const agentStore = useAgentStore();
  const conversationStore = useConversationStore();
  const isListening = useRef(false);

  // 键盘快捷键映射
  const shortcuts: KeyboardShortcut[] = [
    // 画布操作
    {
      keys: ['ArrowUp'],
      handler: (e) => {
        e.preventDefault();
        agentStore.setCanvasPosition({
          x: agentStore.canvasPosition.x,
          y: agentStore.canvasPosition.y - 10
        });
      },
      description: '向上移动画布',
      category: 'canvas'
    },
    {
      keys: ['ArrowDown'],
      handler: (e) => {
        e.preventDefault();
        agentStore.setCanvasPosition({
          x: agentStore.canvasPosition.x,
          y: agentStore.canvasPosition.y + 10
        });
      },
      description: '向下移动画布',
      category: 'canvas'
    },
    {
      keys: ['ArrowLeft'],
      handler: (e) => {
        e.preventDefault();
        agentStore.setCanvasPosition({
          x: agentStore.canvasPosition.x - 10,
          y: agentStore.canvasPosition.y
        });
      },
      description: '向左移动画布',
      category: 'canvas'
    },
    {
      keys: ['ArrowRight'],
      handler: (e) => {
        e.preventDefault();
        agentStore.setCanvasPosition({
          x: agentStore.canvasPosition.x + 10,
          y: agentStore.canvasPosition.y
        });
      },
      description: '向右移动画布',
      category: 'canvas'
    },
    {
      keys: ['Ctrl', 'Plus', 'Equal'],
      handler: (e) => {
        e.preventDefault();
        agentStore.setCanvasZoom(Math.min(200, agentStore.canvasZoom + 10));
      },
      description: '放大画布',
      category: 'canvas'
    },
    {
      keys: ['Ctrl', 'Minus'],
      handler: (e) => {
        e.preventDefault();
        agentStore.setCanvasZoom(Math.max(50, agentStore.canvasZoom - 10));
      },
      description: '缩小画布',
      category: 'canvas'
    },
    {
      keys: ['Ctrl', '0'],
      handler: (e) => {
        e.preventDefault();
        agentStore.resetCanvas();
      },
      description: '重置画布',
      category: 'canvas'
    },
    {
      keys: ['Space'],
      handler: (e) => {
        // 空格键在DraggableCanvas组件中处理
      },
      description: '按住空格键临时切换到抓手工具（拖拽移动画布）',
      category: 'canvas'
    },
    {
      keys: ['Ctrl', '滚轮'],
      handler: (e) => {
        // Ctrl+滚轮在DraggableCanvas组件中处理
      },
      description: 'Ctrl+鼠标滚轮缩放画布',
      category: 'canvas'
    },
    {
      keys: ['Alt', '1'],
      handler: (e) => {
        e.preventDefault();
        agentStore.setSelectedTool('select');
      },
      description: '选择工具',
      category: 'canvas'
    },
    {
      keys: ['Alt', '2'],
      handler: (e) => {
        e.preventDefault();
        agentStore.setSelectedTool('move');
      },
      description: '移动工具',
      category: 'canvas'
    },
    {
      keys: ['Alt', '3'],
      handler: (e) => {
        e.preventDefault();
        agentStore.setSelectedTool('hand');
      },
      description: '抓手工具',
      category: 'canvas'
    },
    
    // 会话管理
    {
      keys: ['Ctrl', 'N'],
      handler: (e) => {
        e.preventDefault();
        conversationStore.createSession();
      },
      description: '创建新会话',
      category: 'session'
    },
    {
      keys: ['Ctrl', 'Tab'],
      handler: (e) => {
        e.preventDefault();
        const sessions = conversationStore.sessions;
        if (sessions.length > 0) {
          const currentIndex = sessions.findIndex(s => s.id === conversationStore.currentSessionId);
          const nextIndex = (currentIndex + 1) % sessions.length;
          conversationStore.switchSession(sessions[nextIndex].id);
        }
      },
      description: '下一个会话',
      category: 'session'
    },
    {
      keys: ['Ctrl', 'Shift', 'Tab'],
      handler: (e) => {
        e.preventDefault();
        const sessions = conversationStore.sessions;
        if (sessions.length > 0) {
          const currentIndex = sessions.findIndex(s => s.id === conversationStore.currentSessionId);
          const prevIndex = (currentIndex - 1 + sessions.length) % sessions.length;
          conversationStore.switchSession(sessions[prevIndex].id);
        }
      },
      description: '上一个会话',
      category: 'session'
    },
    
    // 通用操作
    {
      keys: ['F11'],
      handler: (e) => {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      },
      description: '切换全屏',
      category: 'general'
    },
    {
      keys: ['F1'],
      handler: (e) => {
        e.preventDefault();
        showHelpModal();
      },
      description: '显示帮助',
      category: 'general'
    },
    {
      keys: ['Ctrl', 'H'],
      handler: (e) => {
        e.preventDefault();
        agentStore.toggleChatCollapsed();
      },
      description: '切换聊天面板',
      category: 'general'
    }
  ];

  // 处理键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 忽略输入框和文本区域的键盘事件
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
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
        const keyMatch = e.key === key || 
          (key === 'Plus' && (e.key === '+' || e.key === '=')) ||
          (key === 'Minus' && e.key === '-');

        if (
          (ctrlCmd === keys.includes('Ctrl')) &&
          (alt === keys.includes('Alt')) &&
          (shift === keys.includes('Shift')) &&
          keyMatch
        ) {
          shortcut.handler(e);
          break;
        }
      }
    }
  }, []);

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

  // 显示帮助模态框
  const showHelpModal = useCallback(() => {
    // 创建帮助模态框
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    // 模态框内容
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto';
    modalContent.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    
    // 标题
    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold mb-4 text-gray-900';
    title.textContent = '键盘快捷键帮助';
    modalContent.appendChild(title);
    
    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'absolute top-4 right-4 text-gray-400 hover:text-gray-600';
    closeButton.innerHTML = '&times;';
    closeButton.style.fontSize = '24px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    modal.appendChild(closeButton);
    
    // 按类别分组显示快捷键
    const categories = ['canvas', 'session', 'general'] as const;
    const categoryNames = {
      canvas: '画布操作',
      session: '会话管理',
      general: '通用操作'
    };
    
    categories.forEach(category => {
      const categoryShortcuts = shortcuts.filter(s => s.category === category);
      if (categoryShortcuts.length > 0) {
        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'text-lg font-semibold mt-6 mb-3 text-gray-700';
        categoryTitle.textContent = categoryNames[category];
        modalContent.appendChild(categoryTitle);
        
        const shortcutList = document.createElement('ul');
        shortcutList.className = 'space-y-2';
        
        categoryShortcuts.forEach(shortcut => {
          const listItem = document.createElement('li');
          listItem.className = 'flex justify-between items-center p-2 hover:bg-gray-50 rounded';
          
          const description = document.createElement('span');
          description.className = 'text-gray-700';
          description.textContent = shortcut.description;
          
          const keys = document.createElement('span');
          keys.className = 'flex space-x-1';
          
          shortcut.keys.forEach(key => {
            const keyElement = document.createElement('span');
            keyElement.className = 'px-2 py-1 bg-gray-100 rounded text-sm font-medium text-gray-800';
            keyElement.textContent = key === 'Ctrl' ? 'Ctrl' : 
                                   key === 'Alt' ? 'Alt' : 
                                   key === 'Shift' ? 'Shift' : 
                                   key === 'Plus' ? '+' : 
                                   key === 'Minus' ? '-' : 
                                   key === 'Equal' ? '=' : 
                                   key === '滚轮' ? '🖱️滚轮' : 
                                   key === 'Space' ? '空格' : key;
            keys.appendChild(keyElement);
          });
          
          listItem.appendChild(description);
          listItem.appendChild(keys);
          shortcutList.appendChild(listItem);
        });
        
        modalContent.appendChild(shortcutList);
      }
    });
    
    // 说明文本
    const note = document.createElement('p');
    note.className = 'mt-6 text-sm text-gray-500';
    note.textContent = '提示：在输入框中时，键盘快捷键将被禁用。';
    modalContent.appendChild(note);
    
    modal.appendChild(modalContent);
    
    // 添加到文档
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
      }
    });
    
    // 按ESC键关闭
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
  }, []);

  // 获取快捷键列表
  const getShortcuts = useCallback(() => {
    return shortcuts;
  }, []);

  return {
    getShortcuts,
    showHelpModal
  };
}
