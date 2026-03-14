import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { createReport, getReports } from '@/services/reportService';
import {
  Shield,
  FileText,
  Users,
  Globe,
  Scale,
  ChevronRight,
  Video,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  ChevronLeft,
  X,
  Upload,
  FileUp,
  User,
  Building2
} from 'lucide-react';

// 原创权益类型
const protectionTypes = [
  {
    id: 'infringement',
    icon: FileText,
    title: '侵权举报',
    description: '举报侵犯您原创权益的内容',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-500'
  },
  {
    id: 'plagiarism',
    icon: Search,
    title: '查重治理',
    description: '检测内容原创度和相似度',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-500'
  },
  {
    id: 'protection',
    icon: Shield,
    title: '作品保护',
    description: '为您的原创作品申请保护',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-500'
  },
  {
    id: 'external',
    icon: Globe,
    title: '站外维权',
    description: '处理站外平台的侵权问题',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-500'
  },
  {
    id: 'review',
    icon: Users,
    title: '抄袭评审团',
    description: '参与平台抄袭内容评审',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-500'
  },
  {
    id: 'legal',
    icon: Scale,
    title: '诉讼维权',
    description: '法律途径维护原创权益',
    color: 'from-indigo-500 to-violet-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-500'
  }
];

// 视频教程数据
const videoTutorials = [
  {
    id: 1,
    title: '权益之计：什么是侵权？被侵权了该怎么办？',
    thumbnail: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=225&fit=crop',
    duration: '05:32',
    views: '12.5万'
  },
  {
    id: 2,
    title: '别人拍我，侵犯了肖像权吗？"权益"之计',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop',
    duration: '04:18',
    views: '8.3万'
  },
  {
    id: 3,
    title: '侵权类型与处罚规则详解',
    thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=225&fit=crop',
    duration: '08:45',
    views: '15.2万'
  },
  {
    id: 4,
    title: '"杨老板，骗子商家，我错信了吗？"权益之计',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=225&fit=crop',
    duration: '06:21',
    views: '9.8万'
  },
  {
    id: 5,
    title: '权益之计第六集：著作权、关于搬运和抄袭的...',
    thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=225&fit=crop',
    duration: '07:33',
    views: '11.1万'
  },
  {
    id: 6,
    title: '权益之计第七集：创作者如何规避侵权风险',
    thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=225&fit=crop',
    duration: '05:56',
    views: '7.6万'
  },
  {
    id: 7,
    title: '权益之计：平台侵权与维权系列课程——导学篇',
    thumbnail: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=225&fit=crop',
    duration: '03:42',
    views: '20.3万'
  }
];

// 公告数据
const announcements = [
  {
    id: 1,
    title: '原创保护周报(2026-02-16~2026-02-22)',
    date: '2026-02-22',
    isNew: true
  },
  {
    id: 2,
    title: '2026-01月处罚公告',
    date: '2026-02-01',
    isNew: false
  },
  {
    id: 3,
    title: '平台关于治理"冒用他人营销"公告',
    date: '2026-01-28',
    isNew: false
  }
];

// FAQ数据
const faqData = {
  definition: [
    {
      question: '什么是原创内容？',
      answer: '个人实拍类视频、图集作品，由创作者独立创作完成，具有独创性的内容。'
    },
    {
      question: '对「原创度低」的内容，账号会有什么样的处罚？',
      answer: '平台为鼓励原创内容，平台将对非原创内容减少推荐，直到作品符合平台规范。'
    }
  ],
  guide: [
    {
      question: '我发现平台上有用户搬运/抄袭我的视频，该怎么举报？',
      answer: '1）单个视频举报的操作路径："被举报视频"—"分享"—"举报"—"侵犯权益"。2）多个视频或者用户资料举报操作路径："被举报账号个人主页"—右上"..."—"举报"—"用户举报"—"侵犯...'
    },
    {
      question: '我进行侵权投诉后平台会怎么处理？',
      answer: '平台会依照法律规定，根据构成侵权的初步证据和服务类型采取必要措施。采取的相关必要措施包括但不限于删除、屏蔽、封号等。'
    }
  ]
};

// 举报类型
const reportTypes = [
  { id: 'portrait', label: '曝光肖像', description: '肖像被丑化/污损，或未经他人授权使用' },
  { id: 'privacy', label: '泄露隐私', description: '泄露他人隐私信息' },
  { id: 'impersonation', label: '冒充身份', description: '冒充他人身份进行欺诈' },
  { id: 'reputation', label: '损害个人名誉', description: '诽谤、侮辱他人' },
  { id: 'business', label: '损害企业名誉', description: '损害企业商誉' },
  { id: 'plagiarism', label: '搬运/抄袭/洗稿', description: '未经授权使用他人作品' },
  { id: 'trademark', label: '假冒商标', description: '使用假冒商标' },
  { id: 'patent', label: '假冒专利', description: '假冒他人专利' }
];

