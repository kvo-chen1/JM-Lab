import React, { useEffect } from 'react';
import AgentLayout from './AgentLayout';
import ChatPanel from './components/ChatPanel';
import CanvasPanel from './components/CanvasPanel';
import { useKeyboardControls } from './hooks/useKeyboardControls';

export default function AgentPage() {
  // 启用键盘控制
  useKeyboardControls();

  return (
    <AgentLayout>
      {{
        chatPanel: <ChatPanel />,
        canvasPanel: <CanvasPanel />
      }}
    </AgentLayout>
  );
}
