import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { llmService } from '@/services/llmService';
import { RichTextEditor } from '@/components/RichTextEditor';
import { draftService, Draft } from '@/services/draftService';

// Define templates based on user requirements
const TEMPLATES = {
  business_plan: {
    id: 'business_plan',
    name: '经典商业计划书',
    icon: 'fas fa-briefcase',
    description: '适用于融资、路演的完整标准结构',
    sections: [
      '执行摘要', '公司概述', '问题与解决方案', '产品介绍', '市场分析', '竞争分析', '商业模式', '财务预测'
    ],
    prompt: `请撰写一份专业的商业计划书。
项目名称：[项目名称]
核心业务：[核心业务]
目标市场：[目标市场]
竞争优势：[竞争优势]

请直接输出 **HTML 格式** 的内容，不要包含 markdown 代码块标记（如 \`\`\`html）。
请使用以下 HTML 标签构建结构清晰、排版专业的文档：
- 使用 <h1> 作为主标题（项目名称）
- 使用 <h2> 作为章节标题
- 使用 <h3> 作为子章节标题
- 使用 <p> 作为正文段落，保持段落长度适中
- 使用 <ul>/<li> 或 <ol>/<li> 展示列表项
- 使用 <strong> 或 <b> 强调关键数据和术语
- 使用 <table> 展示财务预测或对比数据（请添加 border="1" style="border-collapse: collapse; width: 100%;"）

章节要求：
1. <h2>执行摘要</h2>：高度浓缩的计划书精华。
2. <h2>公司/项目概述</h2>：背景、愿景、使命。
3. <h2>问题与解决方案</h2>：痛点及解决方案。
4. <h2>产品/服务介绍</h2>：核心功能与技术壁垒。
5. <h2>市场分析</h2>：市场规模、目标客户。
6. <h2>竞争分析</h2>：竞品对比（建议使用表格）。
7. <h2>商业模式</h2>：盈利模式与定价。
8. <h2>财务计划</h2>：未来3年预测（建议使用表格）。

请确保语言专业、严谨、客观，逻辑连贯。`
  },
  lean_canvas: {
    id: 'lean_canvas',
    name: '精益创业画布',
    icon: 'fas fa-th-large',
    description: '适用于早期项目的快速验证与梳理',
    sections: [
      '问题', '客户细分', '独特卖点', '解决方案', '渠道', '收入来源', '成本结构', '关键指标', '门槛优势'
    ],
    prompt: `请为[项目名称]创建一个精益创业画布（Lean Canvas）。
核心业务：[核心业务]

请直接输出 **HTML 格式** 的内容，不要包含 markdown 代码块标记。
使用 <h2> 作为模块标题，<p> 作为内容，<ul> 列表展示要点。
请详细阐述以下9个模块：
1. 问题
2. 客户细分
3. 独特卖点
4. 解决方案
5. 渠道
6. 收入来源
7. 成本结构
8. 关键指标
9. 门槛优势`
  },
  pitch_deck: {
    id: 'pitch_deck',
    name: '融资路演PPT文案',
    icon: 'fas fa-presentation',
    description: '适用于路演演讲的精简有力文案',
    sections: [
      '封面', '痛点', '解决方案', '市场机会', '产品', '商业模式', '团队', '融资'
    ],
    prompt: `请撰写一份融资路演PPT（Pitch Deck）的逐页文案。
项目名称：[项目名称]
一句话介绍：[一句话介绍]

请直接输出 **HTML 格式** 的内容。
每一页使用 <div style="border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; border-radius: 8px;"> 包裹。
内部结构：
<h3>Slide X: [标题]</h3>
<p><strong>核心观点：</strong>[内容]</p>
<p><strong>演讲备注：</strong>[内容]</p>

请规划约10页PPT内容，语言极具感染力。`
  },
  market_analysis: {
    id: 'market_analysis',
    name: '深度市场分析报告',
    icon: 'fas fa-chart-line',
    description: '专注于行业趋势与竞争格局的深度分析',
    sections: [
      '行业概况', '市场规模', '趋势分析', '客户画像', 'SWOT分析'
    ],
    prompt: `请撰写一份关于[行业/领域]的深度市场分析报告。
关注焦点：[关注焦点]

请直接输出 **HTML 格式** 的内容。
使用 <h2>, <h3>, <p>, <ul>, <table> 等标签。
内容包含：行业概况、市场规模测算（使用表格展示数据）、市场趋势、目标客户分析、竞争格局、SWOT分析（使用表格）。
语言需客观、专业，引用行业标准术语。`
  },
  prd: {
    id: 'prd',
    name: '产品需求文档 (PRD)',
    icon: 'fas fa-clipboard-list',
    description: '标准化的互联网产品需求定义文档',
    sections: [
      '文档说明', '产品背景', '用户角色', '功能需求', '非功能需求', '数据埋点'
    ],
    prompt: `请撰写一份专业的产品需求文档（PRD）。
产品名称：[产品名称]
核心功能：[核心功能]

请直接输出 **HTML 格式** 的内容。
使用 <table border="1" style="width: 100%; border-collapse: collapse;"> 展示功能列表和版本记录。
章节结构：
1. <h2>文档说明</h2>：版本记录、变更日志。
2. <h2>产品背景</h2>：背景、目标、范围。
3. <h2>用户角色</h2>：用户画像、使用场景。
4. <h2>功能需求</h2>：详细的功能点描述（使用表格：功能模块 | 功能点 | 优先级 | 描述）。
5. <h2>非功能需求</h2>：性能、安全、兼容性。
6. <h2>数据埋点</h2>：关键指标定义。

语言需极度严谨，逻辑清晰，无歧义。`
  }
};