// 原创度状态
const originalityStatus = [
  { id: 'low', label: '原创度低', score: 45, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20', icon: AlertTriangle },
  { id: 'good', label: '原创度良好', score: 92, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle2 },
  { id: 'certified', label: '原创作者认证', score: null, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20', icon: Shield }
];

export default function OriginalProtection() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'report' | 'history'>('home');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [reportStep, setReportStep] = useState(1);
  const [videoPage, setVideoPage] = useState(1);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    type: '',
    content: '',
    links: [''],
    description: '',
    evidence: [] as File[],
    identity: 'self', // self | other
    subjectType: 'personal', // personal | organization
    agreeTerms: false
  });

  // 用户举报历史
  const [userReports, setUserReports] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 加载用户举报历史
  useEffect(() => {
    if (activeTab === 'history' && isAuthenticated) {
      loadUserReports();
    }
  }, [activeTab, isAuthenticated]);

  const loadUserReports = async () => {
    setLoadingHistory(true);
    try {
      const { reports } = await getReports({
        page: 1,
        limit: 50
      });
      // 过滤出当前用户的举报
      const myReports = reports.filter(r => r.reporter_id === user?.id);
      setUserReports(myReports);
    } catch (error) {
      console.error('加载举报历史失败:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 处理权益卡片点击
  const handleProtectionClick = (id: string) => {
    if (id === 'infringement') {
      setShowReportModal(true);
    } else {
      toast.info('功能开发中', { description: '该功能即将上线，敬请期待' });
    }
  };

  // 处理举报提交
  const handleReportSubmit = async () => {
    if (!reportForm.type) {
      toast.error('请选择侵权类型');
      return;
    }
    if (!reportForm.description.trim()) {
      toast.error('请描述遇到的问题');
      return;
    }
    if (!reportForm.agreeTerms) {
      toast.error('请同意材料转交通知');
      return;
    }

    try {
      // 构建举报数据
      const reportData = {
        target_type: 'work' as const, // 原创保护举报目标类型为作品
        target_id: reportForm.links[0] || 'unknown', // 使用第一个链接作为目标ID
        report_type: reportForm.type as any, // 侵权类型
        description: `[原创保护举报]\n举报身份: ${reportForm.identity === 'self' ? '自己举报' : '代表他人举报'}\n权利主体: ${reportForm.subjectType === 'personal' ? '个人' : '组织'}\n\n问题描述:\n${reportForm.description}\n\n相关链接:\n${reportForm.links.filter(l => l.trim()).join('\n')}`,
        screenshots: reportForm.evidence.map(file => file.name) // 证据文件名列表
      };

      // 调用API提交举报
      const result = await createReport(reportData);
      
      if (result) {
        toast.success('举报提交成功', { description: '我们会在3个工作日内处理您的举报' });
        setShowReportModal(false);
        setReportStep(1);
        setReportForm({
          type: '',
          content: '',
          links: [''],
          description: '',
          evidence: [],
          identity: 'self',
          subjectType: 'personal',
          agreeTerms: false
        });
      } else {
        toast.error('举报提交失败，请稍后重试');
      }
    } catch (error) {
      console.error('提交举报失败:', error);
      toast.error('举报提交失败，请稍后重试');
    }
  };

  // 添加链接输入框
  const addLinkField = () => {
    setReportForm(prev => ({
      ...prev,
      links: [...prev.links, '']
    }));
  };

  // 更新链接
  const updateLink = (index: number, value: string) => {
    setReportForm(prev => ({
      ...prev,
      links: prev.links.map((link, i) => i === index ? value : link)
    }));
  };

  // 移除链接
  const removeLink = (index: number) => {
    setReportForm(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setReportForm(prev => ({
        ...prev,
        evidence: [...prev.evidence, ...Array.from(files)]
      }));
    }
  };

  // 渲染首页内容
  const renderHomeContent = () => (
    <div className="space-y-8">
      {/* 原创度状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {originalityStatus.map((status) => (
          <motion.div
            key={status.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'} hover:shadow-lg transition-all cursor-pointer group`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${status.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <status.icon className={`w-7 h-7 ${status.color}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {status.label}
                </h3>
                {status.score !== null ? (
                  <p className={`text-2xl font-bold ${status.color}`}>{status.score}分</p>
                ) : (
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>去认证 &gt;</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 原创权益 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            原创权益
          </h2>
          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            进行原创作者认证，获得以下权益
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {protectionTypes.map((type, index) => (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleProtectionClick(type.id)}
              className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800' : 'border-slate-200 bg-white hover:bg-slate-50'} transition-all group text-center`}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${type.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <type.icon className={`w-6 h-6 ${type.iconColor}`} />
              </div>
              <h3 className={`font-medium text-sm mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {type.title}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} line-clamp-2`}>
                {type.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 视频讲解 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            视频讲解
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVideoPage(Math.max(1, videoPage - 1))}
              disabled={videoPage === 1}
              className={`p-1 rounded ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} disabled:opacity-50`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {videoPage} / 2
            </span>
            <button
              onClick={() => setVideoPage(Math.min(2, videoPage + 1))}
              disabled={videoPage === 2}
              className={`p-1 rounded ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} disabled:opacity-50`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {videoTutorials.slice((videoPage - 1) * 7, videoPage * 7).map((video) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group cursor-pointer rounded-xl overflow-hidden border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'} hover:shadow-lg transition-all`}
            >
              <div className="relative aspect-video">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
                  {video.duration}
                </div>
              </div>
              <div className="p-2">
                <h4 className={`text-xs font-medium line-clamp-2 mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {video.title}
                </h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {video.views}次观看
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 原创消息公告 */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            原创消息公告
          </h2>
          <button className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center gap-1`}>
            更多 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'} cursor-pointer transition-colors`}
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {announcement.title}
                </span>
                {announcement.isNew && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    NEW
                  </span>
                )}
              </div>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {announcement.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 原创定义与判罚规则 & 维权举报攻略 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              原创定义与判罚规则
            </h2>
            <button className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
              更多 &gt;
            </button>
          </div>
          <div className="space-y-4">
            {faqData.definition.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 font-medium text-sm">问：</span>
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {item.question}
                  </span>
                </div>
                <div className="flex items-start gap-2 pl-5">
                  <span className="text-green-500 font-medium text-sm">答：</span>
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {item.answer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              维权举报攻略
            </h2>
            <button className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
              更多 &gt;
            </button>
          </div>
          <div className="space-y-4">
            {faqData.guide.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 font-medium text-sm">问：</span>
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {item.question}
                  </span>
                </div>
                <div className="flex items-start gap-2 pl-5">
                  <span className="text-green-500 font-medium text-sm">答：</span>
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {item.answer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染举报弹窗
  const renderReportModal = () => (
    <AnimatePresence>
      {showReportModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReportModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}
          >
            {/* 弹窗头部 */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                发起侵权举报
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex h-[calc(90vh-80px)]">
              {/* 左侧导航 */}
              <div className={`w-64 p-4 border-r ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                <div className="space-y-2">
                  <button
                    onClick={() => setReportStep(1)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      reportStep === 1
                        ? 'bg-blue-500 text-white'
                        : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">发起举报</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      受理范围
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                      支持发起著作权、商标权、专利权等知识产权类及名誉权、隐私权、肖像权等人身权益类的侵权举报
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-2`}>
                      请参考抖音侵权举报指引，提交身份证明及构成侵权的初步证明材料
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">历史记录</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                </div>
              </div>

              {/* 右侧表单 */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8">
                  {/* 选择侵权类型 */}
                  <div>
                    <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <span className="text-blue-500">|</span>
                      选择侵权类型
                      <span className="text-red-500">*</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {reportTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setReportForm(prev => ({ ...prev, type: type.id }))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            reportForm.type === type.id
                              ? 'bg-blue-500 text-white'
                              : isDark
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                    {reportForm.type && (
                      <p className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {reportTypes.find(t => t.id === reportForm.type)?.description}
                      </p>
                    )}
                  </div>

                  {/* 添加要举报的账号或内容 */}
                  <div>
                    <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <span className="text-blue-500">|</span>
                      添加要举报的账号或内容
                      <span className="text-red-500">*</span>
                    </h3>
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="contentType"
                          checked={reportForm.content === 'paste'}
                          onChange={() => setReportForm(prev => ({ ...prev, content: 'paste' }))}
                          className="w-4 h-4 text-blue-500"
                        />
                        <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>批量粘贴</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="contentType"
                          checked={reportForm.content === 'upload'}
                          onChange={() => setReportForm(prev => ({ ...prev, content: 'upload' }))}
                          className="w-4 h-4 text-blue-500"
                        />
                        <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>上传文件</span>
                      </label>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                      {reportForm.links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'} w-6`}>
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={link}
                            onChange={(e) => updateLink(index, e.target.value)}
                            placeholder="请粘贴要举报的内容链接或抖音号，最多1000条，粘贴后请点击「开始识别」"
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                          {reportForm.links.length > 1 && (
                            <button
                              onClick={() => removeLink(index)}
                              className={`p-1 rounded ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addLinkField}
                        className={`mt-2 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center gap-1`}
                      >
                        <span className="text-lg">+</span> 添加链接
                      </button>
                    </div>
                    <button className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                      开始识别
                    </button>
                  </div>

                  {/* 描述遇到的问题并上传材料 */}
                  <div>
                    <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <span className="text-blue-500">|</span>
                      描述遇到的问题并上传材料
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          遇到的侵权问题
                        </label>
                        <textarea
                          value={reportForm.description}
                          onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="请详细描述你遇到的侵权问题，以及你的诉求，有助于平台更高效地受理你的举报"
                          rows={4}
                          className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        <div className="text-right text-xs text-slate-400 mt-1">
                          {reportForm.description.length}/500
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          证明材料 <span className="text-red-500">*</span>
                        </label>
                        <div className={`border-2 border-dashed rounded-xl p-6 text-center ${isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-300 hover:border-slate-400'} transition-colors cursor-pointer`}>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="evidence-upload"
                            accept=".jpg,.jpeg,.png,.pdf"
                          />
                          <label htmlFor="evidence-upload" className="cursor-pointer">
                            <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              点击上传证明材料
                            </p>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                              支持 JPG、PNG、PDF 格式
                            </p>
                          </label>
                        </div>
                        {reportForm.evidence.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {reportForm.evidence.map((file, index) => (
                              <div key={index} className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <FileUp className="w-4 h-4 text-blue-500" />
                                <span className="truncate">{file.name}</span>
                                <button
                                  onClick={() => setReportForm(prev => ({
                                    ...prev,
                                    evidence: prev.evidence.filter((_, i) => i !== index)
                                  }))}
                                  className="ml-auto text-red-500 hover:text-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 选择本次的举报身份 */}
                  <div>
                    <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <span className="text-blue-500">|</span>
                      选择本次的举报身份
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          你的举报身份 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="identity"
                              value="self"
                              checked={reportForm.identity === 'self'}
                              onChange={(e) => setReportForm(prev => ({ ...prev, identity: e.target.value }))}
                              className="w-4 h-4 text-blue-500"
                            />
                            <User className="w-4 h-4" />
                            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>自己举报</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="identity"
                              value="other"
                              checked={reportForm.identity === 'other'}
                              onChange={(e) => setReportForm(prev => ({ ...prev, identity: e.target.value }))}
                              className="w-4 h-4 text-blue-500"
                            />
                            <Users className="w-4 h-4" />
                            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>代表他人举报</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          权利主体类型 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="subjectType"
                              value="personal"
                              checked={reportForm.subjectType === 'personal'}
                              onChange={(e) => setReportForm(prev => ({ ...prev, subjectType: e.target.value }))}
                              className="w-4 h-4 text-blue-500"
                            />
                            <User className="w-4 h-4" />
                            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>个人</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="subjectType"
                              value="organization"
                              checked={reportForm.subjectType === 'organization'}
                              onChange={(e) => setReportForm(prev => ({ ...prev, subjectType: e.target.value }))}
                              className="w-4 h-4 text-blue-500"
                            />
                            <Building2 className="w-4 h-4" />
                            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>组织</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          选择身份信息 <span className="text-red-500">*</span>
                        </label>
                        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isDark ? 'border-blue-500 text-blue-400 hover:bg-blue-500/10' : 'border-blue-500 text-blue-600 hover:bg-blue-50'} transition-colors`}>
                          <span className="text-lg">+</span>
                          创建新身份
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 同意条款 */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={reportForm.agreeTerms}
                      onChange={(e) => setReportForm(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 text-blue-500 rounded"
                    />
                    <label htmlFor="agreeTerms" className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      已知悉，材料转交通知：根据相关法律规定，您在此页面提交的全部或部分材料将可能被发送给被举报人
                    </label>
                  </div>

                  {/* 提交按钮 */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleReportSubmit}
                      className="px-8 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
                    >
                      提交
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* 页面标题区 */}
      <div className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center`}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  原创保护中心
                </h1>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  保护原创，维护权益
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'home'
                    ? 'bg-blue-500 text-white'
                    : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                首页
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'report'
                    ? 'bg-blue-500 text-white'
                    : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                发起举报
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-blue-500 text-white'
                    : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                历史记录
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && renderHomeContent()}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {loadingHistory ? (
              <div className={`p-12 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'} text-center`}>
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>加载中...</p>
              </div>
            ) : userReports.length === 0 ? (
              <div className={`p-12 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'} text-center`}>
                <Clock className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  暂无举报记录
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-6`}>
                  您还没有发起过任何侵权举报
                </p>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  发起举报
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userReports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            report.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {report.status === 'pending' ? '待处理' :
                             report.status === 'processing' ? '处理中' :
                             report.status === 'resolved' ? '已解决' : '已驳回'}
                          </span>
                          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {new Date(report.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <h4 className={`font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          举报类型: {reportTypes.find(t => t.id === report.report_type)?.label || report.report_type}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} line-clamp-2`}>
                          {report.description}
                        </p>
                        {report.admin_response && (
                          <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                            <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              处理结果:
                            </p>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {report.admin_response}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 举报弹窗 */}
      {renderReportModal()}
    </div>
  );
}
