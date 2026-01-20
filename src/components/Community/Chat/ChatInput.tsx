import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/pages/Community';

interface ChatInputProps {
  isDark: boolean;
  onSend: (message: Partial<ChatMessage>) => void;
  placeholder?: string;
}

// 表情包类型定义
interface Emoji {
  id: string;
  url: string;
  name: string;
  category: string;
  isFavorite?: boolean;
  uploader?: string;
  isCustom?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isDark,
  onSend,
  placeholder = "发送消息..."
}) => {
  const [text, setText] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  // 更新selectedFiles状态类型，支持断点续传相关属性
  const [selectedFiles, setSelectedFiles] = useState<Array<{
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'failed' | 'paused';
    url?: string;
    chunks?: Array<{
      index: number;
      size: number;
      start: number;
      end: number;
      uploaded: boolean;
    }>;
    totalChunks?: number;
    uploadedChunks?: number;
  }>>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  // 富文本编辑器状态
  const [isRichTextMode, setIsRichTextMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags] = useState<string[]>(['国潮', '非遗', '极简', '赛博朋克', '3D艺术', '插画', 'UI设计']);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  // 表情包状态
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [customEmojis, setCustomEmojis] = useState<Emoji[]>([]);
  const [favoriteEmojis, setFavoriteEmojis] = useState<Emoji[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>('recent');
  const [emojiSearchTerm, setEmojiSearchTerm] = useState<string>('');
  const [showCustomEmojiUpload, setShowCustomEmojiUpload] = useState(false);
  const [customEmojiFile, setCustomEmojiFile] = useState<File | null>(null);
  const [customEmojiName, setCustomEmojiName] = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiInputRef = useRef<HTMLInputElement>(null);

  // 初始化表情包数据
  useEffect(() => {
    // 模拟表情包数据
    const mockEmojis: Emoji[] = [
      { id: '1', url: 'https://via.placeholder.com/64', name: '笑脸', category: 'face' },
      { id: '2', url: 'https://via.placeholder.com/64', name: '哭脸', category: 'face' },
      { id: '3', url: 'https://via.placeholder.com/64', name: '惊讶', category: 'face' },
      { id: '4', url: 'https://via.placeholder.com/64', name: '爱心', category: 'heart' },
      { id: '5', url: 'https://via.placeholder.com/64', name: '点赞', category: 'hand' },
      { id: '6', url: 'https://via.placeholder.com/64', name: '加油', category: 'hand' },
      { id: '7', url: 'https://via.placeholder.com/64', name: '666', category: 'number' },
      { id: '8', url: 'https://via.placeholder.com/64', name: 'OK', category: 'hand' },
    ];
    setEmojis(mockEmojis);
    
    // 从localStorage加载收藏的表情包
    const savedFavorites = localStorage.getItem('favoriteEmojis');
    if (savedFavorites) {
      setFavoriteEmojis(JSON.parse(savedFavorites));
    }
    
    // 从localStorage加载自定义表情包
    const savedCustom = localStorage.getItem('customEmojis');
    if (savedCustom) {
      setCustomEmojis(JSON.parse(savedCustom));
    }
  }, []);

  // 保存收藏的表情包到localStorage
  useEffect(() => {
    localStorage.setItem('favoriteEmojis', JSON.stringify(favoriteEmojis));
  }, [favoriteEmojis]);

  // 保存自定义表情包到localStorage
  useEffect(() => {
    localStorage.setItem('customEmojis', JSON.stringify(customEmojis));
  }, [customEmojis]);

  // 切换表情包收藏状态
  const toggleFavorite = (emoji: Emoji) => {
    setFavoriteEmojis(prev => {
      if (prev.some(e => e.id === emoji.id)) {
        return prev.filter(e => e.id !== emoji.id);
      } else {
        return [...prev, { ...emoji, isFavorite: true }];
      }
    });
  };

  // 搜索表情包
  const filteredEmojis = emojis.filter(emoji => {
    const matchesSearch = emoji.name.toLowerCase().includes(emojiSearchTerm.toLowerCase());
    const matchesCategory = currentCategory === 'recent' ? true : emoji.category === currentCategory;
    return matchesSearch && matchesCategory;
  });

  // 处理表情包选择
  const selectEmoji = (emoji: Emoji) => {
    // 添加到最近使用（简化实现）
    if (currentCategory === 'recent') {
      setEmojis(prev => [emoji, ...prev.filter(e => e.id !== emoji.id)]);
    }
    
    // 发送表情包
    const message: Partial<ChatMessage> = {
      text: emoji.name,
      type: 'emoji',
      images: [{ url: emoji.url, name: emoji.name, size: 0 }]
    };
    onSend(message);
  };

  // 处理自定义表情包上传
  const handleCustomEmojiUpload = () => {
    if (!customEmojiFile || !customEmojiName) return;
    
    // 检查文件大小
    if (customEmojiFile.size > 2 * 1024 * 1024) { // 2MB限制
      alert('表情包大小不能超过2MB');
      return;
    }
    
    // 创建表情包预览
    const reader = new FileReader();
    reader.onload = (event) => {
      const newEmoji: Emoji = {
        id: `custom-${Date.now()}`,
        url: event.target?.result as string,
        name: customEmojiName,
        category: 'custom',
        isCustom: true,
        uploader: 'currentUser'
      };
      
      setCustomEmojis(prev => [...prev, newEmoji]);
      setShowCustomEmojiUpload(false);
      setCustomEmojiFile(null);
      setCustomEmojiName('');
    };
    reader.readAsDataURL(customEmojiFile);
  };

  // 获取表情包分类
  const emojiCategories = ['recent', 'face', 'hand', 'heart', 'number', 'custom'];
  const categoryNames = {
    recent: '最近',
    face: '表情',
    hand: '手势',
    heart: '爱心',
    number: '数字',
    custom: '自定义'
  };

  // 富文本格式化功能
  const formatText = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text;
    
    let newText = '';
    let cursorPos = 0;
    
    switch (format) {
      case 'bold':
        newText = `${text.slice(0, start)}**${selectedText}**${text.slice(end)}`;
        cursorPos = start + 2 + selectedText.length + 2;
        break;
      case 'italic':
        newText = `${text.slice(0, start)}*${selectedText}*${text.slice(end)}`;
        cursorPos = start + 1 + selectedText.length + 1;
        break;
      case 'h1':
        newText = `${text.slice(0, start)}# ${selectedText}${text.slice(end)}`;
        cursorPos = start + 2 + selectedText.length;
        break;
      case 'h2':
        newText = `${text.slice(0, start)}## ${selectedText}${text.slice(end)}`;
        cursorPos = start + 3 + selectedText.length;
        break;
      case 'h3':
        newText = `${text.slice(0, start)}### ${selectedText}${text.slice(end)}`;
        cursorPos = start + 4 + selectedText.length;
        break;
      case 'link':
        newText = `${text.slice(0, start)}[${selectedText || '链接文本'}](https://example.com)${text.slice(end)}`;
        cursorPos = start + 2 + (selectedText || '链接文本').length + 1;
        break;
      case 'ul':
        newText = `${text.slice(0, start)}- ${selectedText}${text.slice(end)}`;
        cursorPos = start + 2 + selectedText.length;
        break;
      case 'ol':
        newText = `${text.slice(0, start)}1. ${selectedText}${text.slice(end)}`;
        cursorPos = start + 3 + selectedText.length;
        break;
      case 'code':
        newText = `${text.slice(0, start)}\`${selectedText}\`${text.slice(end)}`;
        cursorPos = start + 1 + selectedText.length + 1;
        break;
      default:
        return;
    }
    
    setText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  // 切换标签
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // 移除标签
  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: File[] = [];
    const previews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 检查文件类型和大小
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB限制
        alert('图片大小不能超过10MB');
        continue;
      }
      // 检查文件格式
      const allowedFormats = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedFormats.includes(file.type)) {
        alert('只支持JPG、PNG、GIF格式');
        continue;
      }
      newImages.push(file);
      // 创建预览
      const reader = new FileReader();
      reader.onload = (event) => {
        previews.push(event.target?.result as string);
        if (previews.length === newImages.length) {
          setImagePreviews(previews);
          setShowImagePreview(true);
        }
      };
      reader.readAsDataURL(file);
    }
    setSelectedImages(newImages);
  };

  // 断点续传配置
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: Array<{
      file: File;
      progress: number;
      status: 'uploading' | 'success' | 'failed' | 'paused';
      url?: string;
      chunks?: {
        index: number;
        size: number;
        start: number;
        end: number;
        uploaded: boolean;
      }[];
      totalChunks?: number;
      uploadedChunks?: number;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 检查文件大小
      if (file.size > 50 * 1024 * 1024) { // 50MB限制
        alert('文件大小不能超过50MB');
        continue;
      }
      // 检查文件格式
      const allowedFormats = ['application/pdf', 'video/mp4', 'video/x-msvideo'];
      const allowedExtensions = ['.pdf', '.mp4', '.avi'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedFormats.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
        alert('只支持PDF、MP4、AVI格式');
        continue;
      }
      
      // 计算文件分块
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const chunks = [];
      for (let j = 0; j < totalChunks; j++) {
        const start = j * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        chunks.push({
          index: j,
          size: end - start,
          start,
          end,
          uploaded: false
        });
      }
      
      newFiles.push({
        file,
        progress: 0,
        status: 'uploading',
        chunks,
        totalChunks,
        uploadedChunks: 0
      });
    }
    setSelectedFiles(newFiles);
    setShowFileUpload(newFiles.length > 0);
    // 开始分块上传
    newFiles.forEach((fileObj, index) => {
      uploadFileChunks(index);
    });
  };

  // 分块上传函数
  const uploadFileChunks = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      const fileObj = newFiles[index];
      if (!fileObj.chunks || !fileObj.totalChunks) return newFiles;
      
      // 查找未上传的块
      const nextChunk = fileObj.chunks.find(chunk => !chunk.uploaded);
      if (!nextChunk) {
        // 所有块上传完成
        newFiles[index].status = 'success';
        newFiles[index].progress = 100;
        // 模拟生成文件URL
        newFiles[index].url = URL.createObjectURL(newFiles[index].file);
        return newFiles;
      }
      
      // 模拟上传单个块
      setTimeout(() => {
        setSelectedFiles(prev => {
          const newFiles = [...prev];
          const fileObj = newFiles[index];
          if (!fileObj.chunks || !fileObj.totalChunks) return newFiles;
          
          // 更新块状态
          fileObj.chunks[nextChunk.index].uploaded = true;
          fileObj.uploadedChunks = (fileObj.uploadedChunks || 0) + 1;
          fileObj.progress = Math.round((fileObj.uploadedChunks / fileObj.totalChunks) * 100);
          
          // 检查是否所有块都已上传
          const allUploaded = fileObj.chunks.every(chunk => chunk.uploaded);
          if (allUploaded) {
            fileObj.status = 'success';
            fileObj.progress = 100;
            // 模拟生成文件URL
            fileObj.url = URL.createObjectURL(fileObj.file);
          } else {
            // 继续上传下一个块
            uploadFileChunks(index);
          }
          
          return newFiles;
        });
      }, 500);
      
      return newFiles;
    });
  };

  // 暂停文件上传
  const pauseFileUpload = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles[index].status = 'paused';
      return newFiles;
    });
  };

  // 恢复文件上传
  const resumeFileUpload = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles[index].status = 'uploading';
      return newFiles;
    });
    // 继续上传
    uploadFileChunks(index);
  };

  // 重试文件上传
  const retryFileUpload = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      const fileObj = newFiles[index];
      if (!fileObj.chunks) return newFiles;
      
      // 重置所有块的上传状态
      fileObj.chunks.forEach(chunk => {
        chunk.uploaded = false;
      });
      fileObj.uploadedChunks = 0;
      fileObj.progress = 0;
      fileObj.status = 'uploading';
      
      return newFiles;
    });
    // 重新开始上传
    uploadFileChunks(index);
  };

  // 处理发送消息
  const handleSend = () => {
    if (!text.trim() && selectedImages.length === 0 && selectedFiles.length === 0) return;

    const message: Partial<ChatMessage> = {
      text,
      type: selectedImages.length > 0 ? 'image' : selectedFiles.length > 0 ? 'file' : isRichTextMode ? 'rich_text' : 'text',
      richContent: isRichTextMode ? text : undefined,
    };

    // 添加图片内容
    if (selectedImages.length > 0) {
      message.images = selectedImages.map((file, index) => ({
        url: imagePreviews[index],
        name: file.name,
        size: file.size
      }));
    }

    // 添加文件内容
    if (selectedFiles.length > 0) {
      message.files = selectedFiles.map(fileObj => ({
        url: fileObj.url || '',
        name: fileObj.file.name,
        size: fileObj.file.size,
        type: fileObj.file.type,
        status: fileObj.status,
        progress: fileObj.progress
      }));
    }

    // 添加标签和话题
    if (selectedTags.length > 0) {
      message.text += `\n\n#${selectedTags.join(' #')}`;
    }
    if (currentTopic) {
      message.text += `\n\n话题：${currentTopic}`;
    }

    onSend(message);
    setText('');
    setSelectedImages([]);
    setImagePreviews([]);
    setShowImagePreview(false);
    setSelectedFiles([]);
    setShowFileUpload(false);
    setSelectedTags([]);
    setCurrentTopic('');
    setIsRichTextMode(false);
    setShowPreview(false);
  };

  // 移除选中的图片
  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
    if (newImages.length === 0) {
      setShowImagePreview(false);
    }
  };

  // 移除选中的文件
  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setShowFileUpload(false);
    }
  };

  // 渲染文件上传进度
  const renderFileUploads = () => {
    if (!showFileUpload || selectedFiles.length === 0) return null;
    
    return (
      <div className="mb-2 space-y-2">
        {selectedFiles.map((fileObj, index) => (
          <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-blue-100'}`}>
                  <i className={`fas ${fileObj.file.type.startsWith('application/pdf') ? 'fa-file-pdf' : 'fa-file-video'} text-xl ${isDark ? 'text-gray-300' : fileObj.file.type.startsWith('application/pdf') ? 'text-red-600' : 'text-blue-600'}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{fileObj.file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {fileObj.status === 'uploading' && (
                  <button 
                    onClick={() => pauseFileUpload(index)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-yellow-500 hover:bg-gray-500/10"
                    title="暂停上传"
                  >
                    <i className="fas fa-pause"></i>
                  </button>
                )}
                {fileObj.status === 'paused' && (
                  <button 
                    onClick={() => resumeFileUpload(index)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-gray-500/10"
                    title="恢复上传"
                  >
                    <i className="fas fa-play"></i>
                  </button>
                )}
                {fileObj.status === 'failed' && (
                  <button 
                    onClick={() => retryFileUpload(index)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-gray-500/10"
                    title="重试上传"
                  >
                    <i className="fas fa-redo"></i>
                  </button>
                )}
                <button 
                  onClick={() => removeFile(index)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-500/10"
                  title="移除文件"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            {fileObj.status === 'uploading' && (
              <div className="mt-2">
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${fileObj.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>上传中... {fileObj.uploadedChunks}/{fileObj.totalChunks} 块</span>
                  <span>{fileObj.progress}%</span>
                </div>
              </div>
            )}
            {fileObj.status === 'paused' && (
              <div className="mt-2">
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${fileObj.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>已暂停 {fileObj.uploadedChunks}/{fileObj.totalChunks} 块</span>
                  <span>{fileObj.progress}%</span>
                </div>
              </div>
            )}
            {fileObj.status === 'failed' && (
              <div className="mt-2">
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${fileObj.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-red-500 mt-1">
                  <span>上传失败 {fileObj.uploadedChunks}/{fileObj.totalChunks} 块</span>
                  <span>{fileObj.progress}%</span>
                </div>
              </div>
            )}
            {fileObj.status === 'success' && (
              <div className="mt-2">
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-green-500 mt-1">
                  <span>上传成功 {fileObj.uploadedChunks}/{fileObj.totalChunks} 块</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // 渲染富文本工具栏
  const renderRichTextToolbar = () => {
    if (!isRichTextMode) return null;
    
    return (
      <div className={`flex flex-wrap gap-1 p-2 rounded-t-lg ${isDark ? 'bg-gray-600 border-b border-gray-500' : 'bg-gray-200 border-b border-gray-300'}`}>
        <button 
          onClick={() => formatText('bold')}
          className={`w-8 h-8 rounded flex items-center justify-center text-sm ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          title="粗体"
        >
          <strong>B</strong>
        </button>
        <button 
          onClick={() => formatText('italic')}
          className={`w-8 h-8 rounded flex items-center justify-center text-sm ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          title="斜体"
        >
          <em>I</em>
        </button>
        <button 
          onClick={() => formatText('h1')}
          className={`w-8 h-8 rounded flex items-center justify-center text-xs ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          title="标题1"
        >
          H1
        </button>
        <button 
          onClick={() => formatText('h2')}
          className={`w-8 h-8 rounded flex items-center justify-center text-xs ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          title="标题2"
        >
          H2
        </button>
        <button 
          onClick={() => formatText('h3')}
          className={`w-8 h-8 rounded flex items-center justify-center text-xs ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          title="标题3"
        >
          H3
        </button>
        <button 
          onClick={() => formatText('link')}
          className={`w-8 h-8 rounded flex items-center justify-center text-sm ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          title="链接"
        >
          <i className="fas fa-link"></i>
        </button>
        <button 
          onClick={() => formatText('ul')}
          className={`w-8 h-8 rounded flex items-center justify-center text-sm ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          title="无序列表"
        >
          <i className="fas fa-list-ul"></i>
        </button>
        <button 
          onClick={() => formatText('ol')}
          className={`w-8 h-8 rounded flex items-center justify-center text-sm ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          title="有序列表"
        >
          <i className="fas fa-list-ol"></i>
        </button>
        <button 
          onClick={() => formatText('code')}
          className={`w-8 h-8 rounded flex items-center justify-center text-sm ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          title="代码"
        >
          <code>`</code>
        </button>
        <div className="ml-auto flex gap-1">
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1 rounded text-sm ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          >
            {showPreview ? '编辑' : '预览'}
          </button>
          <button 
            onClick={() => setIsRichTextMode(false)}
            className={`px-3 py-1 rounded text-sm ${isDark ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
          >
            退出富文本
          </button>
        </div>
      </div>
    );
  };

  // 渲染标签选择
  const renderTagSelection = () => {
    if (!isRichTextMode) return null;
    
    return (
      <div className={`p-2 rounded-b-lg ${isDark ? 'bg-gray-600 border-b border-gray-500' : 'bg-gray-200 border-b border-gray-300'}`}>
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedTags.map(tag => (
            <div key={tag} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
              <span>{tag}</span>
              <button 
                onClick={() => removeTag(tag)}
                className="text-xs hover:text-red-500"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {availableTags.map(tag => (
            <button 
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${isDark ? 
                selectedTags.includes(tag) ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 
                selectedTags.includes(tag) ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <input 
            type="text"
            value={currentTopic}
            onChange={e => setCurrentTopic(e.target.value)}
            placeholder="添加话题..."
            className={`w-full px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 border border-gray-500 text-white placeholder-gray-400' : 'bg-white border border-gray-300 text-gray-700 placeholder-gray-400'}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`px-4 pb-6 pt-2 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
      {/* Image Preview */}
      {showImagePreview && imagePreviews.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img 
                src={preview} 
                alt={`Preview ${index + 1}`} 
                className="w-24 h-24 object-cover rounded-lg"
              />
              <button 
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Upload Progress */}
      {renderFileUploads()}

      {/* Rich Text Editor */}
      {isRichTextMode ? (
        <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
          {renderRichTextToolbar()}
          {renderTagSelection()}
          
          <div className={`p-2 ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
            {showPreview ? (
              <div className={`p-3 rounded-lg max-h-[200px] overflow-y-auto ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder={placeholder}
                className={`w-full min-h-[100px] max-h-[200px] bg-transparent border-none focus:ring-0 focus:outline-none px-2 py-1 resize-y ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                rows={isRichTextMode ? 6 : 1}
              />
            )}
          </div>
        </div>
      ) : (
        /* Rich Text Mode Toggle - Only show in non-rich text mode */
        <div className={`flex items-center justify-between mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsRichTextMode(!isRichTextMode)}
              className={`px-3 py-1 rounded-full text-sm ${isDark ? 
                isRichTextMode ? 'bg-blue-900/50 text-blue-300' : 'hover:bg-gray-600 text-gray-300' : 
                isRichTextMode ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-700'}`}
            >
              {isRichTextMode ? '富文本模式' : '使用富文本'}
            </button>
          </div>
        </div>
      )}

      {/* 表情包面板 */}
      {showEmojiPanel && (
        <div className={`mb-2 rounded-lg overflow-hidden ${isDark ? 'bg-gray-600 border border-gray-500' : 'bg-white border border-gray-300'}`}>
          {/* 表情包工具栏 */}
          <div className={`p-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={emojiSearchTerm} 
                onChange={e => setEmojiSearchTerm(e.target.value)}
                placeholder="搜索表情包..."
                className={`flex-1 px-3 py-1 rounded-full text-sm ${isDark ? 'bg-gray-600 text-white placeholder-gray-400' : 'bg-white text-gray-700 placeholder-gray-500'}`}
              />
              <button 
                onClick={() => setShowEmojiPanel(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* 表情包分类 */}
            <div className="flex flex-wrap gap-1 mt-2">
              {emojiCategories.map(category => (
                <button 
                  key={category}
                  onClick={() => setCurrentCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${isDark ? 
                    currentCategory === category ? 'bg-blue-900/50 text-blue-300' : 'hover:bg-gray-600 text-gray-300' : 
                    currentCategory === category ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-300 text-gray-700'}`}
                >
                  {categoryNames[category as keyof typeof categoryNames]}
                </button>
              ))}
              <button 
                onClick={() => setShowCustomEmojiUpload(!showCustomEmojiUpload)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${isDark ? 
                  showCustomEmojiUpload ? 'bg-blue-900/50 text-blue-300' : 'hover:bg-gray-600 text-gray-300' : 
                  showCustomEmojiUpload ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-300 text-gray-700'}`}
              >
                {showCustomEmojiUpload ? '取消上传' : '上传自定义'}
              </button>
            </div>
          </div>
          
          {/* 自定义表情包上传 */}
          {showCustomEmojiUpload && (
            <div className={`p-3 ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
              <div className="space-y-2">
                <div>
                  <input 
                    type="text" 
                    value={customEmojiName} 
                    onChange={e => setCustomEmojiName(e.target.value)}
                    placeholder="表情包名称..."
                    className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-white border border-gray-500' : 'bg-white text-gray-700 border border-gray-300'}`}
                  />
                </div>
                <div>
                  <input 
                    type="file" 
                    ref={emojiInputRef}
                    accept="image/jpeg,image/png,image/gif" 
                    onChange={(e) => setCustomEmojiFile(e.target.files?.[0] || null)}
                    className={`w-full ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  />
                </div>
                <button 
                  onClick={handleCustomEmojiUpload}
                  className={`w-full py-2 rounded-lg ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                >
                  上传表情包
                </button>
              </div>
            </div>
          )}
          
          {/* 表情包列表 */}
          {!showCustomEmojiUpload && (
            <div className="p-2 max-h-[200px] overflow-y-auto">
              {/* 响应式网格布局 */}
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-8 lg:grid-cols-8 gap-2">
                {(currentCategory === 'custom' ? customEmojis : filteredEmojis).map(emoji => (
                  <div 
                    key={emoji.id} 
                    className={`relative p-2 rounded-lg cursor-pointer hover:bg-gray-500/10 ${isDark ? 'hover:bg-gray-500/20' : 'hover:bg-gray-200'}`}
                    onClick={() => selectEmoji(emoji)}
                  >
                    <img 
                      src={emoji.url} 
                      alt={emoji.name} 
                      className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded"
                    />
                    <div className="absolute top-1 right-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(emoji);
                        }}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs ${isDark ? 
                          emoji.isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400' : 
                          emoji.isFavorite ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
                      >
                        <i className="fas fa-heart"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 收藏的表情包 */}
          {favoriteEmojis.length > 0 && currentCategory !== 'custom' && !showCustomEmojiUpload && (
            <div className={`p-2 border-t ${isDark ? 'border-gray-500 bg-gray-700/50' : 'border-gray-300 bg-gray-100/50'}`}>
              <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>收藏的表情包</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {favoriteEmojis.map(emoji => (
                  <div 
                    key={emoji.id} 
                    className={`relative p-2 rounded-lg cursor-pointer hover:bg-gray-500/10 ${isDark ? 'hover:bg-gray-500/20' : 'hover:bg-gray-200'}`}
                    onClick={() => selectEmoji(emoji)}
                  >
                    <img 
                      src={emoji.url} 
                      alt={emoji.name} 
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="absolute top-1 right-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(emoji);
                        }}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-yellow-400"
                      >
                        <i className="fas fa-heart"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      {!isRichTextMode && (
        <div className={`flex items-center gap-2 p-2 rounded-xl ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
          {/* Upload Buttons */}
          <div className="flex gap-2">
            <button 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-500' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
              onClick={() => imageInputRef.current?.click()}
              title="上传图片"
            >
              <i className="fas fa-image text-sm"></i>
            </button>
            <input 
              type="file" 
              ref={imageInputRef} 
              multiple 
              accept="image/jpeg,image/png,image/gif" 
              className="hidden"
              onChange={handleImageSelect}
            />
            <button 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-500' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
              onClick={() => fileInputRef.current?.click()}
              title="上传文件"
            >
              <i className="fas fa-file text-sm"></i>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              accept=".pdf,.mp4,.avi,application/pdf,video/mp4,video/x-msvideo" 
              className="hidden"
              onChange={handleFileSelect}
            />
            <button 
              onClick={() => setIsRichTextMode(true)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-500' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
              title="富文本"
            >
              <i className="fas fa-sticky-note text-sm"></i>
            </button>
            <button 
              onClick={() => setShowEmojiPanel(!showEmojiPanel)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark ? 
                showEmojiPanel ? 'bg-blue-900/50 text-blue-300' : 'text-gray-300 hover:text-white hover:bg-gray-500' : 
                showEmojiPanel ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
              title="表情包"
            >
              <i className="fas fa-smile text-sm"></i>
            </button>
          </div>

          <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                  }
              }}
              placeholder={placeholder}
              className={`flex-1 bg-transparent border-none focus:ring-0 focus:outline-none px-3 py-2 ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
            style={{ fontSize: '0.9rem' }}
          />
        </div>
      )}

      {/* Send Button */}
      <button 
        onClick={handleSend}
        disabled={selectedFiles.some(f => f.status === 'uploading') || (!text.trim() && selectedImages.length === 0 && selectedFiles.length === 0)}
        className={`mt-2 px-4 py-1.5 rounded-full font-medium transition-colors w-full ${isDark ? 
          (selectedFiles.some(f => f.status === 'uploading') || (!text.trim() && selectedImages.length === 0 && selectedFiles.length === 0)) ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white' : 
          (selectedFiles.some(f => f.status === 'uploading') || (!text.trim() && selectedImages.length === 0 && selectedFiles.length === 0)) ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
      >
        发送
      </button>
    </div>
  );
};