interface Version {
  id: string;
  timestamp: number;
  content: string;
  summary?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface GenerationOptions {
  tone: string;
  language: string;
}

const TONES = [
  { id: 'professional', label: '专业严谨', icon: 'fas fa-user-tie' },
  { id: 'enthusiastic', label: '热情感染', icon: 'fas fa-fire' },
  { id: 'creative', label: '创意新颖', icon: 'fas fa-lightbulb' },
  { id: 'concise', label: '简洁有力', icon: 'fas fa-compress-alt' },
];

const LANGUAGES = [
  { id: 'zh', label: '中文', icon: '🇨🇳' },
  { id: 'en', label: 'English', icon: '🇺🇸' },
];

const QUICK_ACTIONS = [
  { label: '润色文字', prompt: '请润色这段文字，使其更加通顺、优雅，保持原意不变。' },
  { label: '扩充内容', prompt: '请扩充这段内容，增加更多细节、例子和数据支持，使论证更充分。' },
  { label: '精简摘要', prompt: '请将这段内容概括为一段精炼的摘要，保留核心观点。' },
  { label: '纠正语法', prompt: '请检查并纠正文中的语法错误和错别字。' },
  { label: '翻译为英文', prompt: 'Please translate the content into professional English.' },
];

export default function AIWriter() {
  const { isDark } = useTheme();
  
  // State
  const [activeModel, setActiveModel] = useState('qwen');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('business_plan');
  const [currentStep, setCurrentStep] = useState<'input' | 'editor'>('input');
  
  // Input State
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [genOptions, setGenOptions] = useState<GenerationOptions>({ tone: 'professional', language: 'zh' });
  
  // Editor State
  const [content, setContent] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState(''); // New state for streaming
  const [isGenerating, setIsGenerating] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, time: 0 });
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);

  // Draft History Modal State
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [draftsList, setDraftsList] = useState<Draft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Export & Submit State
  const [showExportMenu, setShowExportMenu] = useState(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    llmService.setCurrentModel(activeModel);
  }, [activeModel]);

  // Load drafts when modal opens
  useEffect(() => {
    if (showDraftsModal) {
      setDraftsList(draftService.getAllDrafts());
    }
  }, [showDraftsModal]);

  useEffect(() => {
    if (content && currentStep === 'editor' && !isGenerating) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft('自动保存');
        setLastSaved(new Date());
      }, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [content, currentStep, isGenerating]);

  // Update stats when content changes
  useEffect(() => {
    const plainText = content.replace(/<[^>]*>/g, '');
    const charCount = plainText.length;
    const wordCount = plainText.trim() === '' ? 0 : plainText.trim().split(/\s+/).length;
    const readTime = Math.ceil(charCount / 500); // Rough estimate: 500 chars per minute

    setStats({
      chars: charCount,
      words: wordCount,
      time: readTime
    });
  }, [content]);

  // Scroll to bottom of streaming content
  useEffect(() => {
    if (isGenerating && editorContainerRef.current) {
      editorContainerRef.current.scrollTop = editorContainerRef.current.scrollHeight;
    }
  }, [streamingContent, isGenerating]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const models = [
    { id: 'qwen', name: '通义千问', icon: 'fas fa-brain', color: 'from-purple-500 to-indigo-500' },
    { id: 'kimi', name: 'Kimi', icon: 'fas fa-moon', color: 'from-blue-500 to-cyan-500' },
    { id: 'deepseek', name: 'DeepSeek', icon: 'fas fa-microchip', color: 'from-emerald-500 to-teal-500' }
  ];

  const currentTemplate = TEMPLATES[selectedTemplateId as keyof typeof TEMPLATES];

  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const generatePrompt = () => {
    let finalPrompt = currentTemplate.prompt;
    Object.keys(inputs).forEach(key => {
      finalPrompt = finalPrompt.replace(`[${key}]`, inputs[key]);
    });
    finalPrompt = finalPrompt.replace(/\[.*?\]/g, '');

    // Append Tone and Language instructions
    finalPrompt += `\n\n**重要要求**：\n`;
    finalPrompt += `- 写作语调：${TONES.find(t => t.id === genOptions.tone)?.label || '专业严谨'}\n`;
    finalPrompt += `- 输出语言：${genOptions.language === 'en' ? 'English' : 'Simplified Chinese (简体中文)'}\n`;
    
    if (genOptions.language === 'en') {
      finalPrompt += `- Please ensure the output is in English, but keep the professional structure.\n`;
    }

    return finalPrompt;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCurrentStep('editor');
    setStreamingContent('');
    setContent(''); // Clear editor content initially
    setChatHistory([]); // Clear chat history for new generation
    setCurrentDraftId(Date.now().toString()); // Start a new draft ID
    
    const prompt = generatePrompt();
    let accumulatedContent = '';

    // Add initial system message to chat (hidden or visible)
    const initialUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `基于模板"${currentTemplate.name}"生成初始草稿。语调：${TONES.find(t => t.id === genOptions.tone)?.label}。`,
      timestamp: Date.now()
    };
    setChatHistory([initialUserMessage]);

    try {
      await llmService.directGenerateResponse(prompt, {
        onDelta: (chunk) => {
          accumulatedContent += chunk;
          setStreamingContent(accumulatedContent);
        }
      });
      
      const cleanContent = accumulatedContent.replace(/```html/g, '').replace(/```/g, '');
      
      setContent(cleanContent);
      
      // Save initial draft
      saveDraft('AI 生成初始版本', cleanContent);
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '已为您生成初始草稿。您可以在此提出修改意见，例如"让语气更正式一点"或"扩充市场分析部分"。',
        timestamp: Date.now()
      }]);

      toast.success('生成完成！您可以直接编辑内容或通过右侧助手进行修改。');
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModification = async (customPrompt?: string) => {
    const inputToUse = customPrompt || chatInput;
    if (!inputToUse.trim() || isGenerating) return;

    const userInstruction = inputToUse;
    setChatInput('');
    setIsGenerating(true);

    // Add user message to chat
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInstruction,
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, newUserMsg]);

    // Construct modification prompt
    const modificationPrompt = `
You are a professional editor assistant.
Current Document Content (HTML):
${content}

User Instruction:
${userInstruction}

Please rewrite the document content to satisfy the user instruction.
IMPORTANT:
1. Output ONLY the new HTML content. Do not output explanations outside the HTML.
2. Maintain the existing HTML structure and formatting unless asked to change.
3. Keep the tone professional and consistent.
`;

    let accumulatedContent = '';
    const toastId = toast.loading('AI 正在修改文档...');

    try {
       await llmService.directGenerateResponse(modificationPrompt, {
        onDelta: (chunk) => {
          accumulatedContent += chunk;
        }
      });

      const cleanContent = accumulatedContent.replace(/```html/g, '').replace(/```/g, '');
      
      // Save old version before applying new one
      saveVersion(content, '修改前备份');
      
      setContent(cleanContent);
      saveDraft(`AI 修改: ${userInstruction.substring(0, 10)}...`, cleanContent);
      saveVersion(cleanContent, `AI 修改: ${userInstruction.substring(0, 10)}...`);

      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '已根据您的要求完成修改。',
        timestamp: Date.now()
      }]);

      toast.success('修改完成', { id: toastId });
    } catch (error) {
      console.error('Modification failed:', error);
      toast.error('修改失败', { id: toastId });
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，修改过程中遇到了问题，请重试。',
        timestamp: Date.now()
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to save draft to persistent storage
  const saveDraft = (summary?: string, specificContent?: string) => {
    const textToSave = specificContent || content;
    if (!textToSave || !currentDraftId) return;

    // Use project name as title if available, otherwise template name
    const title = inputs['项目名称'] || currentTemplate.name;

    draftService.saveDraft({
      id: currentDraftId,
      title: title,
      templateId: selectedTemplateId,
      templateName: currentTemplate.name,
      content: textToSave,
      summary: summary
    });
  };

  // Version control for current session
  const saveVersion = (text: string, summary: string = '手动保存') => {
    const newVersion: Version = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content: text,
      summary
    };
    setVersions(prev => [newVersion, ...prev]);
    setLastSaved(new Date());
  };

  const restoreVersion = (version: Version) => {
    if (window.confirm('确定要恢复到此版本吗？当前未保存的修改将丢失。')) {
      setContent(version.content);
      saveVersion(version.content, `恢复至 ${new Date(version.timestamp).toLocaleTimeString()} 的版本`);
      setShowHistory(false);
      toast.success('版本已恢复');
    }
  };

  const loadDraft = (draft: Draft) => {
    if (content && currentStep === 'editor') {
      if (!window.confirm('当前有未保存的编辑内容，加载草稿将覆盖当前内容。确定要继续吗？')) {
        return;
      }
    }
    
    setContent(draft.content);
    setCurrentDraftId(draft.id);
    setSelectedTemplateId(draft.templateId);
    // Try to extract project name from title if possible, or just reset inputs
    setInputs(prev => ({ ...prev, '项目名称': draft.title !== draft.templateName ? draft.title : '' }));
    
    setCurrentStep('editor');
    setShowDraftsModal(false);
    toast.success('草稿已加载');
  };

  const deleteDraft = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条历史记录吗？')) {
      draftService.deleteDraft(id);
      setDraftsList(draftService.getAllDrafts());
      toast.success('记录已删除');
    }
  };

  const handleClear = () => {
    if (window.confirm('确定要清空所有内容吗？此操作无法撤销。')) {
      setContent('');
      toast.success('内容已清空');
    }
  };

  // Export & Submit Handlers
  const handleExport = (format: 'html' | 'print') => {
    setShowExportMenu(false);
    if (format === 'print') {
      window.print();
    } else if (format === 'html') {
      const element = document.createElement("a");
      const file = new Blob([content], {type: 'text/html'});
      element.href = URL.createObjectURL(file);
      element.download = `${inputs['项目名称'] || 'document'}.html`;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleSubmit = () => {
    if (!content) {
      toast.error('请先生成内容');
      return;
    }
    
    // Mock submission
    const toastId = toast.loading('正在提交作品至大赛系统...');
    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success('作品已成功提交！', {
        description: '您可以在"我的作品"中查看提交状态。大赛评审结果将通过短信通知。',
        duration: 5000,
      });
    }, 2000);
  };

  const renderInputFields = () => {
    const commonFields = [
      { key: '项目名称', label: '项目/公司名称', placeholder: '例如：未来科技' },
      { key: '核心业务', label: '核心业务/产品', placeholder: '例如：AI驱动的教育平台' },
    ];

    let specificFields: {key: string, label: string, placeholder: string, type?: string}[] = [];

    if (selectedTemplateId === 'business_plan') {
      specificFields = [
        { key: '目标市场', label: '目标市场', placeholder: '例如：K12教育市场' },
        { key: '竞争优势', label: '核心竞争优势', placeholder: '例如：独家算法、海量数据' }
      ];
    } else if (selectedTemplateId === 'pitch_deck') {
      specificFields = [
        { key: '一句话介绍', label: '一句话介绍 (Slogan)', placeholder: '例如：让学习更高效' }
      ];
    } else if (selectedTemplateId === 'market_analysis') {
      specificFields = [
        { key: '行业/领域', label: '分析行业', placeholder: '例如：新能源汽车' },
        { key: '关注焦点', label: '重点关注方向', placeholder: '例如：电池技术革新' }
      ];
    } else if (selectedTemplateId === 'prd') {
      specificFields = [
        { key: '产品名称', label: '产品名称', placeholder: '例如：AI写作助手' },
        { key: '核心功能', label: '核心功能', placeholder: '例如：多模态生成、实时协作' }
      ];
    }

    return (
      <div className="space-y-4">
        {[...commonFields, ...specificFields].map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={inputs[field.key] || ''}
                onChange={e => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
                }`}
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={inputs[field.key] || ''}
                onChange={e => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
                }`}
              />
            )}
          </div>
        ))}

        {/* Options: Tone & Language */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">写作语调</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(tone => (
                <button
                  key={tone.id}
                  onClick={() => setGenOptions(prev => ({ ...prev, tone: tone.id }))}
                  className={`p-2 text-xs rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                    genOptions.tone === tone.id
                      ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                >
                  <i className={tone.icon}></i>
                  {tone.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">输出语言</label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setGenOptions(prev => ({ ...prev, language: lang.id }))}
                  className={`p-2 text-xs rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                    genOptions.language === lang.id
                      ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-base">{lang.icon}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-64px)] overflow-hidden ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #editor-content-area, #editor-content-area * {
              visibility: visible;
            }
            #editor-content-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
              background: white;
              color: black;
            }
          }
        `}
      </style>

      {/* Header / Toolbar */}
      <div className={`flex-shrink-0 px-6 py-3 border-b flex items-center justify-between ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <i className="fas fa-pen-nib text-blue-500"></i>
            AI 智作文案
          </h1>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => setActiveModel(model.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  activeModel === model.id
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <i className={model.icon}></i>
                {model.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* History Button - Visible in both steps */}
          <button
            onClick={() => setShowDraftsModal(true)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
              showDraftsModal
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <i className="fas fa-history"></i>
            历史记录
          </button>

          {currentStep === 'editor' && !isGenerating && (
            <>
              <span className="text-xs text-gray-400 hidden lg:inline">
                {lastSaved ? `上次保存: ${lastSaved.toLocaleTimeString()}` : '未保存'}
              </span>
              
              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
              >
                <i className="fas fa-paper-plane"></i>
                一键参赛
              </button>

              {/* Export Button */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <i className="fas fa-download"></i>
                  导出
                </button>
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`absolute top-full right-0 mt-2 w-40 rounded-xl shadow-xl border z-50 overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    >
                      <button onClick={() => handleExport('html')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors`}>
                        <i className="fab fa-html5 text-orange-500"></i> 导出 HTML
                      </button>
                      <button onClick={() => handleExport('print')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors`}>
                        <i className="fas fa-file-pdf text-red-500"></i> 导出 PDF/打印
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors"
                title="清空内容"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
              <button
                onClick={() => saveDraft('手动保存')}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="保存草稿"
              >
                <i className="fas fa-save"></i>
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${showHistory ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}
                title="版本历史"
              >
                <i className="fas fa-code-branch"></i>
              </button>
              <button
                onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${isAssistantOpen ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}
                title="AI 助手"
              >
                <i className="fas fa-robot"></i>
              </button>
              <button
                onClick={() => setCurrentStep('input')}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="新建文案"
              >
                <i className="fas fa-plus"></i>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {currentStep === 'input' && (
          <div className="flex w-full h-full">
            <div className={`w-1/3 max-w-xs border-r overflow-y-auto ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="p-4 space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">选择模板</h3>
                {Object.values(TEMPLATES).map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      selectedTemplateId === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedTemplateId === template.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}>
                        <i className={template.icon}></i>
                      </div>
                      <div>
                        <div className={`font-medium ${selectedTemplateId === template.id ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                          {template.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-8 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">{currentTemplate.name}</h2>
                  <p className="text-gray-500">{currentTemplate.description}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-keyboard text-blue-500"></i>
                    填写关键信息
                  </h3>
                  {renderInputFields()}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 mb-8">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    <i className="fas fa-info-circle mr-2"></i>
                    包含章节
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentTemplate.sections.map((section, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 rounded text-gray-600 dark:text-gray-300">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  className="w-full py-4 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                  开始智能生成
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'editor' && (
          <div className="flex w-full h-full relative">
            <div className="flex-1 flex flex-col h-full min-w-0">
              {/* ID added for print styling targeting */}
              <div id="editor-content-area" className="flex-1 overflow-hidden relative" ref={editorContainerRef}>
                {/* Streaming Preview or Rich Text Editor */}
                {isGenerating && streamingContent ? (
                  <div className={`h-full overflow-y-auto p-8 prose max-w-none ${isDark ? 'prose-invert bg-gray-900' : 'bg-white'}`}>
                     <div className="flex items-center gap-2 mb-4 text-blue-500 font-medium">
                       <i className="fas fa-spinner fa-spin"></i>
                       <span>AI 正在撰写中...</span>
                     </div>
                     <div 
                        className="html-preview"
                        dangerouslySetInnerHTML={{ __html: streamingContent }} 
                     />
                     <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                  </div>
                ) : (
                  <div className={`h-full ${isDark ? 'tinymce-dark' : ''}`}>
                    <RichTextEditor
                      content={content}
                      onChange={setContent}
                      placeholder="AI生成的内容将显示在这里..."
                      disabled={false}
                    />
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              {!isGenerating && (
                <div className={`px-4 py-2 border-t text-xs flex items-center gap-4 ${isDark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  <span>字数: <strong className="text-gray-700 dark:text-gray-300">{stats.words}</strong></span>
                  <span>字符: <strong className="text-gray-700 dark:text-gray-300">{stats.chars}</strong></span>
                  <span>预计阅读: <strong className="text-gray-700 dark:text-gray-300">{stats.time}</strong> 分钟</span>
                </div>
              )}
            </div>

            {/* AI Assistant Sidebar */}
            <AnimatePresence>
              {isAssistantOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className={`border-l flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className={`p-4 border-b font-medium flex justify-between items-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span><i className="fas fa-robot text-blue-500 mr-2"></i>AI 助手</span>
                    <button onClick={() => setIsAssistantOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800')
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Quick Actions */}
                  <div className={`px-4 py-2 border-t overflow-x-auto whitespace-nowrap ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex gap-2">
                      {QUICK_ACTIONS.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleModification(action.prompt)}
                          disabled={isGenerating}
                          className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                            isDark 
                              ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                              : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="relative">
                      <textarea
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleModification();
                          }
                        }}
                        placeholder="输入修改要求，如'让第一段更精简'..."
                        className={`w-full p-3 pr-10 rounded-lg border resize-none focus:ring-2 focus:ring-blue-500 outline-none ${
                          isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                        rows={3}
                        disabled={isGenerating}
                      />
                      <button
                        onClick={() => handleModification()}
                        disabled={!chatInput.trim() || isGenerating}
                        className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          !chatInput.trim() || isGenerating
                            ? 'bg-gray-300 text-gray-500 dark:bg-gray-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isGenerating ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className="fas fa-paper-plane text-xs"></i>}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      AI 可能产生不准确的信息，请核对重要内容。
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Version History Sidebar (Renamed from History) */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 300, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className={`border-l flex-shrink-0 overflow-y-auto absolute right-0 top-0 bottom-0 z-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">当前文档版本</h3>
                      <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {versions.map((version) => (
                        <div key={version.id} className={`p-3 rounded-lg border cursor-pointer transition-all ${isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">{version.summary}</span>
                            <span className="text-xs text-gray-400">{new Date(version.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <button
                            onClick={() => restoreVersion(version)}
                            className="text-xs text-blue-600 hover:underline mt-2"
                          >
                            恢复此版本
                          </button>
                        </div>
                      ))}
                      {versions.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">暂无历史版本</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Drafts History Modal */}
      <AnimatePresence>
        {showDraftsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            >
              {/* Modal Header */}
              <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <i className="fas fa-history text-blue-500"></i>
                  文案历史记录
                </h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input 
                      type="text" 
                      placeholder="搜索文案..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
                    />
                  </div>
                  <button onClick={() => setShowDraftsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {draftsList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {draftsList
                      .filter(d => 
                        d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        d.templateName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .sort((a, b) => b.updatedAt - a.updatedAt)
                      .map(draft => (
                      <div 
                        key={draft.id}
                        onClick={() => loadDraft(draft)}
                        className={`group relative p-5 rounded-xl border transition-all cursor-pointer hover:shadow-lg ${
                          isDark 
                            ? 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750' 
                            : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-blue-100'}`}>
                            <i className={`${TEMPLATES[draft.templateId as keyof typeof TEMPLATES]?.icon || 'fas fa-file-alt'} text-blue-500`}></i>
                          </div>
                          <button 
                            onClick={(e) => deleteDraft(e, draft.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                            title="删除"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                        
                        <h3 className="font-bold text-lg mb-1 line-clamp-1">{draft.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{draft.templateName}</p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-3 mt-auto dark:border-gray-700">
                          <span><i className="far fa-clock mr-1"></i>{new Date(draft.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <i className="fas fa-history text-5xl mb-4"></i>
                    <p className="text-lg">暂无历史记录</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
