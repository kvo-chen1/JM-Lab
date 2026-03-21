import React, { useRef, useEffect } from 'react';
import { Sparkles, Trash2, Wand2 } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { PresetScenarios } from './components/PresetScenarios';
import { useSkillChat } from './hooks/useSkillChat';

const SkillAgentChatPage: React.FC = () => {
  const { messages, isProcessing, sendMessage, clearMessages } = useSkillChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Side - Canvas Area */}
      <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
        {/* Canvas Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">画布</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">+ 80 W</span>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <p className="text-lg font-medium text-gray-600">开始对话</p>
              <p className="text-sm mt-1">在右侧输入消息，Agent 将自动调用 Skill 完成任务</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Show generated content based on messages */}
              {messages.map((msg, index) => {
                if (msg.role === 'agent' && msg.attachments) {
                  return (
                    <div key={`canvas-${index}`} className="space-y-4">
                      {msg.attachments.map((attachment, attIndex) => (
                        attachment.type === 'image' && attachment.url && (
                          <div 
                            key={attIndex}
                            className="rounded-xl overflow-hidden shadow-lg border border-gray-200"
                          >
                            <img 
                              src={attachment.url} 
                              alt={attachment.title || 'Generated'}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        )
                      ))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Canvas Toolbar */}
        <div className="h-12 border-t border-gray-200 flex items-center justify-center gap-4 bg-gray-50">
          <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="w-[450px] flex flex-col bg-white shadow-xl">
        {/* Chat Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-gray-800 text-sm">Skill Agent</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-gray-500">在线</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearMessages}
            disabled={messages.length === 0}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30"
            title="清空对话"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <PresetScenarios onSelect={handleSendMessage} />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput 
          onSend={handleSendMessage} 
          isProcessing={isProcessing}
          placeholder="输入消息开始对话..."
        />
      </div>
    </div>
  );
};

export default SkillAgentChatPage;
