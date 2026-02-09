import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare,
  Link, Image, Table, Code, Quote,
  Type, Heading1, Heading2, Heading3,
  MoreHorizontal, ChevronDown, History, Share2, Download,
  Sparkles, Wand2, Languages, FileText, LayoutTemplate,
  Save, RotateCcw
} from 'lucide-react';
import { llmService } from '@/services/llmService';
import { useAIWriterHistory } from './hooks/useAIWriterHistory';

interface AIWriterEditorProps {
  templateId?: string;
  templateName?: string;
}

// 菜单项
const menuItems = [
  { label: 'File', items: ['新建文档', '打开', '保存', '导出'] },
  { label: 'Edit', items: ['撤销', '重做', '剪切', '复制', '粘贴'] },
  { label: 'View', items: ['编辑模式', '预览模式', '分屏模式'] },
  { label: 'Insert', items: ['图片', '表格', '链接', '代码块', '分隔线'] },
  { label: 'Format', items: ['加粗', '斜体', '下划线', '删除线'] },
  { label: 'Tools', items: ['拼写检查', '字数统计', 'AI润色'] },
  { label: 'Table', items: ['插入表格', '删除表格', '合并单元格'] },
  { label: 'Help', items: ['快捷键', '使用指南', '反馈'] },
];

// AI建议
const aiSuggestions = [
  { id: 'market', label: '深化市场分析', icon: '📊', prompt: '请深化市场分析部分，增加市场规模、增长趋势、目标客户画像等详细内容。' },
  { id: 'finance', label: '完善财务预测', icon: '💰', prompt: '请完善财务预测部分，增加收入模型、成本结构、盈利预测等详细数据。' },
  { id: 'competition', label: '强化竞争分析', icon: '🎯', prompt: '请强化竞争分析部分，增加竞争对手对比、差异化优势、市场定位等内容。' },
  { id: 'team', label: '补充团队介绍', icon: '👥', prompt: '请补充核心团队介绍，包括创始人背景、团队成员、顾问团队等信息。' },
  { id: 'risk', label: '增加风险分析', icon: '⚠️', prompt: '请增加风险分析部分，包括市场风险、运营风险、财务风险及应对措施。' },
  { id: 'plan', label: '细化执行计划', icon: '📅', prompt: '请细化执行计划，增加里程碑、时间节点、关键指标等内容。' },
];

// 快捷操作
const quickActions = [
  { id: 'polish', label: '润色文字', icon: '✨', prompt: '请对全文进行润色，提升文字的专业性和可读性。' },
  { id: 'expand', label: '扩充内容', icon: '📝', prompt: '请扩充内容，增加更多细节和深度，使文档更加充实。' },
  { id: 'summarize', label: '精简摘要', icon: '📋', prompt: '请精简内容，保留核心要点，使文档更加简洁明了。' },
  { id: 'grammar', label: '纠正语法', icon: '✓', prompt: '请检查并纠正语法错误、错别字和标点符号问题。' },
  { id: 'translate', label: '翻译为英文', icon: '🌐', prompt: '请将全文翻译为英文，保持专业术语的准确性。' },
  { id: 'title', label: '优化标题', icon: '🏷️', prompt: '请优化标题和小标题，使其更加吸引人且符合SEO规范。' },
  { id: 'cta', label: '增强CTA', icon: '📢', prompt: '请增强行动号召（CTA）部分，使其更具说服力和紧迫感。' },
  { id: 'tone', label: '调整语气', icon: '🎭', prompt: '请调整语气，使其更加专业、自信且具有说服力。' },
  { id: 'data', label: '添加数据', icon: '📈', prompt: '请在适当位置添加相关数据、统计数字和案例支撑。' },
  { id: 'structure', label: '改进结构', icon: '🏗️', prompt: '请改进文档结构，使逻辑更加清晰，段落过渡更加自然。' },
];

// 标签
const documentTags = ['营销推广', '商业计划', '社交媒体', '新闻媒体', '销售话术', '产品文档'];

