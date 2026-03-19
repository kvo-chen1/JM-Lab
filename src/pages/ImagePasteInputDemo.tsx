// src/pages/ImagePasteInputDemo.tsx
// ImagePasteInput 组件演示页面

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePasteInput, PastedImage } from '@/components/ImagePasteInput';
import { Toaster, toast } from 'sonner';
import { Image, Send, Trash2, Copy } from 'lucide-react';

export default function ImagePasteInputDemo() {
  const [messages, setMessages] = useState<Array<{
    id: string;
    text: string;
    images: PastedImage[];
    timestamp: Date;
  }>>([]);

  const handleSend = (text: string, images: PastedImage[]) => {
    const newMessage = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      images,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    toast.success(`发送成功！包含 ${text ? '文字' : ''} ${images.length > 0 ? images.length + ' 张图片' : ''}`);
  };

  const clearMessages = () => {
    setMessages([]);
    toast.info('消息已清空');
  };

  return (
    <div className="min-h-screen bg-[#1a0f1a] text-[#fff0f5] p-4 md:p-8">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#2a1a2a',
            border: '2px solid #000',
            color: '#fff0f5',
            boxShadow: '4px 4px 0px 0px #000000',
          },
        }}
      />

      <div className="max-w-3xl mx-auto">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#ff1493] uppercase tracking-wider"
              style={{ textShadow: '3px 3px 0px #000000' }}>
            图片粘贴输入框
          </h1>
          <p className="text-[#b090a8] font-mono">
            支持 Ctrl+V 直接粘贴图片的高级输入组件
          </p>
        </motion.div>

        {/* 功能说明卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 bg-[#2a1a2a] border-2 border-black shadow-[4px_4px_0px_0px_#000000]"
        >
          <h2 className="text-xl font-bold mb-4 text-[#ff1493] flex items-center gap-2">
            <Image className="w-5 h-5" />
            功能特性
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#ff1493] flex items-center justify-center text-white font-bold text-xs shadow-[2px_2px_0px_0px_#000000]">
                1
              </div>
              <div>
                <div className="font-medium text-[#fff0f5]">剪贴板粘贴</div>
                <div className="text-[#806070]">支持 Ctrl+V / Cmd+V 直接粘贴图片</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#ff1493] flex items-center justify-center text-white font-bold text-xs shadow-[2px_2px_0px_0px_#000000]">
                2
              </div>
              <div>
                <div className="font-medium text-[#fff0f5]">多图片支持</div>
                <div className="text-[#806070]">最多支持 5 张图片同时粘贴</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#ff1493] flex items-center justify-center text-white font-bold text-xs shadow-[2px_2px_0px_0px_#000000]">
                3
              </div>
              <div>
                <div className="font-medium text-[#fff0f5]">缩略图预览</div>
                <div className="text-[#806070]">粘贴后显示图片缩略图，支持删除</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#ff1493] flex items-center justify-center text-white font-bold text-xs shadow-[2px_2px_0px_0px_#000000]">
                4
              </div>
              <div>
                <div className="font-medium text-[#fff0f5]">Pink Brutalist 风格</div>
                <div className="text-[#806070]">粗犷主义像素风设计</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 使用说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 p-4 bg-[#2a1a2a]/50 border border-dashed border-[#4a304a]"
        >
          <h3 className="text-sm font-bold mb-2 text-[#ff1493] flex items-center gap-2">
            <Copy className="w-4 h-4" />
            使用说明
          </h3>
          <ul className="text-xs text-[#b090a8] space-y-1 font-mono">
            <li>1. 复制任意图片（截图、浏览器图片、文件等）</li>
            <li>2. 点击下方的输入框，按 Ctrl+V 粘贴</li>
            <li>3. 图片将以缩略图形式显示在输入框上方</li>
            <li>4. 可以输入文字后一起发送，或只发送图片</li>
            <li>5. 悬停图片可查看大小，点击右上角删除</li>
          </ul>
        </motion.div>

        {/* 输入框组件 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <ImagePasteInput
            placeholder="输入消息，或按 Ctrl+V 粘贴图片..."
            onSend={handleSend}
            maxImages={5}
            maxLength={1000}
            showVoiceButton={true}
            showPasteHint={true}
          />
        </motion.div>

        {/* 消息历史 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#fff0f5] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#ff1493]" />
              发送历史
              <span className="text-sm text-[#806070] font-mono">
                ({messages.length})
              </span>
            </h3>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#ff0055] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000000] hover:shadow-[3px_3px_0px_0px_#000000] transition-shadow"
              >
                <Trash2 className="w-3 h-3" />
                清空
              </button>
            )}
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12 text-[#806070] font-mono text-sm border-2 border-dashed border-[#2a1a2a]">
              暂无消息，试着发送一些内容吧...
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-[#2a1a2a] border-2 border-black shadow-[3px_3px_0px_0px_#000000]"
                >
                  {/* 消息内容 */}
                  {message.text && (
                    <p className="text-[#fff0f5] mb-3 text-sm leading-relaxed">
                      {message.text}
                    </p>
                  )}

                  {/* 图片展示 */}
                  {message.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {message.images.map((img) => (
                        <div
                          key={img.id}
                          className="relative w-20 h-20 border-2 border-black shadow-[2px_2px_0px_0px_#000000] overflow-hidden bg-[#1a0f1a]"
                        >
                          <img
                            src={img.preview}
                            alt={img.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 时间戳 */}
                  <div className="mt-3 text-xs text-[#806070] font-mono">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 底部信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-xs text-[#806070] font-mono"
        >
          <p>ImagePasteInput Component Demo</p>
          <p className="mt-1">Pink Brutalist Theme</p>
        </motion.div>
      </div>
    </div>
  );
}
