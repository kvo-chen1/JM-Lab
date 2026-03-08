import React from 'react';
import AgentLayout from './AgentLayout';
import ChatPanel from './components/ChatPanel';
import CanvasPanel from './components/CanvasPanel';

export default function AgentPage() {
  return (
    <AgentLayout>
      {{
        chatPanel: <ChatPanel />,
        canvasPanel: <CanvasPanel />
      }}
    </AgentLayout>
  );
}