// 聊天消息类型
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIWriterEditor() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好！我是您的AI写作助手。我已经为您生成了初始草稿，您可以：\n\n1. 点击右侧的「智能建议」来完善特定章节\n2. 使用「快捷操作」快速优化文档\n3. 直接在下方输入框告诉我您的修改需求\n\n请问您想要如何优化这份文档呢？',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('通义千问');
  const [status, setStatus] = useState('草稿');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 从location state获取模板信息
  useEffect(() => {
    const state = location.state as { 
      templateId?: string; 
      templateName?: string; 
      formData?: Record<string, string>;
      historyItemId?: string;
      content?: string;
    };
    
    // 如果是从历史记录进入，直接加载保存的内容，不重新生成
    if (state?.historyItemId && state?.content) {
      setContent(state.content);
      if (state.formData?.projectName) {
        setTitle(state.formData.projectName);
      }
      // 添加一条AI消息提示用户这是历史记录
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `已加载历史记录。您可以继续编辑或提出修改需求。`,
          timestamp: new Date()
        }
      ]);
      return;
    }
    
    // 如果是从模板新建，则生成新内容
    if (state?.templateName) {
      // 更新第一条AI消息
      setChatMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[0].role === 'assistant') {
          newMessages[0] = {
            ...newMessages[0],
            content: `您好！我是您的AI写作助手。基于"${state.templateName}"模板为您生成初始草稿。\n\n您可以：\n1. 点击下方的「智能建议」来完善特定章节\n2. 使用「快捷操作」快速优化文档\n3. 直接在下方输入框告诉我您的修改需求\n\n请问您想要如何优化这份文档呢？`
          };
        }
        return newMessages;
      });
    }
    
    // 只有从模板新建且有formData时才生成新内容
    if (state?.formData && !state?.historyItemId) {
      // 根据项目名称设置标题
      if (state.formData.projectName) {
        setTitle(state.formData.projectName);
      }
      generateInitialContent(state.formData, state?.templateName);
    }
  }, [location.state]);

  const { addHistoryItem } = useAIWriterHistory();

  // 生成初始内容 - 调用真实AI服务（流式生成）
  const generateInitialContent = async (formData: Record<string, string>, templateName?: string) => {
    setIsGenerating(true);
    setContent(''); // 清空内容
    
    try {
      // 构建提示词
      const prompt = buildPrompt(formData, templateName);
      
      let accumulatedContent = '';
      
      // 调用AI服务 - 使用流式生成
      await llmService.directGenerateResponse(prompt, {
        context: {
          systemPrompt: '你是一位专业的商业文案撰写专家。请根据用户提供的信息，生成一份专业的商业计划书/文案。使用HTML格式输出，包含适当的标题（h1, h2, h3）、段落（p）、加粗（strong）等标签。直接返回HTML内容，不要包含markdown代码块标记。'
        },
        onDelta: (chunk: string) => {
          // 实时更新内容，展现生成过程
          accumulatedContent += chunk;
          
          // 清理markdown代码块标记
          let displayContent = accumulatedContent;
          displayContent = displayContent.replace(/^```html\s*/i, '');
          displayContent = displayContent.replace(/```\s*$/i, '');
          
          setContent(displayContent);
          
          // 更新字数统计
          const textContent = displayContent.replace(/<[^>]*>/g, '');
          setWordCount(textContent.length);
          setCharCount(displayContent.length);
          setReadTime(Math.ceil(textContent.length / 300));
        }
      });

      // 最终清理
      let finalContent = accumulatedContent;
      finalContent = finalContent.replace(/^```html\s*/i, '');
      finalContent = finalContent.replace(/```\s*$/i, '');
      finalContent = finalContent.trim();
      
      // 如果返回的不是HTML格式，尝试包装成HTML
      if (!finalContent.includes('<')) {
        finalContent = convertTextToHtml(finalContent);
        setContent(finalContent);
      }
      
      // 保存到历史记录
      addHistoryItem({
        title: formData.projectName || '未命名文档',
        templateName: templateName || '商业计划书',
        templateId: location.state?.templateId || 'default',
        content: finalContent,
        formData: formData,
        status: 'draft',
        wordCount: finalContent.replace(/<[^>]*>/g, '').length,
      });
      
      toast.success('文案生成完成！');
    } catch (error) {
      console.error('AI生成失败:', error);
      toast.error('生成失败，请重试');
      
      // 使用备用内容
      const fallbackContent = generateFallbackContent(formData);
      setContent(fallbackContent);
    } finally {
      setIsGenerating(false);
    }
  };

  // 构建提示词
  const buildPrompt = (formData: Record<string, string>, templateName?: string): string => {
    const fields = Object.entries(formData)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');
    
    return `请根据以下信息生成一份${templateName || '商业计划书'}：

${fields}

要求：
1. 使用专业的商业文案风格
2. 包含执行摘要、公司概述、市场分析等章节
3. 使用HTML格式，包含h1、h2、h3标题和p段落
4. 关键数据使用strong标签加粗
5. 内容要具体、有数据支撑、逻辑清晰`;
  };

  // 将纯文本转换为HTML
  const convertTextToHtml = (text: string): string => {
    return text
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.startsWith('# ')) {
          return `<h1>${paragraph.slice(2)}</h1>`;
        } else if (paragraph.startsWith('## ')) {
          return `<h2>${paragraph.slice(3)}</h2>`;
        } else if (paragraph.startsWith('### ')) {
          return `<h3>${paragraph.slice(4)}</h3>`;
        } else {
          return `<p>${paragraph}</p>`;
        }
      })
      .join('\n');
  };

  // 生成备用内容（当AI服务失败时）
  const generateFallbackContent = (formData: Record<string, string>): string => {
    return `<h1>执行摘要</h1>
<p><strong>${formData.projectName || '本项目'}</strong>致力于通过${formData.coreBusiness || '创新解决方案'}，为${formData.targetMarket || '目标市场'}提供优质服务。</p>
<p>项目核心优势：${formData.competitiveAdvantage || '独特的技术和服务模式'}。</p>

<h1>公司/项目概述</h1>
<h2>背景与定位</h2>
<p>基于市场需求和行业发展趋势，${formData.projectName || '本项目'}应运而生，旨在解决行业痛点，创造独特价值。</p>`;
  };

  // 执行编辑命令
  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  // 处理AI建议点击 - 使用流式生成
  const handleSuggestionClick = async (suggestion: typeof aiSuggestions[0]) => {
    if (!content.trim()) {
      toast.error('请先输入或生成内容');
      return;
    }
    setIsGenerating(true);
    toast.info(`正在${suggestion.label}...`);
    
    try {
      let accumulatedContent = '';
      
      await llmService.directGenerateResponse(
        `当前文档内容：\n${content}\n\n修改要求：${suggestion.prompt}\n\n请直接返回修改后的HTML内容。`,
        {
          context: {
            systemPrompt: '你是一位专业的文案编辑助手。请根据用户的要求对文档进行优化修改。保持HTML格式输出。'
          },
          onDelta: (chunk: string) => {
            accumulatedContent += chunk;
            let displayContent = accumulatedContent;
            displayContent = displayContent.replace(/^```html\s*/i, '');
            displayContent = displayContent.replace(/```\s*$/i, '');
            setContent(displayContent);
          }
        }
      );
      
      toast.success(`${suggestion.label}完成！`);
    } catch (error) {
      console.error('AI修改失败:', error);
      toast.error('修改失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理快捷操作点击 - 使用流式生成
  const handleQuickActionClick = async (action: typeof quickActions[0]) => {
    if (!content.trim()) {
      toast.error('请先输入或生成内容');
      return;
    }
    setIsGenerating(true);
    toast.info(`正在${action.label}...`);
    
    try {
      let accumulatedContent = '';
      
      await llmService.directGenerateResponse(
        `当前文档内容：\n${content}\n\n修改要求：${action.prompt}\n\n请直接返回修改后的HTML内容。`,
        {
          context: {
            systemPrompt: '你是一位专业的文案编辑助手。请根据用户的要求对文档进行优化修改。保持HTML格式输出。'
          },
          onDelta: (chunk: string) => {
            accumulatedContent += chunk;
            let displayContent = accumulatedContent;
            displayContent = displayContent.replace(/^```html\s*/i, '');
            displayContent = displayContent.replace(/```\s*$/i, '');
            setContent(displayContent);
          }
        }
      );
      
      toast.success(`${action.label}完成！`);
    } catch (error) {
      console.error('AI修改失败:', error);
      toast.error('修改失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 发送消息给AI助手 - 支持聊天对话
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsGenerating(true);
    
    // 添加用户消息到聊天
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMsg]);
    
    try {
      let accumulatedContent = '';
      let aiResponse = '';
      
      await llmService.directGenerateResponse(
        `当前文档内容：\n${content}\n\n用户请求：${userMessage}\n\n请根据用户的请求，对文档进行优化修改。如果是修改请求，请直接返回修改后的完整HTML内容；如果是询问或建议，请给出专业的回复。`,
        {
          context: {
            systemPrompt: '你是一位专业的商业文案撰写和编辑专家。你可以：1)根据用户要求修改文档并返回HTML格式内容；2)回答用户关于文档的问题；3)提供专业的写作建议。请友好、专业地回复用户。'
          },
          onDelta: (chunk: string) => {
            accumulatedContent += chunk;
            aiResponse = accumulatedContent;
            
            // 如果内容包含HTML标签，更新文档
            if (aiResponse.includes('<') && aiResponse.includes('>')) {
              let displayContent = aiResponse;
              displayContent = displayContent.replace(/^```html\s*/i, '');
              displayContent = displayContent.replace(/```\s*$/i, '');
              setContent(displayContent);
            }
          }
        }
      );
      
      // 添加AI回复到聊天
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.includes('<') ? '已根据您的要求完成文档修改。您可以继续提出修改意见或询问其他问题。' : aiResponse,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMsg]);
      
    } catch (error) {
      console.error('AI对话失败:', error);
      // 添加错误消息
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，处理您的请求时出现了错误。请稍后重试。',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMsg]);
      toast.error('发送失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存文档
  const handleSave = () => {
    const state = location.state as { templateId?: string; templateName?: string; formData?: Record<string, string> };
    addHistoryItem({
      title: title || '未命名文档',
      templateName: state?.templateName || '商业计划书',
      templateId: state?.templateId || 'default',
      content: content,
      formData: state?.formData || {},
      status: 'draft',
      wordCount: content.replace(/<[^>]*>/g, '').length,
    });
    toast.success('文档已保存到历史记录');
  };

  // 导出文档
  const handleExport = (format: 'html' | 'txt' | 'md') => {
    let exportContent = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'html':
        exportContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Noto Sans SC', sans-serif; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 0.5rem; }
    h2 { color: #1f2937; margin-top: 2rem; }
    h3 { color: #2563eb; }
    strong { color: #111827; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${content}
</body>
</html>`;
        filename = `${title || 'document'}.html`;
        mimeType = 'text/html';
        break;
      case 'txt':
        exportContent = content.replace(/<[^>]*>/g, '');
        filename = `${title || 'document'}.txt`;
        mimeType = 'text/plain';
        break;
      case 'md':
        exportContent = convertHtmlToMarkdown(content);
        filename = `${title || 'document'}.md`;
        mimeType = 'text/markdown';
        break;
    }

    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`已导出为 ${format.toUpperCase()} 格式`);
  };

  // HTML转Markdown
  const convertHtmlToMarkdown = (html: string): string => {
    return html
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '');
  };

  // 添加自定义样式到编辑器
  useEffect(() => {
    // 动态添加编辑器样式
    const style = document.createElement('style');
    style.textContent = `
      .editor-content h1 {
        font-size: 2.25rem;
        font-weight: 700;
        color: #2563eb;
        margin-bottom: 1.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid #2563eb;
        letter-spacing: -0.02em;
      }
      .editor-content h2 {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1f2937;
        margin-top: 2rem;
        margin-bottom: 1rem;
        letter-spacing: -0.01em;
      }
      .editor-content h3 {
        font-size: 1.375rem;
        font-weight: 600;
        color: #2563eb;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
      }
      .editor-content p {
        margin-bottom: 1rem;
        line-height: 1.8;
        color: #374151;
      }
      .editor-content strong {
        font-weight: 600;
        color: #111827;
      }
      .editor-content ul {
        margin-bottom: 1rem;
        padding-left: 1.5rem;
      }
      .editor-content ul li {
        margin-bottom: 0.5rem;
        position: relative;
        padding-left: 0.5rem;
      }
      .editor-content ul li::marker {
        color: #2563eb;
      }
      .editor-content ol {
        margin-bottom: 1rem;
        padding-left: 1.5rem;
      }
      .editor-content ol li {
        margin-bottom: 0.5rem;
      }
      .editor-content blockquote {
        border-left: 4px solid #2563eb;
        padding-left: 1rem;
        margin: 1.5rem 0;
        color: #6b7280;
        font-style: italic;
      }
      .editor-content a {
        color: #2563eb;
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .editor-content code {
        background-color: #f3f4f6;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.875rem;
      }
      .editor-content pre {
        background-color: #1f2937;
        color: #f9fafb;
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin: 1rem 0;
      }
      .editor-content hr {
        border: none;
        border-top: 1px solid #e5e7eb;
        margin: 2rem 0;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-white dark:bg-gray-900' : 'bg-white'}`}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
    >
      {/* 顶部导航栏 */}
      <header className={`flex items-center justify-between px-4 h-14 border-b ${isDark ? 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900' : 'border-gray-200 bg-white'}`}>
        {/* 左侧：Logo和菜单 */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className={`font-semibold ${isDark ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>AI 智作文案</span>
          </div>
          
          {/* 菜单栏 */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((menu) => (
              <div key={menu.label} className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeMenu === menu.label
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {menu.label}
                </button>
                {activeMenu === menu.label && (
                  <div className={`absolute top-full left-0 mt-1 w-40 rounded-lg shadow-lg border py-1 z-50 ${
                    isDark ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    {menu.items.map((item) => (
                      <button
                        key={item}
                        className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                          isDark ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* 中间：AI模型选择 */}
        <div className="flex items-center gap-2">
          <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            isDark ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-blue-50 text-blue-600'
          }`}>
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">通</span>
            </div>
            <span>{selectedModel}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            title="保存"
          >
            <Save className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate('/create/ai-writer')}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            title="历史记录"
          >
            <History className="w-4 h-4" />
          </button>
          <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Share2 className="w-4 h-4" />
          </button>
          
          {/* 导出下拉菜单 */}
          <div className="relative group">
            <button className={`px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5`}>
              <Download className="w-4 h-4" />
              导出
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className={`absolute right-0 top-full mt-1 w-32 rounded-lg shadow-lg border py-1 z-50 hidden group-hover:block ${
              isDark ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <button
                onClick={() => handleExport('html')}
                className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                  isDark ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                导出为 HTML
              </button>
              <button
                onClick={() => handleExport('md')}
                className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                  isDark ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                导出为 Markdown
              </button>
              <button
                onClick={() => handleExport('txt')}
                className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                  isDark ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                导出为纯文本
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 工具栏 */}
      <div className={`flex items-center gap-1 px-4 py-2 border-b ${isDark ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        {/* 撤销重做 */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => execCommand('undo')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="撤销">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button onClick={() => execCommand('redo')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="重做">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 018 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* 标题 */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => execCommand('formatBlock', 'H1')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="标题1">
            <Heading1 className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('formatBlock', 'H2')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="标题2">
            <Heading2 className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('formatBlock', 'H3')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="标题3">
            <Heading3 className="w-4 h-4" />
          </button>
        </div>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* 格式 */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => execCommand('bold')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="加粗">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('italic')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="斜体">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('underline')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="下划线">
            <Underline className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('strikeThrough')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="删除线">
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* 对齐 */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => execCommand('justifyLeft')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="左对齐">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyCenter')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="居中">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('justifyRight')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="右对齐">
            <AlignRight className="w-4 h-4" />
          </button>
        </div>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* 列表 */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="无序列表">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('insertOrderedList')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="有序列表">
            <ListOrdered className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="任务列表">
            <CheckSquare className="w-4 h-4" />
          </button>
        </div>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* 插入 */}
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="插入链接">
            <Link className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="插入图片">
            <Image className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="插入表格">
            <Table className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="代码块">
            <Code className="w-4 h-4" />
          </button>
          <button onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400" title="引用">
            <Quote className="w-4 h-4" />
          </button>
        </div>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* 更多 */}
        <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧编辑区 */}
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-12 py-10">
            {/* 文档标题 */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full text-4xl font-bold mb-8 outline-none bg-transparent tracking-tight ${
                isDark ? 'text-blue-600 dark:text-blue-500 placeholder-gray-400' : 'text-blue-600 placeholder-gray-400'
              }`}
              style={{ fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif' }}
              placeholder="请输入标题..."
            />
            
            {/* 编辑区域 - 美化样式 */}
            <div
              className={`editor-content min-h-[500px] outline-none ${
                isDark ? 'text-gray-800 dark:text-gray-200' : 'text-gray-800'
              }`}
              style={{ fontFamily: '"Noto Sans SC", "Inter", system-ui, sans-serif', lineHeight: '1.8' }}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setContent(e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>

        {/* 右侧AI助手侧边栏 */}
        <AnimatePresence>
          {showAIAssistant && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`w-80 border-l flex flex-col ${isDark ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
            >
              {/* AI助手头部 */}
              <div className={`p-4 border-b ${isDark ? 'border-gray-200 dark:border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-gray-900 dark:text-white' : 'text-gray-900'}`}>AI 智能助手</h3>
                    <p className={`text-xs ${isDark ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500'}`}>随时为您提供帮助</p>
                  </div>
                </div>
              </div>

              {/* 聊天消息列表 */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {chatMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-1">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl text-sm leading-relaxed ${
                          message.role === 'user'
                            ? isDark
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-blue-600 text-white rounded-br-md'
                            : isDark
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-bl-md'
                              : 'bg-gray-100 text-gray-700 rounded-bl-md'
                        }`}
                      >
                        {message.content}
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 快捷功能区 - 可折叠 */}
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800">
                {/* 智能建议 */}
                <div className="mb-3">
                  <h4 className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${isDark ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600'}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    智能建议
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSuggestions.slice(0, 4).map((suggestion) => (
                      <motion.button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <span className="mr-1">{suggestion.icon}</span>
                        {suggestion.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 快捷操作 */}
                <div>
                  <h4 className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${isDark ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500'}`}>
                    <Wand2 className="w-3.5 h-3.5" />
                    快捷操作
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {quickActions.slice(0, 6).map((action) => (
                      <motion.button
                        key={action.id}
                        onClick={() => handleQuickActionClick(action)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          isDark
                            ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span>{action.icon}</span>
                        <span className="truncate">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 输入区域 */}
              <div className={`p-4 border-t ${isDark ? 'border-gray-200 dark:border-gray-800' : 'border-gray-200'}`}>
                <div className={`flex items-center gap-2 p-2 rounded-xl border ${isDark ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-white border-gray-200'}`}>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="输入您的修改要求..."
                    className={`flex-1 bg-transparent outline-none text-sm ${
                      isDark ? 'text-gray-900 dark:text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <motion.button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isGenerating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-lg transition-colors ${
                      inputMessage.trim() && !isGenerating
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </motion.button>
                </div>
                <p className={`text-xs mt-2 text-center ${isDark ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400'}`}>
                  AI 生成内容仅供参考，请核对重要信息
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部状态栏 */}
      <div className={`flex items-center justify-between px-4 py-2 border-t text-xs ${isDark ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
        <div className="flex items-center gap-4">
          <span>字数 {wordCount}</span>
          <span>字符 {charCount.toLocaleString()}</span>
          <span>预计阅读 {readTime} 分钟</span>
          <span>分类</span>
          <div className="flex items-center gap-1">
            {documentTags.slice(0, 3).map((tag, index) => (
              <span key={index} className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span>标签</span>
          <span className={`px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400`}>紧急</span>
          <span className={`px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400`}>重要</span>
          <span className={`px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>草稿</span>
          <span className={`px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400`}>已完成</span>
          <span className={`px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400`}>需要审核</span>
          <button className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
            <span className="text-xs">+</span> 添加标签
          </button>
        </div>
      </div>
    </div>
  );
}
