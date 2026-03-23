import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { ImagePasteInput, PastedImage } from '@/components/ImagePasteInput';

interface ChatInputProps {
  onSend: (message: string, images?: PastedImage[]) => void;
  isProcessing: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  isProcessing,
  placeholder = '输入消息，支持粘贴图片...' 
}) => {
  const [input, setInput] = useState('');

  const handleSend = (message: string, images?: PastedImage[]) => {
    onSend(message, images);
    setInput('');
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <ImagePasteInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          placeholder={placeholder}
          disabled={isProcessing}
          isLoading={isProcessing}
          maxLength={2000}
          maxImages={5}
          showVoiceButton={false}
          showPasteHint={true}
        />
      </div>
    </div>
  );
};

export default ChatInput;
